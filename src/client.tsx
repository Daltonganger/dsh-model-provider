/**
 * dsh-model-provider — client half.
 *
 * Provider-first model selector for the DeepSeek Harness web GUI.
 *
 * The harness already groups the model catalog by provider and keys every
 * selection as { provider, model }, but the original composer model seat
 * flattens the whole catalog provider-by-provider, so with many providers the
 * dropdown turns into one very long list. This plugin shadows the single
 * "conversation.input.model" slot at priority -1 (lowest renders) with a
 * three-level selector over the SAME per-session ModelDirectory service:
 *
 *   root    → 模型 / 推理等级
 *   provider → one row per provider (current provider first, “当前” marker)
 *   model    → only the models of the selected provider
 *
 * Selection semantics, session state and the harness RPC are untouched; only
 * the surface changes. Disposing this registration (plugin off) restores the
 * original seat automatically.
 */

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  IconCheckOutline16,
  IconChevronDownOutline14,
  IconChevronLeftOutline14,
  IconChevronRightOutline14,
  IconWarningOutline16,
  Toast
} from "@deepseek-ai/dsh-client-ui-primitives";

// ---------------------------------------------------------------------------
// model identity
// ---------------------------------------------------------------------------

/** A provider-scoped model identity — the one stable key this plugin uses. */
export interface DshModelItem {
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
  isDefault?: boolean;
  enabled?: boolean;
}

/** Unique key for a provider-scoped model: `providerId:modelId` (never the bare name). */
export function getModelKey(model: DshModelItem): string {
  return `${model.providerId}:${model.modelId}`;
}

/** Group plain models by providerId, preserving catalog order. */
export function groupModelsByProvider(models: DshModelItem[]): Record<string, DshModelItem[]> {
  const groups: Record<string, DshModelItem[]> = {};
  for (const model of models) {
    (groups[model.providerId] ??= []).push(model);
  }
  return groups;
}

/** Normalize a harness group + model pair into the plugin's stable shape. */
export function normalizeModel(group: { id: string; name?: string }, model: { id: string; name?: string }): DshModelItem {
  return {
    providerId: group.id,
    providerName: group.name ?? group.id,
    modelId: model.id,
    modelName: model.name ?? model.id
  };
}

// ---------------------------------------------------------------------------
// directory wire types (subset the plugin reads)
// ---------------------------------------------------------------------------

interface ReasoningLevel {
  id: string;
  name: string;
  description?: string;
}

interface CatalogModel {
  id: string;
  name: string;
  description?: string;
  reasoning?: {
    defaultEffort?: string;
    efforts: ReasoningLevel[];
  };
}

interface CatalogGroup {
  id: string;
  name: string;
  models: CatalogModel[];
}

interface DirectorySnapshot {
  current: { provider: string; model: string; reasoningEffort?: string } | null;
  routable: boolean | null;
  groups: CatalogGroup[];
  failures: { id: string; name: string; message: string }[];
  status: "idle" | "loading" | "selecting" | "ready" | "error";
  error: string | null;
}

type DirectoryStore = {
  subscribe(fn: () => void): () => void;
  getSnapshot(): DirectorySnapshot;
};

type Selection = { provider: string; model: string; reasoningEffort?: string };

interface ModelProviderSelectProps {
  locked: boolean;
  available: boolean;
  directory: DirectoryStore;
  load: () => void;
  select: (selection: Selection) => Promise<boolean>;
  t: (key: string, params?: Record<string, unknown>) => string;
}

// ---------------------------------------------------------------------------
// locales (namespace owned by this plugin)
// ---------------------------------------------------------------------------

const NS = "modelProvider";

const zh = {
  "trigger.fallback": "选择模型",
  "trigger.selectAria": "选择模型",
  "trigger.aria": "选择模型，当前 {model}（{provider}）",
  "trigger.ariaEffort": "选择模型，当前 {model}（{provider}），推理等级 {effort}",
  "menu.aria": "模型与推理等级",
  "menu.model": "模型",
  "menu.effort": "推理等级",
  "provider.header": "选择供应商",
  "provider.models": "{count} 个模型",
  "provider.current": "当前",
  "provider.aria": "{name}，{meta}",
  "effort.providerDefault": "Default",
  "status.loading": "正在刷新模型列表…",
  "error.action": "模型操作失败：{message}",
  "retry": "重新加载",
  "action.reload": "重新加载",
  "warning.groupLoad": "{name} 加载失败：{message}",
  "empty.models": "没有可用的模型。",
  "empty.efforts": "当前模型未提供推理等级。"
};

const en = {
  "trigger.fallback": "Select model",
  "trigger.selectAria": "Select model",
  "trigger.aria": "Select model, current {model} via {provider}",
  "trigger.ariaEffort": "Select model, current {model} via {provider}, reasoning effort {effort}",
  "menu.aria": "Model and reasoning effort",
  "menu.model": "Model",
  "menu.effort": "Effort",
  "provider.header": "Select provider",
  "provider.models": "{count} models",
  "provider.current": "current",
  "provider.aria": "{name}, {meta}",
  "effort.providerDefault": "Default",
  "status.loading": "Refreshing model list…",
  "error.action": "Model operation failed: {message}",
  "retry": "Reload",
  "action.reload": "Reload",
  "warning.groupLoad": "{name} failed to load: {message}",
  "empty.models": "No models available.",
  "empty.efforts": "This model provides no reasoning effort levels."
};

// ---------------------------------------------------------------------------
// ModelProviderSelect — three-level, provider-first model selector
// ---------------------------------------------------------------------------

/**
 * Composer model seat with provider visibility. Identical behavior to the
 * harness seat (shared per-session directory, same selection RPC, keyboard
 * navigation) — the surface is a three-level menu instead of one flattened
 * provider-grouped list:
 *
 *   root      – 模型 (→ providers) / 推理等级 (→ efforts)
 *   provider  – one row per provider; current provider first, marked “当前”
 *   model     – only the selected provider's models
 */
function ModelProviderSelect({ locked, available, directory, load, select, t }: ModelProviderSelectProps) {
  const state = useSyncExternalStore((fn) => directory.subscribe(fn), () => directory.getSnapshot());
  const [open, setOpen] = useState(false);
  const [pane, setPane] = useState<"root" | "provider" | "model" | "effort">("root");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const lastActionRef = useRef<"load" | "select">("load");
  const [toast, setToast] = useState<{ seq: number; text: string } | null>(null);
  const toastSeq = useRef(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const paneRef = useRef(pane);
  const id = useId();

  const choices = useMemo(
    () =>
      state.groups.flatMap((group) =>
        group.models.map((model) => ({
          group,
          model,
          selection: {
            provider: group.id,
            model: model.id,
            ...(model.reasoning?.defaultEffort === void 0 ? {} : { reasoningEffort: model.reasoning.defaultEffort })
          }
        }))
      ),
    [state.groups]
  );

  const currentChoice =
    choices[
      state.current === null
        ? -1
        : choices.findIndex(
            (c) => c.selection.provider === state.current?.provider && c.selection.model === state.current.model
          )
    ];

  const reasoning = currentChoice?.model.reasoning;
  const effectiveEffort =
    state.current?.reasoningEffort ?? reasoning?.defaultEffort;

  const effortLabel =
    reasoning === void 0
      ? void 0
      : effectiveEffort === void 0
        ? t("effort.providerDefault")
        : reasoning.efforts.find((level) => level.id === effectiveEffort)?.name ?? effectiveEffort;

  // Provider-qualified trigger face — the plugin's reason to exist.
  const modelLabel = currentChoice?.model.name ?? t("trigger.fallback");
  const providerLabel = currentChoice?.group.name;
  const triggerLabel =
    providerLabel === void 0
      ? effortLabel === void 0
        ? modelLabel
        : `${modelLabel} · ${effortLabel}`
      : effortLabel === void 0
        ? `${modelLabel} · ${providerLabel}`
        : `${modelLabel} · ${providerLabel} · ${effortLabel}`;

  const triggerAria =
    currentChoice === void 0
      ? t("trigger.selectAria")
      : effortLabel === void 0
        ? t("trigger.aria", { model: modelLabel, provider: providerLabel })
        : t("trigger.ariaEffort", { model: modelLabel, provider: providerLabel, effort: effortLabel });

  const effortChoices = useMemo(
    () =>
      reasoning === void 0
        ? []
        : [
            ...(reasoning.defaultEffort === void 0
              ? [{ key: "provider-default", effort: void 0 as string | undefined, label: t("effort.providerDefault") }]
              : []),
            ...reasoning.efforts.map((effort) => ({
              key: `effort:${effort.id}`,
              effort: effort.id,
              label: effort.name,
              ...(effort.description === void 0 ? {} : { description: effort.description })
            }))
          ],
    [reasoning, t]
  );

  // Provider list for the second pane: current provider pinned first, the
  // rest in catalog order.
  const providerGroups = useMemo(() => {
    const currentId = state.current?.provider;
    if (currentId === void 0) return state.groups;
    return [...state.groups].sort((a, b) => {
      if (a.id === currentId) return -1;
      if (b.id === currentId) return 1;
      return 0;
    });
  }, [state.groups, state.current?.provider]);

  const activeProviderGroup = useMemo(
    () => state.groups.find((group) => group.id === selectedProvider),
    [state.groups, selectedProvider]
  );

  const busy = state.status === "selecting";
  const reload = () => {
    lastActionRef.current = "load";
    load();
  };

  useEffect(() => {
    if (available) {
      lastActionRef.current = "load";
      load();
    }
  }, [available, load]);

  // When the pane changes (not on first open), move focus to the first option
  // of the new pane so keyboard users can keep walking the list with arrows.
  useEffect(() => {
    if (open && paneRef.current !== pane) {
      itemRefs.current.find((item): item is HTMLButtonElement => item !== null)?.focus();
    }
    paneRef.current = pane;
  }, [pane, open]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
    };
  }, [open]);

  if (!available) return null;

  const show = () => {
    setPane("root");
    setOpen(true);
    reload();
  };
  const close = (restoreFocus = false) => {
    setOpen(false);
    setPane("root");
    if (restoreFocus)
      queueMicrotask(() => {
        triggerRef.current?.focus();
      });
  };
  const moveFocus = (offset: number) => {
    const items = itemRefs.current.filter((item) => item !== null);
    if (items.length === 0) return;
    const active = items.findIndex((item) => item === document.activeElement);
    items[(Math.max(active, 0) + offset + items.length) % items.length]?.focus();
  };
  const onRootKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      if (pane === "model") {
        // Model list → provider list → root menu → close, one level at a time.
        setPane("provider");
      } else if (pane === "provider" || pane === "effort") {
        setPane("root");
      } else {
        close(true);
      }
      return;
    }
    if (!open) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(event.key === "ArrowDown" ? 1 : -1);
    }
  };
  const onBlur = (event: React.FocusEvent) => {
    if (event.relatedTarget instanceof Node && rootRef.current?.contains(event.relatedTarget)) return;
    close();
  };
  const settleSelection = (accepted: boolean) => {
    if (accepted) {
      if (rootRef.current !== null) close(true);
      return;
    }
    const message = directory.getSnapshot().error;
    if (message !== null) {
      toastSeq.current += 1;
      setToast({ seq: toastSeq.current, text: t("error.action", { message }) });
    }
  };
  const choose = (selection: Selection) => {
    if (state.current?.provider === selection.provider && state.current.model === selection.model) {
      close(true);
      return;
    }
    lastActionRef.current = "select";
    select(selection).then(settleSelection);
  };
  const chooseEffort = (effort: string | undefined) => {
    if (state.current === null) return;
    if (effectiveEffort === effort) {
      close(true);
      return;
    }
    const selection: Selection = {
      provider: state.current.provider,
      model: state.current.model,
      ...(effort === void 0 ? {} : { reasoningEffort: effort })
    };
    lastActionRef.current = "select";
    select(selection).then(settleSelection);
  };

  itemRefs.current = [];
  let itemIndex = 0;
  const itemRef = () => {
    const at = itemIndex++;
    return (node: HTMLButtonElement | null) => {
      itemRefs.current[at] = node;
    };
  };

  // Directory-level loading/error/warnings shown on the provider and model
  // panes (the only panes that browse the catalog).
  const statusBlock = (
    <>
      {state.status === "loading" && <div className="dshmp-status">{t("status.loading")}</div>}
      {state.error !== null && lastActionRef.current === "load" && (
        <div className="dshmp-error">
          <span>{t("error.action", { message: state.error })}</span>
          <button type="button" className="dshmp-retry" onClick={reload}>
            {t("retry")}
          </button>
        </div>
      )}
      {state.failures.map((failure) => (
        <div className="dshmp-warning" key={failure.id}>
          <span>
            {t("warning.groupLoad", { name: failure.name, message: failure.message })}
          </span>
          <button type="button" className="dshmp-retry" onClick={reload}>
            {t("retry")}
          </button>
        </div>
      ))}
    </>
  );

  return (
    <div ref={rootRef} className="dshmp-root" onKeyDown={onRootKeyDown} onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        className="dshmp-trigger"
        aria-label={triggerAria}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : void 0}
        title={triggerLabel}
        disabled={locked}
        onClick={() => {
          if (open) close();
          else show();
        }}
      >
        <span className="dshmp-triggerLabel">{modelLabel}</span>
        {providerLabel !== void 0 && <span className="dshmp-triggerProvider">· {providerLabel}</span>}
        {effortLabel !== void 0 && <span className="dshmp-triggerEffort">{effortLabel}</span>}
        <IconChevronDownOutline14 className={cx("dshmp-chevron", open && "dshmp-chevronOpen")} />
      </button>

      {open && (
        <div
          id={`${id}-menu`}
          className="dshmp-menu"
          role="menu"
          aria-label={t("menu.aria")}
          aria-busy={state.status === "loading" || busy}
        >
          {pane === "root" && (
            <>
              <button
                ref={itemRef()}
                type="button"
                role="menuitem"
                className="dshmp-cell"
                onClick={() => {
                  setSelectedProvider(null);
                  setPane("provider");
                }}
              >
                <span className="dshmp-cellLabel">{t("menu.model")}</span>
                <span className="dshmp-cellValue">{modelLabel}</span>
                <IconChevronRightOutline14 className="dshmp-cellChevron" />
              </button>
              {reasoning !== void 0 && (
                <button
                  ref={itemRef()}
                  type="button"
                  role="menuitem"
                  className="dshmp-cell"
                  onClick={() => {
                    setPane("effort");
                  }}
                >
                  <span className="dshmp-cellLabel">{t("menu.effort")}</span>
                  <span className="dshmp-cellValue">{effortLabel}</span>
                  <IconChevronRightOutline14 className="dshmp-cellChevron" />
                </button>
              )}
            </>
          )}

          {pane === "provider" && (
            <>
              <button
                type="button"
                className="dshmp-back"
                onClick={() => {
                  setPane("root");
                }}
              >
                <IconChevronLeftOutline14 />
                <span className="dshmp-backLabel">{t("provider.header")}</span>
              </button>
              {statusBlock}
              <div className={cx("dshmp-groups", "scrollable")}>
                {providerGroups.map((group) => {
                  const isCurrent = state.current?.provider === group.id;
                  const metaText = t("provider.models", { count: group.models.length });
                  return (
                    <button
                      ref={itemRef()}
                      type="button"
                      role="menuitem"
                      aria-label={t("provider.aria", {
                        name: group.name,
                        meta: isCurrent ? `${metaText} · ${t("provider.current")}` : metaText
                      })}
                      className={cx("dshmp-option", isCurrent && "dshmp-providerActive")}
                      key={group.id}
                      onClick={() => {
                        setSelectedProvider(group.id);
                        setPane("model");
                      }}
                    >
                      <span className="dshmp-optionCopy">
                        <span className="dshmp-modelName">{group.name}</span>
                        <span className="dshmp-description">
                          {metaText}
                          {isCurrent && (
                            <span className="dshmp-providerCurrent"> · {t("provider.current")}</span>
                          )}
                        </span>
                      </span>
                      <span className="dshmp-cellChevron">
                        <IconChevronRightOutline14 />
                      </span>
                    </button>
                  );
                })}
              </div>
              {state.status === "ready" && providerGroups.length === 0 && (
                <div className="dshmp-empty">{t("empty.models")}</div>
              )}
            </>
          )}

          {pane === "model" && activeProviderGroup !== void 0 && (
            <>
              <button
                type="button"
                className="dshmp-back"
                onClick={() => {
                  setPane("provider");
                }}
              >
                <IconChevronLeftOutline14 />
                <span className="dshmp-backLabel">{activeProviderGroup.name}</span>
              </button>
              {statusBlock}
              <div className={cx("dshmp-groups", "scrollable")}>
                {activeProviderGroup.models.map((model) => {
                  const selected =
                    state.current?.provider === activeProviderGroup.id && state.current.model === model.id;
                  return (
                    <button
                      ref={itemRef()}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      className={cx("dshmp-option", selected && "dshmp-selected")}
                      title={`${model.name} · ${activeProviderGroup.name}`}
                      disabled={busy}
                      key={model.id}
                      onClick={() => {
                        choose({ provider: activeProviderGroup.id, model: model.id });
                      }}
                    >
                      <span className="dshmp-optionCopy">
                        <span className="dshmp-modelName">{model.name}</span>
                        {model.description !== void 0 && (
                          <span className="dshmp-description">{model.description}</span>
                        )}
                      </span>
                      <span className="dshmp-check">
                        {selected ? <IconCheckOutline16 /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
              {activeProviderGroup.models.length === 0 && (
                <div className="dshmp-empty">{t("empty.models")}</div>
              )}
            </>
          )}

          {pane === "model" && activeProviderGroup === void 0 && (
            <>
              <button
                type="button"
                className="dshmp-back"
                onClick={() => {
                  setPane("provider");
                }}
              >
                <IconChevronLeftOutline14 />
                <span className="dshmp-backLabel">{t("menu.model")}</span>
              </button>
              <div className="dshmp-empty">{t("empty.models")}</div>
            </>
          )}

          {pane === "effort" && (
            <>
              {state.error !== null && lastActionRef.current === "load" && (
                <div className="dshmp-error">
                  <span>{t("error.action", { message: state.error })}</span>
                  <button type="button" className="dshmp-retry" onClick={reload}>
                    {t("action.reload")}
                  </button>
                </div>
              )}
              {effortChoices.length === 0 ? (
                <div className="dshmp-empty">{t("empty.efforts")}</div>
              ) : (
                effortChoices.map((level) => (
                  <button
                    ref={itemRef()}
                    type="button"
                    role="menuitemradio"
                    aria-checked={effectiveEffort === level.effort}
                    className={cx("dshmp-option", effectiveEffort === level.effort && "dshmp-selected")}
                    disabled={busy}
                    key={level.key}
                    onClick={() => {
                      chooseEffort(level.effort);
                    }}
                  >
                    <span className="dshmp-optionCopy">
                      <span className="dshmp-modelName">{level.label}</span>
                      {level.description !== void 0 && (
                        <span className="dshmp-description">{level.description}</span>
                      )}
                    </span>
                    <span className="dshmp-check">
                      {effectiveEffort === level.effort ? <IconCheckOutline16 /> : null}
                    </span>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      )}

      {toast !== null && (
        <Toast
          key={toast.seq}
          text={toast.text}
          icon={<IconWarningOutline16 />}
          anchor={rootRef.current?.closest("[data-composer-card]") ?? null}
          onDone={() => {
            setToast(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// tiny clsx-style helper (keeps the bundle free of a runtime require)
// ---------------------------------------------------------------------------

function cx(...parts: Array<string | false | null | undefined>): string {
  let out = "";
  for (const part of parts) {
    if (!part) continue;
    out += out.length > 0 ? ` ${part}` : part;
  }
  return out;
}

// ---------------------------------------------------------------------------
// plugin body
// ---------------------------------------------------------------------------

/** Services this plugin's apply() reaches for (mirrors the harness convention). */
export const inject = ["locale", "sessions", "slots", "modelDirectories"];

/**
 * Client plugin body: register this plugin's dictionaries, then shadow the
 * composer model seat with the provider-first re-implementation.
 */
export function apply(ctx: any) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-model-provider: dictionaries");
  const t = ctx.locale.bind(NS);

  ctx.inject(["slots", "modelDirectories", "sessions"], (scope: any) => {
    const models = scope.modelDirectories;
    const sessions = scope.sessions;

    scope.slots.inject(
      "conversation.input.model",
      () =>
        scope.slots.register(
          {
            name: "conversation.input.model",
            locale: NS,
            // Shadowing priority: the single slot renders the LOWEST priority
            // entry, so -1 beats the harness seat (0). Remove this registration
            // and the original seat is restored verbatim.
            priority: -1,
            registrant: "dsh-model-provider",
            inject: (sessionId: string) => {
              const directory = models.directoryFor(sessionId);
              const available = sessions.subagentAddress(sessionId) === void 0;
              return {
                available,
                directory: directory.store,
                load: () => {
                  if (available) directory.load().catch(() => {});
                },
                select: (selection: Selection) =>
                  available ? directory.select(selection).then(() => true, () => false) : Promise.resolve(false)
              };
            }
          },
          ModelProviderSelect
        ),
      "dsh-model-provider: composer model seat"
    );
  });
}

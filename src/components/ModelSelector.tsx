/**
 * dsh-model-provider - composer model seat with provider visibility.
 *
 * Identical behavior to the harness seat (shared per-session directory, same
 * selection RPC, keyboard navigation) - the surface is a three-level menu
 * instead of one flattened provider-grouped list:
 *
 *   root      - 模型 (→ providers) / 推理等级 (→ efforts)
 *   provider  - one row per provider; current provider first, marked "· 当前";
 *               failed providers render as rows with a retry action; search box
 *   model     - only the selected provider's models, header shows provider name
 *               + model count, search box
 *   effort    - the current model's reasoning levels
 *
 * The trigger shows "Model · Provider" and only appends the effort when the
 * user actually deviated from the provider default - "Default" never takes
 * input-box space.
 */
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { IconChevronDownOutlineRegular, IconChevronLeftOutlineRegular, IconWarningOutlineRegular, Toast } from "@deepseek-ai/dsh-client-ui-primitives";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation.ts";
import { findCurrentChoice, selectionFor, sortGroupsForCurrent } from "../model/selection.ts";
import type {
  Choice,
  DirectoryStore,
  EffortChoice,
  ModelProviderSelectProps,
  Pane,
  Selection
} from "../model/types.ts";
import { EffortPane } from "./EffortPane.tsx";
import { ModelPane } from "./ModelPane.tsx";
import { ProviderPane } from "./ProviderPane.tsx";
import { RootPane } from "./RootPane.tsx";
import { StatusBlock } from "./StatusBlock.tsx";

export function ModelSelector({ locked, available, directory, load, select, t }: ModelProviderSelectProps) {
  const state = useSyncExternalStore((fn) => directory.subscribe(fn), () => directory.getSnapshot());
  const [open, setOpen] = useState(false);
  const [pane, setPane] = useState<Pane>("root");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const lastActionRef = useRef<"load" | "select">("load");
  const [toast, setToast] = useState<{ seq: number; text: string } | null>(null);
  const toastSeq = useRef(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const paneRef = useRef(pane);
  const id = useId();

  // One catalog row per (group, model), each carrying its ready-to-send
  // selection built by selectionFor() - the single source of default effort.
  const choices: Choice[] = useMemo(
    () =>
      state.groups.flatMap((group) =>
        group.models.map((model) => ({
          group,
          model,
          selection: selectionFor(group, model)
        }))
      ),
    [state.groups]
  );

  const currentChoice = findCurrentChoice(choices, state.current);

  const reasoning = currentChoice?.model.reasoning;
  const effectiveEffort = state.current?.reasoningEffort ?? reasoning?.defaultEffort;
  // "Default" is not worth trigger space: only show the effort once it differs
  // from the provider default (i.e. the user actively chose it).
  const effortIsCustom = effectiveEffort !== undefined && effectiveEffort !== reasoning?.defaultEffort;
  const effortLabel =
    reasoning === undefined
      ? undefined
      : effectiveEffort === undefined
        ? t("effort.providerDefault")
        : reasoning.efforts.find((level) => level.id === effectiveEffort)?.name ?? effectiveEffort;
  const visibleEffortLabel = effortIsCustom ? effortLabel : undefined;

  // Provider-qualified trigger face - the plugin's reason to exist.
  const modelLabel = currentChoice?.model.name ?? t("trigger.fallback");
  const providerLabel = currentChoice?.group.name;
  const triggerLabel =
    providerLabel === undefined
      ? visibleEffortLabel === undefined
        ? modelLabel
        : modelLabel + " · " + visibleEffortLabel
      : visibleEffortLabel === undefined
        ? modelLabel + " · " + providerLabel
        : modelLabel + " · " + providerLabel + " · " + visibleEffortLabel;

  const triggerAria =
    currentChoice === undefined
      ? t("trigger.selectAria")
      : effortLabel === undefined
        ? t("trigger.aria", { model: modelLabel, provider: providerLabel })
        : t("trigger.ariaEffort", { model: modelLabel, provider: providerLabel, effort: effortLabel });

  const effortChoices: EffortChoice[] = useMemo(
    () =>
      reasoning === undefined
        ? []
        : [
            ...(reasoning.defaultEffort === undefined
              ? [{ key: "provider-default", effort: undefined as string | undefined, label: t("effort.providerDefault") }]
              : []),
            ...reasoning.efforts.map((effort) => ({
              key: "effort:" + effort.id,
              effort: effort.id,
              label: effort.name,
              ...(effort.description === undefined ? {} : { description: effort.description })
            }))
          ],
    [reasoning, t]
  );

  const providerGroups = useMemo(
    () => sortGroupsForCurrent(state.groups, state.current?.provider),
    [state.groups, state.current?.provider]
  );

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

  // All hooks must run before the early return below (Rules of Hooks).
  const { onRootKeyDown } = useKeyboardNavigation({ open, pane, itemRefs, setPane, onClose: close });

  if (!available) return null;

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
    if (
      state.current !== null &&
      state.current.provider === selection.provider &&
      state.current.model === selection.model
    ) {
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
      ...(effort === undefined ? {} : { reasoningEffort: effort })
    };
    lastActionRef.current = "select";
    select(selection).then(settleSelection);
  };

  // Option registry: rebuilt every render, filled in document order by the
  // panes below; the keyboard handler and pane-switch focus walk it.
  itemRefs.current = [];
  let cursor = 0;
  const registerRef = (node: HTMLButtonElement | null) => {
    itemRefs.current[cursor++] = node;
  };

  // Directory-level loading/error shown on every browsing pane. Failures are
  // rendered as rows by ProviderPane, so they are intentionally not repeated
  // here (and not shown at all on the model pane of another provider).
  const statusBlock = (
    <StatusBlock
      loading={state.status === "loading"}
      loadingText={t("status.loading")}
      errorText={state.error !== null && lastActionRef.current === "load" ? t("error.action", { message: state.error }) : null}
      onRetry={reload}
      retryText={t("retry")}
    />
  );
  const errorBlock = (
    <StatusBlock
      loading={false}
      loadingText=""
      errorText={state.error !== null && lastActionRef.current === "load" ? t("error.action", { message: state.error }) : null}
      onRetry={reload}
      retryText={t("action.reload")}
    />
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
        aria-controls={open ? id + "-menu" : undefined}
        title={triggerLabel}
        disabled={locked}
        onClick={() => {
          if (open) close();
          else show();
        }}
      >
        <span className="dshmp-triggerLabel">{modelLabel}</span>
        {providerLabel !== undefined && <span className="dshmp-triggerProvider">· {providerLabel}</span>}
        {visibleEffortLabel !== undefined && <span className="dshmp-triggerEffort">· {visibleEffortLabel}</span>}
        <IconChevronDownOutlineRegular className={open ? "dshmp-chevron dshmp-chevronOpen" : "dshmp-chevron"} />
      </button>

      {open && (
        <div
          id={id + "-menu"}
          className="dshmp-menu"
          role="menu"
          aria-label={t("menu.aria")}
          aria-busy={state.status === "loading" || busy}
        >
          {pane === "root" && (
            <RootPane
              modelLabel={modelLabel}
              effortLabel={effortLabel}
              hasEffort={reasoning !== undefined}
              onOpenProvider={() => {
                setSelectedProvider(null);
                setPane("provider");
              }}
              onOpenEffort={() => {
                setPane("effort");
              }}
              registerRef={registerRef}
              t={t}
            />
          )}

          {pane === "provider" && (
            <ProviderPane
              groups={providerGroups}
              failures={state.failures}
              currentProvider={state.current?.provider}
              statusBlock={statusBlock}
              onPick={(group) => {
                setSelectedProvider(group.id);
                setPane("model");
              }}
              onRetryLoad={reload}
              onBack={() => {
                setPane("root");
              }}
              registerRef={registerRef}
              t={t}
            />
          )}

          {pane === "model" && activeProviderGroup !== undefined && (
            <ModelPane
              group={activeProviderGroup}
              current={state.current}
              busy={busy}
              statusBlock={statusBlock}
              onPick={(model) => {
                choose(selectionFor(activeProviderGroup, model));
              }}
              onBack={() => {
                setPane("provider");
              }}
              registerRef={registerRef}
              t={t}
            />
          )}

          {pane === "model" && activeProviderGroup === undefined && (
            <>
              <button
                type="button"
                className="dshmp-back"
                onClick={() => {
                  setPane("provider");
                }}
              >
                <IconChevronLeftOutlineRegular />
                <span className="dshmp-backLabel">{t("menu.model")}</span>
              </button>
              <div className="dshmp-empty">{t("empty.models")}</div>
            </>
          )}

          {pane === "effort" && (
            <EffortPane
              levels={effortChoices}
              effectiveEffort={effectiveEffort}
              busy={busy}
              errorBlock={errorBlock}
              onPick={chooseEffort}
              registerRef={registerRef}
              t={t}
            />
          )}
        </div>
      )}

      {toast !== null && (
        <Toast
          key={toast.seq}
          text={toast.text}
          icon={<IconWarningOutlineRegular />}
          anchor={rootRef.current?.closest("[data-composer-card]") ?? null}
          onDone={() => {
            setToast(null);
          }}
        />
      )}
    </div>
  );
}

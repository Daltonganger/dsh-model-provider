window.__ModuleLoader__.load({
	id: "dsh-model-provider",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _mod_react_jsx_runtime = require("react/jsx-runtime");
		let Fragment = _mod_react_jsx_runtime.Fragment, jsx = _mod_react_jsx_runtime.jsx, jsxs = _mod_react_jsx_runtime.jsxs;
		let _mod_react = require("react");
		let useEffect = _mod_react.useEffect, useId = _mod_react.useId, useMemo = _mod_react.useMemo, useRef = _mod_react.useRef, useState = _mod_react.useState, useSyncExternalStore = _mod_react.useSyncExternalStore;
		let _mod__deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let IconCheckOutline16 = _mod__deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, IconChevronDownOutline14 = _mod__deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, IconChevronLeftOutline14 = _mod__deepseek_ai_dsh_client_ui_primitives.IconChevronLeftOutline14, IconChevronRightOutline14 = _mod__deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, IconWarningOutline16 = _mod__deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, Toast = _mod__deepseek_ai_dsh_client_ui_primitives.Toast;
		function getModelKey(model) {
		  return `${model.providerId}:${model.modelId}`;
		}
		function groupModelsByProvider(models) {
		  var _a;
		  const groups = {};
		  for (const model of models) {
		    (groups[_a = model.providerId] ?? (groups[_a] = [])).push(model);
		  }
		  return groups;
		}
		function normalizeModel(group, model) {
		  return {
		    providerId: group.id,
		    providerName: group.name ?? group.id,
		    modelId: model.id,
		    modelName: model.name ?? model.id
		  };
		}
		const NS = "modelProvider";
		const zh = {
		  "trigger.fallback": "\u9009\u62E9\u6A21\u578B",
		  "trigger.selectAria": "\u9009\u62E9\u6A21\u578B",
		  "trigger.aria": "\u9009\u62E9\u6A21\u578B\uFF0C\u5F53\u524D {model}\uFF08{provider}\uFF09",
		  "trigger.ariaEffort": "\u9009\u62E9\u6A21\u578B\uFF0C\u5F53\u524D {model}\uFF08{provider}\uFF09\uFF0C\u63A8\u7406\u7B49\u7EA7 {effort}",
		  "menu.aria": "\u6A21\u578B\u4E0E\u63A8\u7406\u7B49\u7EA7",
		  "menu.model": "\u6A21\u578B",
		  "menu.effort": "\u63A8\u7406\u7B49\u7EA7",
		  "provider.header": "\u9009\u62E9\u4F9B\u5E94\u5546",
		  "provider.models": "{count} \u4E2A\u6A21\u578B",
		  "provider.current": "\u5F53\u524D",
		  "provider.aria": "{name}\uFF0C{meta}",
		  "effort.providerDefault": "Default",
		  "status.loading": "\u6B63\u5728\u5237\u65B0\u6A21\u578B\u5217\u8868\u2026",
		  "error.action": "\u6A21\u578B\u64CD\u4F5C\u5931\u8D25\uFF1A{message}",
		  "retry": "\u91CD\u65B0\u52A0\u8F7D",
		  "action.reload": "\u91CD\u65B0\u52A0\u8F7D",
		  "warning.groupLoad": "{name} \u52A0\u8F7D\u5931\u8D25\uFF1A{message}",
		  "empty.models": "\u6CA1\u6709\u53EF\u7528\u7684\u6A21\u578B\u3002",
		  "empty.efforts": "\u5F53\u524D\u6A21\u578B\u672A\u63D0\u4F9B\u63A8\u7406\u7B49\u7EA7\u3002"
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
		  "status.loading": "Refreshing model list\u2026",
		  "error.action": "Model operation failed: {message}",
		  "retry": "Reload",
		  "action.reload": "Reload",
		  "warning.groupLoad": "{name} failed to load: {message}",
		  "empty.models": "No models available.",
		  "empty.efforts": "This model provides no reasoning effort levels."
		};
		function ModelProviderSelect({ locked, available, directory, load, select, t }) {
		  const state = useSyncExternalStore((fn) => directory.subscribe(fn), () => directory.getSnapshot());
		  const [open, setOpen] = useState(false);
		  const [pane, setPane] = useState("root");
		  const [selectedProvider, setSelectedProvider] = useState(null);
		  const lastActionRef = useRef("load");
		  const [toast, setToast] = useState(null);
		  const toastSeq = useRef(0);
		  const rootRef = useRef(null);
		  const triggerRef = useRef(null);
		  const itemRefs = useRef([]);
		  const paneRef = useRef(pane);
		  const id = useId();
		  const choices = useMemo(
		    () => state.groups.flatMap(
		      (group) => group.models.map((model) => ({
		        group,
		        model,
		        selection: {
		          provider: group.id,
		          model: model.id,
		          ...model.reasoning?.defaultEffort === void 0 ? {} : { reasoningEffort: model.reasoning.defaultEffort }
		        }
		      }))
		    ),
		    [state.groups]
		  );
		  const currentChoice = choices[state.current === null ? -1 : choices.findIndex(
		    (c) => c.selection.provider === state.current?.provider && c.selection.model === state.current.model
		  )];
		  const reasoning = currentChoice?.model.reasoning;
		  const effectiveEffort = state.current?.reasoningEffort ?? reasoning?.defaultEffort;
		  const effortLabel = reasoning === void 0 ? void 0 : effectiveEffort === void 0 ? t("effort.providerDefault") : reasoning.efforts.find((level) => level.id === effectiveEffort)?.name ?? effectiveEffort;
		  const modelLabel = currentChoice?.model.name ?? t("trigger.fallback");
		  const providerLabel = currentChoice?.group.name;
		  const triggerLabel = providerLabel === void 0 ? effortLabel === void 0 ? modelLabel : `${modelLabel} \xB7 ${effortLabel}` : effortLabel === void 0 ? `${modelLabel} \xB7 ${providerLabel}` : `${modelLabel} \xB7 ${providerLabel} \xB7 ${effortLabel}`;
		  const triggerAria = currentChoice === void 0 ? t("trigger.selectAria") : effortLabel === void 0 ? t("trigger.aria", { model: modelLabel, provider: providerLabel }) : t("trigger.ariaEffort", { model: modelLabel, provider: providerLabel, effort: effortLabel });
		  const effortChoices = useMemo(
		    () => reasoning === void 0 ? [] : [
		      ...reasoning.defaultEffort === void 0 ? [{ key: "provider-default", effort: void 0, label: t("effort.providerDefault") }] : [],
		      ...reasoning.efforts.map((effort) => ({
		        key: `effort:${effort.id}`,
		        effort: effort.id,
		        label: effort.name,
		        ...effort.description === void 0 ? {} : { description: effort.description }
		      }))
		    ],
		    [reasoning, t]
		  );
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
		  useEffect(() => {
		    if (open && paneRef.current !== pane) {
		      itemRefs.current.find((item) => item !== null)?.focus();
		    }
		    paneRef.current = pane;
		  }, [pane, open]);
		  useEffect(() => {
		    if (!open) return;
		    const closeOutside = (event) => {
		      if (!rootRef.current?.contains(event.target)) setOpen(false);
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
		  const moveFocus = (offset) => {
		    const items = itemRefs.current.filter((item) => item !== null);
		    if (items.length === 0) return;
		    const active = items.findIndex((item) => item === document.activeElement);
		    items[(Math.max(active, 0) + offset + items.length) % items.length]?.focus();
		  };
		  const onRootKeyDown = (event) => {
		    if (event.key === "Escape" && open) {
		      event.preventDefault();
		      if (pane === "model") {
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
		  const onBlur = (event) => {
		    if (event.relatedTarget instanceof Node && rootRef.current?.contains(event.relatedTarget)) return;
		    close();
		  };
		  const settleSelection = (accepted) => {
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
		  const choose = (selection) => {
		    if (state.current?.provider === selection.provider && state.current.model === selection.model) {
		      close(true);
		      return;
		    }
		    lastActionRef.current = "select";
		    select(selection).then(settleSelection);
		  };
		  const chooseEffort = (effort) => {
		    if (state.current === null) return;
		    if (effectiveEffort === effort) {
		      close(true);
		      return;
		    }
		    const selection = {
		      provider: state.current.provider,
		      model: state.current.model,
		      ...effort === void 0 ? {} : { reasoningEffort: effort }
		    };
		    lastActionRef.current = "select";
		    select(selection).then(settleSelection);
		  };
		  itemRefs.current = [];
		  let itemIndex = 0;
		  const itemRef = () => {
		    const at = itemIndex++;
		    return (node) => {
		      itemRefs.current[at] = node;
		    };
		  };
		  const statusBlock = /* @__PURE__ */ jsxs(Fragment, { children: [
		    state.status === "loading" && /* @__PURE__ */ jsx("div", { className: "dshmp-status", children: t("status.loading") }),
		    state.error !== null && lastActionRef.current === "load" && /* @__PURE__ */ jsxs("div", { className: "dshmp-error", children: [
		      /* @__PURE__ */ jsx("span", { children: t("error.action", { message: state.error }) }),
		      /* @__PURE__ */ jsx("button", { type: "button", className: "dshmp-retry", onClick: reload, children: t("retry") })
		    ] }),
		    state.failures.map((failure) => /* @__PURE__ */ jsxs("div", { className: "dshmp-warning", children: [
		      /* @__PURE__ */ jsx("span", { children: t("warning.groupLoad", { name: failure.name, message: failure.message }) }),
		      /* @__PURE__ */ jsx("button", { type: "button", className: "dshmp-retry", onClick: reload, children: t("retry") })
		    ] }, failure.id))
		  ] });
		  return /* @__PURE__ */ jsxs("div", { ref: rootRef, className: "dshmp-root", onKeyDown: onRootKeyDown, onBlur, children: [
		    /* @__PURE__ */ jsxs(
		      "button",
		      {
		        ref: triggerRef,
		        type: "button",
		        className: "dshmp-trigger",
		        "aria-label": triggerAria,
		        "aria-haspopup": "menu",
		        "aria-expanded": open,
		        "aria-controls": open ? `${id}-menu` : void 0,
		        title: triggerLabel,
		        disabled: locked,
		        onClick: () => {
		          if (open) close();
		          else show();
		        },
		        children: [
		          /* @__PURE__ */ jsx("span", { className: "dshmp-triggerLabel", children: modelLabel }),
		          providerLabel !== void 0 && /* @__PURE__ */ jsxs("span", { className: "dshmp-triggerProvider", children: [
		            "\xB7 ",
		            providerLabel
		          ] }),
		          effortLabel !== void 0 && /* @__PURE__ */ jsx("span", { className: "dshmp-triggerEffort", children: effortLabel }),
		          /* @__PURE__ */ jsx(IconChevronDownOutline14, { className: cx("dshmp-chevron", open && "dshmp-chevronOpen") })
		        ]
		      }
		    ),
		    open && /* @__PURE__ */ jsxs(
		      "div",
		      {
		        id: `${id}-menu`,
		        className: "dshmp-menu",
		        role: "menu",
		        "aria-label": t("menu.aria"),
		        "aria-busy": state.status === "loading" || busy,
		        children: [
		          pane === "root" && /* @__PURE__ */ jsxs(Fragment, { children: [
		            /* @__PURE__ */ jsxs(
		              "button",
		              {
		                ref: itemRef(),
		                type: "button",
		                role: "menuitem",
		                className: "dshmp-cell",
		                onClick: () => {
		                  setSelectedProvider(null);
		                  setPane("provider");
		                },
		                children: [
		                  /* @__PURE__ */ jsx("span", { className: "dshmp-cellLabel", children: t("menu.model") }),
		                  /* @__PURE__ */ jsx("span", { className: "dshmp-cellValue", children: modelLabel }),
		                  /* @__PURE__ */ jsx(IconChevronRightOutline14, { className: "dshmp-cellChevron" })
		                ]
		              }
		            ),
		            reasoning !== void 0 && /* @__PURE__ */ jsxs(
		              "button",
		              {
		                ref: itemRef(),
		                type: "button",
		                role: "menuitem",
		                className: "dshmp-cell",
		                onClick: () => {
		                  setPane("effort");
		                },
		                children: [
		                  /* @__PURE__ */ jsx("span", { className: "dshmp-cellLabel", children: t("menu.effort") }),
		                  /* @__PURE__ */ jsx("span", { className: "dshmp-cellValue", children: effortLabel }),
		                  /* @__PURE__ */ jsx(IconChevronRightOutline14, { className: "dshmp-cellChevron" })
		                ]
		              }
		            )
		          ] }),
		          pane === "provider" && /* @__PURE__ */ jsxs(Fragment, { children: [
		            /* @__PURE__ */ jsxs(
		              "button",
		              {
		                type: "button",
		                className: "dshmp-back",
		                onClick: () => {
		                  setPane("root");
		                },
		                children: [
		                  /* @__PURE__ */ jsx(IconChevronLeftOutline14, {}),
		                  /* @__PURE__ */ jsx("span", { className: "dshmp-backLabel", children: t("provider.header") })
		                ]
		              }
		            ),
		            statusBlock,
		            /* @__PURE__ */ jsx("div", { className: cx("dshmp-groups", "scrollable"), children: providerGroups.map((group) => {
		              const isCurrent = state.current?.provider === group.id;
		              const metaText = t("provider.models", { count: group.models.length });
		              return /* @__PURE__ */ jsxs(
		                "button",
		                {
		                  ref: itemRef(),
		                  type: "button",
		                  role: "menuitem",
		                  "aria-label": t("provider.aria", {
		                    name: group.name,
		                    meta: isCurrent ? `${metaText} \xB7 ${t("provider.current")}` : metaText
		                  }),
		                  className: cx("dshmp-option", isCurrent && "dshmp-providerActive"),
		                  onClick: () => {
		                    setSelectedProvider(group.id);
		                    setPane("model");
		                  },
		                  children: [
		                    /* @__PURE__ */ jsxs("span", { className: "dshmp-optionCopy", children: [
		                      /* @__PURE__ */ jsx("span", { className: "dshmp-modelName", children: group.name }),
		                      /* @__PURE__ */ jsxs("span", { className: "dshmp-description", children: [
		                        metaText,
		                        isCurrent && /* @__PURE__ */ jsxs("span", { className: "dshmp-providerCurrent", children: [
		                          " \xB7 ",
		                          t("provider.current")
		                        ] })
		                      ] })
		                    ] }),
		                    /* @__PURE__ */ jsx("span", { className: "dshmp-cellChevron", children: /* @__PURE__ */ jsx(IconChevronRightOutline14, {}) })
		                  ]
		                },
		                group.id
		              );
		            }) }),
		            state.status === "ready" && providerGroups.length === 0 && /* @__PURE__ */ jsx("div", { className: "dshmp-empty", children: t("empty.models") })
		          ] }),
		          pane === "model" && activeProviderGroup !== void 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
		            /* @__PURE__ */ jsxs(
		              "button",
		              {
		                type: "button",
		                className: "dshmp-back",
		                onClick: () => {
		                  setPane("provider");
		                },
		                children: [
		                  /* @__PURE__ */ jsx(IconChevronLeftOutline14, {}),
		                  /* @__PURE__ */ jsx("span", { className: "dshmp-backLabel", children: activeProviderGroup.name })
		                ]
		              }
		            ),
		            statusBlock,
		            /* @__PURE__ */ jsx("div", { className: cx("dshmp-groups", "scrollable"), children: activeProviderGroup.models.map((model) => {
		              const selected = state.current?.provider === activeProviderGroup.id && state.current.model === model.id;
		              return /* @__PURE__ */ jsxs(
		                "button",
		                {
		                  ref: itemRef(),
		                  type: "button",
		                  role: "menuitemradio",
		                  "aria-checked": selected,
		                  className: cx("dshmp-option", selected && "dshmp-selected"),
		                  title: `${model.name} \xB7 ${activeProviderGroup.name}`,
		                  disabled: busy,
		                  onClick: () => {
		                    choose({ provider: activeProviderGroup.id, model: model.id });
		                  },
		                  children: [
		                    /* @__PURE__ */ jsxs("span", { className: "dshmp-optionCopy", children: [
		                      /* @__PURE__ */ jsx("span", { className: "dshmp-modelName", children: model.name }),
		                      model.description !== void 0 && /* @__PURE__ */ jsx("span", { className: "dshmp-description", children: model.description })
		                    ] }),
		                    /* @__PURE__ */ jsx("span", { className: "dshmp-check", children: selected ? /* @__PURE__ */ jsx(IconCheckOutline16, {}) : null })
		                  ]
		                },
		                model.id
		              );
		            }) }),
		            activeProviderGroup.models.length === 0 && /* @__PURE__ */ jsx("div", { className: "dshmp-empty", children: t("empty.models") })
		          ] }),
		          pane === "model" && activeProviderGroup === void 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
		            /* @__PURE__ */ jsxs(
		              "button",
		              {
		                type: "button",
		                className: "dshmp-back",
		                onClick: () => {
		                  setPane("provider");
		                },
		                children: [
		                  /* @__PURE__ */ jsx(IconChevronLeftOutline14, {}),
		                  /* @__PURE__ */ jsx("span", { className: "dshmp-backLabel", children: t("menu.model") })
		                ]
		              }
		            ),
		            /* @__PURE__ */ jsx("div", { className: "dshmp-empty", children: t("empty.models") })
		          ] }),
		          pane === "effort" && /* @__PURE__ */ jsxs(Fragment, { children: [
		            state.error !== null && lastActionRef.current === "load" && /* @__PURE__ */ jsxs("div", { className: "dshmp-error", children: [
		              /* @__PURE__ */ jsx("span", { children: t("error.action", { message: state.error }) }),
		              /* @__PURE__ */ jsx("button", { type: "button", className: "dshmp-retry", onClick: reload, children: t("action.reload") })
		            ] }),
		            effortChoices.length === 0 ? /* @__PURE__ */ jsx("div", { className: "dshmp-empty", children: t("empty.efforts") }) : effortChoices.map((level) => /* @__PURE__ */ jsxs(
		              "button",
		              {
		                ref: itemRef(),
		                type: "button",
		                role: "menuitemradio",
		                "aria-checked": effectiveEffort === level.effort,
		                className: cx("dshmp-option", effectiveEffort === level.effort && "dshmp-selected"),
		                disabled: busy,
		                onClick: () => {
		                  chooseEffort(level.effort);
		                },
		                children: [
		                  /* @__PURE__ */ jsxs("span", { className: "dshmp-optionCopy", children: [
		                    /* @__PURE__ */ jsx("span", { className: "dshmp-modelName", children: level.label }),
		                    level.description !== void 0 && /* @__PURE__ */ jsx("span", { className: "dshmp-description", children: level.description })
		                  ] }),
		                  /* @__PURE__ */ jsx("span", { className: "dshmp-check", children: effectiveEffort === level.effort ? /* @__PURE__ */ jsx(IconCheckOutline16, {}) : null })
		                ]
		              },
		              level.key
		            ))
		          ] })
		        ]
		      }
		    ),
		    toast !== null && /* @__PURE__ */ jsx(
		      Toast,
		      {
		        text: toast.text,
		        icon: /* @__PURE__ */ jsx(IconWarningOutline16, {}),
		        anchor: rootRef.current?.closest("[data-composer-card]") ?? null,
		        onDone: () => {
		          setToast(null);
		        }
		      },
		      toast.seq
		    )
		  ] });
		}
		function cx(...parts) {
		  let out = "";
		  for (const part of parts) {
		    if (!part) continue;
		    out += out.length > 0 ? ` ${part}` : part;
		  }
		  return out;
		}
		const inject = ["locale", "sessions", "slots", "modelDirectories"];
		function apply(ctx) {
		  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-model-provider: dictionaries");
		  const t = ctx.locale.bind(NS);
		  ctx.inject(["slots", "modelDirectories", "sessions"], (scope) => {
		    const models = scope.modelDirectories;
		    const sessions = scope.sessions;
		    scope.slots.inject(
		      "conversation.input.model",
		      () => scope.slots.register(
		        {
		          name: "conversation.input.model",
		          locale: NS,
		          // Shadowing priority: the single slot renders the LOWEST priority
		          // entry, so -1 beats the harness seat (0). Remove this registration
		          // and the original seat is restored verbatim.
		          priority: -1,
		          registrant: "dsh-model-provider",
		          inject: (sessionId) => {
		            const directory = models.directoryFor(sessionId);
		            const available = sessions.subagentAddress(sessionId) === void 0;
		            return {
		              available,
		              directory: directory.store,
		              load: () => {
		                if (available) directory.load().catch(() => {
		                });
		              },
		              select: (selection) => available ? directory.select(selection).then(() => true, () => false) : Promise.resolve(false)
		            };
		          }
		        },
		        ModelProviderSelect
		      ),
		      "dsh-model-provider: composer model seat"
		    );
		  });
		}
		
		exports.getModelKey = getModelKey;
		exports.groupModelsByProvider = groupModelsByProvider;
		exports.normalizeModel = normalizeModel;
		exports.apply = apply;
		exports.inject = inject;
		
		(function () {
		  if (typeof document === "undefined" || document.querySelector("style[data-plugin-css='dsh-model-provider']") !== null) return;
		  var tag = document.createElement("style");
		  tag.dataset.plugin = "dsh-model-provider";
		  tag.dataset.pluginCss = "dsh-model-provider";
		  tag.textContent = "/* dsh-model-provider — scoped styles for the provider-first model selector.\n   Mirrors the harness model-seat visuals (menu surface, rows) using the same\n   design tokens; the three-level panes and provider-bearing parts are new. */\n.dshmp-root{min-width:0;position:relative}\n.dshmp-trigger{min-width:0;max-width:min(360px,45cqw);height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:24px;outline:none;align-items:center;gap:4px;padding:0 4px 0 8px;font-size:13px;font-weight:500;line-height:20px;display:flex}\n.dshmp-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}\n.dshmp-trigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}\n.dshmp-trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}\n.dshmp-triggerLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}\n.dshmp-triggerProvider{color:var(--dsw-alias-label-caption);white-space:nowrap;flex:none}\n.dshmp-triggerEffort{color:var(--dsw-alias-label-caption);flex:none}\n.dshmp-chevron{color:var(--dsw-alias-label-caption);flex:none;transition:transform .12s}\n.dshmp-chevronOpen{transform:rotate(180deg)}\n.dshmp-menu{z-index:20;border:1px solid var(--dsw-alias-border-inverted);background:var(--dsw-specific-menu);width:max-content;min-width:min(240px,100vw - 32px);max-width:min(420px,100vw - 32px);max-height:min(360px,100vh - 96px);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-primary);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);border-radius:12px;flex-direction:column;padding:4px;display:flex;position:absolute;bottom:calc(100% + 8px);right:0;overflow:hidden}\n.dshmp-status,.dshmp-empty{color:var(--dsw-alias-label-tertiary);padding:10px;font-size:13px;line-height:20px}\n.dshmp-error,.dshmp-warning{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary);border-radius:8px;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px;padding:7px 8px;font-size:12px;line-height:18px;display:flex}\n.dshmp-warning{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-state-warn-label)}\n.dshmp-retry{color:inherit;font:inherit;cursor:pointer;background:0 0;border:none;flex:none;padding:0;font-weight:600}\n/* three-level panes: the scrollable list takes the remaining height below the\n   back header, so the header stays put while the options scroll. */\n.dshmp-back{box-sizing:border-box;width:auto;min-width:100%;height:36px;color:var(--dsw-alias-label-secondary);cursor:pointer;text-align:left;background:0 0;border:none;border-radius:10px;align-items:center;gap:6px;padding:0 8px;font-size:13px;line-height:20px;display:flex;flex:none}\n.dshmp-back:hover:not(:disabled),.dshmp-back:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}\n.dshmp-back:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}\n.dshmp-backLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}\n.dshmp-groups{flex:1 1 auto;min-height:0;overflow-y:auto}\n.dshmp-option{box-sizing:border-box;width:auto;min-width:100%;min-height:38px;color:inherit;text-align:left;cursor:pointer;background:0 0;border:none;border-radius:10px;outline:none;align-items:center;gap:8px;padding:6px 8px;display:flex}\n.dshmp-option:hover:not(:disabled),.dshmp-option:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}\n.dshmp-selected{background:0 0}\n.dshmp-option:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}\n.dshmp-optionCopy{flex-direction:column;flex:1;min-width:0;display:flex}\n.dshmp-modelName{color:inherit;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:500;line-height:20px;overflow:hidden}\n.dshmp-description{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px;overflow:hidden}\n.dshmp-check{color:var(--dsw-alias-label-primary);flex:0 0 18px;place-items:center;display:grid}\n.dshmp-cell{box-sizing:border-box;width:auto;min-width:100%;height:40px;color:var(--dsw-alias-label-primary);cursor:pointer;text-align:left;background:0 0;border:none;border-radius:10px;align-items:center;gap:8px;padding:0 10px;font-size:14px;line-height:22px;display:flex}\n.dshmp-cell:hover{background:var(--dsw-alias-interactive-bg-hover)}\n.dshmp-cellLabel{white-space:nowrap;flex:none}\n.dshmp-cellValue{text-overflow:ellipsis;white-space:nowrap;text-align:right;min-width:0;color:var(--dsw-alias-label-tertiary);flex:auto;overflow:hidden}\n.dshmp-cellChevron{color:var(--dsw-alias-label-tertiary);flex:none}\n/* provider pane: the active provider is pinned first and marked in the row. */\n.dshmp-providerActive{background:var(--dsw-alias-interactive-bg-active)}\n.dshmp-providerCurrent{color:var(--dsw-alias-state-business-primary);font-weight:500}\n";
		  document.head.appendChild(tag);
		})();
		return module.exports;
	}
});

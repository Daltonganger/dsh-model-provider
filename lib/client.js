window.__ModuleLoader__.load({
	id: "dsh-model-provider",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		// src/components/ModelSelector.tsx
		let _mod_0 = require("react/jsx-runtime");
		let Fragment6 = _mod_0.Fragment, jsx6 = _mod_0.jsx, jsxs6 = _mod_0.jsxs;
		// src/model/selection.ts
		function compositeKey(providerId, modelId) {
		  return providerId + ":" + modelId;
		}
		function getModelKey(model) {
		  return compositeKey(model.providerId, model.modelId);
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
		function selectionFor(group, model) {
		  return {
		    provider: group.id,
		    model: model.id,
		    ...model.reasoning?.defaultEffort === void 0 ? {} : { reasoningEffort: model.reasoning.defaultEffort }
		  };
		}
		function sortGroupsForCurrent(groups, currentId) {
		  if (currentId === void 0) return groups;
		  return [...groups].sort((a, b) => {
		    if (a.id === currentId) return -1;
		    if (b.id === currentId) return 1;
		    return 0;
		  });
		}
		function findCurrentChoice(choices, current) {
		  if (current === null) return void 0;
		  return choices.find(
		    (choice) => choice.selection.provider === current.provider && choice.selection.model === current.model
		  );
		}
		function isCurrentSelected(current, providerId, modelId) {
		  return current !== null && current.provider === providerId && current.model === modelId;
		}
		function matchesQuery(text, query) {
		  const q = query.trim().toLowerCase();
		  return q === "" || text !== void 0 && text.toLowerCase().includes(q);
		}
		function filterGroupsByQuery(groups, query) {
		  return groups.filter((group) => matchesQuery(group.name, query) || matchesQuery(group.id, query));
		}
		function filterModelsByQuery(models, query) {
		  return models.filter(
		    (model) => matchesQuery(model.name, query) || matchesQuery(model.id, query) || matchesQuery(model.description, query)
		  );
		}
		function filterFailuresByQuery(failures, query) {
		  return failures.filter((failure) => matchesQuery(failure.name, query) || matchesQuery(failure.id, query));
		}
		function nextPaneOnEscape(pane) {
		  switch (pane) {
		    case "model":
		      return "provider";
		    case "provider":
		    case "effort":
		      return "root";
		    default:
		      return "close";
		  }
		}
		
		// src/hooks/useKeyboardNavigation.ts
		let _mod_1 = require("react");
		let useCallback = _mod_1.useCallback;
		function useKeyboardNavigation({ open, pane, itemRefs, setPane, onClose }) {
		  const moveFocus = useCallback(
		    (offset) => {
		      const items = itemRefs.current.filter((item) => item !== null);
		      if (items.length === 0) return;
		      const active = items.findIndex((item) => item === document.activeElement);
		      items[(Math.max(active, 0) + offset + items.length) % items.length]?.focus();
		    },
		    [itemRefs]
		  );
		  const onRootKeyDown = useCallback(
		    (event) => {
		      if (open && event.key === "Escape") {
		        event.preventDefault();
		        const next = nextPaneOnEscape(pane);
		        if (next === "close") {
		          onClose(true);
		        } else {
		          setPane(next);
		        }
		        return;
		      }
		      if (!open) return;
		      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
		        event.preventDefault();
		        moveFocus(event.key === "ArrowDown" ? 1 : -1);
		      }
		    },
		    [open, pane, setPane, onClose, moveFocus]
		  );
		  return { onRootKeyDown, moveFocus };
		}
		
		// src/components/EffortPane.tsx
		let _mod_2 = require("react/jsx-runtime");
		let Fragment = _mod_2.Fragment, jsx = _mod_2.jsx, jsxs = _mod_2.jsxs;
		let _mod_3 = require("@deepseek-ai/dsh-client-ui-primitives");
		let IconCheckOutline16 = _mod_3.IconCheckOutline16;
		function EffortPane({ levels, effectiveEffort, busy, errorBlock, onPick, registerRef, t }) {
		  if (levels.length === 0) {
		    return /* @__PURE__ */ jsx("div", { className: "dshmp-empty", children: t("empty.efforts") });
		  }
		  return /* @__PURE__ */ jsxs(Fragment, { children: [
		    errorBlock,
		    levels.map((level) => {
		      const selected = effectiveEffort === level.effort;
		      return /* @__PURE__ */ jsxs(
		        "button",
		        {
		          ref: (node) => registerRef(node),
		          type: "button",
		          role: "menuitemradio",
		          "aria-checked": selected,
		          className: selected ? "dshmp-option dshmp-selected" : "dshmp-option",
		          disabled: busy,
		          onClick: () => onPick(level.effort),
		          children: [
		            /* @__PURE__ */ jsxs("span", { className: "dshmp-optionCopy", children: [
		              /* @__PURE__ */ jsx("span", { className: "dshmp-modelName", children: level.label }),
		              level.description !== void 0 && /* @__PURE__ */ jsx("span", { className: "dshmp-description", children: level.description })
		            ] }),
		            /* @__PURE__ */ jsx("span", { className: "dshmp-check", children: selected ? /* @__PURE__ */ jsx(IconCheckOutline16, {}) : null })
		          ]
		        },
		        level.key
		      );
		    })
		  ] });
		}
		
		// src/components/ModelPane.tsx
		let _mod_4 = require("react/jsx-runtime");
		let Fragment2 = _mod_4.Fragment, jsx2 = _mod_4.jsx, jsxs2 = _mod_4.jsxs;
		let _mod_5 = require("@deepseek-ai/dsh-client-ui-primitives");
		let IconCheckOutline162 = _mod_5.IconCheckOutline16, IconChevronLeftOutline14 = _mod_5.IconChevronLeftOutline14, IconSearchOutline16 = _mod_5.IconSearchOutline16;
		let _mod_6 = require("react");
		let useState = _mod_6.useState;
		function ModelPane({ group, current, busy, statusBlock, onPick, onBack, registerRef, t }) {
		  const [query, setQuery] = useState("");
		  const visibleModels = filterModelsByQuery(group.models, query);
		  return /* @__PURE__ */ jsxs2(Fragment2, { children: [
		    /* @__PURE__ */ jsxs2("button", { type: "button", className: "dshmp-back", onClick: onBack, children: [
		      /* @__PURE__ */ jsx2(IconChevronLeftOutline14, {}),
		      /* @__PURE__ */ jsx2("span", { className: "dshmp-backLabel", children: group.name })
		    ] }),
		    /* @__PURE__ */ jsx2("div", { className: "dshmp-subhead", children: t("model.usecount", { provider: group.name, count: group.models.length }) }),
		    /* @__PURE__ */ jsxs2("div", { className: "dshmp-searchWrap", children: [
		      /* @__PURE__ */ jsx2(IconSearchOutline16, { className: "dshmp-searchIcon" }),
		      /* @__PURE__ */ jsx2(
		        "input",
		        {
		          type: "search",
		          className: "dshmp-search",
		          placeholder: t("model.search", { provider: group.name }),
		          "aria-label": t("model.search", { provider: group.name }),
		          value: query,
		          onChange: (event) => setQuery(event.target.value),
		          onKeyDown: (event) => {
		            if (event.key === "Escape" && query !== "") {
		              event.preventDefault();
		              event.stopPropagation();
		              setQuery("");
		            }
		          }
		        }
		      )
		    ] }),
		    statusBlock,
		    /* @__PURE__ */ jsx2("div", { className: "dshmp-groups scrollable", children: visibleModels.map((model) => {
		      const selected = isCurrentSelected(current, group.id, model.id);
		      return /* @__PURE__ */ jsxs2(
		        "button",
		        {
		          ref: (node) => registerRef(node),
		          type: "button",
		          role: "menuitemradio",
		          "aria-checked": selected,
		          className: selected ? "dshmp-option dshmp-selected" : "dshmp-option",
		          title: model.name + " · " + group.name,
		          disabled: busy,
		          onClick: () => onPick(model),
		          children: [
		            /* @__PURE__ */ jsxs2("span", { className: "dshmp-optionCopy", children: [
		              /* @__PURE__ */ jsx2("span", { className: "dshmp-modelName", children: model.name }),
		              model.description !== void 0 && /* @__PURE__ */ jsx2("span", { className: "dshmp-description", children: model.description })
		            ] }),
		            /* @__PURE__ */ jsx2("span", { className: "dshmp-check", children: selected ? /* @__PURE__ */ jsx2(IconCheckOutline162, {}) : null })
		          ]
		        },
		        compositeKey(group.id, model.id)
		      );
		    }) }),
		    group.models.length > 0 && visibleModels.length === 0 && /* @__PURE__ */ jsx2("div", { className: "dshmp-empty", children: t("empty.search") }),
		    group.models.length === 0 && /* @__PURE__ */ jsx2("div", { className: "dshmp-empty", children: t("empty.models") })
		  ] });
		}
		
		// src/components/ProviderPane.tsx
		let _mod_7 = require("react/jsx-runtime");
		let Fragment3 = _mod_7.Fragment, jsx3 = _mod_7.jsx, jsxs3 = _mod_7.jsxs;
		let _mod_8 = require("@deepseek-ai/dsh-client-ui-primitives");
		let IconChevronLeftOutline142 = _mod_8.IconChevronLeftOutline14, IconChevronRightOutline14 = _mod_8.IconChevronRightOutline14, IconSearchOutline162 = _mod_8.IconSearchOutline16, IconWarningOutline16 = _mod_8.IconWarningOutline16;
		let _mod_9 = require("react");
		let useState2 = _mod_9.useState;
		function ProviderPane({
		  groups,
		  failures,
		  currentProvider,
		  statusBlock,
		  onPick,
		  onRetryLoad,
		  onBack,
		  registerRef,
		  t
		}) {
		  const [query, setQuery] = useState2("");
		  const visibleGroups = filterGroupsByQuery(groups, query);
		  const visibleFailures = filterFailuresByQuery(failures, query);
		  return /* @__PURE__ */ jsxs3(Fragment3, { children: [
		    /* @__PURE__ */ jsxs3("button", { type: "button", className: "dshmp-back", onClick: onBack, children: [
		      /* @__PURE__ */ jsx3(IconChevronLeftOutline142, {}),
		      /* @__PURE__ */ jsx3("span", { className: "dshmp-backLabel", children: t("provider.header") })
		    ] }),
		    /* @__PURE__ */ jsxs3("div", { className: "dshmp-searchWrap", children: [
		      /* @__PURE__ */ jsx3(IconSearchOutline162, { className: "dshmp-searchIcon" }),
		      /* @__PURE__ */ jsx3(
		        "input",
		        {
		          type: "search",
		          className: "dshmp-search",
		          placeholder: t("provider.search"),
		          "aria-label": t("provider.search"),
		          value: query,
		          onChange: (event) => setQuery(event.target.value),
		          onKeyDown: (event) => {
		            if (event.key === "Escape" && query !== "") {
		              event.preventDefault();
		              event.stopPropagation();
		              setQuery("");
		            }
		          }
		        }
		      )
		    ] }),
		    statusBlock,
		    /* @__PURE__ */ jsxs3("div", { className: "dshmp-groups scrollable", children: [
		      visibleGroups.map((group) => {
		        const isCurrent = currentProvider === group.id;
		        const metaText = t("provider.models", { count: group.models.length });
		        return /* @__PURE__ */ jsxs3(
		          "button",
		          {
		            ref: (node) => registerRef(node),
		            type: "button",
		            role: "menuitem",
		            "aria-label": t("provider.aria", {
		              name: group.name,
		              meta: isCurrent ? metaText + " · " + t("provider.current") : metaText
		            }),
		            className: "dshmp-option",
		            onClick: () => onPick(group),
		            children: [
		              /* @__PURE__ */ jsxs3("span", { className: "dshmp-optionCopy", children: [
		                /* @__PURE__ */ jsx3("span", { className: "dshmp-modelName", children: group.name }),
		                /* @__PURE__ */ jsxs3("span", { className: "dshmp-description", children: [
		                  metaText,
		                  isCurrent && /* @__PURE__ */ jsxs3("span", { className: "dshmp-providerCurrent", children: [
		                    " · ",
		                    t("provider.current")
		                  ] })
		                ] })
		              ] }),
		              /* @__PURE__ */ jsx3("span", { className: "dshmp-cellChevron", children: /* @__PURE__ */ jsx3(IconChevronRightOutline14, {}) })
		            ]
		          },
		          group.id
		        );
		      }),
		      visibleFailures.map((failure) => /* @__PURE__ */ jsxs3(
		        "button",
		        {
		          ref: (node) => registerRef(node),
		          type: "button",
		          role: "menuitem",
		          "aria-label": t("warning.groupLoad", { name: failure.name, message: failure.message }),
		          title: t("warning.groupLoad", { name: failure.name, message: failure.message }),
		          className: "dshmp-option dshmp-failed",
		          onClick: onRetryLoad,
		          children: [
		            /* @__PURE__ */ jsxs3("span", { className: "dshmp-optionCopy", children: [
		              /* @__PURE__ */ jsx3("span", { className: "dshmp-modelName", children: failure.name }),
		              /* @__PURE__ */ jsxs3("span", { className: "dshmp-description dshmp-failedText", children: [
		                /* @__PURE__ */ jsx3(IconWarningOutline16, { className: "dshmp-failedIcon" }),
		                t("provider.failed"),
		                "：",
		                failure.message
		              ] })
		            ] }),
		            /* @__PURE__ */ jsx3("span", { className: "dshmp-optionRetry", children: t("retry") })
		          ]
		        },
		        failure.id
		      ))
		    ] }),
		    groups.length > 0 && visibleGroups.length === 0 && visibleFailures.length === 0 && /* @__PURE__ */ jsx3("div", { className: "dshmp-empty", children: t("empty.searchProviders") }),
		    groups.length === 0 && failures.length === 0 && /* @__PURE__ */ jsx3("div", { className: "dshmp-empty", children: t("empty.models") })
		  ] });
		}
		
		// src/components/RootPane.tsx
		let _mod_10 = require("react/jsx-runtime");
		let Fragment4 = _mod_10.Fragment, jsx4 = _mod_10.jsx, jsxs4 = _mod_10.jsxs;
		let _mod_11 = require("@deepseek-ai/dsh-client-ui-primitives");
		let IconChevronRightOutline142 = _mod_11.IconChevronRightOutline14;
		function RootPane({ modelLabel, effortLabel, hasEffort, onOpenProvider, onOpenEffort, registerRef, t }) {
		  return /* @__PURE__ */ jsxs4(Fragment4, { children: [
		    /* @__PURE__ */ jsxs4(
		      "button",
		      {
		        ref: (node) => registerRef(node),
		        type: "button",
		        role: "menuitem",
		        className: "dshmp-cell",
		        onClick: onOpenProvider,
		        children: [
		          /* @__PURE__ */ jsx4("span", { className: "dshmp-cellLabel", children: t("menu.model") }),
		          /* @__PURE__ */ jsx4("span", { className: "dshmp-cellValue", children: modelLabel }),
		          /* @__PURE__ */ jsx4(IconChevronRightOutline142, { className: "dshmp-cellChevron" })
		        ]
		      }
		    ),
		    hasEffort && /* @__PURE__ */ jsxs4(
		      "button",
		      {
		        ref: (node) => registerRef(node),
		        type: "button",
		        role: "menuitem",
		        className: "dshmp-cell",
		        onClick: onOpenEffort,
		        children: [
		          /* @__PURE__ */ jsx4("span", { className: "dshmp-cellLabel", children: t("menu.effort") }),
		          /* @__PURE__ */ jsx4("span", { className: "dshmp-cellValue", children: effortLabel }),
		          /* @__PURE__ */ jsx4(IconChevronRightOutline142, { className: "dshmp-cellChevron" })
		        ]
		      }
		    )
		  ] });
		}
		
		// src/components/StatusBlock.tsx
		let _mod_12 = require("react/jsx-runtime");
		let Fragment5 = _mod_12.Fragment, jsx5 = _mod_12.jsx, jsxs5 = _mod_12.jsxs;
		function StatusBlock({ loading, loadingText, errorText, onRetry, retryText }) {
		  return /* @__PURE__ */ jsxs5(Fragment5, { children: [
		    loading && /* @__PURE__ */ jsx5("div", { className: "dshmp-status", children: loadingText }),
		    errorText !== null && /* @__PURE__ */ jsxs5("div", { className: "dshmp-error", children: [
		      /* @__PURE__ */ jsx5("span", { children: errorText }),
		      /* @__PURE__ */ jsx5("button", { type: "button", className: "dshmp-retry", onClick: onRetry, children: retryText })
		    ] })
		  ] });
		}
		
		// src/components/ModelSelector.tsx
		let _mod_13 = require("react");
		let useEffect = _mod_13.useEffect, useId = _mod_13.useId, useMemo = _mod_13.useMemo, useRef = _mod_13.useRef, useState3 = _mod_13.useState, useSyncExternalStore = _mod_13.useSyncExternalStore;
		let _mod_14 = require("@deepseek-ai/dsh-client-ui-primitives");
		let IconChevronDownOutline14 = _mod_14.IconChevronDownOutline14, IconChevronLeftOutline143 = _mod_14.IconChevronLeftOutline14, IconWarningOutline162 = _mod_14.IconWarningOutline16, Toast = _mod_14.Toast;
		function ModelSelector({ locked, available, directory, load, select, t }) {
		  const state = useSyncExternalStore((fn) => directory.subscribe(fn), () => directory.getSnapshot());
		  const [open, setOpen] = useState3(false);
		  const [pane, setPane] = useState3("root");
		  const [selectedProvider, setSelectedProvider] = useState3(null);
		  const lastActionRef = useRef("load");
		  const [toast, setToast] = useState3(null);
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
		        selection: selectionFor(group, model)
		      }))
		    ),
		    [state.groups]
		  );
		  const currentChoice = findCurrentChoice(choices, state.current);
		  const reasoning = currentChoice?.model.reasoning;
		  const effectiveEffort = state.current?.reasoningEffort ?? reasoning?.defaultEffort;
		  const effortIsCustom = effectiveEffort !== void 0 && effectiveEffort !== reasoning?.defaultEffort;
		  const effortLabel = reasoning === void 0 ? void 0 : effectiveEffort === void 0 ? t("effort.providerDefault") : reasoning.efforts.find((level) => level.id === effectiveEffort)?.name ?? effectiveEffort;
		  const visibleEffortLabel = effortIsCustom ? effortLabel : void 0;
		  const modelLabel = currentChoice?.model.name ?? t("trigger.fallback");
		  const providerLabel = currentChoice?.group.name;
		  const triggerLabel = providerLabel === void 0 ? visibleEffortLabel === void 0 ? modelLabel : modelLabel + " · " + visibleEffortLabel : visibleEffortLabel === void 0 ? modelLabel + " · " + providerLabel : modelLabel + " · " + providerLabel + " · " + visibleEffortLabel;
		  const triggerAria = currentChoice === void 0 ? t("trigger.selectAria") : effortLabel === void 0 ? t("trigger.aria", { model: modelLabel, provider: providerLabel }) : t("trigger.ariaEffort", { model: modelLabel, provider: providerLabel, effort: effortLabel });
		  const effortChoices = useMemo(
		    () => reasoning === void 0 ? [] : [
		      ...reasoning.defaultEffort === void 0 ? [{ key: "provider-default", effort: void 0, label: t("effort.providerDefault") }] : [],
		      ...reasoning.efforts.map((effort) => ({
		        key: "effort:" + effort.id,
		        effort: effort.id,
		        label: effort.name,
		        ...effort.description === void 0 ? {} : { description: effort.description }
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
		  const { onRootKeyDown } = useKeyboardNavigation({ open, pane, itemRefs, setPane, onClose: close });
		  if (!available) return null;
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
		    if (state.current !== null && state.current.provider === selection.provider && state.current.model === selection.model) {
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
		  let cursor = 0;
		  const registerRef = (node) => {
		    itemRefs.current[cursor++] = node;
		  };
		  const statusBlock = /* @__PURE__ */ jsx6(
		    StatusBlock,
		    {
		      loading: state.status === "loading",
		      loadingText: t("status.loading"),
		      errorText: state.error !== null && lastActionRef.current === "load" ? t("error.action", { message: state.error }) : null,
		      onRetry: reload,
		      retryText: t("retry")
		    }
		  );
		  const errorBlock = /* @__PURE__ */ jsx6(
		    StatusBlock,
		    {
		      loading: false,
		      loadingText: "",
		      errorText: state.error !== null && lastActionRef.current === "load" ? t("error.action", { message: state.error }) : null,
		      onRetry: reload,
		      retryText: t("action.reload")
		    }
		  );
		  return /* @__PURE__ */ jsxs6("div", { ref: rootRef, className: "dshmp-root", onKeyDown: onRootKeyDown, onBlur, children: [
		    /* @__PURE__ */ jsxs6(
		      "button",
		      {
		        ref: triggerRef,
		        type: "button",
		        className: "dshmp-trigger",
		        "aria-label": triggerAria,
		        "aria-haspopup": "menu",
		        "aria-expanded": open,
		        "aria-controls": open ? id + "-menu" : void 0,
		        title: triggerLabel,
		        disabled: locked,
		        onClick: () => {
		          if (open) close();
		          else show();
		        },
		        children: [
		          /* @__PURE__ */ jsx6("span", { className: "dshmp-triggerLabel", children: modelLabel }),
		          providerLabel !== void 0 && /* @__PURE__ */ jsxs6("span", { className: "dshmp-triggerProvider", children: [
		            "· ",
		            providerLabel
		          ] }),
		          visibleEffortLabel !== void 0 && /* @__PURE__ */ jsxs6("span", { className: "dshmp-triggerEffort", children: [
		            "· ",
		            visibleEffortLabel
		          ] }),
		          /* @__PURE__ */ jsx6(IconChevronDownOutline14, { className: open ? "dshmp-chevron dshmp-chevronOpen" : "dshmp-chevron" })
		        ]
		      }
		    ),
		    open && /* @__PURE__ */ jsxs6(
		      "div",
		      {
		        id: id + "-menu",
		        className: "dshmp-menu",
		        role: "menu",
		        "aria-label": t("menu.aria"),
		        "aria-busy": state.status === "loading" || busy,
		        children: [
		          pane === "root" && /* @__PURE__ */ jsx6(
		            RootPane,
		            {
		              modelLabel,
		              effortLabel,
		              hasEffort: reasoning !== void 0,
		              onOpenProvider: () => {
		                setSelectedProvider(null);
		                setPane("provider");
		              },
		              onOpenEffort: () => {
		                setPane("effort");
		              },
		              registerRef,
		              t
		            }
		          ),
		          pane === "provider" && /* @__PURE__ */ jsx6(
		            ProviderPane,
		            {
		              groups: providerGroups,
		              failures: state.failures,
		              currentProvider: state.current?.provider,
		              statusBlock,
		              onPick: (group) => {
		                setSelectedProvider(group.id);
		                setPane("model");
		              },
		              onRetryLoad: reload,
		              onBack: () => {
		                setPane("root");
		              },
		              registerRef,
		              t
		            }
		          ),
		          pane === "model" && activeProviderGroup !== void 0 && /* @__PURE__ */ jsx6(
		            ModelPane,
		            {
		              group: activeProviderGroup,
		              current: state.current,
		              busy,
		              statusBlock,
		              onPick: (model) => {
		                choose(selectionFor(activeProviderGroup, model));
		              },
		              onBack: () => {
		                setPane("provider");
		              },
		              registerRef,
		              t
		            }
		          ),
		          pane === "model" && activeProviderGroup === void 0 && /* @__PURE__ */ jsxs6(Fragment6, { children: [
		            /* @__PURE__ */ jsxs6(
		              "button",
		              {
		                type: "button",
		                className: "dshmp-back",
		                onClick: () => {
		                  setPane("provider");
		                },
		                children: [
		                  /* @__PURE__ */ jsx6(IconChevronLeftOutline143, {}),
		                  /* @__PURE__ */ jsx6("span", { className: "dshmp-backLabel", children: t("menu.model") })
		                ]
		              }
		            ),
		            /* @__PURE__ */ jsx6("div", { className: "dshmp-empty", children: t("empty.models") })
		          ] }),
		          pane === "effort" && /* @__PURE__ */ jsx6(
		            EffortPane,
		            {
		              levels: effortChoices,
		              effectiveEffort,
		              busy,
		              errorBlock,
		              onPick: chooseEffort,
		              registerRef,
		              t
		            }
		          )
		        ]
		      }
		    ),
		    toast !== null && /* @__PURE__ */ jsx6(
		      Toast,
		      {
		        text: toast.text,
		        icon: /* @__PURE__ */ jsx6(IconWarningOutline162, {}),
		        anchor: rootRef.current?.closest("[data-composer-card]") ?? null,
		        onDone: () => {
		          setToast(null);
		        }
		      },
		      toast.seq
		    )
		  ] });
		}
		
		// src/locale.ts
		var NS = "modelProvider";
		var zh = {
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
		  "provider.search": "搜索供应商",
		  "provider.failed": "加载失败",
		  "provider.failedDetail": "{name} 加载失败：{message}",
		  "model.search": "搜索 {provider} 模型",
		  "model.usecount": "{provider} 的 {count} 个模型",
		  "effort.providerDefault": "Default",
		  "status.loading": "正在刷新模型列表…",
		  "error.action": "模型操作失败：{message}",
		  "retry": "重新加载",
		  "action.reload": "重新加载",
		  "warning.groupLoad": "{name} 加载失败：{message}",
		  "empty.models": "没有可用的模型。",
		  "empty.search": "没有匹配的模型。",
		  "empty.searchProviders": "没有匹配的供应商。",
		  "empty.efforts": "当前模型未提供推理等级。"
		};
		var en = {
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
		  "provider.search": "Search providers",
		  "provider.failed": "Failed to load",
		  "provider.failedDetail": "{name} failed to load: {message}",
		  "model.search": "Search {provider} models",
		  "model.usecount": "{count} models from {provider}",
		  "effort.providerDefault": "Default",
		  "status.loading": "Refreshing model list…",
		  "error.action": "Model operation failed: {message}",
		  "retry": "Reload",
		  "action.reload": "Reload",
		  "warning.groupLoad": "{name} failed to load: {message}",
		  "empty.models": "No models available.",
		  "empty.search": "No matching models.",
		  "empty.searchProviders": "No matching providers.",
		  "empty.efforts": "This model provides no reasoning effort levels."
		};
		
		// src/client.tsx
		var inject = ["locale", "sessions", "slots", "modelDirectories"];
		function apply(ctx) {
		  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-model-provider: dictionaries");
		  ctx.inject(["slots", "modelDirectories", "sessions", "remote", "remote.session"], (scope) => {
		    const models = scope.modelDirectories;
		    const sessions = scope.sessions;
		    scope.slots.inject(
		      "conversation.input.model",
		      () => scope.slots.register(
		        {
		          name: "conversation.input.model",
		          locale: NS,
		          // Shadowing priority: the single slot renders the LOWEST priority
		          // entry, so -1 beats the harness seat (0). Same key at the same
		          // priority would throw, but a different priority shadows cleanly.
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
		        ModelSelector
		      )
		    );
		  });
		}
		
		exports.apply = apply;
		exports.compositeKey = compositeKey;
		exports.getModelKey = getModelKey;
		exports.groupModelsByProvider = groupModelsByProvider;
		exports.inject = inject;
		exports.normalizeModel = normalizeModel;
		exports.selectionFor = selectionFor;
		exports.sortGroupsForCurrent = sortGroupsForCurrent;
		
		(function () {
		  if (typeof document === "undefined" || document.querySelector("style[data-plugin-css='dsh-model-provider']") !== null) return;
		  var tag = document.createElement("style");
		  tag.dataset.plugin = "dsh-model-provider";
		  tag.dataset.pluginCss = "dsh-model-provider";
		  tag.textContent = "/* dsh-model-provider - scoped styles for the provider-first model selector.\n   Mirrors the harness model-seat visuals (menu surface, rows) using the same\n   design tokens; the three-level panes, search boxes, subheads and failed\n   provider rows are new. */\n.dshmp-root{min-width:0;position:relative}\n.dshmp-trigger{min-width:0;max-width:min(360px,45cqw);height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:24px;outline:none;align-items:center;gap:4px;padding:0 4px 0 8px;font-size:13px;font-weight:500;line-height:20px;display:flex}\n.dshmp-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}\n.dshmp-trigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}\n.dshmp-trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}\n.dshmp-triggerLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}\n.dshmp-triggerProvider{color:var(--dsw-alias-label-caption);white-space:nowrap;flex:none}\n.dshmp-triggerEffort{color:var(--dsw-alias-label-caption);flex:none}\n.dshmp-chevron{color:var(--dsw-alias-label-caption);flex:none;transition:transform .12s}\n.dshmp-chevronOpen{transform:rotate(180deg)}\n.dshmp-menu{z-index:20;border:1px solid var(--dsw-alias-border-inverted);background:var(--dsw-specific-menu);width:max-content;min-width:min(240px,100vw - 32px);max-width:min(420px,100vw - 32px);max-height:min(360px,100vh - 96px);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-primary);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);border-radius:12px;flex-direction:column;padding:4px;display:flex;position:absolute;bottom:calc(100% + 8px);right:0;overflow:hidden}\n.dshmp-status,.dshmp-empty{color:var(--dsw-alias-label-tertiary);padding:10px;font-size:13px;line-height:20px}\n.dshmp-error{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary);border-radius:8px;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px;padding:7px 8px;font-size:12px;line-height:18px;display:flex}\n.dshmp-retry{color:inherit;font:inherit;cursor:pointer;background:0 0;border:none;flex:none;padding:0;font-weight:600}\n/* three-level panes: the header block (back + subhead + search) stays put\n   while the option list scrolls below it. */\n.dshmp-back{box-sizing:border-box;width:auto;min-width:100%;height:36px;color:var(--dsw-alias-label-secondary);cursor:pointer;text-align:left;background:0 0;border:none;border-radius:10px;align-items:center;gap:6px;padding:0 8px;font-size:13px;line-height:20px;display:flex;flex:none}\n.dshmp-back:hover:not(:disabled),.dshmp-back:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}\n.dshmp-back:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}\n.dshmp-backLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}\n.dshmp-subhead{color:var(--dsw-alias-label-tertiary);flex:none;padding:0 10px 2px;font-size:12px;line-height:18px}\n.dshmp-searchWrap{flex:none;position:relative;display:flex;margin:2px 0 4px}\n.dshmp-searchIcon{position:absolute;left:9px;top:50%;color:var(--dsw-alias-label-tertiary);pointer-events:none;transform:translateY(-50%)}\n.dshmp-search{box-sizing:border-box;width:auto;min-width:100%;height:30px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover);border:1px solid var(--dsw-alias-border-l3);border-radius:10px;outline:none;padding:0 10px 0 30px;font:inherit;font-size:13px;line-height:18px;flex:none}\n.dshmp-search::placeholder{color:var(--dsw-alias-label-tertiary)}\n.dshmp-search:focus{border-color:var(--dsw-alias-state-business-primary)}\n.dshmp-search::-webkit-search-cancel-button{opacity:.45}\n.dshmp-groups{flex:1 1 auto;min-height:0;overflow-y:auto}\n.dshmp-option{box-sizing:border-box;width:auto;min-width:100%;min-height:38px;color:inherit;text-align:left;cursor:pointer;background:0 0;border:none;border-radius:10px;outline:none;align-items:center;gap:8px;padding:6px 8px;display:flex}\n.dshmp-option:hover:not(:disabled),.dshmp-option:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}\n.dshmp-selected{background:0 0}\n.dshmp-option:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}\n.dshmp-optionCopy{flex-direction:column;flex:1;min-width:0;display:flex}\n.dshmp-modelName{color:inherit;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:500;line-height:20px;overflow:hidden}\n.dshmp-description{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px;overflow:hidden}\n.dshmp-check{color:var(--dsw-alias-label-primary);flex:0 0 18px;place-items:center;display:grid}\n.dshmp-cell{box-sizing:border-box;width:auto;min-width:100%;height:40px;color:var(--dsw-alias-label-primary);cursor:pointer;text-align:left;background:0 0;border:none;border-radius:10px;align-items:center;gap:8px;padding:0 10px;font-size:14px;line-height:22px;display:flex}\n.dshmp-cell:hover{background:var(--dsw-alias-interactive-bg-hover)}\n.dshmp-cellLabel{white-space:nowrap;flex:none}\n.dshmp-cellValue{text-overflow:ellipsis;white-space:nowrap;text-align:right;min-width:0;color:var(--dsw-alias-label-tertiary);flex:auto;overflow:hidden}\n.dshmp-cellChevron{color:var(--dsw-alias-label-tertiary);flex:none}\n/* provider pane: the current provider is pinned first and marked by text\n   (\"· 当前\"), no full-row highlight - matches the harness menu surface. */\n.dshmp-providerCurrent{color:var(--dsw-alias-state-business-primary);font-weight:500}\n/* failed provider row: warning glyph + message on the left, retry on the\n   right; the whole row acts as the retry action. */\n.dshmp-failed{color:var(--dsw-alias-state-warn-label)}\n.dshmp-failedText{display:flex;align-items:center;gap:4px;color:inherit}\n.dshmp-failedIcon{flex:none}\n.dshmp-optionRetry{color:var(--dsw-alias-state-error-primary);font-size:12px;font-weight:600;flex:none;border:none;background:0 0;font:inherit;padding:0}\n";
		  document.head.appendChild(tag);
		})();
		return module.exports;
	}
});

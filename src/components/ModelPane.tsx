/**
 * dsh-model-provider - model pane: only the selected provider's models.
 * Header shows "‹ {provider}" plus a model-count subhead so the pane reads as
 * a page of its own; a local search filters this provider's models only.
 * Row keys are the provider-scoped composite key, so same-named models from
 * different providers never collide.
 */
import {
  IconCheckOutlineRegular,
  IconChevronLeftOutlineRegular,
  IconSearchOutlineRegular
} from "@deepseek-ai/dsh-client-ui-primitives";
import { useState } from "react";
import { compositeKey, filterModelsByQuery, isCurrentSelected } from "../model/selection.ts";
import type { CatalogGroup, CatalogModel } from "../model/types.ts";

export interface ModelPaneProps {
  group: CatalogGroup;
  current: { provider: string; model: string } | null;
  busy: boolean;
  /** Directory load status/error banner. */
  statusBlock: React.ReactNode;
  onPick: (model: CatalogModel) => void;
  onBack: () => void;
  registerRef: (node: HTMLButtonElement | null) => void;
  t: (key: string, params?: Record<string, unknown>) => string;
}

export function ModelPane({ group, current, busy, statusBlock, onPick, onBack, registerRef, t }: ModelPaneProps) {
  const [query, setQuery] = useState("");

  const visibleModels = filterModelsByQuery(group.models, query);

  return (
    <>
      <button type="button" className="dshmp-back" onClick={onBack}>
        <IconChevronLeftOutlineRegular />
        <span className="dshmp-backLabel">{group.name}</span>
      </button>
      <div className="dshmp-subhead">{t("model.usecount", { provider: group.name, count: group.models.length })}</div>
      <div className="dshmp-searchWrap">
        <IconSearchOutlineRegular className="dshmp-searchIcon" />
        <input
          type="search"
          className="dshmp-search"
          placeholder={t("model.search", { provider: group.name })}
          aria-label={t("model.search", { provider: group.name })}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && query !== "") {
              event.preventDefault();
              event.stopPropagation();
              setQuery("");
            }
          }}
        />
      </div>
      {statusBlock}
      <div className="dshmp-groups scrollable">
        {visibleModels.map((model) => {
          const selected = isCurrentSelected(current, group.id, model.id);
          return (
            <button
              ref={(node) => registerRef(node)}
              type="button"
              role="menuitemradio"
              aria-checked={selected}
              className={selected ? "dshmp-option dshmp-selected" : "dshmp-option"}
              key={compositeKey(group.id, model.id)}
              title={model.name + " · " + group.name}
              disabled={busy}
              onClick={() => onPick(model)}
            >
              <span className="dshmp-optionCopy">
                <span className="dshmp-modelName">{model.name}</span>
                {model.description !== undefined && <span className="dshmp-description">{model.description}</span>}
              </span>
              <span className="dshmp-check">{selected ? <IconCheckOutlineRegular /> : null}</span>
            </button>
          );
        })}
      </div>
      {group.models.length > 0 && visibleModels.length === 0 && <div className="dshmp-empty">{t("empty.search")}</div>}
      {group.models.length === 0 && <div className="dshmp-empty">{t("empty.models")}</div>}
    </>
  );
}

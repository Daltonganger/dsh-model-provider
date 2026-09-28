/**
 * dsh-model-provider - provider pane: one row per provider, current pinned
 * first with a "· 当前" marker; failed providers render as rows with a retry
 * action; a local search box filters both rows (no cross-provider search).
 */
import {
  IconChevronLeftOutlineRegular,
  IconChevronRightOutlineRegular,
  IconSearchOutlineRegular,
  IconWarningOutlineRegular
} from "@deepseek-ai/dsh-client-ui-primitives";
import { useState } from "react";
import { filterFailuresByQuery, filterGroupsByQuery } from "../model/selection.ts";
import type { CatalogFailure, CatalogGroup } from "../model/types.ts";

export interface ProviderPaneProps {
  groups: CatalogGroup[];
  failures: CatalogFailure[];
  currentProvider: string | undefined;
  /** Directory load status/error banner (failures are rows, not banners). */
  statusBlock: React.ReactNode;
  onPick: (group: CatalogGroup) => void;
  onRetryLoad: () => void;
  onBack: () => void;
  registerRef: (node: HTMLButtonElement | null) => void;
  t: (key: string, params?: Record<string, unknown>) => string;
}

export function ProviderPane({
  groups,
  failures,
  currentProvider,
  statusBlock,
  onPick,
  onRetryLoad,
  onBack,
  registerRef,
  t
}: ProviderPaneProps) {
  const [query, setQuery] = useState("");

  const visibleGroups = filterGroupsByQuery(groups, query);
  const visibleFailures = filterFailuresByQuery(failures, query);

  return (
    <>
      <button type="button" className="dshmp-back" onClick={onBack}>
        <IconChevronLeftOutlineRegular />
        <span className="dshmp-backLabel">{t("provider.header")}</span>
      </button>
      <div className="dshmp-searchWrap">
        <IconSearchOutlineRegular className="dshmp-searchIcon" />
        <input
          type="search"
          className="dshmp-search"
          placeholder={t("provider.search")}
          aria-label={t("provider.search")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            // While typing, Escape first clears the query and stays in the pane.
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
        {visibleGroups.map((group) => {
          const isCurrent = currentProvider === group.id;
          const metaText = t("provider.models", { count: group.models.length });
          return (
            <button
              ref={(node) => registerRef(node)}
              type="button"
              role="menuitem"
              aria-label={t("provider.aria", {
                name: group.name,
                meta: isCurrent ? metaText + " · " + t("provider.current") : metaText
              })}
              className="dshmp-option"
              key={group.id}
              onClick={() => onPick(group)}
            >
              <span className="dshmp-optionCopy">
                <span className="dshmp-modelName">{group.name}</span>
                <span className="dshmp-description">
                  {metaText}
                  {isCurrent && <span className="dshmp-providerCurrent"> · {t("provider.current")}</span>}
                </span>
              </span>
              <span className="dshmp-cellChevron">
                <IconChevronRightOutlineRegular />
              </span>
            </button>
          );
        })}
        {visibleFailures.map((failure) => (
          <button
            ref={(node) => registerRef(node)}
            type="button"
            role="menuitem"
            aria-label={t("warning.groupLoad", { name: failure.name, message: failure.message })}
            title={t("warning.groupLoad", { name: failure.name, message: failure.message })}
            className="dshmp-option dshmp-failed"
            key={failure.id}
            onClick={onRetryLoad}
          >
            <span className="dshmp-optionCopy">
              <span className="dshmp-modelName">{failure.name}</span>
              <span className="dshmp-description dshmp-failedText">
                <IconWarningOutlineRegular className="dshmp-failedIcon" />
                {t("provider.failed")}：{failure.message}
              </span>
            </span>
            <span className="dshmp-optionRetry">{t("retry")}</span>
          </button>
        ))}
      </div>
      {groups.length > 0 && visibleGroups.length === 0 && visibleFailures.length === 0 && (
        <div className="dshmp-empty">{t("empty.searchProviders")}</div>
      )}
      {groups.length === 0 && failures.length === 0 && <div className="dshmp-empty">{t("empty.models")}</div>}
    </>
  );
}

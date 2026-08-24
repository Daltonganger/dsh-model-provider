/**
 * dsh-model-provider - pure selection / catalog helpers.
 *
 * Everything here is a plain function over the wire types: no React, no DOM,
 * no framework store. The selector components and the node test suite share
 * exactly this code, so the behaviors that matter (current provider pinned,
 * default effort carried into selections, same-named models never crossing a
 * provider boundary, search filtering, Esc pane stack) are all unit-testable.
 *
 * This module only imports types, so the test runner can load it directly.
 */
import type { CatalogFailure, CatalogGroup, CatalogModel, Choice, DshModelItem, Pane, Selection } from "./types.ts";

/** Composite key for a provider-scoped model: `providerId:modelId` (never the bare name). */
export function compositeKey(providerId: string, modelId: string): string {
  return providerId + ":" + modelId;
}

/** Unique key for a provider-scoped model identity. */
export function getModelKey(model: DshModelItem): string {
  return compositeKey(model.providerId, model.modelId);
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

/**
 * Build the selection for choosing `model` from `group`.
 *
 * The one place that turns a catalog row into a selection: when a model
 * declares a `defaultEffort`, switching to it carries that effort along, so
 * "pick model" and "pick effort later" never disagree about the starting
 * effort. Keep every call site on this helper - never build a Selection by
 * hand.
 */
export function selectionFor(group: CatalogGroup, model: CatalogModel): Selection {
  return {
    provider: group.id,
    model: model.id,
    ...(model.reasoning?.defaultEffort === undefined ? {} : { reasoningEffort: model.reasoning.defaultEffort })
  };
}

/**
 * Provider list for the second pane: current provider pinned first, the rest
 * in catalog order. A missing current provider leaves the catalog as-is.
 */
export function sortGroupsForCurrent(groups: CatalogGroup[], currentId: string | undefined): CatalogGroup[] {
  if (currentId === undefined) return groups;
  return [...groups].sort((a, b) => {
    if (a.id === currentId) return -1;
    if (b.id === currentId) return 1;
    return 0;
  });
}

/** Find the catalog row whose selection equals the current session selection. */
export function findCurrentChoice(choices: Choice[], current: { provider: string; model: string } | null): Choice | undefined {
  if (current === null) return undefined;
  return choices.find(
    (choice) => choice.selection.provider === current.provider && choice.selection.model === current.model
  );
}

/** Whether the current session selection matches a provider/model pair. */
export function isCurrentSelected(
  current: { provider: string; model: string } | null,
  providerId: string,
  modelId: string
): boolean {
  return current !== null && current.provider === providerId && current.model === modelId;
}

// ---------------------------------------------------------------------------
// search filtering (single-pane, no cross-provider search)
// ---------------------------------------------------------------------------

/** Case-insensitive substring match; empty/whitespace query matches everything. */
export function matchesQuery(text: string | undefined, query: string): boolean {
  const q = query.trim().toLowerCase();
  return q === "" || (text !== undefined && text.toLowerCase().includes(q));
}

/** Filter providers by name/id. */
export function filterGroupsByQuery(groups: CatalogGroup[], query: string): CatalogGroup[] {
  return groups.filter((group) => matchesQuery(group.name, query) || matchesQuery(group.id, query));
}

/** Filter a single provider's models by name/id/description. */
export function filterModelsByQuery(models: CatalogModel[], query: string): CatalogModel[] {
  return models.filter(
    (model) =>
      matchesQuery(model.name, query) || matchesQuery(model.id, query) || matchesQuery(model.description, query)
  );
}

/** Filter failed providers by name/id. */
export function filterFailuresByQuery(failures: CatalogFailure[], query: string): CatalogFailure[] {
  return failures.filter((failure) => matchesQuery(failure.name, query) || matchesQuery(failure.id, query));
}

// ---------------------------------------------------------------------------
// pane navigation
// ---------------------------------------------------------------------------

/**
 * Next stop for Escape, one level at a time:
 * model -> provider -> root -> close.
 */
export function nextPaneOnEscape(pane: Pane): Pane | "close" {
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

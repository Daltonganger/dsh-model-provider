/**
 * dsh-model-provider - model catalog wire types.
 *
 * These mirror the subset of the harness ModelDirectory snapshot this plugin
 * reads. The fields are advisory: the directory store is framework-owned and
 * this surface only documents what the selector consumes.
 */

/** A reasoning effort level offered by a model. */
export interface ReasoningLevel {
  id: string;
  name: string;
  description?: string;
}

/** One model inside a provider group. */
export interface CatalogModel {
  id: string;
  name: string;
  description?: string;
  reasoning?: {
    /** The effort the provider defaults to when none was chosen explicitly. */
    defaultEffort?: string;
    efforts: ReasoningLevel[];
  };
}

/** One provider group in the catalog. */
export interface CatalogGroup {
  id: string;
  name: string;
  models: CatalogModel[];
}

/** A provider that failed to load (kept as a visible row, not a banner). */
export interface CatalogFailure {
  id: string;
  name: string;
  message: string;
}

/** The per-session directory snapshot (subset the selector reacts to). */
export interface DirectorySnapshot {
  current: { provider: string; model: string; reasoningEffort?: string } | null;
  routable: boolean | null;
  groups: CatalogGroup[];
  failures: CatalogFailure[];
  status: "idle" | "loading" | "selecting" | "ready" | "error";
  error: string | null;
}

/** Framework-owned directory store (external store subscription). */
export type DirectoryStore = {
  subscribe(fn: () => void): () => void;
  getSnapshot(): DirectorySnapshot;
};

/** The selection the selector sends to directory.select(). */
export type Selection = { provider: string; model: string; reasoningEffort?: string };

/** The three-level pane stack: root -> provider -> model, plus effort. */
export type Pane = "root" | "provider" | "model" | "effort";

/** A catalog row plus its ready-to-send selection (shared by panes and tests). */
export interface Choice {
  group: CatalogGroup;
  model: CatalogModel;
  selection: Selection;
}

/** An effort row rendered by the EffortPane. */
export interface EffortChoice {
  key: string;
  /** undefined = "provider default" (only offered when the model has no defaultEffort). */
  effort?: string;
  label: string;
  description?: string;
}

/** Props the harness slot framework hands to the registered component. */
export interface ModelProviderSelectProps {
  locked: boolean;
  available: boolean;
  directory: DirectoryStore;
  load: () => void;
  select: (selection: Selection) => Promise<boolean>;
  t: (key: string, params?: Record<string, unknown>) => string;
}

/** A provider-scoped model identity - the one stable key this plugin uses. */
export interface DshModelItem {
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
  isDefault?: boolean;
  enabled?: boolean;
}

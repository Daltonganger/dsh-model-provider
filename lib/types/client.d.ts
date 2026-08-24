/** dsh-model-provider client half type surface (advisory; runtime is plain JS). */

/** A provider-scoped model identity — the stable key for same-named models. */
export interface DshModelItem {
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
  isDefault?: boolean;
  enabled?: boolean;
}

/** Unique key for a provider-scoped model: `providerId:modelId`. */
export declare function getModelKey(model: DshModelItem): string;

/** Composite key helpers (used for scoped row keys inside the selector). */
export declare function compositeKey(providerId: string, modelId: string): string;

/** Group models by providerId, preserving catalog order. */
export declare function groupModelsByProvider(models: DshModelItem[]): Record<string, DshModelItem[]>;

/** Normalize a harness group + model pair into the plugin's stable shape. */
export declare function normalizeModel(group: { id: string; name?: string }, model: { id: string; name?: string }): DshModelItem;

/** Build the selection for choosing `model` from `group` (carries the model's defaultEffort). */
export declare function selectionFor(group: { id: string; models?: unknown[] }, model: { id: string; reasoning?: { defaultEffort?: string } }): { provider: string; model: string; reasoningEffort?: string };

/** Current provider pinned first, the rest in catalog order. */
export declare function sortGroupsForCurrent<T extends { id: string }>(groups: T[], currentId: string | undefined): T[];

/** Services this plugin's apply() reaches for. */
export declare const inject: string[];

/** Client plugin body: registers dictionaries and shadows the composer model seat. */
export declare function apply(ctx: unknown): void;

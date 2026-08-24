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

/** Group models by providerId, preserving catalog order. */
export declare function groupModelsByProvider(models: DshModelItem[]): Record<string, DshModelItem[]>;

/** Services this plugin's apply() reaches for. */
export declare const inject: string[];

/** Client plugin body: registers dictionaries and shadows the composer model seat. */
export declare function apply(ctx: unknown): void;

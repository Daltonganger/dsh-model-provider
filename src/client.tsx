/**
 * dsh-model-provider - client half entry.
 *
 * The harness already groups the model catalog by provider and keys every
 * selection as { provider, model }, but the original composer model seat
 * flattens the whole catalog provider-by-provider. This plugin shadows the
 * single "conversation.input.model" slot at priority -1 (lowest renders) with
 * the three-level provider-first selector (see components/ModelSelector). The
 * harness seat is restored automatically when this registration goes away.
 *
 * This file only wires the plugin; the selector and all its pieces live under
 * components/, model/ and hooks/.
 */
import { ModelSelector } from "./components/ModelSelector.tsx";
import { NS, en, zh } from "./locale.ts";
import {
  compositeKey,
  getModelKey,
  groupModelsByProvider,
  normalizeModel,
  selectionFor,
  sortGroupsForCurrent
} from "./model/selection.ts";
import type { Selection } from "./model/types.ts";

// Compatibility surface: the pre-split single-file build exported these
// helpers from the client bundle, so keep the runtime exports unchanged.
export { compositeKey, getModelKey, groupModelsByProvider, normalizeModel, selectionFor, sortGroupsForCurrent };

/** Services this plugin's apply() reaches for (mirrors the harness convention). */
export const inject = ["locale", "sessions", "slots", "modelDirectories"];

/**
 * Client plugin body: register this plugin's dictionaries, then shadow the
 * composer model seat with the provider-first re-implementation.
 */
export function apply(ctx: any) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-model-provider: dictionaries");

  ctx.inject(["slots", "modelDirectories", "sessions"], (scope: any) => {
    const models = scope.modelDirectories;
    const sessions = scope.sessions;

    // slots.inject(key, callback) waits on the seat's declaration (ui-conversation
    // declares "conversation.input.model" in its children table), installs the
    // contribution while the declaration lives, and removes it when the plugin
    // fiber disposes — the original harness seat reappears verbatim.
    scope.slots.inject(
      "conversation.input.model",
      () =>
        scope.slots.register(
          {
            name: "conversation.input.model",
            locale: NS,
            // Shadowing priority: the single slot renders the LOWEST priority
            // entry, so -1 beats the harness seat (0). Same key at the same
            // priority would throw, but a different priority shadows cleanly.
            priority: -1,
            registrant: "dsh-model-provider",
            inject: (sessionId: string) => {
              const directory = models.directoryFor(sessionId);
              const available = sessions.subagentAddress(sessionId) === undefined;
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
          ModelSelector
        )
    );
  });
}

/**
 * dsh-model-provider - one place that decides whether a model switch landed.
 *
 * `ModelDirectory.select()` changed shape between harness releases:
 *   0.1.1  rejects on failure, resolves (void) on success
 *   0.1.7  resolves `{ ok: true }` on success and `{ ok: false, error }` on
 *          failure - it never rejects
 *
 * The seat reports "accepted" as a boolean and closes the menu on it, so a
 * refused switch must not be mistaken for a landing one: on 0.1.7 the
 * rejection-only wrapper turned every refusal into `true`, closing the picker
 * with no model change and no toast. Both shapes are handled here, and this is
 * the single function the seat and the tests share.
 */

/** Wrap a directory.select() call into the seat's "did the switch land?" boolean. */
export async function selectionAccepted(call: () => Promise<unknown>): Promise<boolean> {
  try {
    const result = await call();
    // Unknown/void results (older harnesses resolve nothing on success) count as
    // accepted; only an explicit refusal is a failure.
    return (result as { ok?: boolean } | undefined)?.ok !== false;
  } catch {
    return false;
  }
}

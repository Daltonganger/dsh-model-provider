/**
 * dsh-model-provider — host plugin half.
 *
 * Pure browser-surface plugin: the empty apply exists so the package appears
 * in the host Loader / profile bundling; the actual behavior ships through
 * exports["./client"], discovered from the package.json dsh.client declaration.
 */
export function apply() {}

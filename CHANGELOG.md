# Changelog

## 0.3.3 (2026-09-28)

- **0.1.7 compatibility — the picker rendered empty.** `ModelDirectoryResolver.directoryFor()`
  reads through `remote.session`, and the seat's child fiber only injected
  `slots`, `modelDirectories` and `sessions`. Under 0.1.7's service isolation the
  call threw `cannot get property "remote.session" without inject` on first use,
  which the seat's own `.catch` swallowed — so the menu came up empty instead of
  failing loud. `remote` and `remote.session` are now in the child-fiber inject
  list, matching the harness's own `ui-model-selection`.
- **0.1.7 compatibility — the composer trigger crashed the render.**
  `@deepseek-ai/dsh-client-ui-primitives` renamed its size-suffixed icon exports
  to stroke-named ones in `0.1.7-rc.1` (`IconCheckOutline16` →
  `IconCheckOutlineRegular`, `IconChevron*Outline14` → `…Regular`). A missing
  export arrives as `undefined`, so esbuild bundled it happily and only React
  threw at paint time. All six icons updated; `Toast` was unaffected.
  `peerDependencies` now states `^0.1.7-rc.1`, the first release carrying those
  names — claiming `^0.1.1-rc.2` while importing 0.1.7-only symbols was wrong.
- **`select()` refusals were reported as successes.** `ModelDirectory.select()`
  rejected on failure in 0.1.1 but resolves `{ ok: false }` in 0.1.7. The
  seat's `.then(() => true, () => false)` therefore turned every refused switch
  into an accepted one: the menu closed with no model change and no toast. The
  new `selectionAccepted()` helper (single source of truth, shared with the
  tests) handles both shapes.
- **Regression guards** (`test/compat.test.ts`): every primitives symbol the
  bundle reads must exist in the installed version, no size-suffixed icon names
  may survive, and all four `select()` outcome shapes are covered. The first
  guard fails on the pre-0.3.3 bundle, so this cannot come back silently.

## 0.3.2 (2026-08-31)

- **Install hygiene**: trim `dsh.client.inject` to the module the client
  bundle actually consumes (`@deepseek-ai/dsh-client-ui-primitives`; react and
  jsx-runtime are platform seeds). `dsh-client-locale`, `dsh-client-runtime`
  and `dsh-client-ui-model-selection` were declared but never imported —
  dead waiting edges under the 0.1.1-rc.2 loader. Matching `peerDependencies`
  cleanup.
- Re-wired into the `web` profile: the package link now points at
  `/opt/dev/dsh-provider-model` (was a dangling `/data/opt/dev/` link) and the
  plugin is back in `dsh.profile.bundles`, so its client bundle is served and
  the composer model seat shadowing works again.

## 0.3.1 (2026-08-29)

- **Compatibility**: verified against DeepSeek Harness 0.1.1-rc.2 — slot
  composition (`slots.inject` / `slots.register` with `priority` + `registrant`),
  the `conversation.input.model` seat contract, the per-session
  `ModelDirectory` snapshot face, the primer primitives (icons + `Toast`) and
  the `--dsw-*` design tokens are all unchanged in the rc.8 → rc.2 line.
- `slots.inject` no longer passes the phantom third argument (the runtime
  facade signature is `inject(key, callback)`; the extra label was dropped).
- `peerDependencies` aligned to `^0.1.1-rc.2` (same pins the first-party
  client packages use).

## 0.3.0 (2026-08-24)

- Provider-first three-level model selector: root menu → provider list →
  single-provider model list, shadowing the composer model seat at
  `priority: -1`.
- Current provider pinned to the top of the provider list with a "· current"
  marker; failed providers render as retry rows.
- Inline search on the provider and model pages (single-page filter; no
  cross-provider search).
- Lean trigger: `Model · Provider` by default; `· Effort` only for a
  non-default reasoning effort.
- Consistent default effort: switching to a model carries its
  `defaultEffort` into the selection.
- Model page header (‹ provider + N-models subtitle); Esc walks the pane
  stack back one level at a time.

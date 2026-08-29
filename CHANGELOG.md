# Changelog

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

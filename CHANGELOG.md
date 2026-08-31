# Changelog

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

# dsh-model-provider

[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

> **License:** MIT · **Platform:** DSH Web (client plugin)

**[English](README.md) · [简体中文](README.zh-CN.md)**

Provider-first model selector for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH): pick a **provider** first, then a **model** from that provider. The current model always reads as `Model · Provider` — without touching the harness's original model-calling or session-state logic.

In the DSH Web interface, the composer model seat is upgraded from "provider groups + full model list" to a **three-level selector** (v0.3.0):

    Before                        After (this plugin v0.3.0)
    DeepSeek V4 Flash             DeepSeek V4 Flash · OpenCode Go

Try opening the dropdown (still tidy even with many models):

    Level 1 (root menu)           Level 2 (Provider)            Level 3 (Model)
    ├─ Model   DeepSeek V4 Flash >   ├─ opencode-go  8 models · current >   opencode-go
    └─ Effort  High              >   ├─ luckikey     2 models        >   ├─ MiniMax-M3
    🔍 Search providers               ├─ OpenRouter  20 models       >   ├─ Qwen3.7 Max
        (filters Provider rows)         ├─ DeepSeek     4 models       >   ├─ DeepSeek V4 Flash ✓
                                        └─ OpenRouterX  failed ⚠ retry    ├─ DeepSeek V4 Pro
                                     🔍 Search opencode-go models         └─ GLM-5.1
                                        (current provider only)

<img width="1920" height="945" alt="image" src="https://github.com/user-attachments/assets/6fb97a93-43f7-4d05-b9bb-dc77273759f9" />
<img width="1920" height="945" alt="image" src="https://github.com/user-attachments/assets/e011060a-56d9-4744-ab76-359aab52f75e" />

- **Provider is its own level**: the provider list pins the **current provider** to the top and marks it "· current"; the rest keep catalog order. The Model page renders only the selected provider's models — no more provider × model flattening.
- **Failed providers are a row too**: a provider that failed to load no longer lives only in a warning banner — it is a normal Provider row ("failed ⚠ retry") that reloads on click.
- **Search (v0.3)**: both the Provider and Model pages have an inline search box — Provider page filters providers by name/ID; Model page filters only the **current provider's** models (no cross-provider search).
- **Model page header**: entering a provider shows "‹ {provider}" + a "{N} models" subtitle, making it feel like its own page.
- **Lean trigger**: shows `Model · Provider` by default; "· Effort" is appended only when you actively pick a **non-default** reasoning effort — no wasted horizontal space for "Default".
- **Esc walks back level by level**: Model → Provider → root menu → close (clicking "‹" walks back the same way).
- The `Model · Provider [· Effort]` trigger always matches the harness session state.

## How it works

| Concern | Detail |
| --- | --- |
| Extension point | Official Slot system: `conversation.input.model` (single slot, session scope) — no DOM hack |
| Override | Same-named slot registered at `priority: -1` — the slot renders the lowest-priority entry, so this component wins and the original seat is shadowed |
| Data | Reuses the harness's native `modelDirectories` service (per-session shared ModelDirectory); selection semantics and disable logic are unchanged; the provider list comes straight from `state.groups`, failures from `state.failures` |
| Fallback | The registration disappears on plugin unload (slots.inject effect teardown) and the original model seat is restored instantly and unchanged |
| Namespace | Own locale dictionary `modelProvider` (zh/en) — no intrusion into harness copy |

The component keeps the original ModelSelect interaction baseline (shared directory & selection RPC / keyboard arrows & Esc / failure retry & Toast / effort page), only turning the **two-level flat list** into **three-level navigation**:

- Trigger: model name + · Provider (muted style); "· Effort" only when a non-default effort is chosen; title and aria carry the provider too
- Root menu: Model (→ provider list) and Effort (→ current model's effort levels)
- Provider page: "‹ Select provider" back to root; search filter; current provider pinned to top with a "· current" text mark (no full-row highlight); each row shows "N models"; failed providers render as retry rows
- Model page: "‹ {provider}" + "{N} models" subtitle; search box filters only this provider's models; the selected row is marked with ✓ (composite `providerId + modelId` key — same-named models across providers don't collide)
- Default effort: switching to a model automatically carries its `defaultEffort` into the selection (`selectionFor` is the single place that builds a Selection, so prebuilt choice and click-path semantics stay identical)

## Layout

    dsh-model-provider/
    |- package.json            # dsh.client declaration (platform: web, inject list)
    |- pnpm-workspace.yaml     # pnpm 11 setup (approves the esbuild build script)
    |- build.mjs               # esbuild bundle script → lib/client.js (ModuleLoader format)
    |- tsconfig.json           # noEmit typecheck (src + test)
    |- src/
    |  |- index.ts             # host half: empty apply (pure browser-surface plugin)
    |  |- client.tsx           # client entry: apply() + slot wiring + compat exports
    |  |- locale.ts            # modelProvider dictionary (zh/en)
    |  |- model/
    |  |  ├─ types.ts          # directory/selection wire types
    |  |  └─ selection.ts      # pure functions: selectionFor / sortGroupsForCurrent /
    |  |                       #   search filtering / Esc stack (shared by UI and tests)
    |  |- components/
    |  |  ├─ ModelSelector.tsx # trigger + menu shell + state orchestration
    |  |  ├─ RootPane.tsx      # level 1: model / effort
    |  |  ├─ ProviderPane.tsx  # level 2: providers (search + failed rows)
    |  |  ├─ ModelPane.tsx     # level 3: single-provider models (search + composite key)
    |  |  ├─ EffortPane.tsx    # reasoning effort
    |  |  └─ StatusBlock.tsx   # directory load/error banner
    |  |- hooks/
    |  |  └─ useKeyboardNavigation.ts  # Esc stack + arrow-key focus
    |  └─ model-provider.css   # scoped styles (dshmp- prefix + design tokens)
    |- test/model.test.ts      # node --test unit tests (pure-function layer)
    |- lib/                    # build output (host serves /plugins/<id>/client.js)
    |- assets/icon.svg

## Build

    pnpm install        # first time: installs esbuild / typescript (npm works too, see below)
    pnpm build          # node build.mjs → lib/client.js
    pnpm typecheck      # tsc --noEmit
    pnpm test           # node --test (no DOM needed; runs the pure-function layer directly)

The build script resolves esbuild via `require.resolve("esbuild")` from this package's own devDependency — **no machine-specific hardcoded paths**, so it builds on any machine. (With npm: `npm i && npm run build`; the committed lockfile is pnpm-generated and npm resolves it itself.)

The output is the standard DeepSeek Harness client-plugin format:

    window.__ModuleLoader__.load({ id: "dsh-model-provider", factory: (require) => { ... return module.exports; } });

## Installing into a Web profile

> The right way (since v0.1.0): this package declares `dsh.bundle.patch` + ships `cordis.patch.yml`, i.e. the standard dsh plugin shape (same as dsh-balance-meter / dsh-context). Don't write it as a "bundle without metadata" — that triggers the startup check error:
> `profile bundle "dsh-model-provider" declares no dsh.bundle in its package.json` and a restart loop.

1. Link the dependency into the profile (/data/.dsh/profiles/web/package.json):

       "dependencies": { "dsh-model-provider": "link:/data/opt/dev/dsh-provider-model" }
       "dsh": { "profile": { "bundles": [ ..., "dsh-model-provider" ] } }

   (Or use the official dsh CLI: `dsh plugin --profile web add /data/opt/dev/dsh-provider-model` — it reconciles into `bundles` automatically per the `dsh.bundle.patch` declaration.)

2. `pnpm install` (materializes the link)
3. Restart the web host (client-plugin set changes apply on restart): `docker restart deepseek-harness` or the equivalent dsh web restart
4. Verify:

       curl -s http://127.0.0.1:3080/ | grep -o '"id":"dsh-model-provider"'
       curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3080/plugins/dsh-model-provider/client.js   # 200

   > Changing only client.js (no plugin add/remove) needs no restart — rebuild and refresh the page.

## Disabling / restoring the original UI

Remove this package from `dsh.profile.bundles` (or uninstall the plugin) and restart — the original ModelSelect seat becomes the only entry again and the UI is restored.

## Roadmap

Shipped (v0.3.0):

- [x] Three-level selector: root menu → provider list → single-provider model list
- [x] Current provider pinned to top + "· current" text mark (no full-row highlight)
- [x] Failed provider as a retryable row (not just a banner)
- [x] Inline search on Provider / Model pages (single-page filter, no cross-provider search)
- [x] Model page header: ‹ provider + N-models subtitle
- [x] "· Effort" only for non-default reasoning effort (Default hidden)
- [x] Consistent default effort (single selectionFor construction point + test coverage)
- [x] client.tsx split (model / components / hooks / locale)
- [x] Build hygiene: esbuild devDependency, no machine-specific paths
- [x] node --test unit tests (current-pinning / same-named models / defaultEffort / Esc stack / search filtering)

Candidates:

- Plugin settings page (display modes: plain groups / model + provider / both; whether the current model shows its provider)
- Default model badge (depends on host wire exposing an isDefault field)
- Recent-use / favorites / model capabilities (context length, pricing) display enhancements
- Provider icons

## License

MIT

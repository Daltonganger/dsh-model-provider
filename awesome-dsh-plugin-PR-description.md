# add: dsh-model-provider (provider-first model selector)

Adds [pc439527/dsh-model-provider](https://github.com/pc439527/dsh-model-provider) to the **UI Enhancements** section in both `README.md` and `README.zh.md`.

## Checklist

- [x] `package.json` declares `dsh.bundle` (`patch: ./cordis.patch.yml`) → installable via `dsh plugin add`
- [x] Real working code (three-level provider-first model selector shadowing the Web composer model seat; ships prebuilt `lib/`)
- [x] MIT license, actively maintained
- [x] `dsh-plugin` topic added to the repo
- [x] `@deepseek-ai/*` declared as `peerDependencies`

Install: `dsh plugin --profile web add https://github.com/pc439527/dsh-model-provider.git`

> ℹ️ Branch note: this fork's `main` predates a few upstream CI rewrites, so the PR
> branch carries the fork's older copies of the workflow files (and omits the newer
> decay-scan / pr-gate / pr-guard / regate ones) to satisfy the token's
> workflow-scope limits when pushing. The listing lines are the only intended change —
> happy to rebase these away once the fork `main` is synced.

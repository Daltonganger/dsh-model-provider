/**
 * dsh-model-provider - compatibility guards against the DSH runtime.
 *
 * Two 0.1.7 breakages are guarded here, both silent at runtime:
 *
 *  1. The primitives icon set was renamed from size-suffixed names
 *     (`IconCheckOutline16`) to stroke-named ones (`IconCheckOutlineRegular`)
 *     in 0.1.7-rc.1. A missing export arrives as `undefined`, so esbuild still
 *     bundles fine and only the React render crashes.
 *  2. `ModelDirectory.select()` rejected in 0.1.1 but resolves `{ ok: false }`
 *     in 0.1.7, so a refused switch would otherwise be reported as a success.
 *
 * Run with: pnpm test (node --test).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { selectionAccepted } from "../src/model/selection-outcome.ts";

const BUNDLE = new URL("../lib/client.js", import.meta.url);

/** The icon names a 0.1.7 runtime exports, read from the installed typings' backing implementation. */
function primitivesExports(): Set<string> {
  const entry = new URL(
    "../node_modules/@deepseek-ai/dsh-client-ui-primitives/lib/index.js",
    import.meta.url
  );
  const source = readFileSync(entry, "utf8");
  const line = source.split("\n").find((l) => l.startsWith("export { "));
  assert.ok(line, "primitives must expose a single aggregated export statement");
  return new Set(
    line
      .replace(/^export \{ /, "")
      .replace(/ \};$/, "")
      .split(",")
      .map((name) => name.trim())
  );
}

describe("primitives import surface", () => {
  test("every symbol the bundle reads off primitives exists in the installed version", () => {
    const bundle = readFileSync(BUNDLE, "utf8");
    const exports = primitivesExports();

    const aliases = [...bundle.matchAll(/let (_mod_\d+) = require\("@deepseek-ai\/dsh-client-ui-primitives"\)/g)].map(
      (match) => match[1]!
    );
    assert.ok(aliases.length > 0, "the bundle must import primitives");

    const used = new Set<string>();
    for (const alias of aliases) {
      for (const match of bundle.matchAll(new RegExp(`${alias}\\.([A-Za-z0-9_$]+)`, "g"))) used.add(match[1]!);
    }

    const missing = [...used].filter((name) => !exports.has(name));
    assert.deepEqual(missing, [], `bundle reads symbols the installed primitives does not export: ${missing.join(", ")}`);
  });

  test("no size-suffixed icon names remain (they were removed in 0.1.7-rc.1)", () => {
    const bundle = readFileSync(BUNDLE, "utf8");
    const legacy = [...bundle.matchAll(/Icon[A-Za-z]+Outline\d+/g)].map((match) => match[0]);
    assert.deepEqual(legacy, [], `pre-0.1.7 icon names still referenced: ${legacy.join(", ")}`);
  });
});

describe("menu surface opacity", () => {
  /**
   * `--dsw-specific-menu` is an ALPHA colour in the 0.1.7 theme
   * (`var(--dsw-menu-surface-fill)`: 58% light / 45% dark), so a plain
   * `background: var(--dsw-specific-menu)` renders the chat behind the pane.
   * The fix paints that tint over the fully opaque `--dsw-alias-bg-base`
   * (#fff / #151517). A blur alone was measured at 93 -> 16 of 255 contrast
   * bleed behind the pane; the opaque base takes it to ~0.
   */
  test("the menu paints the alpha tint over an opaque base", () => {
    const bundle = readFileSync(BUNDLE, "utf8");
    const rule = bundle.match(/\.dshmp-menu\{[^}]*\}/);
    assert.ok(rule, "the bundle must carry the .dshmp-menu rule");
    // The opaque base is what stops the page showing through.
    assert.match(rule[0], /background-color:var\(--dsw-alias-bg-base\)/);
    // The theme tint is layered on top so the surface keeps the harness colour.
    assert.match(rule[0], /background-image:linear-gradient\(var\(--dsw-specific-menu\),var\(--dsw-specific-menu\)\)/);
    // A bare alpha fill would reopen the see-through bug.
    assert.doesNotMatch(rule[0], /[;{]background:var\(--dsw-specific-menu\)/);
  });
});

describe("select() outcome contract", () => {
  test("a refused 0.1.7 result ({ ok: false }) is a failed pick", async () => {
    assert.equal(await selectionAccepted(async () => ({ ok: false, error: { code: "session/writer-held" } })), false);
  });

  test("a settled 0.1.7 result is an accepted pick", async () => {
    assert.equal(await selectionAccepted(async () => ({ ok: true, value: undefined })), true);
  });

  test("a rejection (the 0.1.1 shape) is still a failed pick", async () => {
    assert.equal(
      await selectionAccepted(async () => {
        throw new Error("session.selectModel failed");
      }),
      false
    );
  });

  test("a void success (an older harness resolves nothing) is an accepted pick", async () => {
    assert.equal(await selectionAccepted(async () => undefined), true);
  });
});

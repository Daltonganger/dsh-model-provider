/**
 * dsh-model-provider - unit tests for the pure selection/catalog layer.
 *
 * Run with: pnpm test (node --test test/).
 * The UI and these tests share exactly src/model/selection.ts, so the
 * behaviors the selector is built around are verified without a DOM.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  compositeKey,
  filterFailuresByQuery,
  filterGroupsByQuery,
  filterModelsByQuery,
  findCurrentChoice,
  getModelKey,
  groupModelsByProvider,
  isCurrentSelected,
  matchesQuery,
  nextPaneOnEscape,
  normalizeModel,
  selectionFor,
  sortGroupsForCurrent
} from "../src/model/selection.ts";
import type { CatalogFailure, CatalogGroup, CatalogModel, DshModelItem, Pane, Selection } from "../src/model/types.ts";

// Two providers that both offer a same-named model - the plugin's core scenario.
const opencodeGroup: CatalogGroup = {
  id: "opencode-go",
  name: "opencode-go",
  models: [
    { id: "MiniMax-M3", name: "MiniMax-M3" },
    {
      id: "DeepSeek-V4-Flash",
      name: "DeepSeek V4 Flash",
      reasoning: { defaultEffort: "high", efforts: [{ id: "high", name: "High" }, { id: "low", name: "Low" }] }
    }
  ]
};
const openrouterGroup: CatalogGroup = {
  id: "openrouter",
  name: "OpenRouter",
  models: [
    {
      id: "deepseek/deepseek-v4",
      name: "DeepSeek V4 Flash",
      reasoning: { efforts: [{ id: "medium", name: "Medium" }, { id: "high", name: "High" }] }
    },
    { id: "qwen/qwen3.7-max", name: "Qwen3.7 Max" }
  ]
};

const groups: CatalogGroup[] = [opencodeGroup, openrouterGroup];

describe("same-named models never cross a provider boundary", () => {
  test("compositeKey/getModelKey distinguish same model name under different providers", () => {
    const a: DshModelItem = { providerId: "opencode-go", providerName: "opencode-go", modelId: "DeepSeek-V4-Flash", modelName: "DeepSeek V4 Flash" };
    const b: DshModelItem = { providerId: "openrouter", providerName: "OpenRouter", modelId: "deepseek/deepseek-v4", modelName: "DeepSeek V4 Flash" };
    assert.equal(getModelKey(a), "opencode-go:DeepSeek-V4-Flash");
    assert.equal(getModelKey(b), "openrouter:deepseek/deepseek-v4");
    assert.notEqual(getModelKey(a), getModelKey(b));
    assert.equal(compositeKey("opencode-go", "DeepSeek-V4-Flash"), getModelKey(a));
  });

  test("findCurrentChoice resolves by provider+model pair, not by name", () => {
    const choices = groups.flatMap((group) => group.models.map((model) => ({ group, model, selection: selectionFor(group, model) })));
    const current = findCurrentChoice(choices, { provider: "openrouter", model: "deepseek/deepseek-v4" });
    assert.ok(current);
    assert.equal(current.group.id, "openrouter");
    assert.equal(current.model.name, "DeepSeek V4 Flash");
    // The same referent in the other provider stays unmatched.
    assert.equal(
      findCurrentChoice(choices, { provider: "opencode-go", model: "deepseek/deepseek-v4" }),
      undefined
    );
  });
});

describe("selectionFor - one source of truth for the default effort", () => {
  test("carries the model's defaultEffort into the selection", () => {
    const s = selectionFor(opencodeGroup, opencodeGroup.models[1]!);
    assert.deepEqual(s, { provider: "opencode-go", model: "DeepSeek-V4-Flash", reasoningEffort: "high" } as Selection);
  });

  test("omits reasoningEffort when the model declares no defaultEffort", () => {
    const s = selectionFor(openrouterGroup, openrouterGroup.models[0]!);
    assert.deepEqual(s, { provider: "openrouter", model: "deepseek/deepseek-v4" } as Selection);
  });

  test("the UI's click path uses the same builder as the choices memo", () => {
    const viaChoices = selectionFor(groups[0]!, groups[0]!.models[1]!);
    const viaClick = selectionFor(opencodeGroup, opencodeGroup.models[1]!);
    assert.deepEqual(viaClick, viaChoices);
  });
});

describe("provider pane ordering", () => {
  test("current provider is pinned first, others keep catalog order", () => {
    const pinned = sortGroupsForCurrent(groups, "openrouter");
    assert.deepEqual(
      pinned.map((g) => g.id),
      ["openrouter", "opencode-go"]
    );
    // Stability: pinning opencode-go keeps the other one in place.
    const pinned2 = sortGroupsForCurrent(groups, "opencode-go");
    assert.deepEqual(
      pinned2.map((g) => g.id),
      ["opencode-go", "openrouter"]
    );
  });

  test("unknown or missing current provider leaves the list untouched", () => {
    assert.equal(sortGroupsForCurrent(groups, undefined), groups);
    assert.deepEqual(
      sortGroupsForCurrent(groups, "ghost").map((g) => g.id),
      ["opencode-go", "openrouter"]
    );
  });
});

describe("current selection checks", () => {
  test("isCurrentSelected matches provider+model only", () => {
    assert.equal(isCurrentSelected({ provider: "opencode-go", model: "DeepSeek-V4-Flash" }, "opencode-go", "DeepSeek-V4-Flash"), true);
    assert.equal(isCurrentSelected({ provider: "opencode-go", model: "DeepSeek-V4-Flash" }, "openrouter", "DeepSeek-V4-Flash"), false);
    assert.equal(isCurrentSelected(null, "opencode-go", "DeepSeek-V4-Flash"), false);
  });

  test("provider disappeared from the catalog -> no current choice (graceful fallback)", () => {
    const choices = groups.flatMap((group) => group.models.map((model) => ({ group, model, selection: selectionFor(group, model) })));
    assert.equal(findCurrentChoice(choices, { provider: "vanished", model: "DeepSeek-V4-Flash" }), undefined);
    assert.equal(findCurrentChoice([], { provider: "opencode-go", model: "DeepSeek-V4-Flash" }), undefined);
    assert.equal(findCurrentChoice(choices, null), undefined);
  });
});

describe("compat normalization helpers", () => {
  test("groupModelsByProvider preserves catalog order", () => {
    const items: DshModelItem[] = [
      { providerId: "a", providerName: "A", modelId: "m1", modelName: "M1" },
      { providerId: "b", providerName: "B", modelId: "m2", modelName: "M2" },
      { providerId: "a", providerName: "A", modelId: "m3", modelName: "M3" }
    ];
    const grouped = groupModelsByProvider(items);
    assert.deepEqual(Object.keys(grouped), ["a", "b"]);
    assert.deepEqual(
      grouped["a"]!.map((m) => m.modelId),
      ["m1", "m3"]
    );
  });

  test("normalizeModel falls back to ids for missing names", () => {
    assert.deepEqual(normalizeModel({ id: "g" }, { id: "m" }), {
      providerId: "g",
      providerName: "g",
      modelId: "m",
      modelName: "m"
    } as DshModelItem);
  });
});

describe("search filtering (single-pane)", () => {
  test("matchesQuery is case-insensitive and empty-tolerant", () => {
    assert.equal(matchesQuery("DeepSeek V4 Flash", "deepseek"), true);
    assert.equal(matchesQuery("DeepSeek V4 Flash", "  "), true);
    assert.equal(matchesQuery("DeepSeek V4 Flash", "qwen"), false);
    assert.equal(matchesQuery(undefined, "x"), false);
  });

  test("filterGroupsByQuery matches name or id", () => {
    assert.deepEqual(
      filterGroupsByQuery(groups, "open").map((g) => g.id),
      ["opencode-go", "openrouter"]
    );
    assert.deepEqual(
      filterGroupsByQuery(groups, "router").map((g) => g.id),
      ["openrouter"]
    );
  });

  test("filterModelsByQuery stays inside the provider (no cross-provider search)", () => {
    const found = filterModelsByQuery(openrouterGroup.models, "DeepSeek");
    assert.equal(found.length, 1);
    assert.equal(found[0]!.id, "deepseek/deepseek-v4");
    void filterModelsByQuery(opencodeGroup.models, "xyz");
  });

  test("filterFailuresByQuery matches name or id", () => {
    const failures: CatalogFailure[] = [
      { id: "openrouter", name: "OpenRouter", message: "timeout" },
      { id: "deepseek", name: "DeepSeek", message: "401" }
    ];
    assert.deepEqual(
      filterFailuresByQuery(failures, "open").map((f) => f.id),
      ["openrouter"]
    );
    assert.deepEqual(filterFailuresByQuery(failures, "nope"), []);
  });
});

describe("esc pane stack", () => {
  test("walks one level at a time: model -> provider -> root -> close", () => {
    const steps: (Pane | "close")[] = [];
    let pane: Pane = "model";
    for (let i = 0; i < 3; i++) {
      const next = nextPaneOnEscape(pane);
      steps.push(next);
      if (next === "close") break;
      pane = next;
    }
    assert.deepEqual(steps, ["provider", "root", "close"]);
  });

  test("effort also returns to root", () => {
    assert.equal(nextPaneOnEscape("effort"), "root");
    assert.equal(nextPaneOnEscape("provider"), "root");
    assert.equal(nextPaneOnEscape("root"), "close");
  });
});

/**
 * dsh-model-provider - bundle builder.
 *
 * Produces lib/client.js in the DeepSeek Harness client-plugin format:
 * window.__ModuleLoader__.load({ id, factory(require) => exports })
 *
 * Uses esbuild to bundle src/client.tsx (declared devDependency) with the
 * harness packages kept external, then rewrites the esm output into the
 * harness module system (jsx-runtime + named imports become requires, exports
 * become module.exports assignments). No machine-specific paths anywhere.
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const ID = "dsh-model-provider";

/** Harness packages are resolved by the host module loader at runtime. */
const EXTERNAL = [
  "react",
  "react/jsx-runtime",
  "@deepseek-ai/dsh-client-locale",
  "@deepseek-ai/dsh-client-runtime",
  "@deepseek-ai/dsh-client-ui-model-selection",
  "@deepseek-ai/dsh-client-ui-primitives"
];

function resolveEsbuild() {
  try {
    return require.resolve("esbuild");
  } catch {
    throw new Error(
      "esbuild not found - run \`pnpm install\` (esbuild is a devDependency) before building."
    );
  }
}

const esbuild = require(resolveEsbuild());

const JsxRuntimeImport = /^import \{ jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment \} from "react\/jsx-runtime";\n?/m;
const NamedImport = /^import \{ ?([\s\S]*?)\s*\} from "([^"]+)";\s*$/gm;
// Bundled esm output aggregates the entry's exports in a trailing statement.
const ExportList = /^export \{ ?([\s\S]*?)\s*\};\s*$/gm;
const ExportFunction = /^export function (\w+)/gm;
const ExportConst = /^export const (\w+)/gm;

const exportedNames = new Set();

function rewrite(code) {
  // 1. jsx-runtime: convert the automatic-JSX import into the require form the
  //    harness module system resolves.
  code = code.replace(
    JsxRuntimeImport,
    'let react_jsx_runtime = require("react/jsx-runtime");\n'
  );

  // esbuild emits bare identifier calls (e.g. _jsxs(...)); normalize all forms
  // (with or without the (0, ...) wrapper) to require-backed property calls.
  code = code.replace(/(?<![\w$])_jsxs\(/g, "(0, react_jsx_runtime.jsxs)(");
  code = code.replace(/(?<![\w$])_jsx\(/g, "(0, react_jsx_runtime.jsx)(");
  code = code.replace(/(?<![\w$])_Fragment(?!\w)/g, "react_jsx_runtime.Fragment");

  // 2. named imports -> destructured requires. Bundling can emit the SAME
  //    external module from several source files with per-module local names
  //    (jsx6, jsxs6, ...), so every import gets a UNIQUE module alias and the
  //    "let ... = require(...)" lines never collide.
  let moduleCounter = 0;
  code = code.replace(NamedImport, (match, names, mod) => {
    const alias = "_mod_" + moduleCounter++;
    const bindings = names
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [orig, as] = part.split(/\s+as\s+/);
        return as ? as + " = " + alias + "." + orig : orig + " = " + alias + "." + orig;
      });
    return 'let ' + alias + ' = require("' + mod + '");\nlet ' + bindings.join(", ") + ";";
  });

  // 3. export forms -> plain declarations (or a no-op for the aggregated
  //    export list) + recorded names; module.exports is appended by main().
  code = code.replace(ExportFunction, (m, name) => {
    exportedNames.add(name);
    return "function " + name;
  });
  code = code.replace(ExportConst, (m, name) => {
    exportedNames.add(name);
    return "const " + name;
  });
  code = code.replace(ExportList, (m, names) => {
    for (const part of names.split(",")) {
      const name = part.trim().split(/\s+as\s+/)[0].trim();
      if (name) exportedNames.add(name);
    }
    return "";
  });
  return code;
}

async function main() {
  const css = readFileSync(join(here, "src/model-provider.css"), "utf8");
  const result = await esbuild.build({
    entryPoints: [join(here, "src/client.tsx")],
    bundle: true,
    write: false,
    format: "esm",
    jsx: "automatic",
    target: "es2020",
    sourcemap: false,
    minify: false,
    treeShaking: false,
    charset: "utf8",
    external: EXTERNAL
  });
  const transformed = { code: result.outputFiles[0].text };
  let code = rewrite(transformed.code);

  const exportsLines = [...exportedNames].map((name) => "exports." + name + " = " + name + ";");
  const cssInject = [
    "(function () {",
    "  if (typeof document === \"undefined\" || document.querySelector(\"style[data-plugin-css='dsh-model-provider']\") !== null) return;",
    "  var tag = document.createElement(\"style\");",
    "  tag.dataset.plugin = \"dsh-model-provider\";",
    "  tag.dataset.pluginCss = \"dsh-model-provider\";",
    "  tag.textContent = " + JSON.stringify(css) + ";",
    "  document.head.appendChild(tag);",
    "})();"
  ].join("\n");

  const body = [code.trim(), "", exportsLines.join("\n"), "", cssInject].join("\n");

  const bundle = [
    "window.__ModuleLoader__.load({",
    "\tid: " + JSON.stringify(ID) + ",",
    "\tfactory: (require) => {",
    "\t\tvar module = { exports: {} };",
    "\t\tvar exports = module.exports;",
    "\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: \"Module\" });",
    body
      .split("\n")
      .map((line) => "\t\t" + line)
      .join("\n"),
    "\t\treturn module.exports;",
    "\t}",
    "});",
    ""
  ].join("\n");

  mkdirSync(join(here, "lib"), { recursive: true });
  writeFileSync(join(here, "lib/client.js"), bundle);
  console.log("lib/client.js written (" + Buffer.byteLength(bundle) + " bytes)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

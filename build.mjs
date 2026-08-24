/**
 * dsh-model-provider — bundle builder.
 *
 * Produces lib/client.js in the DeepSeek Harness client-plugin format:
 * window.__ModuleLoader__.load({ id, factory(require) => exports })
 *
 * Uses esbuild only for the JSX/TS transform (the harness bundles are compiled
 * with tsdown plus the dsh platform preset; this tiny script reproduces the
 * same observable output shape without pulling the whole toolchain).
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const ID = "dsh-model-provider";

function resolveEsbuild() {
  const candidates = [
    "esbuild",
    "/data/opt/dev/leoch/node_modules/esbuild",
    "/data/opt/dev/leoch/node_modules/vite/node_modules/esbuild",
    "/data/opt/dev/trace/node_modules/esbuild"
  ];
  for (const candidate of candidates) {
    try {
      return require.resolve(candidate);
    } catch {
      /* keep looking */
    }
  }
  throw new Error("esbuild not found — install it or point resolveEsbuild() at a copy");
}

const esbuild = require(resolveEsbuild());

const JsxRuntimeImport = /^import \{ jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment \} from "react\/jsx-runtime";\n?/m;
const NamedImport = /^import \{ ?([\s\S]*?)\s*\} from "([^"]+)";\s*$/gm;
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

  // 2. named imports -> destructured requires.
  code = code.replace(NamedImport, (match, names, mod) => {
    const alias = "_mod_" + mod.replace(/[^\w$]/g, "_");
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

  // 3. export forms -> plain declarations + recorded names.
  code = code.replace(ExportFunction, (m, name) => {
    exportedNames.add(name);
    return "function " + name;
  });
  code = code.replace(ExportConst, (m, name) => {
    exportedNames.add(name);
    return "const " + name;
  });
  return code;
}

async function main() {
  const src = readFileSync(join(here, "src/client.tsx"), "utf8");
  const css = readFileSync(join(here, "src/model-provider.css"), "utf8");
  const transformed = await esbuild.transform(src, {
    loader: "tsx",
    jsx: "automatic",
    target: "es2020",
    sourcemap: false,
    minify: false,
    treeShaking: false
  });
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
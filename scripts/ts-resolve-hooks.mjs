/**
 * Resolution hooks for the `scripts/*.mts` checks. See `ts-resolve.mjs`.
 *
 * Two rules, both narrow on purpose:
 *
 *   1. `@/x` -> `<repo root>/x`, matching the tsconfig `paths` alias.
 *   2. an extensionless relative specifier that resolves to a real `.ts` or
 *      `.tsx` file gets that extension.
 *
 * Rule 2 tries the file BEFORE rewriting, so a specifier that already resolves
 * (a real `.mjs`, a package) is left completely alone. Nothing here changes how
 * the application builds — Next and tsc never load this file.
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const EXTS = [".ts", ".tsx", ".mts"];

export async function resolve(specifier, context, nextResolve) {
  let spec = specifier;

  // 1 — the tsconfig alias.
  if (spec.startsWith("@/")) {
    spec = pathToFileURL(path.join(ROOT, spec.slice(2))).href;
  }

  // 2 — an extensionless relative or absolute path that IS a TypeScript file.
  const looksRelative = spec.startsWith(".") || spec.startsWith("file:");
  if (looksRelative && !EXTS.some((e) => spec.endsWith(e)) && !spec.endsWith(".js") && !spec.endsWith(".mjs")) {
    const base = spec.startsWith("file:")
      ? fileURLToPath(spec)
      : path.resolve(path.dirname(fileURLToPath(context.parentURL)), spec);
    for (const ext of EXTS) {
      if (existsSync(base + ext)) {
        spec = pathToFileURL(base + ext).href;
        break;
      }
      // A directory import, e.g. `../compliance` -> `../compliance/index.ts`.
      const idx = path.join(base, `index${ext}`);
      if (existsSync(idx)) {
        spec = pathToFileURL(idx).href;
        break;
      }
    }
  }

  return nextResolve(spec, context);
}

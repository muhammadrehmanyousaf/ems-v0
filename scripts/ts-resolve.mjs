/**
 * A module resolver for the `scripts/*.mts` checks.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 *
 * The check scripts drive REAL app modules under plain node
 * (`--experimental-strip-types`) rather than re-implementing them, which is the
 * whole point: a parity script that tests a copy of the rule proves nothing.
 *
 * Node's resolver and TypeScript's disagree about two things, and app code
 * cannot satisfy both:
 *
 *   `@/lib/seo/constants`   the tsconfig path alias. Node has never heard of it.
 *   `../compliance/x`       extensionless. Node needs `../compliance/x.ts`,
 *                           and `tsc` REJECTS that extension in app files
 *                           unless `allowImportingTsExtensions` is on.
 *
 * Working around it per-file — importing constants directly, threading a
 * dependency in — distorted app code to suit a test harness, which is
 * backwards. This bridges the gap in the harness instead, where it belongs.
 *
 * Usage:
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/whatever.mts
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./ts-resolve-hooks.mjs", pathToFileURL("./scripts/"));

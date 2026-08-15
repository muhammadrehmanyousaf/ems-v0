/**
 * Phase 1 discovery — the complete testable surface, generated from source.
 *
 *   node scripts/qa-discover.mjs
 *
 * Writes QA_TRACKER.md (screens + named elements) and QA_API_MATRIX.md (every
 * endpoint and the guard standing in front of it).
 *
 * Generated, never hand-listed. A hand-written inventory is wrong the day after
 * it is written and every count in it becomes a number nobody can check.
 *
 * The first version of this script missed two things, which is why it was
 * rewritten and why each is called out below:
 *   - it followed component imports ONE level deep, so a page that delegates to
 *     a component that delegates again reported a fraction of its real elements
 *   - it enumerated no API endpoints at all, leaving the permission-boundary
 *     surface (rules.md §4G) — 446 endpoints — entirely undiscovered
 *
 * It also assumed three personas. There are five.
 *
 * What it deliberately does NOT do: decide whether anything works. It produces
 * the list of things that must be exercised. Testing happens in a browser.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const api = resolve(root, "..", "event-planner-api");

const rel = (p) => p.replace(root, "").replace(api, "«api»").replace(/\\/g, "/");

// ═══════════════════════════════════════════════════════════════════════════
// FRONTEND
// ═══════════════════════════════════════════════════════════════════════════

function walk(dir, match, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, match, out);
    else if (match(entry)) out.push(p);
  }
  return out;
}

const routeOf = (file) =>
  file.replace(root, "").replace(/\\/g, "/").replace(/^\/app/, "")
    .replace(/\/page\.tsx$/, "").replace(/\/\([^)]+\)/g, "") || "/";

// ── Named element extraction ────────────────────────────────────────────────
/**
 * Counts alone cannot be tested. "14 elements" tells a tester nothing; "Accept,
 * Decline, Reschedule, Mark complete" tells them exactly what to click. So every
 * extractor returns names where the source gives one.
 */
const clean = (s) => (s || "").replace(/\s+/g, " ").replace(/\{[^}]*\}/g, "").trim();

function extractNamed(src) {
  const found = {
    buttons: new Set(), links: new Set(), fields: new Set(), selects: new Set(),
    toggles: new Set(), dialogs: new Set(), tabs: new Set(), tables: 0,
    uploads: 0, forms: 0, toasts: 0, handlers: 0, writes: new Set(),
  };

  // <Button …>Label</Button> — inner text first, then aria-label, then icon name.
  for (const m of src.matchAll(/<Button\b([^>]*)>([\s\S]{0,120}?)<\/Button>/g)) {
    const label = clean(m[2].replace(/<[^>]+>/g, " "));
    const aria = (m[1].match(/aria-label=["']([^"']+)/) || [])[1];
    const icon = (m[2].match(/<([A-Z]\w+)\s*\/?>/) || [])[1];
    const name = label || aria || (icon ? `(icon: ${icon})` : "(unlabelled)");
    if (name) found.buttons.add(name.slice(0, 48));
  }
  for (const m of src.matchAll(/<button\b([^>]*)>([\s\S]{0,120}?)<\/button>/g)) {
    const label = clean(m[2].replace(/<[^>]+>/g, " "));
    const aria = (m[1].match(/aria-label=["']([^"']+)/) || [])[1];
    found.buttons.add((label || aria || "(unlabelled)").slice(0, 48));
  }

  for (const m of src.matchAll(/<Link\b[^>]*href=\{?["'`]([^"'`}]+)/g)) found.links.add(m[1].slice(0, 60));
  for (const m of src.matchAll(/<a\b[^>]*href=["']([^"']+)/g)) found.links.add(m[1].slice(0, 60));

  // Fields: name= wins, then id=, then placeholder — whichever the tester will see.
  for (const m of src.matchAll(/<(Input|Textarea|input|textarea)\b([^>]*)>/g)) {
    const a = m[2];
    const name = (a.match(/\bname=["']([^"']+)/) || a.match(/\bid=["']([^"']+)/) ||
      a.match(/placeholder=["']([^"']+)/) || [])[1];
    const type = (a.match(/\btype=["']([^"']+)/) || [])[1] || "text";
    const req = /\brequired\b/.test(a) ? " *" : "";
    if (type === "file") found.uploads++;
    else found.fields.add(`${name || "(unnamed)"}:${type}${req}`.slice(0, 52));
  }
  for (const m of src.matchAll(/<(Select|Combobox|select)\b([^>]*)>/g)) {
    const n = (m[2].match(/\bname=["']([^"']+)/) || m[2].match(/\bid=["']([^"']+)/) || [])[1];
    found.selects.add((n || "(unnamed select)").slice(0, 44));
  }
  for (const m of src.matchAll(/<(Checkbox|Switch|RadioGroup)\b([^>]*)>/g)) {
    const n = (m[2].match(/\bname=["']([^"']+)/) || m[2].match(/\bid=["']([^"']+)/) || [])[1];
    found.toggles.add(`${m[1]}:${n || "(unnamed)"}`.slice(0, 44));
  }
  for (const m of src.matchAll(/<(Dialog|AlertDialog|Sheet|Drawer)Title\b[^>]*>([\s\S]{0,80}?)</g)) {
    const t = clean(m[2]);
    if (t) found.dialogs.add(t.slice(0, 44));
  }
  for (const m of src.matchAll(/<TabsTrigger\b[^>]*>([\s\S]{0,60}?)</g)) {
    const t = clean(m[1].replace(/<[^>]+>/g, " "));
    if (t) found.tabs.add(t.slice(0, 32));
  }
  for (const m of src.matchAll(/<(Dialog|AlertDialog|Sheet|Drawer)\b/g)) { /* counted via titles */ }

  found.tables += (src.match(/<Table\b|<DataTable\b|<table\b/g) || []).length;
  found.forms += (src.match(/<form\b|useForm\(|handleSubmit/g) || []).length;
  found.toasts += (src.match(/toast\(|toast\.success|toast\.error/g) || []).length;
  found.handlers += (src.match(/onClick=|onSubmit=|onValueChange=|onCheckedChange=/g) || []).length;
  found.uploads += (src.match(/useDropzone|<Dropzone|<FileUpload/g) || []).length;

  // Which endpoints this screen actually calls — the link between the two files.
  for (const m of src.matchAll(/["'`](\/(?:api\/v1\/)?[a-zA-Z][\w\-/[\]${}.]*)["'`]/g)) {
    const p = m[1];
    if (/^\/(api|auth|bookings|businesses|vendors|users|payments|customers|leads|quotes|staff|reviews|disputes|notifications|packages|availability|venue-os|promotions|subscriptions)/.test(p))
      found.writes.add(p.replace(/\$\{[^}]*\}/g, ":id").slice(0, 56));
  }
  return found;
}

/**
 * Transitive, depth-capped, cycle-guarded. Depth 3 was chosen by measurement:
 * depth 1 undercounted every delegating page, and past 3 the design system
 * dominates and the numbers stop describing this screen.
 */
const SKIP_IMPORT = /\/(ui|lib|hooks|utils|types|api|constants|config)\//;

function localImports(src, fileDir) {
  const out = [];
  for (const m of src.matchAll(/from\s+["'](@\/[^"']+|\.\.?\/[^"']+)["']/g)) {
    const spec = m[1];
    if (SKIP_IMPORT.test(spec)) continue;
    const base = spec.startsWith("@/") ? join(root, spec.slice(2)) : resolve(fileDir, spec);
    for (const ext of [".tsx", ".ts", "/index.tsx", "/index.ts"]) {
      if (existsSync(base + ext) && statSync(base + ext).isFile()) { out.push(base + ext); break; }
    }
  }
  return out;
}

function analyse(entryFiles, maxDepth = 3) {
  const seen = new Set();
  const merged = { buttons: new Set(), links: new Set(), fields: new Set(), selects: new Set(),
    toggles: new Set(), dialogs: new Set(), tabs: new Set(), writes: new Set(),
    tables: 0, uploads: 0, forms: 0, toasts: 0, handlers: 0 };
  const components = [];
  let queue = entryFiles.map((f) => [f, 0]);
  while (queue.length) {
    const [f, depth] = queue.shift();
    if (seen.has(f)) continue;
    seen.add(f);
    let src; try { src = readFileSync(f, "utf8"); } catch { continue; }
    const got = extractNamed(src);
    for (const k of Object.keys(merged)) {
      if (merged[k] instanceof Set) for (const v of got[k]) merged[k].add(v);
      else merged[k] += got[k];
    }
    if (!entryFiles.includes(f)) components.push(rel(f));
    if (depth < maxDepth) for (const dep of localImports(src, dirname(f))) queue.push([dep, depth + 1]);
  }
  return { merged, components, filesRead: seen.size };
}

// ── Personas ────────────────────────────────────────────────────────────────
/**
 * Five, not three. `app/staff/*` is a whole separate portal with its own login,
 * and `app/floor` / `app/pin` are venue-floor surfaces. Missing these meant the
 * first flow map covered three of five roles.
 *
 * The admin split is verified against the live app, not guessed: a vendor at
 * /dashboard/users gets "Admin only — You don't have permission to view this
 * page.", and the API returns 403 for the same token.
 */
function rolesFor(route) {
  if (route.startsWith("/staff")) return ["STAFF"];
  if (route.startsWith("/floor") || route.startsWith("/pin")) return ["FLOOR"];
  if (route.startsWith("/dashboard/admin/")) return ["SUPERADMIN"];
  if (/^\/dashboard\/(users|roles|vendors|businesses|revenue|audit-logs)\b/.test(route)) return ["SUPERADMIN"];
  if (route.startsWith("/dashboard")) return ["VENDOR", "SUPERADMIN"];
  if (/^\/(login|register|forgot-password|reset-password|onboarding|business-registration)/.test(route)) return ["PUBLIC"];
  return ["USER", "PUBLIC"];
}

const isContent = (r) =>
  /^\/(blog|glossary|best|cities|compare)\b/.test(r) ||
  /guide|how-to-|-in-pakistan$|-for-bride$|traditions|dress|hairstyles|jewellery|designs/.test(r);

// ── Layouts: chrome present on every screen beneath them ────────────────────
const layouts = walk(join(root, "app"), (e) => e === "layout.tsx").map((f) => {
  const scope = f.replace(root, "").replace(/\\/g, "/").replace(/^\/app/, "").replace(/\/layout\.tsx$/, "").replace(/\/\([^)]+\)/g, "") || "/";
  const { merged } = analyse([f], 2);
  return { file: rel(f), scope, merged };
});

const pages = walk(join(root, "app"), (e) => e === "page.tsx");
const screens = pages.map((f) => {
  const route = routeOf(f);
  const { merged, components, filesRead } = analyse([f]);
  const elements = merged.buttons.size + merged.links.size + merged.fields.size +
    merged.selects.size + merged.toggles.size + merged.dialogs.size + merged.tabs.size +
    merged.tables + merged.uploads;
  return { route, file: rel(f), roles: rolesFor(route), merged, elements, components, filesRead, content: isContent(route) };
}).sort((a, b) => a.route.localeCompare(b.route));

// ═══════════════════════════════════════════════════════════════════════════
// BACKEND — every endpoint and the guard in front of it
// ═══════════════════════════════════════════════════════════════════════════

function discoverApi() {
  const mountSrc = readFileSync(join(api, "src/loaders/routes.js"), "utf8");
  const mounts = [];
  for (const m of mountSrc.matchAll(/app\.use\(\s*["']([^"']+)["']\s*,\s*(\w+)/g)) {
    mounts.push({ prefix: m[1], router: m[2] });
  }
  // Longest prefix first: /businesses/:id/slots must win over /businesses.
  mounts.sort((a, b) => b.prefix.length - a.prefix.length);

  /**
   * Routers reach the mount table two ways, and missing the second one hid
   * THIRTY of the sixty-six routers — including leads, staff, disputes,
   * complaints, public reviews and import. The first matrix reported "549
   * endpoints" while covering barely half the surface, and the gap only
   * surfaced because a live probe of /api/v1/disputes 404'd for every role.
   *
   *   1. exported from src/routes/index.js
   *   2. `const xRouter = require("../routes/xRouter")` INLINE in routes.js,
   *      immediately above its own app.use
   */
  const idxSrc = readFileSync(join(api, "src/routes/index.js"), "utf8");
  const fileOf = {};
  for (const m of idxSrc.matchAll(/const\s+(\w+)\s*=\s*require\(["']\.\/([^"']+)["']\)/g)) fileOf[m[1]] = m[2];
  for (const m of mountSrc.matchAll(/const\s+(\w+)\s*=\s*require\(["']\.\.\/routes\/([^"']+)["']\)/g)) fileOf[m[1]] = m[2];

  const endpoints = [];
  for (const { prefix, router } of mounts) {
    const f = fileOf[router];
    if (!f) continue;
    const p = join(api, "src/routes", f.endsWith(".js") ? f : `${f}.js`);
    if (!existsSync(p)) continue;
    const src = readFileSync(p, "utf8");

    /**
     * Middleware arrays spread into routes must be resolved, or every route
     * using one is reported as unguarded. venueOsRouter does exactly this —
     * `const scoped = [auth(), membershipScope, enforceVenueOsScope]` used as
     * `router.get("/x", ...scoped, handler)` — and the first version of this
     * parser called all 40 of its authenticated routes PUBLIC.
     */
    const spreads = {};
    for (const s of src.matchAll(/const\s+(\w+)\s*=\s*\[([\s\S]{0,400}?)\]\s*;/g)) spreads[s[1]] = s[2];
    const expand = (tail) =>
      tail.replace(/\.\.\.(\w+)/g, (_, name) => spreads[name] || "");

    for (const m of src.matchAll(/(\w*[Rr]outer|router)\.(get|post|put|patch|delete)\(\s*\n?\s*["']([^"']*)["']([\s\S]{0,900}?)\)\s*;/g)) {
      const [, , method, path, rawTail] = m;
      const tail = expand(rawTail);
      const guards = [];
      /**
       * The super-admin middleware is imported under TWO names —
       * `superAdminMiddleware` and `superAdmin` — and matching only the long
       * one reported `POST /admin/force-majeure-cancel` (bulk-cancels every
       * booking in a date range) as protected by nothing but `auth`. It is in
       * fact behind `const guard = [auth(), superAdmin()]`. Detect the alias,
       * or the matrix understates protection and sends a tester hunting a
       * vulnerability that does not exist.
       */
      if (/\bsuperAdmin(Middleware)?\s*\(/.test(tail)) guards.push("SUPERADMIN");
      else if (/\boptionalAuth\(/.test(tail)) guards.push("optional-auth");
      else if (/\bauth\(/.test(tail)) guards.push("auth");
      else guards.push("**PUBLIC**");
      if (/RateLimiter|Limiter/.test(tail)) guards.push("rate-limited");
      if (/requirePhoneVerified/.test(tail)) guards.push("phone-verified");
      if (/checkPermission|hasPermission/.test(tail)) guards.push("permission");
      const full = (prefix + (path === "/" ? "" : path)).replace(/\/+/g, "/");
      endpoints.push({ method: method.toUpperCase(), path: full, guards, router, file: `routes/${f}` });
    }
  }
  return { endpoints, mounts };
}

const { endpoints, mounts } = discoverApi();

// ═══════════════════════════════════════════════════════════════════════════
// OUTPUT
// ═══════════════════════════════════════════════════════════════════════════

const group = (pred) => screens.filter(pred);
const portal = group((r) => r.route.startsWith("/dashboard"));
const staff = group((r) => r.roles.includes("STAFF") || r.roles.includes("FLOOR"));
const auth = group((r) => r.roles.includes("PUBLIC") && !r.route.startsWith("/dashboard") && /login|register|password|onboarding/.test(r.route));
const content = group((r) => r.content);
const publicFn = screens.filter((r) => ![...portal, ...staff, ...auth, ...content].includes(r));
const sum = (rows) => rows.reduce((a, r) => a + r.elements, 0);

const setLine = (label, set) => (set.size ? `\n**${label} (${set.size}):** ${[...set].map((x) => `\`${x}\``).join(" · ")}` : "");

function screenBlock(r) {
  const m = r.merged;
  const out = [`### ${r.route}`,
    `\`${r.file}\` · **${r.roles.join(" / ")}** · **${r.elements} elements** · ${r.filesRead} files read${r.components.length ? ` · ${r.components.length} components` : ""}`];
  out.push(setLine("Buttons", m.buttons));
  out.push(setLine("Fields", m.fields));
  out.push(setLine("Selects", m.selects));
  out.push(setLine("Toggles", m.toggles));
  out.push(setLine("Dialogs", m.dialogs));
  out.push(setLine("Tabs", m.tabs));
  out.push(setLine("Links", m.links));
  out.push(setLine("Endpoints called", m.writes));
  const misc = [];
  if (m.tables) misc.push(`tables ${m.tables}`);
  if (m.uploads) misc.push(`**uploads ${m.uploads}**`);
  if (m.forms) misc.push(`forms ${m.forms}`);
  if (m.toasts) misc.push(`toasts ${m.toasts}`);
  if (m.handlers) misc.push(`handlers ${m.handlers}`);
  if (misc.length) out.push(`\n${misc.join(" · ")}`);
  out.push("");
  for (const role of r.roles) {
    out.push(`- [ ] **${role}** · A nav · B forms · C actions · D modals · E tables · F states · G permissions · H 1366+360`);
  }
  return out.filter(Boolean).join("\n") + "\n";
}

const section = (title, rows, note) =>
  `\n---\n\n## ${title}\n\n**${rows.length} screens · ${sum(rows)} elements**\n${note ? `\n> ${note}\n` : ""}\n` +
  rows.map(screenBlock).join("\n");

const totalElements = sum(screens);
const publicEndpoints = endpoints.filter((e) => e.guards.includes("**PUBLIC**"));
const adminEndpoints = endpoints.filter((e) => e.guards.includes("SUPERADMIN"));

writeFileSync(join(root, "QA_TRACKER.md"), `# QA_TRACKER.md — full testable surface

Generated by \`scripts/qa-discover.mjs\`. **Do not hand-edit the inventory** — re-run
the script. Check boxes off in place, in real time.

Governed by [rules.md](rules.md). A checked box means: clicked it, submitted it,
reloaded, re-read the value. A render check is never \`[x]\`.
Categories: A nav · B forms/fields · C actions · D modals · E tables · F states ·
G permission boundaries · H responsive 1366×657 + 360×720 (rules.md §4).

## Totals

| Surface | Screens | Elements |
|---|---:|---:|
| Portal \`/dashboard/*\` | ${portal.length} | ${sum(portal)} |
| Staff / floor | ${staff.length} | ${sum(staff)} |
| Auth | ${auth.length} | ${sum(auth)} |
| Public functional | ${publicFn.length} | ${sum(publicFn)} |
| Content / SEO | ${content.length} | ${sum(content)} |
| **Total** | **${screens.length}** | **${totalElements}** |

Plus **${endpoints.length} API endpoints** — see [QA_API_MATRIX.md](QA_API_MATRIX.md).

## Shared chrome — present on every screen beneath it

${layouts.map((l) => `- \`${l.scope}\` — ${l.merged.buttons.size} buttons, ${l.merged.links.size} links (\`${l.file}\`)`).join("\n")}

> Chrome is tested **once per layout per role**, not once per screen. It is listed
> here so it is never assumed to have been covered by the screens beneath it.
${section("Portal", portal)}${section("Staff & floor", staff, "A separate portal with its own login. Easy to miss entirely — it does not appear under /dashboard.")}${section("Auth", auth)}${section("Public functional", publicFn)}${section("Content / SEO", content, "Not functional modules. Narrower obligation: the page renders, its links resolve, and it does not scroll sideways at 360px.")}`);

const byRouter = {};
for (const e of endpoints) (byRouter[e.router] ||= []).push(e);

writeFileSync(join(root, "QA_API_MATRIX.md"), `# QA_API_MATRIX.md — every endpoint and its guard

Generated by \`scripts/qa-discover.mjs\` from \`«api»/src/loaders/routes.js\` and the
${mounts.length} mounted routers.

This file exists because **a control hidden in the UI while its endpoint still
answers is a Critical finding** (rules.md §4G, Prohibition 7). Hiding a button is
not a permission boundary. Each endpoint below is called directly with each role's
token, and the response asserted.

## Totals

| | Count |
|---|---:|
| Endpoints | **${endpoints.length}** |
| Mounted routers | ${mounts.length} |
| Requiring \`auth()\` | ${endpoints.filter((e) => e.guards.includes("auth")).length} |
| Requiring SUPERADMIN | ${adminEndpoints.length} |
| Optional auth | ${endpoints.filter((e) => e.guards.includes("optional-auth")).length} |
| **No guard at all** | **${publicEndpoints.length}** |
| Rate-limited | ${endpoints.filter((e) => e.guards.includes("rate-limited")).length} |

## How each row is tested

| Endpoint guard | USER token | VENDOR token | SUPERADMIN token | No token |
|---|---|---|---|---|
| \`**PUBLIC**\` | 2xx | 2xx | 2xx | 2xx — **confirm it should be open** |
| \`auth\` | 2xx / 403 | 2xx / 403 | 2xx | **401** |
| \`SUPERADMIN\` | **403** | **403** | 2xx | **401** |

Plus tenant isolation on every \`:id\` route: vendor A must get **403/404**, never
200, for vendor B's record.

## Unguarded endpoints — read these first

${publicEndpoints.length ? publicEndpoints.map((e) => `- [ ] \`${e.method.padEnd(6)} ${e.path}\` — \`${e.file}\``).join("\n") : "_None._"}

## All endpoints by router

${Object.entries(byRouter).sort().map(([r, list]) => `\n### ${r} — ${list.length}\n\n${list.map((e) => `- [ ] \`${e.method.padEnd(6)} ${e.path}\` — ${e.guards.map((g) => `\`${g}\``).join(" ")}`).join("\n")}`).join("\n")}
`);

console.log(`screens:        ${screens.length}   elements: ${totalElements}`);
console.log(`  portal        ${String(portal.length).padStart(3)}  (${sum(portal)})`);
console.log(`  staff/floor   ${String(staff.length).padStart(3)}  (${sum(staff)})   <- was missing entirely`);
console.log(`  auth          ${String(auth.length).padStart(3)}  (${sum(auth)})`);
console.log(`  public fn     ${String(publicFn.length).padStart(3)}  (${sum(publicFn)})`);
console.log(`  content       ${String(content.length).padStart(3)}  (${sum(content)})`);
console.log(`layouts:        ${layouts.length}`);
console.log(`\nendpoints:      ${endpoints.length} across ${mounts.length} mounted routers`);
console.log(`  superadmin    ${adminEndpoints.length}`);
console.log(`  unguarded     ${publicEndpoints.length}   <- verify each is meant to be open`);
console.log(`\nwrote QA_TRACKER.md + QA_API_MATRIX.md`);

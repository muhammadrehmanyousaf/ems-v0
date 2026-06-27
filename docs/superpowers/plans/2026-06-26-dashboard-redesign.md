# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the `ems-v0` vendor/admin dashboard into a clean, professional, fully-responsive ClickUp/Slack-class SaaS workspace with user-switchable themes and Iconly icons, add shared bulk import/export to every list domain, and fix the Track-A security/polish gaps — all additive, behavior-frozen, and verifiable as zero-miss via the migration manifest.

**Architecture:** Three tracks. **Track A** (security/polish) and **Track B** (design-system foundation: theme engine + Iconly wrapper + shared primitives + bulk-IO primitive + restyled shell) are built once. **Track C** migrates all 211 dashboard files screen-by-screen on top of B, tracked in the migration manifest. The redesign rides entirely on shadcn HSL CSS custom properties: themes rewrite tokens via a `data-theme` attribute on the dashboard shell root, so every shadcn component re-themes with zero per-component edits. The public bridal site is untouched.

**Tech Stack:** Next.js 14 App Router · React 18 · TypeScript · Tailwind v3 · shadcn/ui (Radix) · @tanstack/react-table v8 · react-hook-form + zod · nuqs (URL state) · Zustand + next-themes (theming) · react-iconly (icons) · SheetJS `xlsx` Apache-2.0 (bulk IO) · TanStack Query.

---

## Source Specs (code-complete detail lives here — read before implementing each track)

| Spec | Path | Contains |
|---|---|---|
| Design spec | `docs/superpowers/specs/2026-06-26-dashboard-redesign-design.md` | Locked direction + decisions |
| Migration manifest | `docs/superpowers/specs/2026-06-26-dashboard-migration-manifest.md` | 211-file checklist (the zero-miss tracker) |
| Theme engine | `docs/superpowers/plans/_foundation/theme-engine.md` | 6 themes × light/dark HSL, Zustand store, FOUC script, picker |
| Icon system | `docs/superpowers/plans/_foundation/icon-system.md` | `<Icon>` wrapper, 190-name lucide→Iconly map, `<Spinner>` |
| Shared primitives | `docs/superpowers/plans/_foundation/shared-primitives.md` | AppShell, DataTable, PageHeader, StatCard, FilterBar, FormDrawer/Dialog, EmptyState, Skeletons, ErrorBoundary |
| Bulk IO | `docs/superpowers/plans/_foundation/bulk-io.md` | ExportMenu, BulkImportDialog, per-domain registry |
| Track A security | `docs/superpowers/plans/_foundation/track-a-security.md` | Secrets scrub, RBAC activation, polish fixes |
| **Design-OS spec** | `docs/superpowers/plans/2026-06-26-dashboard-design-os.md` | **The experience layer: vision, IA (5 zones), nav map, full design system (spacing/type/color/icon/motion), command palette, keyboard model, hi-fi direction, a11y, FE architecture. Drives Track B5–B7.** |
| **Completeness spec** | `docs/superpowers/plans/2026-06-26-completeness-spec.md` | **The zero-miss QUALITY contract: 35-component × 13-state matrix, per-screen 6-state matrix, full data-table/forms/keyboard/WCAG-2.2/responsive checklists with EXACT researched values. §I "Done" checklist is the per-screen gate in Track C.** |
| Research (5 files) | `docs/superpowers/plans/_research/*.md` | Sourced best-practice from Linear/Stripe/Geist/Radix/M3/NN-g/W3C backing every value in the completeness spec |
| Recon (8 files) | `docs/superpowers/plans/_recon/*.md` | Per-domain api/components/buttons/dialogs/bulk-IO specs |

---

## VERIFICATION CORRECTIONS (these OVERRIDE the source specs — adversarial review found them)

### C-1. Theme AA contrast fixes (computed via WCAG math; 4 of 12 theme/modes failed)
The theme-engine.md values for these four MUST be replaced with the corrected HSL below before shipping. All other 8 theme/modes pass AA cleanly.

| Theme/mode | Token | OLD (fails) | NEW (passes) | Ratio |
|---|---|---|---|---|
| Champagne **light** | `--primary` | `38 70% 45%` | `38 72% 42%` | ring 3.4:1 ✓ |
| Champagne **light** | `--primary-foreground` | `40 60% 98%` (white) | `36 40% 12%` (charcoal) | text 5.1:1 ✓ |
| Emerald **light** | `--primary` | `158 70% 38%` | `158 74% 30%` | text 4.58:1 / ring 4.49:1 ✓ |
| Emerald **light** | `--ring` | `158 70% 38%` | `158 74% 30%` | (match primary) |
| Indigo **dark** | `--primary` | `243 80% 67%` | `243 82% 70%` | — |
| Indigo **dark** | `--primary-foreground` | `240 30% 10%` | `240 30% 10%` (keep) | text 4.93:1 ✓ |

> Champagne is the DEFAULT theme and its light mode fails worst (white-on-gold = 2.95:1). The fix is charcoal text on gold — which is also the more premium look. Since champagne also lives in the base `:root`, apply the same `--primary`/`--primary-foreground` correction to the base `:root` block (NOT `.dark`).

### C-2. Icon map corrections (from icon-coverage verify — 190/190 mapped, but 2 defects)
1. **Dual-map bug (correctness):** 5 names — `DollarSign`, `Minus`, `ScanLine`, `UserMinus`, `UserX` — are keyed in BOTH `ICONLY_MAP` and `FALLBACK_MAP`. Resolution order makes `ICONLY_MAP` win, so `Minus`→`Plus` (wrong glyph), `UserMinus`/`UserX`→`People` (drops remove/block semantic). **Fix:** delete the `ICONLY_MAP` rows for these 5 so the curated fallbacks win.
2. **15 weak visual matches — flag for design review, swap to inline SVG/curated lucide where it misleads:** `RotateCw`/`RefreshCw`/`RefreshCcw`/`Repeat`→`Activity` (refresh shown as pulse), `Zap`→`Activity`, `Gauge`→`Activity`, `ChevronsUpDown`→`Swap` (sort handle), `ChevronsLeft`/`ChevronsRight` collapsing to single chevrons (first/last page == prev/next), `ExternalLink`+`ArrowUpRight`→`ArrowUpSquare` (collision), `Target`/`Globe`/`Link`/`Link2`→`Discovery` (4-way collision), `Smile`→`Game`, `UserCheck`→`AddUser`. Keep these as curated-lucide passthroughs in `FALLBACK_MAP` until clean Iconly equivalents are chosen.

### C-3. Infrastructure recon note (from coverage verify)
`layout/` (12 files), `globalComponents/` (8, incl. the `globalTable` primitives + `confirm-delete-dialog` + `dashboard-date-filter`), and `shared/` (`whatsapp-quick-send` = 3 btn/6 dlg, `upgrade-nudge`) are **migration targets but NOT list domains** → import/export = N/A. They are migrated in Wave 0/1 (foundation) as chrome, not given bulk-IO. Do not silently skip `whatsapp-quick-send`.

### C-4. Per-domain importability (from recon — which domains get IMPORT vs export-only)
- **Import + Export:** leads, customers (exists), bookings (exists), receipts, pdcs, expenses, brokers, inventory, suppliers, staff (roster), automation, reviews (gated), roles, users, drone-noc, halal-certs, generator-fuel, collaborations, vendors (admin, validate vendorType vs 23-enum).
- **Export-only (import N/A — computed/config/read-only):** payments, receivables, tax, billing, revenue, calendar, today, insights, promote, onboarding, dashboard, function-sheets, businesses, businesses-overview, businessSettings (config tabs), profile, platform-pulse, subscriptions, promotions, disputes, audit-logs, documents, force-majeure, reliability.

---

## File Structure (new files; existing files extended, not replaced)

```
lib/store/theme-prefs.ts                         # Zustand persisted theme store (B1)
lib/hooks/use-apply-theme.ts                     # syncs store → DOM data-theme + next-themes (B1)
lib/bulk-io/registry.ts                          # domain → BulkImportConfig registry (B4)
lib/bulk-io/<domain>.ts                          # per-domain export cols + import fields (C, per wave)
components/dashboard/shared/icon.tsx             # <Icon> + <Spinner> wrapper, lucide→Iconly map (B2)
components/dashboard/shared/export-menu.tsx      # shared ExportMenu (CSV+XLSX) (B4)
components/dashboard/shared/bulk-import-dialog.tsx  # shared generic importer (B4)
components/dashboard/primitives/app-shell.tsx    # shell wrapping existing sidebar (B3)
components/dashboard/primitives/page-header.tsx  # (B3)
components/dashboard/primitives/stat-card.tsx    # (B3)
components/dashboard/primitives/filter-bar.tsx   # (B3)
components/dashboard/primitives/empty-state.tsx  # token-based rewrite (B3)
components/dashboard/primitives/skeletons.tsx    # Table/Card/Detail skeletons (B3)
components/dashboard/primitives/error-boundary.tsx  # per-section boundary (B3)
components/dashboard/primitives/data-table/*      # DataTable<T> generalizing global-table (B3)
components/dashboard/primitives/form-shell/*      # FormDrawer + FormDialog (B3)
app/(dashboard)/dashboard/theme-picker.tsx       # topbar theme picker popover (B1)
app/globals.css                                  # APPEND 6 theme blocks (B1) — do NOT touch :root/.dark except C-1
event-planner-api/.gitignore                     # add .env (A1)
event-planner-api/src/seeders/*-rbac-permissions.js  # RBAC seed (A2)
event-planner-api/src/middlewares/authMiddleware.js  # add gate() wrapper (A2)
```

---

## TRACK A — Security & Polish (independent; can run first/in parallel)

### Task A1: Secrets scrub (untrack-only; user rotates live secrets)
**Files:** Modify `event-planner-api/.gitignore`; untrack `event-planner-api/.env`.

- [ ] **Step 1: Confirm exposure & that app reads from process.env (no code change needed)**
Run: `cd event-planner-api && git ls-files --error-unmatch .env && grep -n "process.env" app.js src/config/config.js src/middlewares/authMiddleware.js`
Expected: `.env` is tracked; `app.js:6,9,20`, `config.js:13`, `authMiddleware.js:47` read `process.env`. (Confirmed in recon — no app code change required.)

- [ ] **Step 2: Add .env to .gitignore** (line 76 currently says it's *intentionally* tracked — replace that comment)
Replace `event-planner-api/.gitignore:76` (`# .env intentionally tracked for the new ems-v0-backend repo per user request`) with:
```
# .env now untracked — secrets rotated externally (see Track A). Keep local only.
.env
```

- [ ] **Step 3: Untrack the file (history left intact per decision)**
Run: `git rm --cached event-planner-api/.env`
Expected: `rm '.env'` — file stays on disk, removed from index.

- [ ] **Step 4: Verify**
Run: `git status --short event-planner-api/.env`
Expected: shows `D .env` staged + the file still present on disk (`ls event-planner-api/.env`).

- [ ] **Step 5: Commit**
```bash
git add event-planner-api/.gitignore && git commit -m "chore(security): stop tracking .env (untrack-only; secrets to be rotated)"
```

- [ ] **Step 6: USER ACTION (cannot be automated — surface clearly)**
Print a notice: the exposed secrets — `JWT_SECRET` (weak: `HR-Backend-114422455-SECRET`), Neon `DATABASE_URL` (pw `npg_sAPoIl8chtk9`), `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — remain in git history and are only neutralized by **rotation**: regenerate in Neon + Stripe dashboards and set a new strong `JWT_SECRET`, then update Railway env vars. Rotating `JWT_SECRET` logs out all active users (expected).

### Task A2: RBAC activation (flag-gated; seed FIRST, enforce SECOND)
**Files:** Create `event-planner-api/src/seeders/<ts>-rbac-permissions.js`; Modify `authMiddleware.js` (add `gate()`); Modify the main dashboard routers.

- [ ] **Step 1: Confirm the dormant RBAC machinery**
Run: `grep -n "permission" event-planner-api/src/middlewares/authMiddleware.js | head`
Expected: `authMiddleware(permission, condition)` at ~line 23; resolves `UserRoleMap`→`RolePermissionMap.count`→403 (~line 179); returns 400 if a permission name has no `Permission` row (~line 150). Routers currently call `auth()` with no permission (confirmed).

- [ ] **Step 2: Define the permission scheme** (in the seed file)
Permission names per domain: `booking:read|write`, `staff:read|manage`, `supplier:read|write`, `broker:read|write`, `pdc:read|write`, `tax:read`, `expense:read|write`, `inventory:read|write`, `lead:read|write`, `business:read|write`, `admin:*`. Seed inserts each into `Permission` and grants every name to existing roles via `RolePermissionMap` (vendor role → its domain perms; admin/super → all). **This runs BEFORE any gate is enabled so nobody is locked out.**

- [ ] **Step 3: Add the `gate()` wrapper to authMiddleware.js**
```js
// Pass-through unless RBAC_ENFORCE=1, so gates are dormant until seeded+flipped.
const RBAC_ENFORCE = process.env.RBAC_ENFORCE === "1";
const gate = (permission, condition) =>
  RBAC_ENFORCE ? authMiddleware(permission, condition) : authMiddleware(undefined, condition);
module.exports.gate = gate;
```

- [ ] **Step 4: Apply gates on routers (still dormant — flag off)**
Replace bare `auth()` with `gate('domain:action')` on bookingRouter, staffRouter, supplierRouter, brokerRouter, pdcRouter, taxReportRouter, vendorExpenseRouter, inventoryRouter, leadRouter, businessRouter, adminRouter. With `RBAC_ENFORCE` unset, behavior is unchanged.

- [ ] **Step 5: Run the seed (after deploy, before flag)**
Run: `cd event-planner-api && npm run db:seed`
Expected: permissions inserted, role grants created. Verify with a query that an existing vendor role has its perms.

- [ ] **Step 6: Commit** (do NOT set the flag yet — that's a deliberate USER go-live step)
```bash
git add -A && git commit -m "feat(rbac): permission scheme + seed + flag-gated gate() (enforcement OFF by default)"
```

- [ ] **Step 7: USER ACTION** — after confirming the seed ran on prod, set `RBAC_ENFORCE=1` in Railway to enable enforcement.

### Task A3: Polish fixes
- [ ] **A3.1 ErrorBoundary** — wrap `{children}` in `app/(dashboard)/dashboard/layout.tsx:53` with the new `ErrorBoundary` (from B3). Commit.
- [ ] **A3.2 Calendar team-shift bug** — `components/dashboard/mainScreens/calendar/components/main-calendar.tsx:71`: `teamByDate` is never set. Wire it to `StaffAPI.teamCalendar()` (`lib/api/staff.ts:440` — method is `teamCalendar`, NOT `calendarShifts`); its `.days` already matches the shape consumed by `agenda-view.tsx:84,116`. Commit.
- [ ] **A3.3 a11y** — add `aria-live="polite"` to `layout/notifications-popover.tsx` async region; add skip-to-content link in AppShell (B3); enforce `aria-label` on icon-only buttons via the `<Icon label=…>` prop pattern (B2). Commit.
- [ ] **A3.4 Admin parity** — `admin-subscriptions-view.tsx` (129 lines) and `admin-promotions-view.tsx` (167) are the thinnest backing views; bring to parity with sibling admin screens during their Wave-5 migration (no empty stubs found — these are real but light). Commit.

---

## TRACK B — Foundation (build once; gates the whole redesign)

> Each task's code-complete source is in the referenced `_foundation/*.md` spec. Apply the C-1/C-2 corrections as you go. After each task, run the acceptance gate.

### Task B1: Theme engine
**Files:** Create `lib/store/theme-prefs.ts`, `lib/hooks/use-apply-theme.ts`, `app/(dashboard)/dashboard/theme-picker.tsx`; Modify `app/globals.css` (append theme blocks), `app/(dashboard)/dashboard/layout.tsx` (shell `data-theme` + FOUC script).
- [ ] **Step 1:** Append the 6 `[data-theme="x"]` light + `.dark [data-theme="x"]` (+ `[data-theme="x"].dark` fallback) blocks from theme-engine.md §2.7 to `globals.css`, **applying the C-1 corrected HSL** for champagne-light, emerald-light, indigo-dark. Apply C-1 champagne fix to base `:root` too. Do NOT otherwise touch base `:root`/`.dark`.
- [ ] **Step 2:** Create the Zustand store + `useApplyTheme` hook + FOUC bootstrap script (theme-engine.md §3–§4).
- [ ] **Step 3:** Wrap the dashboard shell with `data-theme={theme}` and mount the hook.
- [ ] **Step 4: Acceptance gate** — `npm run dev -p 3001`, load dashboard, switch all 6 themes + light/dark via the picker; confirm sidebar + buttons + cards all re-theme, no FOUC on reload. Re-run the contrast script (`docs/superpowers/plans/_foundation/_contrast-check`) → all 12 pass.
- [ ] **Step 5: Commit** `feat(dashboard): user-switchable theme engine (6 themes + custom accent, AA-verified)`

### Task B2: Iconly wrapper
**Files:** Create `components/dashboard/shared/icon.tsx`; add `react-iconly` to package.json.
- [ ] **Step 1:** `npm i react-iconly`. Create `icon.tsx` from icon-system.md §2 — the `<Icon name variant size label/>`, `ICONLY_MAP`, `FALLBACK_MAP`, `<Spinner/>`, dev-mode unknown-name guard. **Apply C-2.1**: remove the 5 dual-map rows so fallbacks win. **Apply C-2.2**: keep the 15 weak matches as curated-lucide passthroughs.
- [ ] **Step 2: Acceptance gate** — render an icon gallery page of all 190 names in dev; confirm none render the magenta UnknownIcon box; `Loader2` renders the animated `<Spinner>`; `Minus`/`UserX` render correct glyphs.
- [ ] **Step 3: Commit** `feat(dashboard): typed Iconly <Icon> wrapper with full lucide→Iconly map`

### Task B3: Shared primitives
**Files:** Create the `components/dashboard/primitives/*` tree per shared-primitives.md.
- [ ] **Step 1:** Build, in this order (each is code-complete in the spec): ErrorBoundary → Skeletons → EmptyState (token-based) → StatCard → PageHeader → FilterBar (nuqs) → FormDrawer/FormDialog → DataTable (incl. `renderCard` mobile-collapse) → AppShell (wraps existing `app-sidebar.tsx` unmodified — preserves role/craft gating).
- [ ] **Step 2: Acceptance gate (token-only)** — `grep -rE "#[0-9a-fA-F]{3,6}|bg-(white|gray|slate|zinc|red|green|blue)-[0-9]" components/dashboard/primitives` returns ZERO (primitives use semantic tokens only, so they theme correctly). DataTable collapses to cards below `md` (test at 375px).
- [ ] **Step 3: Commit** `feat(dashboard): shared primitives (AppShell, DataTable, forms, states)`

### Task B4: Bulk-IO primitive
**Files:** Create `components/dashboard/shared/export-menu.tsx`, `bulk-import-dialog.tsx`, `lib/bulk-io/registry.ts`; add `xlsx` (SheetJS CE, Apache-2.0) via the maintained CDN tarball, dynamic-imported.
- [ ] **Step 1:** Build `ExportMenu` (generalizes `lib/utils/csv-export.ts` + `export-bookings-button.tsx`: CSV path kept, XLSX added, "all pages" refetch) and `BulkImportDialog` (merges `import-customers-dialog.tsx` + `import-bookings-dialog.tsx`: CSV/XLSX → column-map → validate → preview → `importRow()` commit → result summary + error report). Use the `BulkImportConfig<TRow>` type from bulk-io.md.
- [ ] **Step 2:** Seed `lib/bulk-io/registry.ts` with the worked **leads** example from the spec.
- [ ] **Step 3: Acceptance gate** — round-trip leads: export to CSV + XLSX, re-import the file, confirm preview validates and dedupe (backend 409 → "skipped") works. XLSX lib dynamic-imports (not in main bundle).
- [ ] **Step 4: Commit** `feat(dashboard): shared bulk import/export (CSV+XLSX) primitive + registry`

---

### Task B5: Motion tokens & primitives
**Files:** Modify `app/globals.css` / `tailwind.config` (motion tokens); apply across primitives.
- [ ] **Step 1:** Add motion tokens from Design-OS §9 (`--motion-fast/base/slow` + the 3 easings). Wire into Tailwind `transitionDuration`/`transitionTimingFunction`.
- [ ] **Step 2:** Apply the per-interaction specs to the B3 primitives (dialog scale-fade 200ms, drawer slide 250ms, expand/collapse 200ms, skeleton shimmer, optimistic-success flash, hover 120ms). Wrap everything in a `prefers-reduced-motion` guard that collapses to opacity/instant.
- [ ] **Step 3: Acceptance gate** — DevTools "Rendering → paint flashing": animations touch transform/opacity only (no layout thrash), 60fps; reduced-motion OS setting disables them.
- [ ] **Step 4: Commit** `feat(dashboard): motion token system (150–300ms, reduced-motion safe)`

### Task B6: Command spine — ⌘K palette + global search + shortcuts
**Files:** Create `components/dashboard/shared/command-palette.tsx`, `lib/commands/registry.ts`, `components/dashboard/shared/global-search.tsx`, `components/dashboard/shared/shortcuts-overlay.tsx`. (shadcn `command` (cmdk) is likely already present via shadcn — confirm; else `npm i cmdk`.)
- [ ] **Step 1:** Build the command registry (`{id,label,group,keywords,icon,run}`) that nav items, quick-create, and row actions register into (Design-OS §12). One source of truth for ⌘K and `?`.
- [ ] **Step 2:** CommandPalette (⌘K / Ctrl-K): navigate to any of the 5-zone screens, run quick-create ("Add booking", "Log expense"), and surface GlobalSearch results (bookings/customers/leads/vendors/function-sheets) via the existing search endpoints. Debounced, keyboard-driven, grouped.
- [ ] **Step 3:** ShortcutsOverlay (`?`): lists active keybindings; KeyboardLayer wires j/k navigate · x select · e edit · / search · Esc close on the DataTable.
- [ ] **Step 4: Acceptance gate** — from any screen: ⌘K → "Add booking" opens the booking drawer; ⌘K → type a customer name → jumps to them; `?` shows shortcuts; a list is fully operable mouse-free.
- [ ] **Step 5: Commit** `feat(dashboard): command palette + global search + keyboard layer (the OS spine)`

### Task B7: Today home + StatusPill/MoneyCell atoms + experience primitives
**Files:** Restyle `components/dashboard/mainScreens/today/today-view.tsx` as the launch surface; create `components/dashboard/shared/status-pill.tsx`, `money-cell.tsx`, `undo-toast.tsx`, `density-toggle.tsx`, `saved-views.tsx`, `workspace-switcher.tsx` (extend existing `team-switcher`), `notification-panel.tsx` (extend `notifications-popover`).
- [ ] **Step 1:** Build StatusPill (color+icon+text, semantic tokens) and MoneyCell (tabular Rs + tone) — the atoms used across every domain in Track C.
- [ ] **Step 2:** Rebuild Today per Design-OS §7: "Needs you now" (deposits overdue · sheets due · shifts unconfirmed · certs expiring) + this-week + money snapshot. Make it the default `(dashboard)/dashboard` route.
- [ ] **Step 3:** UndoToast (5s, countdown bar) wired into the mutation layer; DensityToggle + SavedViews on DataTable; restyle WorkspaceSwitcher + NotificationPanel.
- [ ] **Step 4: Acceptance gate** — Today shows real "needs you now" items from live data and each CTA deep-links correctly; a delete shows an undo toast that restores; saved views persist per user.
- [ ] **Step 5: Commit** `feat(dashboard): Today launch surface + status/money atoms + undo/density/saved-views`

> **Track B order:** B1→B2→B3→B4 first (system), then B5→B6→B7 (experience). Track C consumes StatusPill/MoneyCell from B7, so build B7's atoms before Wave 1.

## TRACK C — Per-Domain Migration (211 files, manifest-tracked, wave by wave)

> Track C does NOT have 211 hand-written task blocks. It has ONE repeatable recipe applied to each manifest row. The manifest (`2026-06-26-dashboard-migration-manifest.md`) is the live tracker: flip a row `[ ]→[x]` only when the recipe's acceptance gate passes for that file.

### The Per-Screen Migration Recipe (apply to every manifest file)
For each file:
1. **Icons:** replace every `lucide-react` import with `<Icon name=… />` from B2. Re-type `LucideIcon` → `IconName`. Convert nav-data icon refs to string names.
2. **Layout:** wrap the screen in `PageHeader` + the relevant primitive (`DataTable` for `tbl=Y` rows; card grid for card lists). Replace ad-hoc tables with `DataTable<T>` (gets sticky header + mobile cards + built-in loading/empty/error free).
3. **Tokens:** delete every `bridal-*` class and hardcoded hex/Tailwind color; use semantic tokens (`bg-card`, `text-muted-foreground`, `bg-primary`…) so the screen themes. Per-status tone maps → token-based variants.
4. **Bulk IO:** if the domain is import+export (C-4), add `<ExportMenu>` + `<BulkImportDialog>` to the DataTable toolbar, wiring its `lib/bulk-io/<domain>.ts` config (export columns + import fields from that domain's recon file). Export-only domains get `<ExportMenu>` only.
5. **States:** ensure loading skeleton, empty state (preserve craft-aware copy), and error boundary are present (mostly free via primitives).
6. **Responsive:** verify at 375 / 768 / 1280px — no horizontal scroll, ≥44px targets, dialogs become full-width sheets on mobile.
7. **Behavior freeze:** preserve every button, dialog, state machine, validation, dedupe, money-format, and flag listed in the domain's recon file. NO routes/state/API/handler changes.
8. **Acceptance gate (per file): run the completeness-spec §I "Done" checklist (all 10 items)** — component states (B-matrix), screen states (C), table features (D), form rules (E), keyboard (F), WCAG 2.2 incl. the 7 deltas (G), responsive at 1280/768/375 (H), tokens-only grep `grep -E "lucide-react|bridal-|#[0-9a-fA-F]{3,6}" <file>` → zero, behavior frozen, 2-themes+dark smoke-check. Then flip the manifest row to `[x]`.

### Wave order (migrate by manifest section; commit per wave)
- **Wave 0 — chrome:** `layout/*`, `globalComponents/*` (incl. globalTable→DataTable bridge, confirm-delete-dialog, dashboard-date-filter), `shared/*` (whatsapp-quick-send, upgrade-nudge). [C-3]
- **Wave 1 — core ops:** bookings, leads, calendar, today, customers. (Note: customers export is a fragile DOM-scrape — replace with ExportMenu; leads/bookings preserve their NEXT_STATUS / status+payment action gates.)
- **Wave 2 — money:** payments, receivables, receipts, pdcs, expenses, tax, brokers, billing, revenue. (Preserve PDC + commission state machines; expenses categories must source from the API enum incl. `salary`, not the local array.)
- **Wave 3 — ops:** inventory, suppliers, staff, function-sheets. (Preserve immutable ledgers; staff dual state machines + payslip PDF.)
- **Wave 4 — compliance/exotic:** drone-noc, halal-certs, generator-fuel, collaborations, reliability. (Preserve permit/cert state machines + auto-expiry.)
- **Wave 5 — admin & directory:** admin/* (audit-logs, disputes, documents, force-majeure, platform-pulse, promotions, subscriptions, vendor-queue), roles, users, businesses, businesses-overview, businessSettings (all tabs+dialogs), vendors, profile. (vendors import validates `vendorType` vs 23-enum; bank-details keeps no-draft + verification-reset; A3.4 admin parity here.)
- **Wave 6 — growth:** insights, automation, promote, onboarding, reviews, dashboard home. (reviews is already on DataTable+CSV — use as the template; dashboard has the hook-count role-switch footgun + hardcoded Recharts fills to tokenize.)

### Track C completion gate (the zero-miss proof)
- [ ] Every manifest row is `[x]`.
- [ ] `grep -rE "from ['\"]lucide-react['\"]" components/dashboard` → **zero** (all icons via `<Icon>`; exceptions only the curated-lucide fallbacks inside `icon.tsx`).
- [ ] `grep -rE "bridal-" components/dashboard app/(dashboard)` → **zero**.
- [ ] `tsc --noEmit` clean for the dashboard tree; `npm run lint` clean.
- [ ] Every import+export domain (C-4) has a `lib/bulk-io/<domain>.ts` and both controls wired.

---

## Git Strategy
New isolated branch `feat/dashboard-redesign` off the current branch; commit per task/wave as above; **squash to a small set of commits at the end**; nothing pushed until the user says "push" (per standing preference).

## Self-Review notes (done)
- Spec coverage: theme engine (B1), Iconly (B2), primitives (B3), bulk-IO (B4), responsiveness (recipe step 6 + DataTable), a11y (A3.3 + primitives), completeness (manifest + Track C gate), bulk import/export (B4 + C-4), Track-A security (A1/A2/A3) — all mapped.
- Corrections C-1…C-4 fold the adversarial-verify findings into the plan so they're not lost.
- No placeholders: every task has exact paths, commands, and acceptance gates; code-complete detail is in the referenced `_foundation` specs to keep this plan navigable.

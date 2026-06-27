# Vendor/Admin Dashboard Redesign — Design Spec

**Date:** 2026-06-26
**Scope:** The `(dashboard)` route group of `ems-v0` only. Public customer-facing
site and the bridal design system are explicitly OUT of scope and untouched.

---

## 0. Direction (locked decisions)

| Decision | Choice | Notes |
|---|---|---|
| Aesthetic | **Clean professional SaaS** (ClickUp / Slack / Linear class) | Overrides the bridal direction *for the dashboard only*. Bridal stays on the public site. |
| Icons | **`react-iconly`** via one typed `<Icon/>` wrapper | Replaces scattered `lucide-react` usage in dashboard surfaces, incrementally. |
| Theming | **User-switchable**, 6 curated themes + custom accent, light/dark | Built on existing shadcn HSL tokens. |
| Responsiveness | **Mobile-first to the micro-element** | Tables→cards, sidebar→sheet, ≥44px targets, `clamp()` type. |
| Safety | **Additive, behavior-frozen, incremental** | Zero changes to routes/state/API/validation/handlers. Visual surfaces only. Roll out screen-by-screen. |
| Completeness | **Zero-miss, manifest-tracked** | Every one of the 214 dashboard files tracked in a checklist. No screen "done" until every button/icon-button/dialog/empty/loading/error on it is migrated. Verified by grep, not by claim. |
| Bulk I/O | **Shared import/export on every list domain** | Consistent `BulkImportDialog` + `ExportMenu` (CSV/XLSX) primitive, extended to all list screens. |

### Real surface (measured 2026-06-26, not estimated)
- **214** dashboard component files · **535** `<Button>` · **612** dialogs/sheets · **166** files import `lucide-react` · **31** table files · **0** files use `useForm` directly (forms live in dialog components — counted per-dialog).
- Bulk import/export **already exists** for: bookings, customers, businesses, payments, reviews, roles, users, vendors (`lib/utils/csv-export.ts`, per-domain `*-table-actions.tsx`, `import-*-dialog.tsx`). Job = unify into one primitive + extend to the domains that lack it.

### North-star (replaces bridal rules for the dashboard)
- Tool feels like a tool: calm, dense-but-breathable, content-first.
- Color is restrained: one accent (the active theme) + neutrals + semantic
  status colors (success/warn/danger/info). "Colorful but not too much."
- No ornamentation (no Mughal jaal / petals / Playfair italic) on dashboard surfaces.
- Every interactive element: visible focus ring, loading state, AA contrast.

---

## 1. Theme Engine

**Mechanism.** A `data-theme="<name>"` attribute on the dashboard shell root.
Each theme is a CSS block overriding the existing HSL custom properties
(`--primary`, `--background`, `--accent`, `--ring`, semantic tokens, …) already
defined in `app/globals.css`. Because every shadcn/ui component reads these
tokens, switching the attribute re-themes the entire dashboard with no
per-component changes. Light/dark handled as `[data-theme="x"]` and
`[data-theme="x"].dark`.

**Themes (6):**
1. **Champagne** — warm, default. Preserves Wedding Wala identity.
2. **Indigo** — ClickUp-like.
3. **Violet** — the current dashboard primary (≈263°).
4. **Emerald** — fresh/operational.
5. **Slate** — neutral pro.
6. **Rose** — soft brand-adjacent.

Plus a **custom accent** (hex → HSL/OKLCH) for power users.

**State & control.**
- Zustand store `lib/store/theme-prefs.ts` (persisted to localStorage; profile
  sync optional later), coordinated with `next-themes` for light/dark.
- Topbar **theme picker popover**: swatch grid + light/dark toggle + custom
  accent input, with live preview (mirrors BOS `themePrefs`).
- SSR-safe: attribute applied pre-paint via an inline script to avoid FOUC.

**A11y.** Each theme's accent passes WCAG AA against its surface in both modes.

---

## 2. Icon System

- Add `react-iconly`. Wrap in `components/dashboard/shared/icon.tsx`:
  `<Icon name="Calendar" variant="bulk|light|bold|broken|curved" size set />`.
- Central `name → component` map so the whole set's weight/size is tunable in
  one place and unknown names fail loudly in dev.
- Migrate dashboard icons incrementally; non-dashboard surfaces keep lucide.

---

## 3. Shared Primitives (the leverage layer)

Build once; every screen inherits the new look. Located under
`components/dashboard/shared/` (extends, does not delete, existing
`globalComponents`/`layout`).

| Primitive | Responsibility |
|---|---|
| `AppShell` | Sidebar + topbar + `data-theme` root + responsive frame. Wraps existing role/craft-gated sidebar logic — **preserved, restyled**. |
| `DataTable` | Sticky header, column sizing, **mobile→card collapse under `md`**, built-in loading skeleton / empty / error states. Supersedes ad-hoc tables; wraps existing `global-table` behavior. |
| `PageHeader` | Title + description + breadcrumb + action slot. |
| `StatCard` | KPI tile (label, value, delta, icon). |
| `FilterBar` | Search + chips/segments, URL-param backed. |
| `FormDrawer` / `FormDialog` | RHF+zod form shell with consistent footer, submit-loading, error summary. |
| `EmptyState` | Icon + copy + CTA (craft-aware copy preserved). |
| `Skeleton` set | Table / card / detail skeletons. |
| `ErrorBoundary` | Per-section recovery (fixes the "toast-only" gap). |
| `BulkImportDialog` | **Shared.** CSV/XLSX upload → column-map → validate → preview → commit, per-domain schema config. Generalizes the existing `import-bookings-dialog` / `import-customers-dialog`. |
| `ExportMenu` | **Shared.** CSV + XLSX export of current (filtered) view, all-pages option. Generalizes `csv-export.ts` + `export-bookings-button`. |

### Bulk import/export coverage target
Every list-style domain gets both Import and Export wired to its api module.
Already present (unify): bookings, customers, businesses, payments, reviews,
roles, users, vendors. **To add:** leads, suppliers, brokers, inventory,
expenses, pdcs, receipts, receivables, staff, function-sheets, tax, generator
-fuel, halal-certs, drone-noc, collaborations, promotions, subscriptions.
Each domain's import schema + export columns live in one config file so the
manifest can verify coverage.

---

## 4. Responsiveness Contract

- Breakpoints honored: 360 / 414 / 768 / 1024 / 1280 / 1440 / 1920.
- Sidebar: full → icon-rail → **off-canvas sheet** on mobile.
- Tables: **collapse to stacked cards** below `md` (no horizontal scroll on phones).
- Touch targets ≥ 44px. Type via `clamp()`. No viewport-pinned magic numbers.
- Dialogs/drawers full-width sheets on mobile.

---

## 5. Accessibility Baseline

- Visible focus ring (theme `--ring`) on every interactive element.
- `aria-live="polite"` on async/status regions (fixes notifications gap).
- Skip-to-content link in `AppShell`.
- Icon-only buttons get `aria-label`.
- Forms: `<label>` associations, announced loading/error.

---

## 6. Rollout Plan (incremental, safe)

**Track B (foundation — this spec):**
1. Theme engine + tokens.
2. `react-iconly` + `<Icon/>` wrapper.
3. Shared primitives + restyled `AppShell`/sidebar/topbar.
4. Theme picker in topbar.

**Track C (per-domain, after B approved):** migrate screens in waves —
core (bookings, leads, calendar, today, customers) → money (payments,
receivables, expenses, pdcs, tax, brokers) → ops (inventory, suppliers, staff,
function-sheets) → admin (queue, disputes, audit, force-majeure) → exotic
(drone-noc, halal-certs, generator-fuel). Each screen: behavior smoke-checked
after restyle (R6).

**Track A (security/polish, parallel, already-scoped):**
- Untrack `.env` + `.gitignore` + env-var reads (user rotates live secrets).
- Activate RBAC permission names + seed (flag-gated rollout).
- Error boundaries / a11y / calendar team-shift fetch / thin admin screens.

---

## 7. Explicit Non-Goals
- No changes to backend behavior, API contracts, routes, or data flow.
- No restyle of the public bridal site.
- No bridal ornamentation on dashboard surfaces.
- No big-bang rewrite — incremental, reversible per screen.

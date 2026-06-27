# TRACK A — Security + Polish Fixes (implementation-ready)

Runs alongside the redesign. Every change is additive, backward-compatible, and flag-gated where it touches live behavior (per "Live system safety" standard). Order within each section is load-bearing — do not reorder.

Backend root: `C:/Projects/Event Management Systen/event-planner-api`
Frontend root: `C:/Projects/Event Management Systen/ems-v0`

---

## 1. SECRETS SCRUB (untrack-only; history left intact per decision)

### Current state (verified)
- `.env` **IS tracked** by git: `git ls-files --error-unmatch .env` returns `.env` (exit 0) in `event-planner-api`.
- `event-planner-api/.gitignore` (lines 75–82) intentionally tracks `.env` — line 76 comment: `# .env intentionally tracked for the new ems-v0-backend repo per user request`. It ignores `.env.local`, `.env.test`, etc. but **NOT bare `.env`**. This is the hole.
- App already reads everything from `process.env` — **no code change needed**:
  - `app.js:6` `dotenv.config()`, `:9` validates `["PORT","DATABASE_URL","JWT_SECRET"]`, `:20` validates `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`.
  - `src/config/config.js:13` `use_env_variable: "DATABASE_URL"` (Sequelize reads env directly).
  - `authMiddleware.js:47` `jwt.verify(token, process.env.JWT_SECRET)`.
  - Stripe keys are read from `process.env.STRIPE_*` at usage sites.
  - Conclusion: removing `.env` from the index changes **nothing at runtime** as long as the file stays on disk locally / is set as host env vars on Railway.

### Secrets currently exposed in `event-planner-api/.env` (verbatim from file)
| Line | Var | Value (truncated) | Where to rotate |
|---|---|---|---|
| 5 | `JWT_SECRET` | `HR-Backend-114422455-SECRET` | Regenerate locally (any long random string); update Railway env. Rotating invalidates all existing JWTs (users re-login). |
| 7 | `DATABASE_URL` | Neon `postgresql://neondb_owner:npg_sAPoIl8chtk9@ep-divine-dream-...neon.tech/neondb` | **Neon dashboard** — reset `neondb_owner` password / rotate role; update Railway `DATABASE_URL`. |
| 8 | `STRIPE_SECRET_KEY` | `sk_test_51TSPXpAx7PCShKWC...` | **Stripe dashboard → Developers → API keys** → roll secret key. (Test key, but still roll.) |
| 15 | `STRIPE_PUBLISHABLE_KEY` | `pk_test_51TSPXpAx7PCShKWC...` | Publishable (non-secret) — rolls together with the secret when you roll the key pair. |
| 22 | `STRIPE_WEBHOOK_SECRET` | `whsec_REPLACE_ME` (placeholder, not real) | Set real value from Stripe → Webhooks → Signing secret. |

### Steps (run from `event-planner-api/`)
1. **Add the ignore rule.** Edit `.gitignore` — replace line 76 comment block so bare `.env` is ignored. Add at the top of the dotenv section (around line 75):
   ```gitignore
   # Local secrets — never tracked. (Was previously tracked; now untracked-only.)
   .env
   ```
   (Leave the existing `.env.*.local` / `.env.test` lines below it.)
2. **Untrack the file (keep it on disk):**
   ```bash
   git rm --cached .env
   ```
3. **Verify it's now ignored and gone from the index but present on disk:**
   ```bash
   git ls-files --error-unmatch .env   # expect: error (exit 1) → no longer tracked
   git check-ignore .env               # expect: .env  → now ignored
   test -f .env && echo "still on disk OK"
   ```
4. **Commit** (untrack-only — history intentionally left intact per decision):
   ```bash
   git add .gitignore
   git commit -m "chore(security): stop tracking .env (untrack-only; rotate secrets out-of-band)"
   ```
5. **Provision env on the host.** Ensure Railway has `DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `PORT`, `NODE_ENV=production` set as service variables (so the now-untracked `.env` is not needed in prod). `app.js:9-35` will hard-exit if `DATABASE_URL`/`JWT_SECRET`/Stripe vars are missing in production — verify before relying on it.

### NOTE — USER MUST ROTATE (we cannot do this)
Untracking does **not** invalidate the already-committed values; anyone with repo history still has them. The USER must rotate, in their own dashboards:
- **Stripe** → roll the API key pair + set the real webhook signing secret.
- **Neon** → reset/rotate the `neondb_owner` credential.
- **JWT_SECRET** → pick a new random value (forces all users to re-login).
After rotating, update the Railway service env vars to the new values. History is being left intact by decision, so rotation is the *only* thing that actually neutralizes the leak.

---

## 2. RBAC ACTIVATION (flag-gated, safe on live)

### Confirmed mechanism (`src/middlewares/authMiddleware.js`)
- Signature: `module.exports = (permission, condition) => async (req,res,next) => {…}` (line 23). Routers import it as `const auth = require("../middlewares/authMiddleware")` and call `auth()` / `auth("perm")` / `auth(null, "IncludePassword")`.
- When `permission != null` (lines 143–188): looks up `Permission.findOne({where:{name}})` (line 144) → 400 if the permission name doesn't exist in the table (line 150). Then resolves the user's roles via `UserRoleMap.findAll({where:{userId}})` (line 161) → `RolePermissionMap.count({permissionId, roleId IN roleIds})` (line 170) → **403** if count < 1 (line 179).
- **Today the gates are dormant:** every dashboard router calls `auth()` with no permission (confirmed `bookingRouter.js:3`, `staffRouter.js:13/58` `auth()`), so only authentication runs, never authorization.
- **Two latent foot-guns to respect:**
  1. If you pass a permission name that has **no row** in `Permission`, the middleware returns **400 "Please verify permission name in your route"** — so the seed (below) must create every permission row *before* any router references it.
  2. If a role lacks the `RolePermissionMap` link, the user gets **403** — so the seed must grant existing roles their permissions *before* the flag flips on, or live users get locked out.

### Proposed permission-name scheme (`resource:action`)
One read + one write per dashboard domain, plus manage where an admin-only surface exists:

| Router | Permissions |
|---|---|
| bookingRouter | `booking:read`, `booking:write` |
| staffRouter | `staff:read`, `staff:write`, `staff:manage` |
| supplierRouter | `supplier:read`, `supplier:write` |
| brokerRouter | `broker:read`, `broker:write` |
| pdcRouter | `pdc:read`, `pdc:write` |
| taxReportRouter | `tax:read`, `tax:write` |
| vendorExpenseRouter | `expense:read`, `expense:write` |
| inventoryRouter | `inventory:read`, `inventory:write` |
| leadRouter | `lead:read`, `lead:write` |
| businessRouter | `business:read`, `business:write` |
| adminRouter | `admin:read`, `admin:manage` |

Convention: GET → `:read`; POST/PUT/PATCH/DELETE → `:write`; destructive/admin-only ops → `:manage`.

### ENV FLAG + wrapper pattern
Add a small helper so routers can declare permissions **always**, but the permission is only *passed* to `authMiddleware` when enforcement is on. This means turning the flag off instantly reverts to today's "authenticate-only" behavior — zero-downtime kill switch.

New file `src/middlewares/rbac.js`:
```js
const auth = require("./authMiddleware");

// RBAC_ENFORCE=1 turns permission gating ON. Default OFF = today's behavior
// (authenticate only). Lets us SEED first, deploy, then flip the flag with
// no code change. `condition` still flows through (e.g. "IncludePassword").
const ENFORCE = process.env.RBAC_ENFORCE === "1";

module.exports = function gate(permission, condition) {
  return ENFORCE ? auth(permission, condition) : auth(undefined, condition);
};
```
Routers change from `auth("booking:read")` → `gate("booking:read")` (drop-in; same call shape). Example in `bookingRouter.js`:
```js
const gate = require("../middlewares/rbac");
router.get("/", gate("booking:read"), c.list);
router.post("/", gate("booking:write"), c.create);
```
Until `RBAC_ENFORCE=1`, `gate()` calls `auth(undefined,…)` → no authorization check → identical to current live behavior.

### SEED / migration (grant BEFORE enforcing)
Create an **idempotent** seeder `src/seeders/<timestamp>-rbac-permissions.js` (or a one-off `scripts/seedRbac.js`) that:
1. **Upserts every permission row** in the scheme above into `Permission` (so no router can hit the 400 "verify permission name" path).
2. **Grants existing roles their matching permissions** in `RolePermissionMap`:
   - super-admin roles (`authMiddleware.js:13` `["super admin","superadmin","super_admin"]`) → ALL permissions.
   - vendor/owner role → all `:read` + `:write` for booking, staff, supplier, broker, pdc, tax, expense, inventory, lead, business.
   - staff/limited roles → `:read` only (+ whatever they legitimately do today; mirror current sidebar access).
   - admin role → `admin:read`, `admin:manage`.
   Use find-or-create on `(roleId, permissionId)` so re-running is safe.
3. Logs a summary: rows created vs. already-present.

### ORDER (do not deviate)
1. **Seed first** — deploy + run the seeder while `RBAC_ENFORCE` is unset (gates still dormant). Verify every active user's role has the rows they need (spot-check super-admin + one vendor + one staff).
2. **Switch routers** to `gate(...)` and deploy (still no enforcement because flag is off — safe).
3. **Enable the flag second** — set `RBAC_ENFORCE=1` on Railway. Watch logs for any `403`. If anything breaks, unset the flag for instant rollback (no redeploy).

---

## 3. POLISH ITEMS (exact locations)

### (a) Wrap dashboard sections in an ErrorBoundary
There is **no app-level ErrorBoundary** today (only Next's internal dev one in `node_modules`). Create `ems-v0/components/dashboard/layout/section-error-boundary.tsx` (client component, `class … extends React.Component` with `getDerivedStateFromError` + `componentDidCatch`, rendering a compact "This section failed to load — Retry" card). Then wrap the page body in the dashboard shell:
- File: `ems-v0/app/(dashboard)/dashboard/layout.tsx` — wrap `{children}` (line 53). Place the boundary *inside* `SidebarInset`/`<div className="flex flex-1 …">` so a section crash keeps the sidebar + header alive:
  ```tsx
  <SectionErrorBoundary>{children}</SectionErrorBoundary>
  ```
- Additionally wrap the highest-churn section bodies for finer isolation: the calendar (`components/dashboard/mainScreens/calendar/components/main-calendar.tsx` return), and the admin tables (each `app/(dashboard)/dashboard/admin/*/page.tsx`, around the table component, e.g. `<DisputesTable/>` at `disputes/page.tsx:17`).

### (b) a11y fixes
- **aria-live (notifications):** the notifications surface is `components/dashboard/layout/notifications-popover.tsx` (rendered in `header.tsx:6,21`) — *not* a `notifications-view` file (that name doesn't exist). Add `role="status" aria-live="polite"` to the list container that re-renders when new notifications arrive, and `aria-live="assertive"` only for error toasts. (Toasts already go through `sonner`, which is announced; the popover list is the gap.)
- **skip-link (shell):** there is no `AppShell` component — the shell is `app/(dashboard)/dashboard/layout.tsx`. Add a visually-hidden, focus-visible skip link as the first child inside `<SidebarInset>` (before `<Header/>`, layout.tsx:48) and give the main content wrapper an `id`:
  ```tsx
  <a href="#dashboard-main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 …">Skip to content</a>
  ...
  <div id="dashboard-main" className="flex flex-1 min-w-0 flex-col">
  ```
- **aria-label on icon-only buttons:** enforce at the shared `<Icon>`/icon-button pattern rather than per-call. Audit icon-only triggers in `header.tsx` (`SidebarTrigger` :14, `ThemeToggle` :22, `NotificationsPopover` :21) and the calendar toolbar. Rule: any button whose only child is an icon MUST have `aria-label`. Best enforcement: add a required `aria-label` (or `title`) to the icon-button wrapper component's props type so omission is a TS error; failing that, add an ESLint rule `jsx-a11y/control-has-associated-label`.

### (c) Calendar team-shift overlay — missing fetch
- **The bug:** `main-calendar.tsx:71` declares `const [teamByDate, setTeamByDate] = useState<Record<string, TeamCalendarShift[]>>({})` and passes it to `<AgendaView teamByDate={teamByDate}/>` at line 534 — but **nothing ever calls `setTeamByDate`**, so the agenda "team on duty" row (`agenda-view.tsx:84,116`) is always empty.
- **The wiring:** the backend route exists (`staffRouter.js:58` `router.get("/team-calendar", auth(), c.teamCalendar)`) and the client method exists: `StaffAPI.teamCalendar({from,to,businessId})` (`lib/api/staff.ts:440`) returns `TeamCalendarData` with `.days` keyed by `YYYY-MM-DD` (`staff.ts:502-506`). Note: the method is named **`teamCalendar`**, not `calendarShifts` (no `calendarShifts` symbol exists — use `teamCalendar`).
- **Fix:** add a `useEffect` in `main-calendar.tsx` that fires when `mode === 'agenda'` (lazy, per the comment at lines 69-70) using the agenda window:
  ```tsx
  useEffect(() => {
    if (mode !== 'agenda') return;
    const from = ymd(cursor);
    const toDate = new Date(cursor); toDate.setDate(toDate.getDate() + AGENDA_HORIZON_DAYS);
    const to = ymd(toDate);
    StaffAPI.teamCalendar({ from, to, ...(slotBusinessId ? { businessId: slotBusinessId } : {}) })
      .then((d) => setTeamByDate(d.days ?? {}))
      .catch(() => setTeamByDate({}));
  }, [mode, cursor, slotBusinessId]);
  ```
  `StaffAPI` and `ymd` are already imported (`main-calendar.tsx:9,10`); `AGENDA_HORIZON_DAYS` is defined at line 29. `.days` is already the exact `Record<YYYY-MM-DD, TeamCalendarShift[]>` shape `teamByDate` expects — no transform needed. `teamCalendar` swallows its own errors and returns an empty shape, so the agenda degrades gracefully.

### (d) "Thin" admin screens — parity assessment
Finding: the `app/(dashboard)/dashboard/admin/*` pages are **21–27-line wrappers by design** — each delegates to a real, substantively-sized backing component, so **none are empty stubs**. Parity work is in the backing components, not the page files:

| Admin page | Backing component (lines) | Status / parity gap |
|---|---|---|
| disputes | `components/admin/DisputesTable.tsx` (275) | Functional. Verify resolve actions (refund/release/forfeit) hit live endpoints. |
| audit-logs | `components/admin/AuditLogTable.tsx` (142) | Functional; super-admin gated (`requireSuperAdmin`). Thinnest table — confirm filters (target type/action) + pagination wired. |
| documents | `components/admin/DocumentQueueTable.tsx` (202) | Functional (KYC approve/reject/request-changes). |
| force-majeure | `components/admin/ForceMajeureForm.tsx` (412) | Functional (largest). |
| vendor-queue | `components/admin/VendorQueueTable.tsx` (215) | Functional. |
| platform-pulse | `mainScreens/admin/platform-pulse-view.tsx` (259) | Functional snapshot view. |
| subscriptions | `mainScreens/admin/subscriptions/admin-subscriptions-view.tsx` (129) | **Thinnest backing view** — confirm it's not a placeholder; likely needs list + state transitions + empty/loading states to reach table parity. |
| promotions | `mainScreens/admin/promotions/admin-promotions-view.tsx` (167) | Mid-size; confirm create/edit/disable actions are wired, not read-only. |

Parity checklist for each (apply uniformly): real loading skeleton, empty state, error state (wrap in the new SectionErrorBoundary from 3a), pagination/filter persistence, and confirm every action button calls a live API (no `TODO`/no-op handlers). Prioritize **subscriptions** (129 lines) and **promotions** (167) for a no-op/placeholder audit — the rest are already substantive.

---

## SUMMARY (most urgent flagged)

**MOST URGENT: rotate the leaked live secrets.** `event-planner-api/.env` is git-tracked and contains a real Neon `DATABASE_URL` (with password), a Stripe secret key, and a weak `JWT_SECRET` (`HR-Backend-114422455-SECRET`). `.gitignore` line 76 deliberately tracked it. `git rm --cached .env` + ignoring it stops *future* leakage, but since history is intentionally left intact, **only rotating in the Neon and Stripe dashboards + setting a new JWT_SECRET actually neutralizes the exposure** — and we cannot do that for the user.

The work is three ordered tracks. (1) Secrets: untrack `.env`, add the ignore rule, commit; no app code changes (everything already reads `process.env`); user rotates Neon/Stripe/JWT out-of-band. (2) RBAC: the gating logic already exists in `authMiddleware.js` but every router calls `auth()` dormant. Add a `resource:action` permission scheme, a `gate()` wrapper keyed on `RBAC_ENFORCE`, and an idempotent seeder — **seed permissions + grant existing roles first, flip the flag second**, so no one is locked out and the flag is an instant kill switch. (3) Polish: add a real `SectionErrorBoundary` (none exists) and wrap `{children}` in `dashboard/layout.tsx`; a11y fixes target `notifications-popover.tsx` (aria-live), the layout shell (skip-link + `id="dashboard-main"`), and icon-only buttons in `header.tsx` (required `aria-label` enforced at the wrapper); fix the dead `teamByDate` state in `main-calendar.tsx:71` by adding a `useEffect` calling `StaffAPI.teamCalendar()` (the method is `teamCalendar`, not `calendarShifts`) on agenda open. The admin screens are thin *wrappers* over real components — not stubs — so parity work is auditing `admin-subscriptions-view.tsx` (129 lines) and `admin-promotions-view.tsx` (167) for placeholder/no-op handlers.

# Super-admin console scope — design

**Date:** 2026-07-29
**Branch:** `fix/super-admin-console-scope`
**Status:** approved, implementing

## Problem

A super admin logging in at weddingwala.pk lands on the **vendor console**. The
breadcrumb literally reads `VENDOR CONSOLE · OVERVIEW`, the primary CTA is "Add
booking", and the widgets are single-vendor CRM tools ("Aaj ke events", "Naye
Rabtay", "Yaad dilao" reminder buttons).

Worse, the numbers on that screen contradict each other, because some widgets
read platform-wide endpoints and others read vendor-scoped ones that find
nothing for an admin who owns no business:

- `BAQAYA · TO COLLECT Rs 18,799,650 across 59 events` sits beside
  `Total bookings 0` and `Revenue due Rs 0`.
- "Who to chase: **Nothing outstanding — you're all collected**" renders
  directly below the Rs 18.8M outstanding list.
- "RECENT BOOKINGS: **No bookings yet**" renders below 12 listed bookings.

## Root cause

This is a **regression, not missing work.** The codebase already has a correct
admin/vendor split. The dashboard redesign — ON by default in production via
`lib/dashboard-redesign-flag.ts` — carried that split over for some screens and
dropped it for others.

| Screen | Legacy path | Redesign path (live) |
|---|---|---|
| `/dashboard` home | forks to `AdminDashboardView` (`dashboard-view.tsx:111`) | **no fork** — vendor console for all roles |
| Vendors / Businesses / Users | admin views | `*AdminRedesignedView` — correct |
| Revenue | analytics | super-admin aware server-side — correct |
| Payments | — | calls `PaymentsAPI.getVendorRevenue()` — vendor-scoped |
| Bookings | — | generic vendor fetch — vendor-scoped |

A complete `AdminDashboardView` (platform KPIs, `totalVendors`, date-range
filter) exists at
`components/dashboard/mainScreens/dashboard/admin-dashboard-view.tsx` and is
simply never reached on the live path.

The sidebar is *already* role-aware (`app-sidebar.tsx:237` →
`buildAdminSections`), which is why the nav looked correct while the content did
not.

## Changes

### 1. Restore the dropped role fork

In `overview-redesigned-view.tsx` (already `"use client"`, already imports
`useUser`), mirror the legacy pattern from `dashboard-view.tsx:111`:

```tsx
const { user, isLoading } = useUser()
if (isLoading) return null
if (isAdminLike(getDashboardRole(user))) return <AdminDashboardView />
// existing vendor console below, untouched
```

Uses the canonical `getDashboardRole` helper, so super admin and any future
admin role both route correctly. The branch never fires for vendors.

### 2. Drop the two vendor modules from the admin nav

Remove `Bookings` and `Payments` from `adminOperations` in `nav-data.ts`
(lines 117-118). Admin Operations goes 8 items → 6.

A super admin has no bookings to chase and no payouts to receive. The
platform-level equivalents already exist in the nav: **Revenue** for money,
**Disputes** for booking problems.

Vendors are unaffected — `buildVendorSections` reads a separate array with its
own Bookings (line 53) and Payments (line 58) entries.

### 3. Users page — stop reporting false counts

`/dashboard/users` reports `Total users 9`. The real figure is **3,304**
(confirmed against `GET /api/v1/users?limit=1` → `meta.total`). The backend
paginates and returns `meta.total/page/limit/totalPages`
(`userController.js:321-329`) but `UsersAPI.getAll()` discards `meta`
(`lib/api/dashboard.ts:28`) and the view prints `rows.length`. Default limit is
10 (`apiFeatures.js:90`); one super admin is filtered out server-side, hence 9.
There is no pagination control, so 3,295 users are unreachable.

Separately, `Customers` reads **0** while six rows are badged "Customer" — the
same field tested two ways in one file:

```
line 87 (badge):   u.isVendor ? "Vendor" : "Customer"   // truthy  → null renders "Customer"
line 67 (counter): u.isVendor === false                 // strict  → null counts as neither
```

`isVendor` is a nullable BOOLEAN with no default, so customers stored as `null`
display as Customer but count as zero.

Fix, frontend-only:

- `UsersAPI.getAll(page, limit)` returns `{ results, meta }`.
- `Total users` reads `meta.total`.
- Counter uses `!u.isVendor` so it agrees with the badge.
- Add server-driven pagination so every user is reachable.
- Label the three breakdown tiles as page-scoped, since truthful platform-wide
  breakdowns are not obtainable — `getUsers` supports only paginate/sort/search,
  with no `isVendor` or `active` filter.

## Out of scope

The vendor console itself; the sidebar role logic (already correct); the
backend; and every screen already admin-aware (Vendors, Businesses, Users,
Revenue, and the five `AdminGuard`-wrapped pages).

Deliberately **not** bundled: adding `isVendor` / `active` filters to
`getUsers` so the breakdown tiles can be platform-wide. That is additive and
backward-compatible but needs a Railway backend deploy, so it belongs in its own
change.

## Safety

Frontend-only, additive, instantly revertible. Change 1 adds a branch that fires
only for admin-like roles; change 2 removes two nav links; change 3 touches one
view and one API method. No migration, no backend change, no new flag. Vendor
and customer paths are provably untouched.

Changes 1-2 land in one commit; change 3 in a second, so either can be reverted
alone.

## Verification

Log in as the super admin in a real browser at desktop and mobile: the home
renders the platform overview, admin nav shows 15 items, and the Users page
reports 3,304 with working pagination. The vendor path is verified by code
inspection — no vendor credentials are available, and that limit is stated
rather than glossed.

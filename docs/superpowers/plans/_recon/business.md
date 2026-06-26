# Recon — Business / Vendor / Settings / Profile domains

Ground-truth audit for the full visual redesign (ClickUp/Slack-style, switchable themes,
Iconly icons, mobile responsiveness, bulk import/export on every list domain).

Scope: `businesses`, `businesses-overview`, `businessSettings`, `vendors`, and the
`profile` page. All paths are relative to `C:/Projects/Event Management Systen/ems-v0`
(frontend) or `C:/Projects/Event Management Systen/event-planner-api` (backend) unless absolute.

Key shared infra discovered:
- **Global table stack**: `components/dashboard/globalComponents/globalTable/global-table.tsx`
  + `.../components/use-data-table.tsx` (tanstack) + `.../components/data-table-column-view.tsx`
  (column visibility) + `.../confirm-delete-dialog.tsx`. Both `businesses` and `vendors` use it.
- **CSV export util**: `lib/utils/csv-export.ts` — `exportTableToCSV(table, filename)`.
  Exports **only visible columns**, skips `select`/`actions`, uses tanstack
  `getFilteredRowModel()` so it respects the search filter. **This is the ONLY export
  mechanism in these 5 domains** and it is client-side (current page rows only — both
  tables fetch up to 100 rows).
- **Import dialogs exist only for `bookings` + `customers`** (`import-bookings-dialog.tsx`,
  `customersListing/components/import-customers-dialog.tsx`). **None of the 5 audited
  domains have an import dialog today.** The only backend bulk-import endpoint that
  exists is `POST /api/v1/bookings/bulk-import` (`BookingsAPI.bulkImport`, soft cap 200 rows).
- **Draft-resilience pattern** (`useFormDraft` + `DraftResumeBanner` + `AutoSaveIndicator`)
  is wired into basic-info, team-members, package-dialog, pricing-rules, resources,
  bundled-services. Bank-details deliberately AVOIDS localStorage drafts (financial PII)
  and uses `useBeforeUnloadGuard` + confirm-on-close instead. **Preserve verbatim.**

---

## 1. businesses

Super-admin list of every business on the platform.

1. **Main list/view + sub-tables**
   - View: `components/dashboard/mainScreens/businesses/businessListing/business-listing-view.tsx`
     (just `Heading "Businesses"` + `<BusinessTable/>` inside `PageContainer`).
   - Table: `.../businessListing/components/business-table.tsx` (tanstack via `useDataTable`,
     fetches `BusinessesAPI.getAll(1, 100)`, maps to flat `Business` rows).
   - Columns: `.../components/columns.tsx` — select checkbox, Business Name, Type (Badge),
     Location (city+subArea), Vendor (name), Packages (count chip), Created At, actions.
   - Toolbar: `.../components/business-table-actions.tsx` — search input (filters `name`) +
     **Export button** + `DataTableColumnView`.
   - Row actions: `.../components/row-actions.tsx` — dropdown: View Details (Eye), Delete (Trash2).
   - Detail dialog: `.../components/view-business-dialog.tsx` — read-only; embeds
     `AvailabilitySettingsCard` (vacation mode BK-048 + recurring blocks BK-011).
   - Also present: `.../components/business-table-filters.tsx` (filters helper).

2. **lib/api module + functions**
   - `lib/api/dashboard.ts` → `BusinessesAPI`. Used here: `getAll(page,limit)`, `delete(id)`.
   - Other `BusinessesAPI` methods (used by settings, not the list): `getAdminBusinessByUserId`,
     `getUserBusinesses`, `getById`, `update`, `uploadImages`, `getCompleteness`,
     `getCancellationPolicy`/`setCancellationPolicy`, `getPricingRules`/`setPricingRules`.
   - NOTE: `lib/api/vendors.ts` is a DIFFERENT class (`VendorAPI`) — the public-facing
     business listing/normalization, NOT the admin table. Do not conflate.

3. **Backend router + controller**
   - Router: `src/routes/businessRouter.js` (mounted `/api/v1/businesses`).
   - Controller: `src/controllers/businessController.js` (`businessController`). Delete is
     money-safety-gated ("Cannot delete business with active bookings" surfaced by FE WW-095).
   - Admin-by-user route: `businessRouter.js:104` `/admin/by-user/:userId` (superAdmin-gated).

4. **Bulk I/O**
   - **Import: ABSENT.** No `import-business-dialog.tsx`; no backend business bulk-import route.
   - **Export: PRESENT** (client-side CSV) via `business-table-actions.tsx` →
     `exportTableToCSV(table, "businesses")`.

5. **Interactive elements that MUST survive**
   - Primary buttons: **Export** (Download icon).
   - Icon-only: row-actions `MoreHorizontal` trigger; column-view toggle.
   - Search input (filters on `name`).
   - Dialogs: `ViewBusinessDialog` (+ nested `AvailabilitySettingsCard`),
     `ConfirmDeleteDialog`.
   - Per-row: select checkbox (bulk-select scaffolding already present but unused),
     profile/packages count chips.

6. **Table or cards?** Real **tanstack table** (`global-table` + `use-data-table`).

7. **Recommended export columns**
   `id, name, vendorType, city, subArea, vendorName, total_packages, createdAt, updatedAt`.

8. **Recommended import schema** — see Migration risk; admin-create of businesses is
   high-risk (requires linked vendor user + vendor-type config). If pursued:
   `name`(req,string), `vendorEmail`(req,string — links to existing vendor user),
   `city`(opt,string), `subArea`(opt,string), `minimumPrice`(opt,number),
   `description`(opt,string). **Recommend deferring business import** — it is an admin
   surface and a business is meaningless without its owning vendor + packages.

9. **Behaviors to preserve verbatim**
   - Delete must surface backend's specific block message (active-bookings guard), not a
     generic toast.
   - `getAll` paginates at limit 100; export reflects only fetched rows.

10. **Migration risk**
    - Bulk-select checkboxes render but have no bulk-action bar yet — redesign should
      either wire or intentionally drop them (don't silently break selection state).
    - `Business` flat type in `lib/dashboard-types` is hand-mapped from `ApiBusiness`;
      column ids (`vendorType`, `location`, `vendorName`) are synthetic (not accessorKeys),
      so CSV header derivation uses `formatColumnId`. Renaming columns changes export headers.

---

## 2. businesses-overview

Multi-business rollup ("see your whole empire") — Phase 4 #10.5.

1. **Main view + sub-components**
   - `components/dashboard/mainScreens/businesses-overview/businesses-overview-view.tsx`
     (single file; no sub-table). Grand-total strip (4 `Total` tiles) + per-business
     `BusinessCard` grid (2-col), each with `Metric` tiles + "Improve reliability" link.

2. **lib/api module + functions**
   - **No dedicated api module.** Calls `axiosInstance.get('/api/v1/businesses/my-overview')`
     directly. Imports `TIER_LABELS`, `TIER_TONES` from `lib/api/reliability`.

3. **Backend router + controller**
   - Router: `businessRouter.js:121` `/my-overview` (auth-gated).
   - Controller: `src/controllers/multiBusinessController.js` → `getMyOverview`.

4. **Bulk I/O**
   - **Import: N/A** (read-only analytics rollup).
   - **Export: ABSENT** (and arguably N/A — it's a dashboard, not a list). Could add a
     "Download summary CSV" of the per-business rows if desired.

5. **Interactive elements that MUST survive**
   - "Improve reliability" link → `/dashboard/reliability` (per card).
   - Reliability tier Badge (uses `TIER_LABELS`/`TIER_TONES` tone mapping — preserve).
   - PKR formatting helper `fmtPKR` (`Rs. {n} en-PK`).
   - Empty state ("You don't own any businesses yet").

6. **Table or cards?** **Cards** (grand-total tiles + per-business cards). Not a tanstack table.

7. **Recommended export columns** (if a summary export is added)
   `businessId, name, vendorType, city, bookings, bookingRevenue, sheets, paidSheets,
   sheetRevenue, leads, openLeads, convertedLeads, conversionRate, reliabilityScore,
   reliabilityTier`.

8. **Recommended import schema** — **import N/A** (derived analytics).

9. **Behaviors to preserve verbatim**
   - Grand-total math: `grandRevenue = bookingRevenue + sheetRevenue`.
   - Tier tone/label mapping from `lib/api/reliability`.

10. **Migration risk**
    - Response shape is consumed inline (`OverviewResponse`/`BizRow` interfaces local to the
      file) — no shared type. A redesign that extracts a card component must carry these
      interfaces or the rollup silently mis-renders.

---

## 3. businessSettings  (the large, tab-driven domain)

Vendor self-service settings. Tab routing via `?tab=` query param; **not** a list.

- View: `components/dashboard/mainScreens/businessSettings/business-settings-view.tsx`
  (`Heading "Business Settings"` + `<Suspense><MainView/></Suspense>`).
- Router/dispatcher: `.../components/main-view.tsx` — reads `?tab=`, pulls `business` from
  `BusinessContext` + `user` from `UserContext`, derives `vendorConfig` via
  `getVendorTypeConfig(business?.vendor?.vendorType ?? user?.vendorType)` from
  `lib/vendor-type-config.ts`. **vendor-type drives which tabs render.**
- Tab-nav UI primitive (animated underline, keyboard nav, horizontal scroll):
  `.../components/tabs/tabs-section.tsx` (`TabsSection`).

### Enumerated tabs (rendered by `main-view.tsx` on `active === ...`)
| `?tab=` | File | Gating |
|---|---|---|
| `overview` | `tabs/overview-tab.tsx` | always |
| `basic` | `tabs/basic-info-tab.tsx` | always |
| `images` | `tabs/images-tab.tsx` | always |
| `fleet` | `tabs/packages-tab.tsx` (mode="fleet") | car rental |
| `packages` | `tabs/packages-tab.tsx` (mode="packages") | `vendorConfig.hasPackages` |
| `menus` | `tabs/menus-tab.tsx` | `vendorConfig.hasMenus` |
| `type-specific` | `tabs/type-specific-tab.tsx` | `vendorConfig` present |
| `bank-details` | `tabs/bank-details-tab.tsx` | always |
| `team` | `tabs/team-members-tab.tsx` | always |
| `availability` | `tabs/availability-tab.tsx` | always (+ `VenueComplianceCard` if `NEXT_PUBLIC_VENUE_COMPLIANCE=1` AND vendorType==='Wedding venue') |

### Dialogs (under `components/dialogs/`)
- `package-dialog.tsx` — generic Package / Vehicle / Product create-edit. **Heavy vendor-type
  branching** (car-rental fleet fields, stationery labels, category-checkbox features, generic
  textarea fallback). **Image upload (car rental only, max 10)**; IndexedDB blob-sync for
  pending images; `useFormDraft` resume. Calls `PackagesAPI.uploadImages/create/update`.
- `car-package-dialog.tsx` — car-rental **bundled** package (compose from existing fleet cars
  w/ qty + cities + total price + description). Features shape `{ cars[], citiesCovered[] }`.
  No image upload. `PackagesAPI.create/update`.
- `stationery-product-dialog.tsx` — stationery products. **Image upload via react-dropzone,
  max 8.** Badge multi-select for 15 product types + 8 events. Features shape
  `{ productType[], event[] }`. `PackagesAPI.uploadImages/create/update`.
- `menu-dialog.tsx` — (menus tab; not deep-read) menu create/edit, `MenusAPI`.

### subComponents (cards, mounted inside basic-info-tab unless noted)
- `pricing-rules-card.tsx` — weekend premium + early-bird discount. Flag-gated
  (`NEXT_PUBLIC_PRICING_RULES=1` client + `PRICING_RULES_ENGINE` server). Switches + bounded
  % inputs (premiumMaxPercent/discountMaxPercent/365-day threshold). `BusinessesAPI.get/setPricingRules`.
- `resources-card.tsx` — multi-resource capacity (halls/kitchen/crews/tents). Inline create/edit,
  kind select, qty/capacity-per-unit/units-per-booking, live capacity preview (mirrors server
  `computeMultiResourceCapacity`), master `useMultiResourceCapacity` flag. `lib/api/businessResources` (`BusinessResourcesAPI`).
- `bundled-services-card.tsx` — in-house services (catering/decor/DJ/valet/...). 9 Pakistani
  presets, category + price-model (flat/per_plate/percentage_of_total/free) + included/mandatory
  flags + outside-vendor policy/fee. `lib/api/bundledServices` (`BundledServicesAPI`).
- Other cards present (not all deep-read): `additional-info-card`, `basic-details-card`,
  `cancellation-policy-card` (BK-100.5 presets, `BusinessesAPI.get/setCancellationPolicy`),
  `profile-share-card`, `venue-compliance-card`.

### Per-tab facts

**basic-info-tab.tsx** — `react-hook-form` + zod. Fields: name(min 2, req), city, subArea,
description, additionalInfo, minimumPrice, maxCapacity, minCapacity, downPaymentType
(Percentage|Fixed Amount), downPayment, cancelationPolicy. `useFormDraft` key
`business-basic-info-{id}` + resume banner + auto-save indicator. `BusinessesAPI.update`.
Renders cancellation-policy, pricing-rules (flag), bundled-services, resources cards below form.

**bank-details-tab.tsx** — list of `BankDetail` cards + add/edit Dialog + delete AlertDialog.
zod: bankName(min2,max120,req), accountHolderName(min2,max120,req), accountNumber(min6,max40,req),
iban(max34,opt), branchCode(max20,opt), isActive(opt). Active/Verified badges; **set-active**,
masked account display, **verification is admin-only & read-only here**. First account auto-active.
Edit leaves account# blank = keep current; changing it resets verification. **No localStorage
draft** — uses `useBeforeUnloadGuard` + `closeWithConfirm`. `lib/api/bankDetails` (`BankDetailsAPI`:
`listMine/create/update/setActive/remove`).

**team-members-tab.tsx** — card roster (Active + Retired sections). zod: name(min2,max120,req),
role(min2,max80,req), bio(max2000,opt), profileImageUrl(url|'',opt), yearsExperience(opt str→≤80),
specialtiesText(max500,opt → comma-split, ≤20), isLeadArtist(opt). MAX 50 members. Up/down
reorder (`reorder` bulk endpoint), lead-artist star, **retire (soft-delete)** vs permanent delete
(separate confirm). `useFormDraft` per-record key. `lib/api/teamMembers` (`TeamMembersAPI`:
`list/create/update/remove/reorder`).

**availability-tab.tsx** — 3 independent sections + 3 inline dialogs:
  - **Slot templates** (label/start/end/capacity/buffer/unitGuestCapacity/weekdayMask) +
    "Seed defaults" + deactivate confirm. Validations: end>start, mask≠0, cap≥1.
  - **Recurring closed days** (weekdayMask + start/end + slot scope + reason).
  - **Per-date capacity overrides** (date + scope + capacity, 0=closed).
  Weekday bitfield Mon=1..Sun=64, all=127 (`WEEKDAY_BITS`). `lib/api/businessAvailability`
  (`SlotTemplatesAPI`, `BusinessAvailabilityAPI`, `CapacityOverridesAPI`).

**packages-tab.tsx** — **card grid** (NOT a table). Vendor-type-aware: filters fleet vs generic
by `isCarFleetFeatures`; renders car-fleet / car-combo / generic-feature card bodies; chooses
`StationeryProductDialog` / `CarPackageDialog` / `PackageDialog` by vendor type + mode.
`PackagesAPI.getAll/delete`. Rich `CATEGORY_LABELS` map (50+ feature categories).

1. **Backend routers + controllers**
   - Business settings hang off `businessRouter.js` + `businessController.js`, plus
     standalone controllers mounted on it: `businessBundledServiceController.js`,
     `businessResourceController.js`.
   - Bank: `bankDetailRouter.js` + `bankDetailsController.js` (verify route superAdmin-gated).
   - Team: `teamMemberRouter.js` (mergeParams, mounted `/businesses/:businessId/team-members`)
     + `teamMemberController.js`.
   - Packages/menus: `packageRouter.js`/`packageController.js`, `menuRouter.js`/`menuController.js`.
   - Availability: `vendorSlotRouter.js`/`vendorSlotController.js` + availability bits on
     `businessRouter`/`bookingRouter`.

2. **Bulk I/O**
   - **Import: N/A for the settings domain as a whole** (config, not records). Sub-collections
     that COULD support import are **team-members** and **packages** (and stationery products) —
     but these are per-business roster/catalog data, not the primary intent of this redesign's
     "list domains". Mark **import N/A** for settings config (basic-info, bank-details,
     availability, pricing-rules, resources, bundled-services).
   - **Export: ABSENT everywhere in settings.** No CSV anywhere in this domain.

3. **Interactive elements that MUST survive** (high density — enumerate by surface)
   - Tab nav (`TabsSection`): animated underline, keyboard arrows/Home/End, horizontal scroll.
   - basic-info: Save Changes; DraftResumeBanner (Resume/Discard); AutoSaveIndicator;
     downPaymentType select; nested cards' own Save/Reset buttons.
   - bank-details: Add bank account / Add your first; per-row **Set as active**, Edit (Pencil
     icon-only), Delete (Trash2 icon-only); add/edit Dialog (Cancel/Add|Save); delete AlertDialog.
   - team-members: Add member; per-row up/down (ChevronUp/Down icon-only), Edit (Pencil),
     Retire (UserMinus), Reactivate (UserCheck), Delete (Trash2); add/edit Dialog;
     permanent-delete AlertDialog; DraftResumeBanner.
   - availability: Seed defaults; Add slot/rule/override; per-row Edit/Delete/Clear/Deactivate
     (icon-only); weekday toggle button group; 3 dialogs + deactivate AlertDialog.
   - packages: Add {Package|Vehicle|Product}; per-card Edit/Delete; 3 dialog variants;
     ConfirmDeleteDialog; image upload UIs (drag-drop for stationery).
   - pricing-rules/resources/bundled-services cards: Save/Reset, Add/Edit/Delete, presets,
     master toggles.

4. **Table or cards?** Mixed: **all card lists** (bank accounts, team, availability sections,
   packages grid). No tanstack table in settings.

5. **Recommended export columns** (only if per-collection export is later wanted)
   - Team: `name, role, isLeadArtist, yearsExperience, specialties, bio, isActive`.
   - Packages: `name, price, vendorType, featuresSummary, imageCount`.
   - Bank: **DO NOT EXPORT** (financial PII; masked in UI by design).

6. **Recommended import schema** (only realistic candidates; everything else import N/A)
   - **Team members** (if pursued): `name`(req,string), `role`(req,string),
     `yearsExperience`(opt,int 0-80), `specialties`(opt,comma-string→≤20),
     `bio`(opt,string), `isLeadArtist`(opt,bool). Cap 50/business.
   - **Packages** (generic only): `name`(req,string), `price`(req,number≥1),
     `description`(opt,string), `features`(opt,newline/comma list). Car-fleet & stationery
     have structured feature objects — **not** flat-importable safely.
   - basic-info / bank-details / availability / pricing / resources / bundled-services: **import N/A.**

7. **Behaviors to preserve verbatim (CRITICAL)**
   - **vendor-type config coupling**: `getVendorTypeConfig` decides tab visibility + dialog
     selection + per-type fields. Must not be flattened by the redesign.
   - **Bank verification flow**: admin-only verify; account# change resets verification;
     masked display; NO localStorage draft (PII) — keep `useBeforeUnloadGuard`.
   - **Team retire vs delete** semantics (soft-delete preserves booking attribution).
   - **Availability**: weekday bitmask encoding, end>start, capacity 0=closed, seed-defaults.
   - **Image upload**: car-rental (10) + stationery (8, dropzone) with IndexedDB blob-sync drafts.
   - **Draft-resilience** wiring (keys, resume banners, auto-save indicators) across forms.
   - **Cancellation/pricing-rules flag-gating** — never change prices until both flags on.

8. **Migration risk**
    - Highest-complexity domain; many independent stateful card lists each with their own
      dialogs, validations, and draft hooks. Theme/redesign must be applied per-card without
      altering form submission shapes.
    - `TabsSection` default tab list is hard-coded inside the component but the ACTUAL tab set
      is decided in `main-view.tsx`; keep them in sync.
    - Pending-image IndexedDB blob-sync is easy to break — preserve `useFileArrayBlobSync`.

---

## 4. vendors

Super-admin list of vendor (user) accounts.

1. **Main list/view + sub-tables**
   - View: `components/dashboard/mainScreens/vendors/vendorsListing/vendor-listing-view.tsx`
     (`Heading "Vendors"` + `<VendorsTable/>`).
   - Table: `.../vendorsListing/components/vendors-table.tsx` (tanstack via `useDataTable`;
     `VendorsAPI.getAll()`, delete via `UsersAPI.delete`).
   - Columns: `.../components/columns.tsx` — select, Full Name (avatar+email), Phone Number,
     Vendor Type (Badge), **Profile Approved** (inline Switch → `vendor-profile-update`),
     **Active** (inline Switch → `change-status`), Date, actions.
   - Toolbar: `.../components/vendor-table-actions.tsx` — search (filters `fullName`) +
     **Export** + `DataTableColumnView`.
   - Row actions: `.../components/row-actions.tsx` — View details (Eye), Edit (PencilLine),
     Delete (Trash2).
   - Filters helper: `.../components/vendors-table-filters.tsx`.
   - Dialogs: `edit-vendor-dialog.tsx` (fullName/email/phone; direct `axiosInstance.patch
     /api/v1/users?id=`), `vendor-review-dialog.tsx` (read-only profile review +
     Approve/Reject via `VendorsAPI.changeProfileStatus`; loads via
     `BusinessesAPI.getAdminBusinessByUserId`), `ConfirmDeleteDialog`.

2. **lib/api module + functions**
   - `lib/api/dashboard.ts` → `VendorsAPI.getAll/getById/changeProfileStatus` and
     `UsersAPI.delete/changeStatus/...`. Inline column switches call axios directly
     (`/api/v1/users/vendor-profile-update`, `/api/v1/users/change-status`).
   - (`lib/api/vendors.ts` `VendorAPI` is the unrelated public business-listing API.)

3. **Backend router + controller**
   - Router: `src/routes/vendorRouter.js` (`/api/v1/vendors`): `GET /` (`getVendors`),
     `GET /type/:type`, `GET /:id` (`getUserById`), `PATCH /` (superAdmin, `updateUser`).
   - Controller: `src/controllers/vendorController.js`. User mutations
     (status/profile/delete/edit) go through `userController` / `userRouter` (`/api/v1/users`).

4. **Bulk I/O**
   - **Import: ABSENT.** No `import-vendor-dialog.tsx`; no vendor bulk-create route.
     (Note: there IS a real vendor self-registration flow via `businessRouter` signup, but
     no admin bulk import.)
   - **Export: PRESENT** (client-side CSV) via `vendor-table-actions.tsx` →
     `exportTableToCSV(table, "vendors")`.

5. **Interactive elements that MUST survive**
   - Primary: **Export**.
   - **Inline row Switches**: Profile Approved + Active (optimistic, revert-on-error toasts).
     These are load-bearing admin controls — must remain inline + accessible.
   - Icon-only: row-actions `MoreHorizontal`; column-view toggle.
   - Search (filters `fullName`).
   - Dialogs: EditVendor (Save/Cancel), VendorReview (Approve & publish / Reject-unpublish /
     Close — rich read-only profile with packages/menus/photos/social/completeness),
     ConfirmDeleteDialog.
   - Avatar fallback (first initial), per-row select checkbox.

6. **Table or cards?** Real **tanstack table**.

7. **Recommended export columns**
   `id, fullName, email, phoneNumber, vendorType, status(active), reviewProfile(approved),
   createdAt`.

8. **Recommended import schema** (admin bulk-onboarding — feasible but sensitive)
   `fullName`(req,string), `email`(req,string,unique), `phoneNumber`(opt,string),
   `vendorType`(req,enum — must match `User.vendorType` whitelist / `lib/vendor-type-config`),
   `city`(opt,string), `password`(opt — else invite/temp), `reviewProfile`(opt,bool default false),
   `active`(opt,bool default true). **vendorType MUST be validated against the canonical
   23-type enum.**

9. **Behaviors to preserve verbatim**
   - Optimistic Switch toggles with rollback + specific success/error toasts.
   - `getAll` reads `res.data.data.data` (double-nested) — fragile shape; keep mapping.
   - Vendor delete actually deletes the USER (`UsersAPI.delete`), not a business.
   - Profile review Approve/Reject toggles `reviewProfile` and refetches.

10. **Migration risk**
    - Two different "vendor" APIs (`VendorsAPI` in dashboard.ts vs `VendorAPI` in vendors.ts) —
      easy to import the wrong one during a refactor.
    - Inline column-cell components define local `useState` switches; moving to a new table
      lib must preserve per-cell stateful rendering.
    - `vendorType` is coupled to a backend whitelist + `lib/vendor-type-config.ts` mirror;
      import/edit must respect exact enum strings.

---

## 5. profile

Logged-in user's own account/profile page (not a list).

1. **Main view + components**
   - `app/(dashboard)/dashboard/profile/page.tsx` — single self-contained client page.
     Uses `PageContainer/PageHeader/SectionCard` from `@/components/user-dashboard` and local
     `ProfileAvatar` + `Field` helpers. No sub-components under mainScreens for this page.

2. **lib/api module + functions**
   - `UsersAPI.getMyProfile()` (`lib/api/dashboard.ts`) for load.
   - Saves via **direct axios**: `PATCH {BACKEND_URL}api/v1/users/profile` (profile fields),
     `PATCH {BACKEND_URL}api/v1/users/change-password`. Refreshes `UserContext.refreshUser()`.

3. **Backend router + controller**
   - `src/routes/userRouter.js` + `src/controllers/userController.js` (`/api/v1/users`):
     `profile/me` (get), `profile` (patch), `change-password` (patch).

4. **Bulk I/O**
   - **Import: N/A** (single self record).
   - **Export: ABSENT / N/A.**

5. **Interactive elements that MUST survive**
   - Identity card (avatar initials, vendorType + role badges).
   - Personal info form: fullName, phoneNumber, city, subArea → **Save changes**.
   - Business contact sub-section: bookingEmail, primaryContactNumber, secondaryContactNumber,
     website, officeAddress (these are extra string fields read off the user object).
   - Change-password form: currentPassword, newPassword, confirmPassword → **Update password**
     (client validation: match + min 6).
   - Loading skeleton state.

6. **Table or cards?** **Cards/forms** (no table).

7. **Recommended export columns** — **N/A**.

8. **Recommended import schema** — **import N/A**.

9. **Behaviors to preserve verbatim**
   - Password client-side validation (mismatch + min-6) before submit; surface backend error
     message on change-password failure.
   - Profile save posts the FULL `profile` object (incl. business-contact fields that aren't
     in the typed `ApiUser` — read via `x as Record<string,string>`).
   - `refreshUser()` after profile save (keeps header/context in sync).

10. **Migration risk**
    - Profile mutation hits `users/profile` directly (bypasses `UsersAPI.updateProfile`, which
      targets a different `PATCH /users` shape) — don't "consolidate" to the API class blindly.
    - Business-contact fields are loosely typed (cast through `Record<string,string>`); a typed
      redesign must extend `ApiUser` or keep the cast or fields silently drop.

---

## Cross-domain summary

| Domain | List view | API module | Import | Export | Table/Cards | Importable? |
|---|---|---|---|---|---|---|
| businesses | `mainScreens/businesses/businessListing/business-listing-view.tsx` | `lib/api/dashboard.ts` (`BusinessesAPI`) | absent | present (CSV) | table | no (admin; needs vendor+packages) |
| businesses-overview | `mainScreens/businesses-overview/businesses-overview-view.tsx` | inline axios + `lib/api/reliability` | absent (N/A) | absent | cards | no (analytics) |
| businessSettings | `mainScreens/businessSettings/business-settings-view.tsx` (tabbed) | `lib/api/dashboard` + `bankDetails`/`teamMembers`/`businessAvailability`/`businessResources`/`bundledServices` | absent (config N/A) | absent | cards | partial (team/packages only) |
| vendors | `mainScreens/vendors/vendorsListing/vendor-listing-view.tsx` | `lib/api/dashboard.ts` (`VendorsAPI`/`UsersAPI`) | absent | present (CSV) | table | yes (admin onboarding; validate vendorType enum) |
| profile | `app/(dashboard)/dashboard/profile/page.tsx` | `lib/api/dashboard` (`UsersAPI`) + direct axios | absent (N/A) | absent (N/A) | cards/forms | no (self record) |

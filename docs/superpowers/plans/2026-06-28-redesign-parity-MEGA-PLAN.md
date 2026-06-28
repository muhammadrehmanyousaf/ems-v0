# Redesign Parity Mega-Plan — close the 11 dropped-subsystem gaps

**Why:** An adversarial audit found the redesigned screens were built as simplified
single-purpose views that dropped entire subsystems present in the originals. The
redesign is now default-ON, so these are deploy-blocking regressions. Nothing is
deployed yet (commits local), so there is time to fix before go-live.

**Principle:** PORT each dropped subsystem into the redesigned screen, reusing the
SAME backend API the original calls + the redesign design system (PageHeader,
DataTable, StatCard, StatusPill, MoneyCell, Dialog, AlertDialog, Button, Icon,
showSuccessToast/sonner). Do NOT touch originals. Verify each: tsc clean + browser.

## Wave 1 — SEVERE (money / payroll / core booking) — block deploy
1. **staff** — add a Roster | Shifts & payroll tab system; port the payroll ledger
   (log shift, outstanding-pay banner, per-shift base/OT/bonus/deduction → gross/net,
   mark-paid dialog, dispute, void, partial pay, attendance check-in/out/absent/
   excused/replaced, leave queue) via StaffAPI shift/attendance/leave methods.
2. **suppliers** — add a Directory | A/P invoices tab; port the ledger (log invoice,
   record payment, dispute, void, delete invoice, A/P aging buckets) via
   SupplierAPI.createInvoice/listInvoices/payment/transition/aging.
3. **bookings** — restore row actions: Record payment, Record refund, Mark completed,
   Cancel booking, Quick-view, and a Link to /dashboard/bookings/[id].
4. **brokers** — restore commission row actions: Record payment / Dispute / Void via
   BrokerAPI.markCommissionPaid + transitionCommission.

## Wave 2 — lifecycle transitions
5. **halal-certs** — Revoke (reason) + Mark-pending-renewal → Renewal-received via
   HalalCertAPI.transition.
6. **drone-noc** — per-permit Resubmit / Cancel (and Approve/Reject) via the NOC
   status endpoints + a reason dialog.
7. **vendor-queue** — status tabs (all 5 statuses), Request-changes, Suspend, Restore,
   per-action notes (the list already supports status filtering).
8. **collaborations** — Outgoing "invites you sent" list + Cancel-invite; fix the
   "With" column to show the correct party; stat cards count both directions.

## Wave 3 — feature ports
9. **automation** — restore the 5 built-in reminder toggles (T-14/T-3/T-1/T+1 +
   lead-stale, per-vendor opt-out) as the default surface; keep the custom-rule builder.
10. **fs-detail** — PDF generate/preview/download/WhatsApp per variant + share-link
    generate/manage (reuse the original's handlers/endpoints).
11. **business-settings** — Type-specific settings tab (vendor-type-config
    typeSpecificFields) + fleet packages mode for transport vendors.

## Minors (do after gaps, or note as backlog)
generator-fuel richness, supplier category-filter pills/active-toggle, etc. — capture
but don't block.

## Done = every gap ported + verified (tsc clean + browser), committed; then deploy-ready.

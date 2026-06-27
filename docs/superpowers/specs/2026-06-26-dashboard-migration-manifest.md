# Dashboard Redesign — Migration Manifest

> Source of truth for zero-miss completeness. Generated from the filesystem on 2026-06-26.
> Each file is checked off ONLY when every button, icon-button, dialog, table, empty/loading/error state on it is migrated to the new design system AND the screen's behavior is smoke-checked (R6).
> Legend per row: `btn`=<Button> count · `dlg`=dialog/sheet count · `luc`=imports lucide (needs Iconly swap) · `tbl`=has table (needs DataTable + bulk I/O).

Status key: [ ] not started · [~] in progress · [x] migrated+verified

## layout

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `layout/ThemeToggle/theme-provider.tsx` | 0 | 0 | · | · |
| [ ] | `layout/ThemeToggle/theme-toggle.tsx` | 1 | 0 | Y | · |
| [ ] | `layout/app-sidebar.tsx` | 0 | 0 | · | · |
| [ ] | `layout/header.tsx` | 0 | 0 | · | · |
| [ ] | `layout/nav-main.tsx` | 0 | 0 | Y | · |
| [ ] | `layout/nav-projects.tsx` | 1 | 0 | Y | · |
| [ ] | `layout/nav-user.tsx` | 0 | 0 | Y | · |
| [ ] | `layout/notifications-popover.tsx` | 4 | 0 | Y | · |
| [ ] | `layout/page-container.tsx` | 0 | 0 | · | · |
| [ ] | `layout/page-header.tsx` | 1 | 0 | · | · |
| [ ] | `layout/team-switcher.tsx` | 0 | 0 | Y | · |
| [ ] | `layout/user-nav.tsx` | 1 | 0 | · | · |

## globalComponents

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `globalComponents/confirm-delete-dialog.tsx` | 0 | 8 | Y | · |
| [ ] | `globalComponents/dashboard-date-filter.tsx` | 2 | 3 | Y | · |
| [ ] | `globalComponents/globalTable/components/data-table-column-view.tsx` | 1 | 0 | Y | Y |
| [ ] | `globalComponents/globalTable/components/data-table-pagination.tsx` | 4 | 0 | Y | Y |
| [ ] | `globalComponents/globalTable/components/data-table-search.tsx` | 0 | 0 | · | Y |
| [ ] | `globalComponents/globalTable/components/data-table.tsx` | 0 | 0 | · | Y |
| [ ] | `globalComponents/globalTable/components/use-data-table.tsx` | 0 | 0 | · | Y |
| [ ] | `globalComponents/globalTable/global-table.tsx` | 0 | 0 | · | Y |

## shared

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `shared/upgrade-nudge.tsx` | 0 | 0 | Y | · |
| [ ] | `shared/whatsapp-quick-send.tsx` | 3 | 6 | Y | · |

## admin

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/admin/platform-pulse-view.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/admin/promotions/admin-promotions-view.tsx` | 3 | 0 | Y | · |
| [ ] | `mainScreens/admin/subscriptions/admin-subscriptions-view.tsx` | 3 | 0 | Y | · |

## automation

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/automation/automation-builder-card.tsx` | 2 | 0 | Y | · |
| [ ] | `mainScreens/automation/automation-status-view.tsx` | 0 | 0 | Y | · |

## billing

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/billing/billing-view.tsx` | 3 | 0 | Y | · |

## bookings

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/bookings/bookingListing/booking-detail-view.tsx` | 2 | 0 | Y | · |
| [ ] | `mainScreens/bookings/bookingListing/booking-listing-view.tsx` | 5 | 0 | Y | · |
| [ ] | `mainScreens/bookings/bookingListing/components/booking-detail-sheet.tsx` | 0 | 4 | Y | · |
| [ ] | `mainScreens/bookings/bookingListing/components/booking-table-actions.tsx` | 2 | 0 | Y | Y |
| [ ] | `mainScreens/bookings/bookingListing/components/booking-table-filters.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/bookings/bookingListing/components/booking-table.tsx` | 1 | 0 | Y | Y |
| [ ] | `mainScreens/bookings/bookingListing/components/columns.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/bookings/bookingListing/components/edit-booking-dialog.tsx` | 7 | 9 | Y | · |
| [ ] | `mainScreens/bookings/bookingListing/components/offline-booking-dialog.tsx` | 9 | 9 | Y | · |
| [ ] | `mainScreens/bookings/bookingListing/components/record-payment-dialog.tsx` | 2 | 6 | Y | · |
| [ ] | `mainScreens/bookings/bookingListing/components/record-refund-dialog.tsx` | 2 | 6 | Y | · |
| [ ] | `mainScreens/bookings/bookingListing/components/row-actions.tsx` | 1 | 8 | Y | Y |
| [ ] | `mainScreens/bookings/event-weather-chip.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/bookings/export-bookings-button.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/bookings/import-bookings-dialog.tsx` | 4 | 6 | Y | · |
| [ ] | `mainScreens/bookings/pipeline/pipeline-view.tsx` | 0 | 0 | Y | · |

## brokers

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/brokers/brokers-view.tsx` | 23 | 46 | Y | · |

## businessSettings

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/businessSettings/business-settings-view.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/businessSettings/components/dialogs/car-package-dialog.tsx` | 4 | 5 | Y | · |
| [ ] | `mainScreens/businessSettings/components/dialogs/menu-dialog.tsx` | 2 | 5 | Y | · |
| [ ] | `mainScreens/businessSettings/components/dialogs/package-dialog.tsx` | 9 | 5 | Y | · |
| [ ] | `mainScreens/businessSettings/components/dialogs/stationery-product-dialog.tsx` | 5 | 5 | Y | · |
| [ ] | `mainScreens/businessSettings/components/main-view.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/businessSettings/components/subComponents/additional-info-card.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/businessSettings/components/subComponents/basic-details-card.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/businessSettings/components/subComponents/bundled-services-card.tsx` | 13 | 0 | Y | · |
| [ ] | `mainScreens/businessSettings/components/subComponents/cancellation-policy-card.tsx` | 2 | 0 | Y | · |
| [ ] | `mainScreens/businessSettings/components/subComponents/pricing-rules-card.tsx` | 2 | 0 | Y | · |
| [ ] | `mainScreens/businessSettings/components/subComponents/profile-share-card.tsx` | 3 | 0 | Y | · |
| [ ] | `mainScreens/businessSettings/components/subComponents/resources-card.tsx` | 6 | 0 | Y | · |
| [ ] | `mainScreens/businessSettings/components/subComponents/venue-compliance-card.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/businessSettings/components/tabs/availability-tab.tsx` | 16 | 26 | Y | · |
| [ ] | `mainScreens/businessSettings/components/tabs/bank-details-tab.tsx` | 7 | 14 | Y | · |
| [ ] | `mainScreens/businessSettings/components/tabs/basic-info-tab.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/businessSettings/components/tabs/images-tab.tsx` | 3 | 0 | Y | · |
| [ ] | `mainScreens/businessSettings/components/tabs/menus-tab.tsx` | 4 | 0 | Y | · |
| [ ] | `mainScreens/businessSettings/components/tabs/overview-tab.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/businessSettings/components/tabs/packages-tab.tsx` | 4 | 0 | Y | · |
| [ ] | `mainScreens/businessSettings/components/tabs/tabs-section.tsx` | 1 | 0 | · | · |
| [ ] | `mainScreens/businessSettings/components/tabs/team-members-tab.tsx` | 10 | 14 | Y | · |
| [ ] | `mainScreens/businessSettings/components/tabs/type-specific-tab.tsx` | 2 | 0 | Y | · |

## businesses

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/businesses/businessListing/business-listing-view.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/businesses/businessListing/components/business-table-actions.tsx` | 1 | 0 | Y | Y |
| [ ] | `mainScreens/businesses/businessListing/components/business-table-filters.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/businesses/businessListing/components/business-table.tsx` | 0 | 0 | · | Y |
| [ ] | `mainScreens/businesses/businessListing/components/columns.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/businesses/businessListing/components/row-actions.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/businesses/businessListing/components/view-business-dialog.tsx` | 0 | 4 | Y | · |

## businesses-overview

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/businesses-overview/businesses-overview-view.tsx` | 0 | 0 | Y | · |

## calendar

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/calendar/calendar-view.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/calendar/components/add-booking-dialog.tsx` | 4 | 9 | Y | · |
| [ ] | `mainScreens/calendar/components/agenda-view.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/calendar/components/availability-drawer.tsx` | 1 | 6 | Y | · |
| [ ] | `mainScreens/calendar/components/block-date-dialog.tsx` | 5 | 6 | Y | · |
| [ ] | `mainScreens/calendar/components/day-view.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/calendar/components/islamic-events-strip.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/calendar/components/main-calendar.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/calendar/components/month-view.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/calendar/components/toolbar.tsx` | 4 | 0 | Y | · |
| [ ] | `mainScreens/calendar/components/week-calendar.tsx` | 0 | 0 | Y | · |

## collaborations

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/collaborations/collaborations-view.tsx` | 4 | 0 | Y | · |

## customers

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/customers/community-trust-panel.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/customers/customer-detail-view.tsx` | 2 | 0 | Y | · |
| [ ] | `mainScreens/customers/customer-timeline.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/customers/customer-trust-card.tsx` | 2 | 0 | Y | · |
| [ ] | `mainScreens/customers/customersListing/components/columns.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/customers/customersListing/components/costomers-table-filters.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/customers/customersListing/components/creations-buttons.tsx` | 5 | 6 | Y | · |
| [ ] | `mainScreens/customers/customersListing/components/customers-table-actions.tsx` | 1 | 0 | Y | Y |
| [ ] | `mainScreens/customers/customersListing/components/customers-table.tsx` | 0 | 0 | · | Y |
| [ ] | `mainScreens/customers/customersListing/components/import-customers-dialog.tsx` | 4 | 6 | Y | · |
| [ ] | `mainScreens/customers/customersListing/components/row-actions.tsx` | 1 | 0 | Y | Y |
| [ ] | `mainScreens/customers/customersListing/components/view-customer-dialog.tsx` | 0 | 4 | Y | · |
| [ ] | `mainScreens/customers/customersListing/customers-view.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/customers/rate-customer-dialog.tsx` | 4 | 6 | Y | · |

## dashboard

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/dashboard/admin-dashboard-view.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/dashboard/components/booking-area-chart.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/dashboard/components/customer-reviews.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/dashboard/components/data-card.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/dashboard/components/recent-booking-table.tsx` | 1 | 0 | · | · |
| [ ] | `mainScreens/dashboard/components/revenue-bar-chart.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/dashboard/components/status-pie-chart.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/dashboard/components/top-vendors-table.tsx` | 0 | 0 | Y | Y |
| [ ] | `mainScreens/dashboard/dashboard-view.tsx` | 1 | 5 | Y | · |
| [ ] | `mainScreens/dashboard/sections/cards-section.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/dashboard/sections/charts-sections.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/dashboard/sections/completeness-widget.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/dashboard/sections/lead-conversion-tile.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/dashboard/sections/needs-attention-strip.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/dashboard/sections/operations-summary-section.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/dashboard/sections/revenue-split-section.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/dashboard/sections/table-and-review-section.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/dashboard/sections/upcoming-and-due-section.tsx` | 0 | 0 | Y | · |

## drone-noc

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/drone-noc/drone-noc-view.tsx` | 12 | 28 | Y | · |

## expenses

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/expenses/expenses-view.tsx` | 6 | 14 | Y | · |

## function-sheets

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/function-sheets/activity-dialog.tsx` | 0 | 5 | Y | · |
| [ ] | `mainScreens/function-sheets/beo-run-sheet-card.tsx` | 3 | 0 | Y | · |
| [ ] | `mainScreens/function-sheets/bridal-fitting-card.tsx` | 4 | 0 | Y | · |
| [ ] | `mainScreens/function-sheets/car-rental-card.tsx` | 3 | 0 | Y | · |
| [ ] | `mainScreens/function-sheets/decorator-setup-card.tsx` | 3 | 0 | Y | · |
| [ ] | `mainScreens/function-sheets/deliverables-card.tsx` | 5 | 0 | Y | · |
| [ ] | `mainScreens/function-sheets/fbr-submit-dialog.tsx` | 2 | 6 | Y | · |
| [ ] | `mainScreens/function-sheets/function-sheet-composer.tsx` | 8 | 6 | Y | · |
| [ ] | `mainScreens/function-sheets/function-sheet-detail-view.tsx` | 11 | 16 | Y | Y |
| [ ] | `mainScreens/function-sheets/function-sheets-view.tsx` | 14 | 17 | Y | · |
| [ ] | `mainScreens/function-sheets/henna-schedule-card.tsx` | 3 | 0 | Y | · |
| [ ] | `mainScreens/function-sheets/kitchen-sheet-card.tsx` | 5 | 0 | Y | · |
| [ ] | `mainScreens/function-sheets/makeup-card.tsx` | 5 | 0 | Y | · |
| [ ] | `mainScreens/function-sheets/photography-card.tsx` | 12 | 0 | Y | · |
| [ ] | `mainScreens/function-sheets/send-whatsapp-dialog.tsx` | 2 | 6 | Y | · |
| [ ] | `mainScreens/function-sheets/share-link-dialog.tsx` | 6 | 6 | Y | · |
| [ ] | `mainScreens/function-sheets/sign-dialog.tsx` | 2 | 6 | Y | · |
| [ ] | `mainScreens/function-sheets/signature-pad.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/function-sheets/stationery-card.tsx` | 9 | 0 | Y | · |
| [ ] | `mainScreens/function-sheets/subcontract-card.tsx` | 3 | 0 | Y | · |

## generator-fuel

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/generator-fuel/generator-fuel-view.tsx` | 6 | 14 | Y | · |

## halal-certs

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/halal-certs/halal-certs-view.tsx` | 13 | 26 | Y | · |

## insights

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/insights/cash-flow-forecast.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/insights/insights-view.tsx` | 0 | 0 | Y | Y |
| [ ] | `mainScreens/insights/monthly-pnl.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/insights/response-times.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/insights/revenue-breakdowns.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/insights/seasonal-demand-heatmap.tsx` | 2 | 0 | Y | · |
| [ ] | `mainScreens/insights/whatsapp-template-performance.tsx` | 0 | 0 | Y | · |

## inventory

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/inventory/inventory-view.tsx` | 11 | 20 | Y | · |

## leads

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/leads/leads-inbox-view.tsx` | 17 | 20 | Y | · |
| [ ] | `mainScreens/leads/leads-pipeline-view.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/leads/leads-view.tsx` | 2 | 0 | Y | · |

## onboarding

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/onboarding/getting-started-migration.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/onboarding/onboarding-checklist-view.tsx` | 0 | 0 | Y | · |

## payments

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/payments/components/columns.tsx` | 0 | 0 | Y | · |
| [ ] | `mainScreens/payments/components/payment-table-actions.tsx` | 1 | 0 | Y | Y |
| [ ] | `mainScreens/payments/components/payment-table-filters.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/payments/components/payments-table.tsx` | 1 | 0 | · | Y |
| [ ] | `mainScreens/payments/components/row-actions.tsx` | 1 | 0 | Y | Y |
| [ ] | `mainScreens/payments/components/view-payment-dialog.tsx` | 0 | 4 | Y | · |
| [ ] | `mainScreens/payments/payments-view.tsx` | 1 | 0 | Y | · |

## pdcs

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/pdcs/pdc-ledger-view.tsx` | 12 | 20 | Y | · |

## promote

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/promote/promote-view.tsx` | 2 | 0 | Y | · |

## receipts

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/receipts/receipts-ledger-view.tsx` | 6 | 14 | Y | · |

## receivables

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/receivables/receivables-view.tsx` | 8 | 0 | Y | · |

## reliability

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/reliability/reliability-view.tsx` | 0 | 0 | Y | · |

## revenue

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/revenue/revenue-view.tsx` | 0 | 0 | Y | Y |

## reviews

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/reviews/ai-review-summary-card.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/reviews/automation-stats-card.tsx` | 3 | 0 | Y | · |
| [ ] | `mainScreens/reviews/reputation-panel.tsx` | 3 | 0 | Y | · |
| [ ] | `mainScreens/reviews/reviewsListing/components/columns.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/reviews/reviewsListing/components/reply-dialog.tsx` | 2 | 6 | Y | · |
| [ ] | `mainScreens/reviews/reviewsListing/components/reviews-table-actions.tsx` | 1 | 0 | Y | Y |
| [ ] | `mainScreens/reviews/reviewsListing/components/reviews-table-filters.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/reviews/reviewsListing/components/reviews-table.tsx` | 0 | 0 | · | Y |
| [ ] | `mainScreens/reviews/reviewsListing/components/row-actions.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/reviews/reviewsListing/components/star-component.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/reviews/reviewsListing/components/view-dialog.tsx` | 0 | 5 | · | · |
| [ ] | `mainScreens/reviews/reviewsListing/reviews-listing-view.tsx` | 0 | 0 | · | · |

## roles

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/roles/rolesListing/components/columns.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/roles/rolesListing/components/create-role-dialog.tsx` | 2 | 5 | Y | · |
| [ ] | `mainScreens/roles/rolesListing/components/edit-role-dialog.tsx` | 2 | 5 | Y | · |
| [ ] | `mainScreens/roles/rolesListing/components/roles-table-actions.tsx` | 1 | 0 | Y | Y |
| [ ] | `mainScreens/roles/rolesListing/components/roles-table-filters.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/roles/rolesListing/components/roles-table.tsx` | 0 | 0 | · | Y |
| [ ] | `mainScreens/roles/rolesListing/components/row-actions.tsx` | 1 | 0 | Y | Y |
| [ ] | `mainScreens/roles/rolesListing/roles-listing-view.tsx` | 1 | 0 | Y | · |

## staff

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/staff/staff-view.tsx` | 26 | 52 | Y | · |

## suppliers

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/suppliers/suppliers-view.tsx` | 23 | 46 | Y | · |

## tax

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/tax/annual-tax-report-view.tsx` | 1 | 0 | Y | Y |

## today

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/today/today-view.tsx` | 10 | 20 | Y | · |

## users

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/users/usersListing/components/columns.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/users/usersListing/components/create-user-dialog.tsx` | 3 | 5 | Y | · |
| [ ] | `mainScreens/users/usersListing/components/edit-user-dialog.tsx` | 3 | 5 | Y | · |
| [ ] | `mainScreens/users/usersListing/components/row-actions.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/users/usersListing/components/user-table-actions.tsx` | 1 | 0 | Y | Y |
| [ ] | `mainScreens/users/usersListing/components/user-table-filters.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/users/usersListing/components/user-table.tsx` | 0 | 0 | · | Y |
| [ ] | `mainScreens/users/usersListing/user-listing-view.tsx` | 1 | 0 | Y | · |

## vendors

| ✓ | File | btn | dlg | luc | tbl |
|---|------|-----|-----|-----|-----|
| [ ] | `mainScreens/vendors/vendorsListing/components/columns.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/vendors/vendorsListing/components/edit-vendor-dialog.tsx` | 2 | 5 | Y | · |
| [ ] | `mainScreens/vendors/vendorsListing/components/row-actions.tsx` | 1 | 0 | Y | · |
| [ ] | `mainScreens/vendors/vendorsListing/components/vendor-review-dialog.tsx` | 3 | 5 | Y | · |
| [ ] | `mainScreens/vendors/vendorsListing/components/vendor-table-actions.tsx` | 1 | 0 | Y | Y |
| [ ] | `mainScreens/vendors/vendorsListing/components/vendors-table-filters.tsx` | 0 | 0 | · | · |
| [ ] | `mainScreens/vendors/vendorsListing/components/vendors-table.tsx` | 0 | 0 | · | Y |
| [ ] | `mainScreens/vendors/vendorsListing/vendor-listing-view.tsx` | 0 | 0 | · | · |


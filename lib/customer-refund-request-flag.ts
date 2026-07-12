// Customer-facing "Request a refund" action on the booking-detail page —
// feature flag, OFF by default. Wires to the EPIC-5 refund-request engine
// (POST /api/v1/bookings/:id/refund-requests).
//
// NOTE (authz): that endpoint is currently VENDOR/admin-scoped — its
// loadOwnedBooking gate requires the caller to be in booking.vendorIds, and the
// cancellation policy is resolved from the vendor's business. A customer caller
// therefore gets 403/404 today. This flag stays OFF on prod until the backend
// authz is extended to accept the customer-by-email path; the UI degrades
// gracefully (friendly message, no crash) if the endpoint refuses.
//
//   NEXT_PUBLIC_CUSTOMER_REFUND_REQUEST_ON=true → render the refund-request card
//   (unset / anything else)                     → OFF (default)
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time, so each is read as a
// full static process.env.NEXT_PUBLIC_… access.)

const ON = process.env.NEXT_PUBLIC_CUSTOMER_REFUND_REQUEST_ON === "true"

/** Whether the customer refund-request card should render. OFF by default. */
export function isCustomerRefundRequestOn(): boolean {
  return ON
}

export const CUSTOMER_REFUND_REQUEST_ON = isCustomerRefundRequestOn()

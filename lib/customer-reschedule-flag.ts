// Customer-facing "Change date" (reschedule) action on the booking-detail page
// — feature flag, OFF by default. The backend reschedule endpoint
// (POST /api/v1/bookings/:id/reschedule) is customer-by-email authz'd and can
// move money (partial refund when the new total is lower; 422 requires_top_up
// when higher), so on live production the customer control stays dark until a
// pilot deliberately enables it.
//
//   NEXT_PUBLIC_CUSTOMER_RESCHEDULE_ON=true   → render the "Change date" action
//   (unset / anything else)                   → OFF (default)
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time, so each is read as a
// full static process.env.NEXT_PUBLIC_… access.)

const ON = process.env.NEXT_PUBLIC_CUSTOMER_RESCHEDULE_ON === "true"

/** Whether the customer reschedule ("Change date") action should render. OFF by default. */
export function isCustomerRescheduleOn(): boolean {
  return ON
}

export const CUSTOMER_RESCHEDULE_ON = isCustomerRescheduleOn()

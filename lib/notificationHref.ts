import type { Notification } from "@/lib/api/notifications";

/**
 * Maps a notification to the page it should open when tapped.
 *
 * Before this, notification rows only marked-read and closed the dropdown —
 * every alert was a dead-end even though the payload already carries a
 * destination (booking notifications ship `data.bookingId`, etc.). This turns
 * that payload into a real route.
 *
 * `base` is the section prefix — "/dashboard" for vendors/admins, "/user" for
 * customers — so the same notification opens the right booking view in either
 * context. Returns null when there is no meaningful destination (generic
 * system notices), so the caller can just mark-read without navigating.
 */
export function getNotificationHref(
  n: Pick<Notification, "type" | "data">,
  base: "/dashboard" | "/user" = "/dashboard",
): string | null {
  const data = (n.data || {}) as Record<string, unknown>;
  const bookingId = (data.bookingId ?? data.booking_id) as number | string | undefined;
  const t = String(n.type || "").toLowerCase();

  // Bookings + payments + change-requests all resolve to their booking.
  if (bookingId != null && (t.startsWith("booking") || t.startsWith("payment"))) {
    return `${base}/bookings/${bookingId}`;
  }
  if (t.includes("review")) return base === "/user" ? "/user/reviews" : "/dashboard/reviews";
  if (t.includes("message") || t.includes("chat")) {
    return base === "/user" ? "/user/conversations" : "/dashboard/chat";
  }
  if (t.includes("lead") || t.includes("enquiry") || t.includes("inquiry")) return "/dashboard/leads";
  if (t.includes("subcontract") || t.includes("collab")) return "/dashboard/collaborations";
  if (t.includes("claim")) return "/dashboard/claims";
  // Last resort: any booking reference at all still opens the booking.
  if (bookingId != null) return `${base}/bookings/${bookingId}`;
  return null;
}

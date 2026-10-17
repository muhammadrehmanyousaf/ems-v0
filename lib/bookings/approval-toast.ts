/**
 * What the vendor is told after "Confirm karein" (BOOKINGS-029). Approving a booking that is still waiting on
 * the customer's advance does NOT confirm it: the server keeps it at Awaiting Payment and the money is what
 * confirms it. The toast used to say "Booking confirm ho gayi" regardless, contradicting the badge beside it.
 * Worded from the status the server actually returned.
 */
export function approvalToast(res: unknown): string {
  const status = String((res as { data?: { status?: string } } | null)?.data?.status ?? "").toLowerCase()
  if (status.includes("await") || status.includes("pending")) return "Aap ne booking qabool kar li - advance ka intezar hai"
  return "Booking confirm ho gayi"
}

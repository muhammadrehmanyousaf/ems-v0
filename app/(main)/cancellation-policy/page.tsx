import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/legal-page-shell"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Cancellation Policy",
  description: `How customer, vendor, and platform-initiated cancellations work on ${SITE_NAME}, including the cancellation-tier matrix.`,
  path: "/cancellation-policy",
})

export default function CancellationPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Cancellations"
      title="Cancellation Policy"
      lastUpdated="2026-05-07"
      breadcrumbs={[{ name: "Cancellation Policy", href: "/cancellation-policy" }]}
      intro={
        <p>
          When plans change, here&apos;s how cancellations work on {SITE_NAME}.
          Read alongside the <Link href="/refund-policy">Refund Policy</Link>.
        </p>
      }
    >
      <h2>1. Vendor cancellation tiers</h2>
      <p>
        Each vendor on {SITE_NAME} sets one of three cancellation tiers visible
        on their profile and at checkout:
      </p>
      <ul>
        <li><strong>Flexible</strong> — full refund up to 60 days before the event date; 50% refund 30–60 days before; deposit non-refundable thereafter.</li>
        <li><strong>Moderate</strong> — full refund up to 90 days before; 50% 60–90 days before; deposit non-refundable thereafter.</li>
        <li><strong>Strict</strong> — full refund only if cancelled within 14 days of booking AND at least 90 days before the event; deposit non-refundable thereafter.</li>
      </ul>
      <p>
        The tier shown at the time of booking is the tier that applies. Vendors
        cannot change tiers after a booking is confirmed.
      </p>

      <h2>2. Vendor-initiated cancellation</h2>
      <p>
        If a vendor cancels a confirmed booking, you receive a <strong>full refund of
        all amounts paid</strong> within the timelines in the{" "}
        <Link href="/refund-policy">Refund Policy</Link>. {SITE_NAME} will help
        you find a replacement vendor at no additional platform fee.
      </p>
      <p>
        Vendors who cancel without good cause may be suspended from the
        platform.
      </p>

      <h2>3. Platform-initiated cancellation</h2>
      <p>
        {SITE_NAME} may cancel a booking if:
      </p>
      <ul>
        <li>The vendor breaches our <Link href="/acceptable-use">Acceptable Use Policy</Link>.</li>
        <li>The vendor&apos;s account is suspended for fraud or AML concerns.</li>
        <li>Payment fails or is reversed and is not cured within 7 days.</li>
      </ul>
      <p>
        In platform-initiated cancellations not caused by the customer, the
        customer receives a full refund.
      </p>

      <h2>4. Force majeure</h2>
      <p>
        Force majeure events include natural disasters, declared epidemics or
        pandemics, civil unrest, government-mandated lockdowns, terrorism, and
        other events beyond reasonable control of either party.
      </p>
      <ul>
        <li>If the event date falls within a force-majeure window, both parties agree to <strong>reschedule first</strong>. {SITE_NAME} will not charge platform fees for force-majeure rescheduling within 12 months of the original date.</li>
        <li>Where rescheduling is not feasible, the customer is entitled to a refund of all amounts not yet incurred by the vendor as documented work-in-progress (e.g. paid sub-vendor fees, custom outfits already produced).</li>
      </ul>

      <h2>5. How to cancel</h2>
      <ol>
        <li>Open the booking from <Link href="/user/bookings">My Bookings</Link>.</li>
        <li>Click <em>Cancel booking</em>. The system shows you the refund amount based on the tier and your timing.</li>
        <li>Confirm. The refund is initiated immediately and reaches you per the <Link href="/refund-policy">Refund Policy</Link> timeline.</li>
      </ol>

      <h2>6. Disputes</h2>
      <p>
        If you disagree with the refund amount calculated, open a dispute on the
        booking page. Our team reviews disputes within 14 days. Persistent issues
        may be escalated via the <Link href="/complaints">Complaints process</Link>.
      </p>
    </LegalPageShell>
  )
}

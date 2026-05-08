import type { Metadata } from "next"
import Link from "next/link"
import { LegalPageShell } from "@/components/legal/legal-page-shell"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Service Delivery Policy",
  description: `How wedding services booked through ${SITE_NAME} are delivered, when delivery is considered complete, and how we record it.`,
  path: "/service-delivery-policy",
})

export default function ServiceDeliveryPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Service delivery"
      title="Service Delivery Policy"
      lastUpdated="2026-05-07"
      breadcrumbs={[{ name: "Service Delivery Policy", href: "/service-delivery-policy" }]}
      intro={
        <p>
          {SITE_NAME} sells <em>wedding services</em>, not physical products. This
          policy explains what &quot;delivery&quot; means for events, how delivery is
          recorded, and the dispute window.
        </p>
      }
    >
      <h2>1. Definition of service delivery</h2>
      <p>
        A service is considered <strong>delivered</strong> when the vendor performs
        the agreed work on the agreed date and at the agreed location. The
        delivery date for SEO and accounting purposes is the event date listed
        on the booking confirmation.
      </p>

      <h2>2. Recording delivery</h2>
      <ul>
        <li>The customer or the vendor (typically the customer) marks the booking <em>Complete</em> in the {SITE_NAME} app within 7 days of the event.</li>
        <li>If neither party marks it within 14 days, {SITE_NAME} auto-confirms delivery based on the event date and absence of an open dispute.</li>
        <li>Final balance amounts are released to the vendor according to the payout schedule once delivery is confirmed.</li>
      </ul>

      <h2>3. Multi-day weddings</h2>
      <p>
        Pakistani weddings often span multiple functions (mehndi, baraat, walima,
        valima). For multi-day bookings, the &quot;event date&quot; is the last
        function date covered by the booking. Delivery is considered complete
        when all booked functions are concluded.
      </p>

      <h2>4. Pre-event deliverables</h2>
      <p>
        Some vendors deliver pre-event work (custom invitation design, dress
        fittings, location scouting, sample shoots). These are tracked as
        milestones on the booking, and partial payment release may be tied to
        their completion as agreed at booking time.
      </p>

      <h2>5. Post-event deliverables</h2>
      <p>
        Photographers and videographers commonly deliver edited photos / films
        weeks after the event. The booking remains <em>Awaiting deliverables</em>
        until the vendor uploads the final files and the customer confirms
        receipt. This is the only kind of post-event obligation we track on the
        booking; any other work agreed off-platform is between you and the
        vendor.
      </p>

      <h2>6. Disputes about delivery</h2>
      <p>
        If a service is not delivered or not delivered as agreed, open a dispute
        on the booking page within <strong>14 days</strong> of the event date. Our team
        will review evidence from both sides and apply the{" "}
        <Link href="/refund-policy">Refund Policy</Link>.
      </p>

      <h2>7. Geographic scope</h2>
      <p>
        {SITE_NAME} covers wedding services delivered within Pakistan. Some
        vendors may travel internationally for an additional fee, agreed
        directly between the customer and the vendor at booking time.
      </p>
    </LegalPageShell>
  )
}

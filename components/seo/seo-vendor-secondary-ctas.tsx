"use client"

/**
 * "Request a quote" + "Add to my wedding plan" for the CANONICAL vendor page.
 *
 * Both existed only on the legacy `/{type}/{id}` routes. The canonical SEO page
 * — `/{type}/{city}/{slug}-{id}`, the one Google sends organic traffic to —
 * offered only "Check availability" and "Ask a question".
 *
 * That is backwards. Haggling is how this market actually buys: a visitor who
 * lands on a fixed price with no way to open a conversation about it mostly
 * leaves. Both backends are live and both dialogs already exist; the only thing
 * missing was the door on the page that matters most.
 *
 * The page itself is a server component, so this island carries the dialog
 * state. Auth is checked only on click — a first-time visitor from search must
 * never meet a login wall before they know what they want.
 */

import { useState } from "react"
import { Handshake } from "lucide-react"
import RequestQuoteDialog from "@/components/RequestQuoteDialog"
import VendorInquiryDialog from "@/components/VendorInquiryDialog"
import { AddToPlanButton } from "@/components/wedding-plan/add-to-plan-button"
import { useUser } from "@/context/UserContext"

export function SeoVendorSecondaryCtas({
  businessId,
  vendorName,
  vendorType,
}: {
  /** The SEO vendor record types this as `string | number`, so accept both and
   *  normalise once here rather than casting at the call site. */
  businessId: number | string
  vendorName: string
  vendorType?: string | null
}) {
  const id = Number(businessId)
  const { isAuthenticated } = useUser()
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [guestQuoteOpen, setGuestQuoteOpen] = useState(false)

  /**
   * A guest asking for a quote is captured, not bounced.
   *
   * This used to `router.push("/login?redirect=…")` — directly contradicting
   * the note at the top of this file about never showing a first-time visitor
   * from search a login wall. The wall was simply one click later, and it sat
   * on the HIGHER-intent action: "Ask a question" right beside it opens a form
   * for anyone, while "Request a quote" — someone with a date and a budget in
   * mind — demanded an account first. In a market that runs on WhatsApp, being
   * asked to register before you can ask a price is where the lead is lost.
   *
   * Guests now get the same public inquiry form, reframed as a quote request.
   * It posts to the no-auth POST /leads/inquiry and lands the identical Lead in
   * the vendor's inbox — verified end to end on production — so the vendor can
   * reply with a price either way. Signed-in customers still get the real
   * quote-negotiation dialog, which needs an account to track the thread.
   */
  const onRequestQuote = () => {
    if (isAuthenticated) setQuoteOpen(true)
    else setGuestQuoteOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={onRequestQuote}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-bridal-gold/50 bg-white text-bridal-charcoal font-bridal text-[13px] font-medium hover:bg-bridal-cream transition-colors"
      >
        <Handshake className="w-4 h-4" />
        Request a quote
      </button>

      <AddToPlanButton
        businessId={id}
        businessName={vendorName}
        vendorType={vendorType ?? undefined}
        variant="detail"
        label="Add to my wedding plan"
      />

      <RequestQuoteDialog
        businessId={id}
        vendorName={vendorName}
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
      />

      <VendorInquiryDialog
        businessId={id}
        vendorName={vendorName}
        open={guestQuoteOpen}
        onOpenChange={setGuestQuoteOpen}
        title={`Request a quote from ${vendorName}`}
        description="Tell them your date and guest count and they'll come back with a price. No account needed."
        initialMessage="Please send me your packages and pricing for my function."
      />
    </>
  )
}

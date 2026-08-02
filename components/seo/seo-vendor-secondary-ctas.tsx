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
import { useRouter } from "next/navigation"
import { Handshake } from "lucide-react"
import RequestQuoteDialog from "@/components/RequestQuoteDialog"
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
  const router = useRouter()
  const { isAuthenticated } = useUser()
  const [quoteOpen, setQuoteOpen] = useState(false)

  const onRequestQuote = () => {
    if (!isAuthenticated) {
      const back = typeof window !== "undefined" ? window.location.pathname : "/"
      router.push(`/login?redirect=${encodeURIComponent(back)}`)
      return
    }
    setQuoteOpen(true)
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
        // Short enough to sit in the row with the other three rather than
        // forcing a line of its own.
        label="Add to my plan"
      />

      <RequestQuoteDialog
        businessId={id}
        vendorName={vendorName}
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
      />
    </>
  )
}

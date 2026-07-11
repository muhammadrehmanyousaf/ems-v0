// Anonymous "Ask a question / Ask for a price" inquiry dialog on the SEO vendor
// detail page (the canonical page a customer lands on from Google) — feature
// flag, OFF by default. When ON, the page's secondary CTA opens the anonymous
// VendorInquiryDialog (drops a form_inquiry Lead in the vendor's inbox, no
// login) instead of routing to the generic /contact page. The primary booking
// (payment) CTA is untouched.
//
//   NEXT_PUBLIC_SEO_INQUIRY_DIALOG_ON=true → SEO CTA opens the inquiry dialog
//   (unset / anything else)                → OFF (default: keep /contact link)
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time, so each is read as a
// full static process.env.NEXT_PUBLIC_… access.)

const ON = process.env.NEXT_PUBLIC_SEO_INQUIRY_DIALOG_ON === "true"

/** Whether the SEO detail page should surface the anonymous inquiry dialog. OFF by default. */
export function isSeoInquiryDialogOn(): boolean {
  return ON
}

export const SEO_INQUIRY_DIALOG_ON = isSeoInquiryDialogOn()

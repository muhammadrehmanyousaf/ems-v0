"use client";

/**
 * Client wrapper that lets the (server-rendered) SEO vendor detail page offer
 * the anonymous inquiry dialog from its CTA row. A first-time visitor arriving
 * from Google can ask a question / ask for a price WITHOUT logging in — the
 * dialog drops a form_inquiry Lead straight into the vendor's inbox.
 *
 * Always rendered. This used to sit behind a flag, so search visitors were sent
 * to a generic /contact page and the lead never reached the vendor. The booking
 * (payment) CTA is never touched.
 */

import { useState } from "react";
import VendorInquiryDialog from "@/components/VendorInquiryDialog";

interface Props {
  businessId: number | string;
  vendorName: string;
  /** Button copy — defaults to "Ask a question". */
  label?: string;
}

export default function VendorInquiryCta({ businessId, vendorName, label = "Ask a question" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[13px] text-bridal-charcoal transition-colors"
      >
        {label}
      </button>
      <VendorInquiryDialog
        businessId={businessId}
        vendorName={vendorName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

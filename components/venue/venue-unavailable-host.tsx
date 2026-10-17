"use client"

/**
 * The one dialog a customer sees when ANY request they make is refused 409 VENUE_UNAVAILABLE (a booking submit, a quote, a
 * chat, a payment start) and the screen did not show the refusal itself. Mounted once in the public layout. It is
 * informative, not an error: the venue is not taking new enquiries, and an existing booking is unaffected.
 */

import * as React from "react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { onVenueUnavailable, type VenueUnavailable } from "@/lib/plans/venue-availability"
import { COPY } from "@/lib/plans/copy"

export function VenueUnavailableHost() {
  const [v, setV] = React.useState<VenueUnavailable | null>(null)
  React.useEffect(() => onVenueUnavailable((x) => setV(x)), [])
  return (
    <Dialog open={!!v} onOpenChange={(o) => { if (!o) setV(null) }}>
      <DialogContent className="max-w-md" data-testid="venue-unavailable-dialog">
        <DialogHeader>
          <DialogTitle>{COPY["cust.unavailable.title"].en}</DialogTitle>
          <DialogDescription>{v?.message || COPY["cust.unavailable.body"].en}</DialogDescription>
        </DialogHeader>
        <p lang="und" className="-mt-2 text-[13px] text-muted-foreground">{COPY["cust.unavailable.body"].ru}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
          <Link href="/user/bookings" onClick={() => setV(null)} className="underline underline-offset-4">{COPY["cust.unavailable.view"].en}</Link>
          <Link href="/search" onClick={() => setV(null)} className="underline underline-offset-4">{COPY["cust.unavailable.browse"].en}</Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}

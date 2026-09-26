"use client"

/**
 * WW-MEDIA — "Recently removed", the way back from a deleted photo.
 *
 * Removing a photo only rewrites this business's URL array; Cloudinary still
 * holds the file. So a removal was always reversible in principle, and in
 * practice was not: the only way back was the Undo toast, which lives for a few
 * seconds. Miss it — a stray tap, a second tab, a phone that slept — and a
 * gallery photo was gone for good with the bytes sitting untouched in storage.
 *
 * This is the door onto that. It is deliberately quiet: collapsed by default,
 * and it renders nothing at all when there is nothing to recover, so a vendor
 * with a tidy gallery never sees a control implying they lost something.
 */

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { pushLive } from "@/lib/seo/push-live"

export function RecoverMediaCard({ businessId }: { businessId: number | string }) {
  const qc = useQueryClient()
  const [open, setOpen] = React.useState(false)

  const orphansQ = useQuery({
    queryKey: ["biz-orphan-media", businessId],
    queryFn: () => BusinessesAPI.listOrphanMedia(businessId),
    // Only ask once the vendor opens the section — this hits Cloudinary's admin
    // API, which is not something to do on every settings page view.
    enabled: open,
  })

  const restoreMut = useMutation({
    mutationFn: (url: string) => BusinessesAPI.restoreMedia(businessId, url),
    onSuccess: () => {
      showSuccessToast("Photo restored")
      void pushLive(businessId)
      qc.invalidateQueries({ queryKey: ["biz-settings-hub"] })
      qc.invalidateQueries({ queryKey: ["biz-orphan-media", businessId] })
    },
    onError: () => toast.error("Couldn't restore that photo. Please try again."),
  })

  const orphans = orphansQ.data ?? []

  // Once opened and loaded, say nothing if there is nothing to say.
  if (open && !orphansQ.isLoading && orphans.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        Nothing to recover — every photo you have uploaded is on your listing.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span>
            <span className="block text-sm font-semibold">Recently removed</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Deleted a photo by mistake? It can be put back.
            </span>
          </span>
          <Icon name="ChevronRight" className="size-4 shrink-0 text-muted-foreground" />
        </button>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Recently removed</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                These are still in storage but are not on your listing.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>

          {orphansQ.isLoading ? (
            <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
              <Spinner /> Looking for removed photos…
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {orphans.map((o) => (
                <div key={o.publicId} className="overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={o.url}
                    alt="Removed photo"
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-none border-0 border-t"
                    disabled={restoreMut.isPending}
                    onClick={() => restoreMut.mutate(o.url)}
                  >
                    Put back
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default RecoverMediaCard

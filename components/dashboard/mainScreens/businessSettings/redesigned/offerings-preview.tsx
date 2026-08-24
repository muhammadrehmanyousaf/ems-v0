"use client"

/**
 * WW-RATECARD 9.5 — preview & publish, in the customer's own words.
 *
 * A vendor builds packages on one screen and menus on another, each a form of
 * fields. Nothing showed them the thing those fields become: the block a couple
 * actually reads on the listing, where a package that includes food says so, a
 * per-head menu shows a plate rate, and a flat one shows a single number.
 *
 * The point of this file is that it renders `VendorOfferings` — the SAME
 * component the public detail page renders, not a dashboard imitation of it.
 * A preview built from a second component is a preview of a page that does not
 * exist, and it drifts the first time either side is touched. There is exactly
 * one way this block can look, and this is it.
 *
 * It deliberately shows the PUBLISHED state. Unsaved edits in the form above
 * are not in it, and the empty state says so, because "what customers see right
 * now" is the question a vendor is asking when they open this.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { PackagesAPI, MenusAPI, type ApiPackage, type ApiMenu } from "@/lib/api/dashboard"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import VendorOfferings from "@/components/seo/vendor-offerings"

export function OfferingsPreview({ businessId }: { businessId: number }) {
  const [open, setOpen] = React.useState(false)

  /**
   * The keys here must be the ones the managers already use — `["pkgs", id]`
   * and `["menus", id]`, not a tidier pair of my own.
   *
   * A separate key would mean a separate cache entry that the managers'
   * `invalidateQueries` never touches, so the preview would keep showing the
   * old packages immediately after a save. Stale-right-after-saving is the one
   * failure this component exists to prevent.
   */
  const packagesQ = useQuery<ApiPackage[]>({
    queryKey: ["pkgs", businessId],
    queryFn: () => PackagesAPI.getAll(businessId),
    enabled: open,
  })
  const menusQ = useQuery<ApiMenu[]>({
    queryKey: ["menus", businessId],
    queryFn: () => MenusAPI.getAll(businessId),
    enabled: open,
  })

  const loading = packagesQ.isLoading || menusQ.isLoading
  const packages = packagesQ.data ?? []
  const menus = menusQ.data ?? []
  const nothingPublished = !loading && packages.length === 0 && menus.length === 0

  return (
    <div className="mt-6 rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon name="Eye" size={15} />
          How customers see this
        </span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={15} />
      </button>

      {open && (
        <div className="border-t border-border p-4">
          <p className="mb-4 text-xs text-muted-foreground">
            This is the block that appears on your public listing, rendered by the same
            component that draws it there. It shows what is <strong>saved</strong> — anything you
            are still editing above will appear once you save it.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Spinner size={14} /> Loading your published offerings…
            </div>
          ) : nothingPublished ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm font-medium">Nothing to show a customer yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a package or a menu and it will appear here exactly as it will on your listing.
              </p>
            </div>
          ) : (
            /* The real thing. Wrapped in the public surface's own background so
               it is not judged against a dashboard palette it will never be
               seen on. */
            <div className="rounded-lg bg-white p-4 text-bridal-charcoal dark:bg-white">
              <VendorOfferings packages={packages} menus={menus} />
            </div>
          )}

          {!loading && !nothingPublished && (
            <p className="mt-3 text-xs text-muted-foreground">
              {packages.length} {packages.length === 1 ? "package" : "packages"} ·{" "}
              {menus.length} {menus.length === 1 ? "menu" : "menus"} published
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default OfferingsPreview

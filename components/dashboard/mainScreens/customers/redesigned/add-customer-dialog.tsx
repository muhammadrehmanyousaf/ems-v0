"use client"

/**
 * Add-customer dialog (redesigned).
 *
 * Two modes, because the two roles mean different things by "add a customer":
 *
 *  - VENDOR — adds a walk-in to their own roster, exactly as before, via
 *    POST /api/v1/offlineCustomers. Untouched behaviour.
 *
 *  - SUPER ADMIN — creates a customer and hands it to a chosen vendor, and
 *    optionally to one of that vendor's businesses, via POST /api/v1/customers.
 *    That endpoint writes BOTH the canonical Customer row (so it appears in the
 *    list) and the assignment. The old dialog posted only to /offlineCustomers
 *    while this screen lists the canonical Customer table — so admin-created
 *    customers saved fine and then never showed up anywhere.
 *
 * The vendor picker is a typeahead, not a <select>: there are 3,278 vendors.
 * The business picker is dependent — it only loads once a vendor is chosen, and
 * it queries that vendor's own businesses.
 */

import * as React from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import axiosInstance from "@/lib/axiosConfig"
import { VendorsAPI } from "@/lib/api/dashboard"
import { useUser } from "@/context/UserContext"
import { getDashboardRole, isAdminLike } from "@/lib/dashboard-role"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}

interface PickedVendor { id: number; fullName: string; email: string }
interface PickedBusiness { id: number; name: string; city?: string | null }

export function AddCustomerDialog({
  open, onOpenChange, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved?: () => void
}) {
  const { user } = useUser()
  const isAdmin = isAdminLike(getDashboardRole(user))

  const [name, setName] = React.useState("")
  const [phoneno, setPhoneno] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [email, setEmail] = React.useState("")

  // Admin-only assignment state.
  const [vendorQuery, setVendorQuery] = React.useState("")
  const [vendor, setVendor] = React.useState<PickedVendor | null>(null)
  const [businessId, setBusinessId] = React.useState<number | "">("")

  React.useEffect(() => {
    if (!open) return
    setName(""); setPhoneno(""); setAddress(""); setEmail("")
    setVendorQuery(""); setVendor(null); setBusinessId("")
  }, [open])

  // Debounced so typing a vendor name doesn't fire a request per keystroke.
  const [debouncedVendorQuery, setDebouncedVendorQuery] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedVendorQuery(vendorQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [vendorQuery])

  const vendorResults = useQuery({
    queryKey: ["add-customer-vendor-search", debouncedVendorQuery],
    queryFn: () => VendorsAPI.getPage(1, 8, debouncedVendorQuery),
    // Don't pull the first page of 3,278 before they've typed anything.
    enabled: isAdmin && open && debouncedVendorQuery.length >= 2 && !vendor,
  })

  const businesses = useQuery({
    queryKey: ["add-customer-vendor-businesses", vendor?.id],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/businesses", {
        params: { userId: vendor?.id, limit: 100 },
      })
      const body = res.data?.data
      return (body?.data ?? []) as PickedBusiness[]
    },
    enabled: isAdmin && open && !!vendor?.id,
  })

  const saveMut = useMutation({
    mutationFn: () => {
      if (isAdmin) {
        return axiosInstance.post("/api/v1/customers", {
          name: name.trim(),
          phone: phoneno.trim(),
          email: email.trim() || undefined,
          city: address.trim() || undefined,
          assignedVendorId: vendor?.id,
          businessId: businessId === "" ? undefined : Number(businessId),
        })
      }
      return axiosInstance.post("/api/v1/offlineCustomers", {
        name: name.trim(), phoneno: phoneno.trim(), address: address.trim(), email: email.trim() || undefined,
      })
    },
    onSuccess: () => { showSuccessToast("Customer added"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't add customer"),
  })

  // Address is required for a vendor's own roster (existing rule). For an admin
  // assignment the required pair is a vendor + a phone, since that is what the
  // customer is deduped and routed on.
  const canSave = isAdmin
    ? Boolean(name.trim() && phoneno.trim() && vendor?.id)
    : Boolean(name.trim() && phoneno.trim() && address.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add customer</DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Create a customer and assign them to a vendor. Most customers appear automatically from bookings."
              : "Add a customer to your roster (most appear automatically from bookings)."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <Field label="Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
          <Field label="Phone"><input className={inputCls} value={phoneno} onChange={(e) => setPhoneno(e.target.value)} placeholder="03xx-xxxxxxx" /></Field>
          <Field label={isAdmin ? "City (optional)" : "Address"}>
            <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City / area" />
          </Field>
          <Field label="Email (optional)"><input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>

          {isAdmin && (
            <>
              <Field label="Assign to vendor">
                {vendor ? (
                  <div className="flex items-center justify-between gap-2 rounded-md border border-input bg-muted/40 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{vendor.fullName || "—"}</div>
                      <div className="truncate text-xs text-muted-foreground">{vendor.email}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setVendor(null); setBusinessId(""); setVendorQuery("") }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <>
                    <input
                      className={inputCls}
                      value={vendorQuery}
                      onChange={(e) => setVendorQuery(e.target.value)}
                      placeholder="Search vendors by name, email or phone…"
                    />
                    {debouncedVendorQuery.length >= 2 && (
                      <div className="mt-1.5 max-h-44 overflow-y-auto rounded-md border border-input">
                        {vendorResults.isLoading && (
                          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                            <Spinner size={13} /> Searching…
                          </div>
                        )}
                        {!vendorResults.isLoading && !(vendorResults.data?.results ?? []).length && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">No vendors match that.</div>
                        )}
                        {(vendorResults.data?.results ?? []).map((v: any) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => { setVendor({ id: v.id, fullName: v.fullName, email: v.email }); setBusinessId("") }}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                          >
                            <div className="truncate font-medium">{v.fullName || "—"}</div>
                            <div className="truncate text-xs text-muted-foreground">{v.email}{v.city ? ` · ${v.city}` : ""}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Field>

              {vendor && (
                <Field label="Business (optional)">
                  {businesses.isLoading ? (
                    <div className="flex items-center gap-2 px-1 py-2 text-sm text-muted-foreground">
                      <Spinner size={13} /> Loading businesses…
                    </div>
                  ) : (businesses.data ?? []).length ? (
                    <select
                      className={inputCls}
                      value={businessId}
                      onChange={(e) => setBusinessId(e.target.value === "" ? "" : Number(e.target.value))}
                    >
                      <option value="">No specific business</option>
                      {(businesses.data ?? []).map((b) => (
                        <option key={b.id} value={b.id}>{b.name}{b.city ? ` — ${b.city}` : ""}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-muted-foreground">This vendor has no businesses yet.</p>
                  )}
                </Field>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending
              ? <><Spinner size={14} className="mr-1.5" /> Saving…</>
              : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Save customer</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddCustomerDialog

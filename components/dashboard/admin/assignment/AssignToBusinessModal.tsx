"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { AdminBusinessAPI, type BusinessSearchAssignItem } from "@/lib/api/admin-business"
import { showSuccessToast } from "@/lib/toast/undo"
import { errorMessage } from "@/lib/utils/api-error"
import { toast } from "sonner"

interface AssignToBusinessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** If assigning a Lead */
  lead?: {
    id: number
    contactName?: string | null
    contactPhone?: string | null
    businessName?: string | null
    eventType?: string | null
  } | null
  /** If assigning a Booking */
  booking?: {
    id: number
    customerName?: string | null
    totalAmount?: number | null
    currentBusinessName?: string | null
  } | null
  onSuccess?: () => void
}

const PAKISTAN_MAJOR_CITIES = [
  "all",
  "Islamabad",
  "Rawalpindi",
  "Lahore",
  "Karachi",
  "Peshawar",
  "Multan",
  "Faisalabad",
  "Gujranwala",
  "Sialkot",
  "Abbottabad",
]

export function AssignToBusinessModal({
  open,
  onOpenChange,
  lead,
  booking,
  onSuccess,
}: AssignToBusinessModalProps) {
  const [search, setSearch] = React.useState("")
  const [selectedCity, setSelectedCity] = React.useState("all")
  const [results, setResults] = React.useState<BusinessSearchAssignItem[]>([])
  const [selectedBusiness, setSelectedBusiness] = React.useState<BusinessSearchAssignItem | null>(null)
  const [adminNote, setAdminNote] = React.useState("")
  const [isSearching, setIsSearching] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Reset state when opened
  React.useEffect(() => {
    if (open) {
      setSearch("")
      setSelectedBusiness(null)
      setAdminNote("")
      loadInitialVenues()
    }
  }, [open])

  const loadInitialVenues = async () => {
    try {
      setIsSearching(true)
      const list = await AdminBusinessAPI.searchBusinessesForAssignment({
        city: selectedCity !== "all" ? selectedCity : undefined,
      })
      setResults(list)
    } catch (e) {
      console.error("Failed to load venues for assignment:", e)
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  React.useEffect(() => {
    if (!open) return
    const t = setTimeout(async () => {
      try {
        setIsSearching(true)
        const list = await AdminBusinessAPI.searchBusinessesForAssignment({
          q: search.trim() || undefined,
          city: selectedCity !== "all" ? selectedCity : undefined,
        })
        setResults(list)
      } catch (e) {
        console.error("Search failed:", e)
      } finally {
        setIsSearching(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [search, selectedCity, open])

  const handleSubmit = async () => {
    if (!selectedBusiness) {
      toast.error("Please select a target business")
      return
    }

    try {
      setIsSubmitting(true)
      if (lead) {
        await AdminBusinessAPI.assignLeadToBusiness(lead.id, selectedBusiness.id, adminNote.trim() || undefined)
        showSuccessToast(`Lead reassigned to ${selectedBusiness.name}`)
      } else if (booking) {
        await AdminBusinessAPI.assignBookingToBusiness(booking.id, selectedBusiness.id, adminNote.trim() || undefined)
        showSuccessToast(`Booking reassigned to ${selectedBusiness.name}`)
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (e) {
      toast.error(errorMessage(e, "Assignment failed"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = lead
    ? `Assign Lead #${lead.id} to Business`
    : booking
      ? `Assign Booking #${booking.id} to Business`
      : "Assign to Business"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Icon name="RefreshCw" size={20} className="text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {lead && (
              <span>
                Assigning inquiry from <strong>{lead.contactName || "Client"}</strong> ({lead.contactPhone || "No phone"}) · Currently linked to:{" "}
                <strong>{lead.businessName || "Unassigned"}</strong>
              </span>
            )}
            {booking && (
              <span>
                Assigning booking order for <strong>{booking.customerName || "Customer"}</strong> · Current venue:{" "}
                <strong>{booking.currentBusinessName || "Unassigned"}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Filters & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={16} />
              </span>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search venue name, owner, area..."
                className="pl-9"
              />
            </div>
            <div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {PAKISTAN_MAJOR_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All Cities" : c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Select Destination Venue ({results.length} found)
            </Label>
            <div className="max-h-60 overflow-y-auto rounded-md border border-border/60 divide-y divide-border/40 bg-muted/20">
              {isSearching ? (
                <div className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Spinner size={16} className="text-primary" />
                  Searching venues...
                </div>
              ) : results.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No matching venues found in {selectedCity === "all" ? "Pakistan" : selectedCity}.
                </div>
              ) : (
                results.map((biz) => {
                  const isSelected = selectedBusiness?.id === biz.id
                  return (
                    <div
                      key={biz.id}
                      onClick={() => setSelectedBusiness(biz)}
                      className={`p-3 cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-primary/10 border-l-4 border-l-primary"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {biz.name}
                          </span>
                          <span className="text-xs text-muted-foreground">#{biz.id}</span>
                          {biz.city && (
                            <StatusPill tone="neutral">
                              {biz.city}
                            </StatusPill>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {biz.subArea ? `${biz.subArea} · ` : ""}
                          Owner: {biz.ownerName || "Unclaimed / System"} ({biz.ownerPhone || "No direct phone"})
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {isSelected ? (
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground text-xs">
                            <Icon name="Check" size={14} />
                          </span>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2">
                            Select
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Selected Preview & Admin Note */}
          {selectedBusiness && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
              <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Icon name="CheckCircle2" size={14} /> Target Destination Selected:
              </div>
              <div className="text-sm font-medium text-foreground">
                {selectedBusiness.name} ({selectedBusiness.city || "Pakistan"})
              </div>
              <div className="space-y-1 pt-1">
                <Label htmlFor="admin-note" className="text-xs text-muted-foreground">
                  Admin Routing Reason (Stored in Audit Log):
                </Label>
                <Textarea
                  id="admin-note"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Lead requested hall with 500+ capacity in Gulberg Lahore; reassigned by Admin."
                  rows={2}
                  className="text-xs bg-background"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedBusiness || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Spinner size={14} />
                Assigning...
              </>
            ) : (
              <>
                <Icon name="RefreshCw" size={14} />
                Confirm Reassignment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { AdminBusinessAPI, type Business360Data, type AdminBusinessProfile } from "@/lib/api/admin-business"
import { AssignToBusinessModal } from "@/components/dashboard/admin/assignment/AssignToBusinessModal"
import { showSuccessToast } from "@/lib/toast/undo"
import { errorMessage } from "@/lib/utils/api-error"
import { toast } from "sonner"
import Link from "next/link"

interface BusinessDetailDrawerProps {
  businessId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefreshList?: () => void
}

const fmtDate = (d?: string | null) => {
  if (!d) return "—"
  const t = new Date(d)
  return isNaN(t.getTime())
    ? "—"
    : t.toLocaleDateString("en-PK", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
}

export function BusinessDetailDrawer({
  businessId,
  open,
  onOpenChange,
  onRefreshList,
}: BusinessDetailDrawerProps) {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = React.useState("overview")
  const [assignModalOpen, setAssignModalOpen] = React.useState(false)

  // Edit fields state
  const [editPhone, setEditPhone] = React.useState("")
  const [editWhatsapp, setEditWhatsapp] = React.useState("")
  const [editMinPrice, setEditMinPrice] = React.useState("")
  const [editMaxCapacity, setEditMaxCapacity] = React.useState("")
  const [editDescription, setEditDescription] = React.useState("")

  // Transfer ownership state
  const [transferUserId, setTransferUserId] = React.useState("")
  const [transferReason, setTransferReason] = React.useState("")

  const {
    data: b360,
    isLoading,
    isError,
    refetch,
  } = useQuery<Business360Data>({
    queryKey: ["admin-business-360", businessId],
    queryFn: () => AdminBusinessAPI.getBusiness360(businessId!),
    enabled: !!businessId && open,
  })

  // Synchronize edit fields when data arrives
  React.useEffect(() => {
    if (b360?.business) {
      const b: AdminBusinessProfile = b360.business
      setEditPhone(b.phoneNumber || "")
      setEditWhatsapp(b.whatsappNumber || "")
      setEditMinPrice(b.minimumPrice ? String(b.minimumPrice) : "")
      setEditMaxCapacity(b.maxCapacity ? String(b.maxCapacity) : "")
      setEditDescription(b.description || "")
      setTransferUserId("")
      setTransferReason("")
    }
  }, [b360])

  // Save settings mutation
  const updateMut = useMutation({
    mutationFn: async () => {
      if (!businessId) return
      return AdminBusinessAPI.updateBusinessAdmin(businessId, {
        phoneNumber: editPhone.trim() || undefined,
        whatsappNumber: editWhatsapp.trim() || undefined,
        minimumPrice: editMinPrice ? Number(editMinPrice) : undefined,
        maxCapacity: editMaxCapacity ? Number(editMaxCapacity) : undefined,
        description: editDescription.trim() || undefined,
      })
    },
    onSuccess: () => {
      showSuccessToast("Business details updated")
      refetch()
      qc.invalidateQueries({ queryKey: ["businesses-admin-redesigned"] })
      onRefreshList?.()
    },
    onError: (err) => {
      toast.error(errorMessage(err, "Failed to update business"))
    },
  })

  // Transfer ownership mutation
  const transferMut = useMutation({
    mutationFn: async () => {
      if (!businessId || !transferUserId) return
      const targetId = parseInt(transferUserId, 10)
      if (isNaN(targetId) || targetId <= 0) {
        throw new Error("Please enter a valid vendor User ID")
      }
      return AdminBusinessAPI.transferBusinessOwnership(
        businessId,
        targetId,
        transferReason.trim() || undefined,
      )
    },
    onSuccess: () => {
      showSuccessToast("Business ownership successfully transferred")
      refetch()
      qc.invalidateQueries({ queryKey: ["businesses-admin-redesigned"] })
      onRefreshList?.()
      setTransferUserId("")
      setTransferReason("")
    },
    onError: (err) => {
      toast.error(errorMessage(err, "Failed to transfer ownership"))
    },
  })

  const b: AdminBusinessProfile | undefined = b360?.business
  const vendor = b?.vendor
  const metrics = b360?.metrics
  const leads = b360?.recentLeads || []
  const bookings = b360?.recentBookings || []
  const packages = b?.packages || []
  const menus = b?.menus || []

  // Public leaf URL
  const citySlug = (b?.city || "pakistan").toLowerCase().replace(/\s+/g, "-")
  const bizSlug = (b?.slug || b?.name || "venue").toLowerCase().replace(/[^a-z0-9]+/g, "-")
  const publicLeafUrl = `/wedding-venues/${citySlug}/${bizSlug}-${b?.id}`

  // Contact numbers
  const directPhone = b?.phoneNumber || vendor?.phoneNumber || "0327-4811220"
  const cleanPhone = directPhone.replace(/[^0-9]/g, "")
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith("0") ? `92${cleanPhone.slice(1)}` : cleanPhone}?text=Assalam-o-Alaikum%2C%20regarding%20${encodeURIComponent(b?.name || "your venue")}%20on%20WeddingWala`

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 flex flex-col h-full bg-background"
        >
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
              <Spinner size={32} className="text-primary" />
              <p className="text-sm text-muted-foreground">Loading 360° business profile...</p>
            </div>
          ) : isError || !b ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3 text-center">
              <Icon name="AlertCircle" size={36} className="text-destructive" />
              <h3 className="font-semibold text-lg">Unable to load business details</h3>
              <p className="text-sm text-muted-foreground">The requested business may not exist or an error occurred.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Top Banner / Header */}
              <div className="border-b border-border/80 p-5 bg-muted/20">
                <SheetHeader className="text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                        {b.name?.slice(0, 2).toUpperCase() || "??"}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <SheetTitle className="text-xl font-bold tracking-tight">
                            {b.name}
                          </SheetTitle>
                          <span className="text-xs text-muted-foreground font-mono">
                            #{b.id}
                          </span>
                        </div>
                        <SheetDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Icon name="MapPin" size={13} />
                          {b.subArea ? `${b.subArea}, ` : ""}
                          {b.city || "Pakistan"}
                          {b.subBusinessType ? ` · ${String(b.subBusinessType)}` : ""}
                        </SheetDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusPill tone="neutral">
                        {b.status || "active"}
                      </StatusPill>
                      {b.verificationTier && b.verificationTier > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <Icon name="ShieldCheck" size={13} />
                          Tier {b.verificationTier}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Quick Action Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="h-8 text-xs gap-1.5"
                    >
                      <Link href={publicLeafUrl} target="_blank">
                        <Icon name="ExternalLink" size={13} />
                        Public Leaf
                      </Link>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="h-8 text-xs gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50"
                    >
                      <a href={whatsappUrl} target="_blank" rel="noreferrer">
                        <Icon name="MessageCircle" size={13} />
                        WhatsApp ({directPhone})
                      </a>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="h-8 text-xs gap-1.5"
                    >
                      <a href={`tel:${directPhone}`}>
                        <Icon name="Phone" size={13} />
                        Call
                      </a>
                    </Button>

                    <div className="ml-auto flex items-center gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => setAssignModalOpen(true)}
                        className="h-8 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Icon name="RefreshCw" size={13} />
                        Assign Lead
                      </Button>
                    </div>
                  </div>
                </SheetHeader>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-border/50 text-center">
                  <div className="bg-background rounded-lg p-2 border border-border/40">
                    <div className="text-xs text-muted-foreground">Total Inquiries</div>
                    <div className="text-lg font-bold text-foreground">
                      {metrics?.totalLeads ?? 0}
                    </div>
                  </div>
                  <div className="bg-background rounded-lg p-2 border border-border/40">
                    <div className="text-xs text-muted-foreground">Total Bookings</div>
                    <div className="text-lg font-bold text-foreground">
                      {metrics?.totalBookings ?? 0}
                    </div>
                  </div>
                  <div className="bg-background rounded-lg p-2 border border-border/40">
                    <div className="text-xs text-muted-foreground">Confirmed</div>
                    <div className="text-lg font-bold text-emerald-600">
                      {metrics?.confirmedBookings ?? 0}
                    </div>
                  </div>
                  <div className="bg-background rounded-lg p-2 border border-border/40">
                    <div className="text-xs text-muted-foreground">Min Rate</div>
                    <div className="text-lg font-bold text-foreground">
                      {b.minimumPrice ? formatPkr(Number(b.minimumPrice)) : "On req."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Tabs Surface */}
              <div className="flex-1 overflow-y-auto p-5">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-5 w-full mb-4">
                    <TabsTrigger value="overview" className="text-xs">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="leads" className="text-xs">
                      Leads ({leads.length})
                    </TabsTrigger>
                    <TabsTrigger value="bookings" className="text-xs">
                      Bookings ({bookings.length})
                    </TabsTrigger>
                    <TabsTrigger value="packages" className="text-xs">
                      Packages ({packages.length})
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="text-xs">
                      Settings
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB 1: OVERVIEW */}
                  <TabsContent value="overview" className="space-y-4">
                    {/* Ownership Card */}
                    <div className="rounded-xl border border-border/70 p-4 bg-muted/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Icon name="UserCheck" size={14} className="text-primary" />
                          Business Ownership & Claim Status
                        </h4>
                        <span className="text-xs font-mono text-muted-foreground">
                          Owner User ID: {vendor?.id || "Unclaimed (System)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs block">Owner Name:</span>
                          <span className="font-medium text-foreground">
                            {vendor?.fullName || "Unclaimed Listing"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Owner Email:</span>
                          <span className="font-medium text-foreground">
                            {vendor?.email || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Owner Phone:</span>
                          <span className="font-medium text-foreground">
                            {vendor?.phoneNumber || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Account Created:</span>
                          <span className="font-medium text-foreground">
                            {fmtDate(vendor?.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Details */}
                    <div className="rounded-xl border border-border/70 p-4 space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Icon name="Building2" size={14} className="text-primary" />
                        Operational Details
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs block">Capacity:</span>
                          <span className="font-medium">
                            {b.minCapacity ? `${b.minCapacity} – ` : ""}
                            {b.maxCapacity ? `${b.maxCapacity} guests` : "Flexible"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Direct Venue Phone:</span>
                          <span className="font-medium">{b.phoneNumber || "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Direct WhatsApp:</span>
                          <span className="font-medium">{b.whatsappNumber || "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Address / Street:</span>
                          <span className="font-medium">{b.address || "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">City & Area:</span>
                          <span className="font-medium">{b.city || "—"} ({b.subArea || "Citywide"})</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Completeness:</span>
                          <span className="font-medium">{b.completenessScore ?? 0}%</span>
                        </div>
                      </div>

                      {b.description && (
                        <div className="pt-2 border-t border-border/40">
                          <span className="text-muted-foreground text-xs block mb-1">Description:</span>
                          <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                            {b.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Photos Preview */}
                    {Array.isArray(b.images) && b.images.length > 0 && (
                      <div className="rounded-xl border border-border/70 p-4 space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Icon name="Image" size={14} className="text-primary" />
                          Venue Photos ({b.images.length})
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {b.images.slice(0, 8).map((imgUrl: string, idx: number) => (
                            <div
                              key={idx}
                              className="aspect-video rounded-md overflow-hidden bg-muted border border-border/40 relative"
                            >
                              <img
                                src={imgUrl}
                                alt={`Venue photo ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 2: LEADS (Live Inquiries) */}
                  <TabsContent value="leads" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Recent customer inquiries routed to or created for {b.name}.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssignModalOpen(true)}
                        className="h-7 text-xs gap-1"
                      >
                        <Icon name="Plus" size={13} />
                        Assign Lead
                      </Button>
                    </div>

                    {leads.length === 0 ? (
                      <div className="p-8 text-center rounded-xl border border-dashed border-border/80 text-muted-foreground space-y-2">
                        <Icon name="Inbox" size={32} className="mx-auto text-muted-foreground/60" />
                        <p className="text-sm">No inquiries recorded for this business yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {leads.map((lead) => (
                          <div
                            key={lead.id}
                            className="p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/30 transition-colors flex flex-wrap items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-foreground">
                                  {lead.contactName || "Client"}
                                </span>
                                <span className="text-muted-foreground font-mono">#{lead.id}</span>
                                <StatusPill tone="neutral">{lead.status}</StatusPill>
                              </div>
                              <div className="text-muted-foreground flex flex-wrap items-center gap-2">
                                <span>Phone: {lead.contactPhone || "—"}</span>
                                {lead.eventDate && <span>· Date: {lead.eventDate}</span>}
                                {lead.estimatedGuests && <span>· {lead.estimatedGuests} Guests</span>}
                                {lead.estimatedBudget && (
                                  <span>· Budget: {formatPkr(Number(lead.estimatedBudget))}</span>
                                )}
                              </div>
                              {lead.inquiry && (
                                <p className="text-foreground/80 italic line-clamp-1">
                                  "{lead.inquiry}"
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 ml-auto">
                              {lead.contactPhone && (
                                <Button size="sm" variant="ghost" className="h-7 px-2" asChild>
                                  <a href={`tel:${lead.contactPhone}`}>
                                    <Icon name="Phone" size={12} className="mr-1" /> Call
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 3: BOOKINGS */}
                  <TabsContent value="bookings" className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Confirmed & pending booking orders tied to {b.name}.
                    </p>
                    {bookings.length === 0 ? (
                      <div className="p-8 text-center rounded-xl border border-dashed border-border/80 text-muted-foreground space-y-2">
                        <Icon name="Calendar" size={32} className="mx-auto text-muted-foreground/60" />
                        <p className="text-sm">No bookings recorded for this business yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {bookings.map((bk) => (
                          <div
                            key={bk.id}
                            className="p-3 rounded-lg border border-border/60 bg-card flex flex-wrap items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-foreground">
                                  Booking #{bk.id}
                                </span>
                                <StatusPill tone="neutral">{bk.status}</StatusPill>
                                <span className="text-muted-foreground">
                                  Customer: {bk.customer?.fullName || "Guest"}
                                </span>
                              </div>
                              <div className="text-muted-foreground">
                                Event Date: {fmtDate(bk.eventDate || bk.bookingDate)} · Total:{" "}
                                <strong className="text-foreground">
                                  {formatPkr(Number(bk.totalAmount || 0))}
                                </strong>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 4: PACKAGES & MENUS */}
                  <TabsContent value="packages" className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Published Packages ({packages.length})
                      </h4>
                      {packages.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No custom packages published.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {packages.map((pkg) => (
                            <div
                              key={pkg.id}
                              className="p-3 rounded-lg border border-border/60 bg-card space-y-1 text-xs"
                            >
                              <div className="flex justify-between items-center font-semibold text-foreground">
                                <span>{pkg.name}</span>
                                <span>{formatPkr(pkg.price)}</span>
                              </div>
                              {pkg.description && (
                                <p className="text-muted-foreground line-clamp-2">{pkg.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Catering Menus ({menus.length})
                      </h4>
                      {menus.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No menus uploaded.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {menus.map((m) => (
                            <div
                              key={m.id}
                              className="p-3 rounded-lg border border-border/60 bg-card space-y-1 text-xs"
                            >
                              <div className="flex justify-between items-center font-semibold text-foreground">
                                <span>{m.title || m.name || "Menu"}</span>
                                <span>
                                  {m.pricePerHead ? `${formatPkr(m.pricePerHead)} / head` : "Flexible"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* TAB 5: SETTINGS & TRANSFER */}
                  <TabsContent value="settings" className="space-y-6">
                    {/* Direct Contact & Details Edit */}
                    <div className="rounded-xl border border-border/70 p-4 space-y-4 bg-card">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Icon name="Pencil" size={15} className="text-primary" />
                        Edit Business Information & Rates
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <Label htmlFor="edit-phone">Primary Phone Number</Label>
                          <Input
                            id="edit-phone"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="0327-4811220"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="edit-whatsapp">WhatsApp Number</Label>
                          <Input
                            id="edit-whatsapp"
                            value={editWhatsapp}
                            onChange={(e) => setEditWhatsapp(e.target.value)}
                            placeholder="0327-4811220"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="edit-min-price">Starting / Minimum Price (PKR)</Label>
                          <Input
                            id="edit-min-price"
                            type="number"
                            value={editMinPrice}
                            onChange={(e) => setEditMinPrice(e.target.value)}
                            placeholder="45000"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="edit-max-capacity">Max Guest Capacity</Label>
                          <Input
                            id="edit-max-capacity"
                            type="number"
                            value={editMaxCapacity}
                            onChange={(e) => setEditMaxCapacity(e.target.value)}
                            placeholder="500"
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <Label htmlFor="edit-description">Description</Label>
                          <Textarea
                            id="edit-description"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={3}
                            placeholder="Venue details, packages, halls, etc."
                          />
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => updateMut.mutate()}
                        disabled={updateMut.isPending}
                        className="text-xs gap-1.5"
                      >
                        {updateMut.isPending ? (
                          <>
                            <Spinner size={13} />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Icon name="Save" size={13} />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Transfer Ownership Form */}
                    <div className="rounded-xl border border-destructive/30 p-4 space-y-3 bg-destructive/5">
                      <h4 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                        <Icon name="UserPlus" size={15} />
                        Transfer Business Ownership
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Reassign this business from its current owner ({vendor?.fullName || "Unclaimed"})
                        to another registered vendor account by their User ID.
                      </p>
                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <Label htmlFor="transfer-user-id">New Vendor User ID</Label>
                          <Input
                            id="transfer-user-id"
                            value={transferUserId}
                            onChange={(e) => setTransferUserId(e.target.value)}
                            placeholder="e.g. 142"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="transfer-reason">Reason for Transfer (Audit Trail)</Label>
                          <Input
                            id="transfer-reason"
                            value={transferReason}
                            onChange={(e) => setTransferReason(e.target.value)}
                            placeholder="e.g. Vendor claimed ownership with CNIC proof"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => transferMut.mutate()}
                          disabled={!transferUserId || transferMut.isPending}
                          className="text-xs gap-1.5"
                        >
                          {transferMut.isPending ? (
                            <>
                              <Spinner size={13} />
                              Transferring...
                            </>
                          ) : (
                            <>
                              <Icon name="Check" size={13} />
                              Confirm Ownership Transfer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Embedded Reassignment Modal */}
      {b && (
        <AssignToBusinessModal
          open={assignModalOpen}
          onOpenChange={setAssignModalOpen}
          lead={{
            id: 0,
            contactName: "Admin Direct Assignment",
            businessName: b.name,
          }}
          onSuccess={() => {
            refetch()
            onRefreshList?.()
          }}
        />
      )}
    </>
  )
}

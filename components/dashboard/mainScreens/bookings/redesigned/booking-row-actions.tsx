"use client"

/**
 * Bookings — redesigned row actions.
 *
 * Restores the row-level actions that the original Bookings screen exposes
 * (Record payment, Record refund, Mark completed, Cancel booking, Quick view,
 * and a Link to the detail page) inside the redesigned shell.
 *
 * STRATEGY: this is only the redesign-style SHELL. Every dialog/sheet is the
 * SAME already-working component the original `row-actions.tsx` mounts — they
 * are imported, not rebuilt. The destructive mutations (cancel / complete) hit
 * the SAME backend endpoints via axiosInstance. onSuccess is wired to the
 * caller's refetch so the live DataTable refreshes, matching how the view
 * already reuses OfflineBookingDialog/EditBookingDialog.
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/dashboard/shared/icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import type { BookingData } from "@/lib/dashboard-types"
import axiosInstance from "@/lib/axiosConfig"
import { BACKEND_URL } from "@/lib/backend-url"
// Reused — original screen's already-working dialogs/sheet.
import { BookingDetailSheet } from "@/components/dashboard/mainScreens/bookings/bookingListing/components/booking-detail-sheet"
import { RecordPaymentDialog } from "@/components/dashboard/mainScreens/bookings/bookingListing/components/record-payment-dialog"
import { RecordRefundDialog } from "@/components/dashboard/mainScreens/bookings/bookingListing/components/record-refund-dialog"
import { EditBookingDialog } from "@/components/dashboard/mainScreens/bookings/bookingListing/components/edit-booking-dialog"

interface BookingRowActionsProps {
  data: BookingData
  /** Caller's refetch — invoked after any successful action so the table refreshes. */
  onRefresh: () => void
}

export function BookingRowActions({ data, onRefresh }: BookingRowActionsProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sheetData, setSheetData] = useState<BookingData>(data)

  // Keep the quick-view sheet in sync when the table data updates.
  useEffect(() => { setSheetData(data) }, [data])

  // Mirrors the original gating exactly so behavior matches.
  const canEdit =
    (data.status === "Confirmed" || data.status === "Pending" || data.status === "Awaiting Payment") &&
    data.paymentStatus !== "Paid"
  const canCancel =
    data.status === "Pending" || data.status === "Confirmed" || data.status === "Awaiting Payment"
  const canRecordPayment =
    data.paymentStatus !== "Paid" && data.status !== "Cancelled" && data.status !== "Awaiting Payment"
  const canRefund =
    (data.paymentStatus === "Partial" || data.paymentStatus === "Paid") && data.status !== "Cancelled"
  const canComplete = data.status === "Confirmed" && data.paymentStatus === "Paid"

  const handleEditSuccess = (updated: Partial<BookingData> | null) => {
    if (updated) {
      setSheetData((prev) => ({ ...prev, ...updated, bookingDetails: prev.bookingDetails }))
    }
    onRefresh()
  }

  const handleCancel = async () => {
    try {
      setLoading(true)
      if (data.status === "Awaiting Payment") {
        await axiosInstance.delete(`${BACKEND_URL}api/v1/bookings/${data.id}/cancel-pending`)
      } else {
        await axiosInstance.patch(`${BACKEND_URL}api/v1/bookings/${data.id}/cancel`)
      }
      toast({ title: "Booking Cancelled", description: `Booking #${data.id} has been cancelled.` })
      onRefresh()
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err?.response?.data?.message || "Could not cancel booking.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setConfirmCancel(false)
    }
  }

  const handleComplete = async () => {
    try {
      setLoading(true)
      await axiosInstance.patch(`${BACKEND_URL}api/v1/bookings/${data.id}`, { status: "Completed" })
      toast({ title: "Booking Completed", description: `Booking #${data.id} has been marked as completed.` })
      onRefresh()
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err?.response?.data?.message || "Could not complete booking.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Quick edit — kept as a direct icon button to match the prior column affordance. */}
      {canEdit && (
        <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)} aria-label="Edit booking">
          <Icon name="Pencil" size={14} />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 data-[state=open]:bg-muted" aria-label="Booking actions">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon name="MoreHorizontal" size={16} />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem onClick={() => setSheetOpen(true)}>
            <Icon name="Eye" size={14} className="mr-2" />
            Quick view
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/bookings/${data.id}`}>
              <Icon name="ExternalLink" size={14} className="mr-2" />
              View detail page
            </Link>
          </DropdownMenuItem>

          {canRecordPayment && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPaymentOpen(true)}>
                <Icon name="CreditCard" size={14} className="mr-2 text-emerald-600" />
                Record payment
              </DropdownMenuItem>
            </>
          )}
          {canRefund && (
            <DropdownMenuItem onClick={() => setRefundOpen(true)}>
              <Icon name="RotateCw" size={14} className="mr-2 text-amber-600" />
              Record refund
            </DropdownMenuItem>
          )}
          {canComplete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleComplete} disabled={loading} className="text-green-600 focus:text-green-600">
                <Icon name="CheckCircle2" size={14} className="mr-2" />
                Mark as completed
              </DropdownMenuItem>
            </>
          )}
          {canCancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmCancel(true)}
                disabled={loading}
                className="text-red-600 focus:text-red-600"
              >
                <Icon name="XCircle" size={14} className="mr-2" />
                Cancel booking
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reused dialogs/sheet — wired to the caller's refetch. */}
      <BookingDetailSheet open={sheetOpen} onOpenChange={setSheetOpen} booking={sheetData} />

      <EditBookingDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        booking={sheetData}
        onSuccess={handleEditSuccess}
      />

      <RecordPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        booking={data}
        onSuccess={onRefresh}
      />

      <RecordRefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        booking={data}
        onSuccess={onRefresh}
      />

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel booking #{data.id}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>No, keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, cancel booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default BookingRowActions

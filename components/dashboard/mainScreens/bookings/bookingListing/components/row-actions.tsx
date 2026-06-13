"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MoreHorizontal, Eye, Pencil, XCircle, Loader2, CreditCard, CheckCircle2, ExternalLink, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { BookingData } from "@/lib/dashboard-types"
import { BookingDetailSheet } from "./booking-detail-sheet"
import { RecordPaymentDialog } from "./record-payment-dialog"
import { RecordRefundDialog } from "./record-refund-dialog"
import { EditBookingDialog } from "./edit-booking-dialog"
import axiosInstance from "@/lib/axiosConfig"
import { BACKEND_URL } from "@/lib/backend-url"
import { toast } from "@/components/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"

interface DataTableRowActionsProps {
  data: BookingData
}

export function RowActions({ data }: DataTableRowActionsProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  // Issue #63 — manual refund flow.
  const [refundOpen, setRefundOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sheetData, setSheetData] = useState<BookingData>(data)
  const queryClient = useQueryClient()

  // Keep sheetData in sync when table data updates (background refetch)
  useEffect(() => { setSheetData(data) }, [data])

  // Issue #11 — useFetchData hashes the query under
  // `[endpoint, ...queryKey, params]`, so to invalidate every
  // bookings-flavoured query in one shot we match on the endpoint
  // string at position [0]. Covers BOTH the vendor endpoint
  // (`/api/v1/bookings`) AND the admin endpoint
  // (`/api/v1/bookings/admin/bookings`), plus the pipeline view
  // which lives under the same vendor endpoint with a different
  // second-position label. The previous concrete-key match missed
  // the admin endpoint and was silently inert on the pipeline view.
  const refreshBookings = () => {
    queryClient.invalidateQueries({
      predicate: (q) =>
        typeof q.queryKey[0] === 'string' &&
        q.queryKey[0].includes('/bookings'),
    })
  }

  const handleEditSuccess = (updated: Partial<BookingData> | null) => {
    if (updated) {
      // Merge server response immediately — preserving nested bookingDetails
      setSheetData(prev => ({ ...prev, ...updated, bookingDetails: prev.bookingDetails }))
    }
    setSheetOpen(true)
    refreshBookings()
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
      refreshBookings()
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

  const canEdit = (data.status === "Confirmed" || data.status === "Pending" || data.status === "Awaiting Payment") && data.paymentStatus !== "Paid"
  const canCancel = data.status === "Pending" || data.status === "Confirmed" || data.status === "Awaiting Payment"
  const canRecordPayment = data.paymentStatus !== "Paid" && data.status !== "Cancelled" && data.status !== "Awaiting Payment"
  // Issue #63 — refund available whenever there's money in (Partial or
  // Paid) and the booking isn't already cancelled. Lets a vendor refund
  // a goodwill amount from a Paid booking without cancelling.
  const canRefund = (data.paymentStatus === "Partial" || data.paymentStatus === "Paid") && data.status !== "Cancelled"
  const canComplete = data.status === "Confirmed" && data.paymentStatus === "Paid"

  const handleComplete = async () => {
    try {
      setLoading(true)
      await axiosInstance.patch(`${BACKEND_URL}api/v1/bookings/${data.id}`, { status: "Completed" })
      toast({ title: "Booking Completed", description: `Booking #${data.id} has been marked as completed.` })
      refreshBookings()
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem onClick={() => setSheetOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Quick view
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/bookings/${data.id}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open detail page
            </Link>
          </DropdownMenuItem>
          {canEdit && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4 text-blue-600" />
                Edit Booking
              </DropdownMenuItem>
            </>
          )}
          {canRecordPayment && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPaymentOpen(true)}>
                <CreditCard className="mr-2 h-4 w-4 text-emerald-600" />
                Record Payment
              </DropdownMenuItem>
            </>
          )}
          {canRefund && (
            <DropdownMenuItem onClick={() => setRefundOpen(true)}>
              <Undo2 className="mr-2 h-4 w-4 text-amber-600" />
              Record refund
            </DropdownMenuItem>
          )}
          {canComplete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleComplete} disabled={loading} className="text-green-600 focus:text-green-600">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Completed
              </DropdownMenuItem>
            </>
          )}
          {canCancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setConfirmCancel(true)} disabled={loading} className="text-red-600 focus:text-red-600">
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Booking
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
        onSuccess={refreshBookings}
      />

      <RecordRefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        booking={data}
        onSuccess={refreshBookings}
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
    </>
  )
}

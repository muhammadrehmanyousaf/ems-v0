"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Eye, Pencil, XCircle, Loader2, CreditCard, CheckCircle2 } from "lucide-react"
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
  const [loading, setLoading] = useState(false)
  const [sheetData, setSheetData] = useState<BookingData>(data)
  const queryClient = useQueryClient()

  // Keep sheetData in sync when table data updates (background refetch)
  useEffect(() => { setSheetData(data) }, [data])

  const refreshBookings = () => {
    queryClient.refetchQueries({ queryKey: ['/api/v1/bookings'] })
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
            View Details
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

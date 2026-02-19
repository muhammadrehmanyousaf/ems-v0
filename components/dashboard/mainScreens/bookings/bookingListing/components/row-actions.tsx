"use client"

import { useState } from "react"
import { MoreHorizontal, Eye, CheckCircle, XCircle, Loader2, CreditCard } from "lucide-react"
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
import axiosInstance from "@/lib/axiosConfig"
import { BACKEND_URL } from "@/lib/backend-url"
import { toast } from "@/components/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"

interface DataTableRowActionsProps {
  data: BookingData
}

export function RowActions({ data }: DataTableRowActionsProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const refreshBookings = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/v1/bookings'] })
  }

  const handleApprove = async () => {
    try {
      setLoading(true)
      await axiosInstance.patch(`${BACKEND_URL}api/v1/bookings/${data.id}/approve`)
      toast({ title: "Booking Approved", description: `Booking #${data.id} has been approved.` })
      refreshBookings()
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err?.response?.data?.message || "Could not approve booking.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    try {
      setLoading(true)
      await axiosInstance.patch(`${BACKEND_URL}api/v1/bookings/${data.id}/cancel`)
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

  const isPending = data.status === "Pending"
  const canCancel = data.status === "Pending" || data.status === "Confirmed"
  const canRecordPayment = data.paymentStatus !== "Paid" && data.status !== "Cancelled"

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
          {canRecordPayment && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPaymentOpen(true)}>
                <CreditCard className="mr-2 h-4 w-4 text-emerald-600" />
                Record Payment
              </DropdownMenuItem>
            </>
          )}
          {isPending && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleApprove} disabled={loading}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                Approve
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

      <BookingDetailSheet open={sheetOpen} onOpenChange={setSheetOpen} booking={data} onApprove={isPending ? handleApprove : undefined} />

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

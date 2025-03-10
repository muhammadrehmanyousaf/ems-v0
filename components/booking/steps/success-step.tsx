"use client"

import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BookingFormData } from "@/lib/types"

interface SuccessStepProps {
  formData: BookingFormData
}

export default function SuccessStep({ formData }: SuccessStepProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-6 rounded-full bg-green-100 p-3">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>

      <h2 className="mb-2 text-2xl font-bold">Booking Confirmed!</h2>

      <p className="mb-6 max-w-md text-muted-foreground">
        Thank you for your booking, {formData.username}. We have sent a confirmation email to {formData.email} with all
        the details.
      </p>

      <div className="mb-8 rounded-lg border bg-muted/50 p-4 text-left">
        <p className="font-medium">
          Booking Reference: <span className="text-primary">VB-{Math.floor(100000 + Math.random() * 900000)}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Please keep this reference for your records.</p>
      </div>

      <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
        <Button variant="outline" onClick={() => window.print()}>
          Print Receipt
        </Button>
        <Button onClick={() => (window.location.href = "/")}>Return to Home</Button>
      </div>
    </div>
  )
}


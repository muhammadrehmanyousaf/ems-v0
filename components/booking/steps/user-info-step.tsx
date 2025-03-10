"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BookingFormData } from "@/lib/types"

interface UserInfoStepProps {
  formData: BookingFormData
  updateFormData: (data: Partial<BookingFormData>) => void
}

export default function UserInfoStep({ formData, updateFormData }: UserInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Personal Information</h2>
        <p className="text-muted-foreground">Please provide your contact details to proceed with the booking</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Full Name</Label>
          <Input
            id="username"
            placeholder="Enter your full name"
            value={formData.username}
            onChange={(e) => updateFormData({ username: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            placeholder="Enter your phone number"
            value={formData.phoneNumber}
            onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => updateFormData({ password: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
        </div>
      </div>
    </div>
  )
}


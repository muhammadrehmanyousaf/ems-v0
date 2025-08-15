"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BookingFormData } from "@/lib/types"
import { User, Phone, Mail, Lock, Eye, EyeOff } from "lucide-react"

interface UserInfoStepProps {
  formData: BookingFormData
  updateFormData: React.Dispatch<React.SetStateAction<BookingFormData>>
}

export default function UserInfoStep({ formData, updateFormData }: UserInfoStepProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-neutral-900">Personal Information</h2>
        <p className="text-neutral-600">Please provide your contact details to proceed with the booking</p>
      </div>

      <div className="mx-auto max-w-md space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium text-neutral-700">
            Full Name
          </Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-5 w-5 text-neutral-400" />
            </div>
            <Input
              id="username"
              placeholder="Enter your full name"
              value={formData.username}
              type="text"
              onChange={(e) => updateFormData({
                ...formData,
                username: e.target.value
              })}
              className="pl-10 border-neutral-300 focus:border-rose-500 focus:ring-rose-500"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="text-sm font-medium text-neutral-700">
            Phone Number
          </Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Phone className="h-5 w-5 text-neutral-400" />
            </div>
            <Input
              id="phoneNumber"
              placeholder="Enter your phone number"
              value={formData.phoneNumber ?? ''}
              onChange={(e) =>
                updateFormData({ ...formData, phoneNumber: String(e.target.value) })
              }
              className="pl-10 border-neutral-300 focus:border-rose-500 focus:ring-rose-500"
              type={formData.phoneNumber !=='' ? 'tel' : 'number'}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
            Email Address
          </Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-5 w-5 text-neutral-400" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={(e) => updateFormData({ ...formData, email: e.target.value })}
              className="pl-10 border-neutral-300 focus:border-rose-500 focus:ring-rose-500"
              required
            />
          </div>
        </div>
      </div>
      <div className="mt-6 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 p-4 max-w-md mx-auto border border-rose-200">
        <p className="text-sm text-rose-700">
          Your information is secure and will only be used for booking purposes. We'll send confirmation details to
          your email.
        </p>
      </div>
    </div>
  )
}

"use client"

import { useFormContext } from "@/context/form-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { Flag } from "lucide-react"

export function PersonalDetailsStep() {
  const { formData, updateFormData } = useFormContext()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => updateFormData({ fullName: e.target.value })}
          placeholder="Enter your full name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
          placeholder="Enter your email address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactNumber">Contact Number *</Label>
        <div className="flex">
          <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-gray-50">
            <Flag className="w-4 h-4 text-gray-500" />
            <span className="ml-2 text-sm text-gray-500">+92</span>
          </div>
          <Input
            id="contactNumber"
            type="tel"
            value={formData.contactNumber}
            onChange={(e) => updateFormData({ contactNumber: e.target.value })}
            placeholder="Enter your phone number"
            className="rounded-l-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => updateFormData({ password: e.target.value })}
          placeholder="Enter your password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Retype Password *</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
          placeholder="Confirm your password"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="agreeToTerms"
          checked={formData.agreeToTerms}
          onCheckedChange={(checked) => updateFormData({ agreeToTerms: checked as boolean })}
        />
        <Label htmlFor="agreeToTerms" className="text-sm text-gray-700">
          Agree to{" "}
          <Link href="/terms" className="text-rose-600 hover:underline">
            Terms & Conditions
          </Link>
        </Label>
      </div>
    </div>
  )
}


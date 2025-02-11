"use client"

import { useFormContext } from "@/lib/context/form-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Flag } from "lucide-react"

export function ContactDetailsStep() {
  const { formData, updateFormData } = useFormContext()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="brandName">Brand Name *</Label>
        <Input
          id="brandName"
          value={formData.brandName}
          onChange={(e) => updateFormData({ brandName: e.target.value })}
          placeholder="Enter your brand name"
          className="focus:ring-0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="secondaryContact">Contact Number Secondary</Label>
        <div className="flex">
          <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-gray-50">
            <Flag className="w-4 h-4 text-gray-500" />
            <span className="ml-2 text-sm text-gray-500">+92</span>
          </div>
          <Input
            id="secondaryContact"
            type="tel"
            value={formData.secondaryContact}
            onChange={(e) => updateFormData({ secondaryContact: e.target.value })}
            placeholder="Enter secondary contact number"
            className="rounded-l-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="websiteUrl">Website</Label>
        <Input
          id="websiteUrl"
          type="url"
          value={formData.websiteUrl}
          onChange={(e) => updateFormData({ websiteUrl: e.target.value })}
          placeholder="Enter your website URL"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instagramUrl">Instagram Link *</Label>
        <Input
          id="instagramUrl"
          type="url"
          value={formData.instagramUrl}
          onChange={(e) => updateFormData({ instagramUrl: e.target.value })}
          placeholder="Enter your Instagram profile URL"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="facebookUrl">Facebook Link</Label>
        <Input
          id="facebookUrl"
          type="url"
          value={formData.facebookUrl}
          onChange={(e) => updateFormData({ facebookUrl: e.target.value })}
          placeholder="Enter your Facebook page URL"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bookingEmail">Booking Email *</Label>
        <Input
          id="bookingEmail"
          type="email"
          value={formData.bookingEmail}
          onChange={(e) => updateFormData({ bookingEmail: e.target.value })}
          placeholder="Enter your booking email address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="officeAddress">Office Address</Label>
        <Input
          id="officeAddress"
          value={formData.officeAddress}
          onChange={(e) => updateFormData({ officeAddress: e.target.value })}
          placeholder="Enter your office address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="googleMapsLink">Office Google Link</Label>
        <Input
          id="googleMapsLink"
          type="url"
          value={formData.googleMapsLink}
          onChange={(e) => updateFormData({ googleMapsLink: e.target.value })}
          placeholder="Enter your office Google Maps link"
        />
      </div>
    </div>
  )
}


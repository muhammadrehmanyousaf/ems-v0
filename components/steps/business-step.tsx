"use client"

import { useFormContext } from "@/context/form-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

const businessTypes = [
  "Wedding Venues",
  "Photographers",
  "Makeup Artists",
  "Decor",
  "Catering",
  "Henna Artists",
  "Wedding Stationery",
  "Bridal Wear",
  "Car Rental",
]

const cities = ["Lahore", "Islamabad", "Karachi", "Rawalpindi", "Faisalabad"]

const staffTypes = ["Photographers", "Videographers", "Makeup Artists", "Event Planners", "Decorators", "Caterers"]

export function BusinessStep() {
  const { formData, updateFormData } = useFormContext()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name</Label>
        <Input
          id="businessName"
          value={formData.businessName}
          onChange={(e) => updateFormData({ businessName: e.target.value })}
          placeholder="Enter your business name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessType">Business Type</Label>
        <Select value={formData.businessType} onValueChange={(value) => updateFormData({ businessType: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select business type" />
          </SelectTrigger>
          <SelectContent>
            {businessTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Select value={formData.city} onValueChange={(value) => updateFormData({ city: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => updateFormData({ address: e.target.value })}
          placeholder="Enter your business address"
        />
      </div>

      <div className="space-y-2">
        <Label>Staff Types</Label>
        <div className="grid grid-cols-2 gap-4">
          {staffTypes.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={type}
                checked={formData.staffTypes.includes(type)}
                onCheckedChange={(checked) => {
                  const updatedTypes = checked
                    ? [...formData.staffTypes, type]
                    : formData.staffTypes.filter((t) => t !== type)
                  updateFormData({ staffTypes: updatedTypes })
                }}
              />
              <Label htmlFor={type}>{type}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


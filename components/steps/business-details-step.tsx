"use client"

import { useFormContext } from "@/lib/context/form-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"

export function BusinessDetailsStep() {
  const { formData, updateFormData } = useFormContext()

  const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad"]
  const staffTypes = ["MALE", "FEMALE", "TRANSGENDER"]
  const paymentTypes = ["Full Amount", "Partial Amount", "No Advance"]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="citiesCovered">Cities Covered *</Label>
        <Select
          value={formData.citiesCovered[0] || ""}
          onValueChange={(value) => updateFormData({ citiesCovered: [value] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Cities" />
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
        <Label>Staff *</Label>
        <div className="flex flex-wrap gap-4">
          {staffTypes.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Switch
                id={type}
                checked={formData.staffGender.includes(type)}
                onCheckedChange={(checked) => {
                  const updatedStaff = checked
                    ? [...formData.staffGender, type]
                    : formData.staffGender.filter((t) => t !== type)
                  updateFormData({ staffGender: updatedStaff })
                }}
              />
              <Label htmlFor={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minimumPrice">Minimum Price</Label>
        <Input
          id="minimumPrice"
          type="number"
          value={formData.minimumPrice}
          onChange={(e) => updateFormData({ minimumPrice: Number.parseInt(e.target.value) })}
          placeholder="Enter minimum price"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Enter description"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalInfo">Additional Info</Label>
        <Textarea
          id="additionalInfo"
          value={formData.additionalInfo}
          onChange={(e) => updateFormData({ additionalInfo: e.target.value })}
          placeholder="Enter additional information"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentType">Down payment Type</Label>
        <Select value={formData.paymentType} onValueChange={(value) => updateFormData({ paymentType: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment type" />
          </SelectTrigger>
          <SelectContent>
            {paymentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="downPaymentPrice">Down Payment Price</Label>
        <Input
          id="downPaymentPrice"
          type="number"
          value={formData.downPaymentPrice || ""}
          onChange={(e) => updateFormData({ downPaymentPrice: Number.parseInt(e.target.value) })}
          placeholder="Enter down payment price"
        />
      </div>

      <div className="space-y-2">
        <Label>Covid Compliant? *</Label>
        <div className="flex items-center space-x-2">
          <Switch
            id="covidCompliant"
            checked={formData.covidCompliant}
            onCheckedChange={(checked) => updateFormData({ covidCompliant: checked })}
          />
          <Label htmlFor="covidCompliant">Yes</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Cancellation Policy *</Label>
        <RadioGroup
          value={formData.cancellationPolicy}
          onValueChange={(value) => updateFormData({ cancellationPolicy: value as any })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="REFUNDABLE" id="refundable" />
            <Label htmlFor="refundable">Refundable</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="NON_REFUNDABLE" id="non-refundable" />
            <Label htmlFor="non-refundable">Non-Refundable</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="PARTIALLY_REFUNDABLE" id="partially-refundable" />
            <Label htmlFor="partially-refundable">Partially Refundable</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}


import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import type { Filters, StaffOption, VendorType } from "@/lib/types"
import { cities, vendorTypes, cancellationPolicies, amenities, staffOptions } from "@/lib/data"

interface FilterContentProps {
  filters: Filters
  handleFilterChange: (key: string, value: string | number | string[]) => void
  handleAmenityToggle: (amenity: string) => void
  handleStaffToggle: (staff: StaffOption) => void
  handleResetFilters: () => void
  vendorType: string
}

export default function FilterContent({
  filters,
  handleFilterChange,
  handleAmenityToggle,
  handleStaffToggle,
  handleResetFilters,
  vendorType,
}: FilterContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block mb-2 font-medium">City</label>
        <Select value={filters.city} onValueChange={(value) => handleFilterChange("city", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a city" />
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
      <div>
        <label className="block mb-2 font-medium">Sub Area</label>
        <Input
          value={filters.subArea}
          placeholder="e.g. G-10 Markaz"
          onChange={(e) => handleFilterChange("subArea", e.target.value)}
        />
      </div>
      <div>
        <label className="block mb-2 font-medium">Price Range (PKR)</label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange("minPrice", e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="block mb-2 font-medium">Type</label>
        <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {vendorTypes[vendorType as VendorType].map((type:any) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {vendorType === "venues" && (
        <div>
          <label className="block mb-2 font-medium">Capacity</label>
          <Input
            type="number"
            placeholder="Enter capacity"
            value={filters.capacity}
            onChange={(e) => handleFilterChange("capacity", e.target.value)}
          />
        </div>
      )}
      <div>
        <label className="block mb-2 font-medium">Amenities</label>
        <div className="space-y-2">
          {amenities[vendorType as VendorType].map((amenity) => (
            <div key={amenity} className="flex items-center">
              <Checkbox
                id={`amenity-${amenity}`}
                checked={filters.amenities.includes(amenity)}
                onCheckedChange={() => handleAmenityToggle(amenity)}
              />
              <label htmlFor={`amenity-${amenity}`} className="ml-2">
                {amenity}
              </label>
            </div>
          ))}
        </div>
      </div>
      {vendorType === "venues" && (
        <div>
          <label className="block mb-2 font-medium">Cancellation Policy</label>
          <Select
            value={filters.cancellationPolicy}
            onValueChange={(value) => handleFilterChange("cancellationPolicy", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select policy" />
            </SelectTrigger>
            <SelectContent>
              {cancellationPolicies.map((policy) => (
                <SelectItem key={policy} value={policy}>
                  {policy}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <label className="block mb-2 font-medium">Staff</label>
        <div className="space-y-2">
          {staffOptions.map((staff) => (
            <div key={staff} className="flex items-center">
              <Checkbox
                id={`staff-${staff}`}
                checked={filters.staff.includes(staff as StaffOption)}
                onCheckedChange={() => handleStaffToggle(staff as StaffOption)}
              />
              <label htmlFor={`staff-${staff}`} className="ml-2 capitalize">
                {staff}
              </label>
            </div>
          ))}
        </div>
      </div>
      <Button onClick={handleResetFilters} variant="outline" className="w-full">
        Reset Filters
      </Button>
    </div>
  )
}


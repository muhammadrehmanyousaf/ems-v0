"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import VendorCard from "@/components/VendorCard"
import { vendors as allVendors } from "@/app/data/vendors"
import { cities, vendorTypes } from "@/app/data/filters"

const FilterInput = ({ searchTerm, setSearchTerm }: { searchTerm: string; setSearchTerm: (value: string) => void }) => (
  <Input
    type="text"
    placeholder="Search vendors or cities..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="max-w-xs"
  />
)

const CitySelect = ({ selectedCity, setSelectedCity }: { selectedCity: string; setSelectedCity: (value: string) => void }) => (
  <Select value={selectedCity} onValueChange={setSelectedCity}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Select city" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Cities</SelectItem>
      {cities.map((city) => (
        <SelectItem key={city} value={city}>
          {city}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

const TypeSelect = ({ selectedType, setSelectedType }: { selectedType: string; setSelectedType: (value: string) => void }) => (
  <Select value={selectedType} onValueChange={setSelectedType}>
    <div>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Vendor type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        {vendorTypes.map((type) => (
          <SelectItem key={type} value={type}>
            {type}
          </SelectItem>
        ))}
      </SelectContent>
    </div>
  </Select>
)

export default function VendorsComponent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCity, setSelectedCity] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [vendors, setVendors] = useState(allVendors)
  const searchParams = useSearchParams()

  useEffect(() => {
    const category = searchParams.get("category")
    if (category) {
      setSelectedType(category)
    }
  }, [searchParams])

  useEffect(() => {
    const filteredVendors = allVendors.filter((vendor) => {
      const matchesSearchTerm = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) || vendor.city.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCity = selectedCity === "all" || vendor.city === selectedCity
      const matchesType = selectedType === "all" || vendor.type.toLowerCase() === selectedType.toLowerCase()

      return matchesSearchTerm && matchesCity && matchesType
    })
    setVendors(filteredVendors)
  }, [searchTerm, selectedCity, selectedType])

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Wedding Vendors</h1>

      {/* Search and Filters */}
      <div className="mb-6 sm:mb-8 flex flex-wrap gap-3 sm:gap-4">
        <FilterInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <CitySelect selectedCity={selectedCity} setSelectedCity={setSelectedCity} />
        <TypeSelect selectedType={selectedType} setSelectedType={setSelectedType} />
      </div>

      {/* Filtered Vendors */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8 sm:mb-12">
        {vendors.map((vendor) => (
          <VendorCard
            key={vendor.id}
            id={vendor.id}
            name={vendor.name}
            type={vendor.type}
            rating={vendor.rating}
            reviews={vendor.reviews}
            image={vendor.image}
            price={vendor.price}
            location={vendor.city}
          />
        ))}
      </div>
    </div>
  )
}

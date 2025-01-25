"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VendorCard } from "@/components/vendor-card"

// Mock data for vendors
const allVendors = [
  {
    id: "1",
    name: "Elegant Events",
    city: "Lahore",
    type: "Event Planner",
    rating: 4.8,
    reviews: 156,
    image:
      "https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    price: "₨₨₨",
  },
  {
    id: "2",
    name: "Capture Moments",
    city: "Islamabad",
    type: "Photographer",
    rating: 4.9,
    reviews: 203,
    image:
      "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    price: "₨₨",
  },
  {
    id: "3",
    name: "Delicious Delights",
    city: "Karachi",
    type: "Caterer",
    rating: 4.7,
    reviews: 178,
    image:
      "https://images.pexels.com/photos/5638527/pexels-photo-5638527.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    price: "₨₨₨₨",
  },
  {
    id: "4",
    name: "Floral Fantasy",
    city: "Peshawar",
    type: "Decorator",
    rating: 4.6,
    reviews: 192,
    image:
      "https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    price: "₨₨",
  },
  {
    id: "5",
    name: "Melodic Tunes",
    city: "Faisalabad",
    type: "Music Band",
    rating: 4.8,
    reviews: 145,
    image:
      "https://images.pexels.com/photos/2747446/pexels-photo-2747446.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    price: "₨₨",
  },
]

const cities = ["Lahore", "Islamabad", "Karachi", "Peshawar", "Faisalabad"]
const vendorTypes = ["Event Planner", "Photographer", "Caterer", "Decorator", "Music Band"]

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedType, setSelectedType] = useState("")
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
      return (
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCity === "" || vendor.city === selectedCity) &&
        (selectedType === "" || vendor.type.toLowerCase() === selectedType.toLowerCase())
      )
    })
    setVendors(filteredVendors)
  }, [searchTerm, selectedCity, selectedType])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Wedding Vendors</h1>

      {/* Search and Filters */}
      <div className="mb-8 flex flex-wrap gap-4">
        <Input
          type="text"
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
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
        <Select value={selectedType} onValueChange={setSelectedType}>
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
        </Select>
      </div>

      {/* Filtered Vendors */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
            city={vendor.city}
          />
        ))}
      </div>
    </div>
  )
}


"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VenueCard } from "@/components/venue-card"
import { venues } from "@/app/data/venues"
import { cities, venueTypes } from "@/app/data/filters"

const FilterInput = ({ searchTerm, setSearchTerm }: { searchTerm: string; setSearchTerm: (value: string) => void }) => (
  <Input
    type="text"
    placeholder="Search venues or cities..."
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
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Venue type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Types</SelectItem>
      {venueTypes.map((type) => (
        <SelectItem key={type} value={type}>
          {type}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

export default function VenuesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCity, setSelectedCity] = useState("all")
  const [selectedType, setSelectedType] = useState("all")

  const filteredVenues = venues.filter((venue) => {
    const matchesSearchTerm = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) || venue.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCity = selectedCity === "all" || venue.city === selectedCity
    const matchesType = selectedType === "all" || venue.type === selectedType

    return matchesSearchTerm && matchesCity && matchesType
  })

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Wedding Venues</h1>

      {/* Search and Filters */}
      <div className="mb-8 flex flex-wrap gap-4">
        <FilterInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <CitySelect selectedCity={selectedCity} setSelectedCity={setSelectedCity} />
        <TypeSelect selectedType={selectedType} setSelectedType={setSelectedType} />
      </div>

      {/* Filtered Venues */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredVenues.map((venue) => (
          <VenueCard
            key={venue.id}
            id={venue.id}
            name={venue.name}
            type={venue.type}
            capacity={venue.capacity}
            rating={venue.rating}
            reviews={venue.reviews}
            image={venue.image}
            price={venue.price}
            city={venue.city}
          />
        ))}
      </div>
    </div>
  )
}


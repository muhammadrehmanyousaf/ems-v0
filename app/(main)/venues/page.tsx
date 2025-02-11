"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VendorCard } from "@/components/vendor-card"
import { venues } from "@/app/data/venues"
import { cities, venueTypes , venueCapacity } from "@/app/data/filters"
import Image from "next/image"
import NotFoundImg from '../../../public/see-1019991_1280.jpg'

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

const TypeCapacity = ({ selectedCapacity, setSelectedCapacity }: { selectedCapacity: string; setSelectedCapacity: (value: string) => void }) => (
  <Select value={selectedCapacity} onValueChange={setSelectedCapacity}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Venue capacity" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Capacities</SelectItem>
      {venueCapacity.map((capacity) => (
        <SelectItem key={capacity} value={capacity}>
          {capacity}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);


export default function VenuesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCity, setSelectedCity] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedCapacity, setSelectedCapacity] = useState("all")

  const filteredVenues = venues.filter((venue) => {
    const matchesSearchTerm = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) || venue.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCity = selectedCity === "all" || venue.city === selectedCity
    const matchesType = selectedType === "all" || venue.type === selectedType
    const matchesCapacity = selectedCapacity === "all" || venue.capacity >= parseInt(selectedCapacity, 10);

    return matchesSearchTerm && matchesCity && matchesType && matchesCapacity
  })

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Wedding Venues</h1>
  
      {/* Search and Filters */}
      <div className="mb-8 flex flex-wrap gap-4">
        <FilterInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <CitySelect selectedCity={selectedCity} setSelectedCity={setSelectedCity} />
        <TypeSelect selectedType={selectedType} setSelectedType={setSelectedType} />
        <TypeCapacity selectedCapacity={selectedCapacity} setSelectedCapacity={setSelectedCapacity} />
      </div>
  
      {/* Filtered Venues */}
      {filteredVenues.length > 0 ? (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
    {filteredVenues.map((venue) => (
      <VendorCard
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
) : (
  <div className="flex flex-col justify-center items-center h-[70vh] text-center">
    <Image src={NotFoundImg} width={64} height={64} alt="No venues found" className="w-64 h-64 mb-6" />
    <h2 className="text-2xl font-semibold text-gray-700">Oops! No venues match your search.</h2>
    <p className="text-gray-500 mt-2">Try adjusting the filters or explore other options.</p>
    <button 
      onClick={() => {
        setSearchTerm("");
        setSelectedCity("all");
        setSelectedType("all");
        setSelectedCapacity("all");
      }}
      className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
    >
      Reset Filters
    </button>
  </div>
)}
    </div>
  );
  
}


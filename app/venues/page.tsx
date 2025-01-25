"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VenueCard } from "@/components/venue-card"

// Mock data for venues
const venues = [
  {
    id: "1",
    name: "Grand Palace",
    city: "Lahore",
    type: "Banquet Hall",
    capacity: 500,
    rating: 4.8,
    reviews: 156,
    image:
      "https://images.pexels.com/photos/169193/pexels-photo-169193.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    price: "₨₨₨",
  },
  {
    id: "2",
    name: "Serene Gardens",
    city: "Islamabad",
    type: "Outdoor",
    capacity: 300,
    rating: 4.9,
    reviews: 203,
    image:
      "https://images.pexels.com/photos/265920/pexels-photo-265920.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    price: "₨₨",
  },
  {
    id: "3",
    name: "Coastal View",
    city: "Karachi",
    type: "Beach Resort",
    capacity: 400,
    rating: 4.7,
    reviews: 178,
    image:
      "https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    price: "₨₨₨₨",
  },
  {
    id: "4",
    name: "Mountain Retreat",
    city: "Peshawar",
    type: "Resort",
    capacity: 200,
    rating: 4.6,
    reviews: 192,
    image:
      "https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    price: "₨₨",
  },
  {
    id: "5",
    name: "City Center Hall",
    city: "Faisalabad",
    type: "Banquet Hall",
    capacity: 350,
    rating: 4.8,
    reviews: 145,
    image:
      "https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    price: "₨₨",
  },
]

const cities = ["Lahore", "Islamabad", "Karachi", "Peshawar", "Faisalabad"]
const venueTypes = ["Banquet Hall", "Outdoor", "Beach Resort", "Resort"]

export default function VenuesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedType, setSelectedType] = useState("")

  const filteredVenues = venues.filter((venue) => {
    return (
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCity === "" || venue.city === selectedCity) &&
      (selectedType === "" || venue.type === selectedType)
    )
  })

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Wedding Venues</h1>

      {/* Search and Filters */}
      <div className="mb-8 flex flex-wrap gap-4">
        <Input
          type="text"
          placeholder="Search venues..."
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


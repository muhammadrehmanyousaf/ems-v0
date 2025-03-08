"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import VendorCard from "./VendorCard"
import FilterContent from "./FilterContent"
// import { vendors as allVendors } from "@/lib/data"
import type { Vendor, Filters, SortOption, StaffOption } from "@/lib/types"
import axios from "axios"
import { BACKEND_URL } from "@/lib/backend-url"
import { Checkbox } from "./ui/checkbox"

interface VendorSearchProps {
  vendorType: string
  title?: string
  description?: string
}

export default function VendorSearch({ vendorType }: VendorSearchProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVendors, setTotalVendors] = useState(0)
  const [filters, setFilters] = useState<Filters>({
    city: "All Cities",
    subArea: "",
    minPrice: "",
    maxPrice: "",
    type: "All Types",
    capacity: "",
    amenities: [],
    cancellationPolicy: "All Policies",
    staff: [],
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sortOption, setSortOption] = useState("default");
  const [staffFilters, setStaffFilters] = useState<string[]>([]);
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [cities, setCities] = useState<string[]>([]);

  let vendorTypes = "";

  switch (vendorType) {
    case "photographers":
      vendorTypes = "Photographer";
      break;
    case "catering":
      vendorTypes = "Catering";
      break;
    case "makeup-artists":
      vendorTypes = "Makeup artist";
      break;
    case "venues":
      vendorTypes = "Wedding venue";
      break;
    case "henna-artists":
      vendorTypes = "Henna artist";
      break;
    case "decor":
      vendorTypes = "Decorator";
      break;
    case "car-rental":
      vendorTypes = "Car rental";
      break;
    case "wedding-stationery":
      vendorTypes = "Wedding Invitations and Stationery";
      break;
    case "bridal-wear":
      vendorTypes = "Bridal wearing";
      break;
    default:
      vendorTypes = "";
  }


  const fetchVendorsbyType = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${BACKEND_URL}api/v1/businesses/businesses-by-vendor?vendorType=${vendorTypes}`)
      console.log(response.data);
      let vendorsData: Vendor[] = response.data.data || [];

      if (sortOption === "price-low") {
        vendorsData = vendorsData.sort((a: Vendor, b: Vendor) => a.minimumPrice - b.minimumPrice);
      } else if (sortOption === "price-high") {
        vendorsData = vendorsData.sort((a: Vendor, b: Vendor) => b.minimumPrice - a.minimumPrice);
      }

      if (staffFilters.length) {
        vendorsData = vendorsData.filter((vendor: Vendor) =>
          staffFilters.some((staff: string) => vendor.staff.includes(staff))
        );
      }

      if (cityFilter !== "All Cities") {
        vendorsData = vendorsData.filter((vendor: Vendor) => vendor.city === cityFilter);
      }
      setCities([...new Set(vendorsData.map((v: Vendor) => v.city))]);
      setVendors(vendorsData);
      setIsLoading(false)
    } catch (error) {
      console.log('error', error);
      setIsLoading(false)
    }
  };

  useEffect(() => {
    fetchVendorsbyType();
  }, [sortOption, staffFilters, cityFilter])

  console.log('vendors', vendors);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{'title'}</h1>
      <p className="text-gray-600 mb-8">{'description'}</p>
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-1/4 space-y-5">
          <div className="space-y-2">
          <label className="font-semibold">City</label>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Cities">All Cities</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col items-start gap-2">
            <label className="font-semibold">Staff</label>
            {["Male", "Female", "Transgender"].map(staff => (
              <div key={staff} className="flex items-center gap-2">
                <Checkbox
                  checked={staffFilters.includes(staff)}
                  onCheckedChange={() => {
                    setStaffFilters(prev =>
                      prev.includes(staff) ? prev.filter(s => s !== staff) : [...prev, staff]
                    );
                  }}
                />
                <label>{staff}</label>
              </div>
            ))}
          </div>
        </aside>
        <div className="flex flex-col sm:flex-row gap-8 w-full">
          <section className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 w-full">
              <p className="text-gray-600 mb-2 sm:mb-0">
                {isLoading ? "Loading..." : `${vendors.length} OF ${totalVendors} RESULTS`}
              </p>
              <div className="w-full sm:w-auto">
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">SORT BY: RELEVANCE</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-300 h-48 rounded-t-lg"></div>
                    <div className="bg-white p-4 rounded-b-lg">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <VendorCard
                    key={vendor.id}
                    id={vendor.id}
                    name={vendor.name}
                    image={vendor.images[0]}
                    location={vendor.city}
                    rating={vendor.rating}
                    // reviews={vendor.length}
                    price={vendor.minimumPrice}
                    type={vendor.subBusinessType}
                    vendorType={vendorType}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-xl font-semibold">No results found</p>
                  <p className="text-gray-600 mt-2">Try adjusting your filters</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="m-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  className="m-1"
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="m-1"
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}


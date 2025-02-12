"use client";

import { VendorCard } from "../vendor-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const vendors = [
  {
    id: "1",
    name: "Royal Wedding Photography",
    category: "Photographer",
    rating: 4.8,
    reviews: 156,
    image:
      "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    price: "₹25,000",
    location: "Mumbai",
    capacity: 0,
  },
  {
    id: "2",
    name: "Glamour Makeup Studio",
    category: "Makeup Artist",
    rating: 4.9,
    reviews: 203,
    image:
      "https://images.pexels.com/photos/457701/pexels-photo-457701.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    price: "₹15,000",
    location: "Delhi",
    capacity: 0,
  },
  {
    id: "3",
    name: "Divine Decor Events",
    category: "Decorator",
    rating: 4.7,
    reviews: 178,
    image:
      "https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    price: "₹45,000",
    location: "Bangalore",
    capacity: 0,
  },
  {
    id: "4",
    name: "Taste of Joy Catering",
    category: "Caterer",
    rating: 4.6,
    reviews: 192,
    image:
      "https://images.pexels.com/photos/5638527/pexels-photo-5638527.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    price: "₹850",
    location: "Chennai",
    capacity: 0,
  },
  {
    id: "5",
    name: "Elegant Bridal Boutique",
    category: "Bridal Wear",
    rating: 4.8,
    reviews: 145,
    image:
      "https://images.pexels.com/photos/3775132/pexels-photo-3775132.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    price: "₹50,000",
    location: "Kolkata",
    capacity: 0,
  },
];

export function FeaturedVendors() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Featured Wedding Vendors
            </h2>
            <p className="text-gray-600">
              Discover top-rated wedding professionals in your area
            </p>
          </div>
          <a
            href="/vendors"
            className="text-primary hover:underline hidden md:block"
          >
            View all vendors →
          </a>
        </div>

        {/* ShadCN Carousel with Responsive Items Per Slide */}
        <div className="relative w-full overflow-hidden">
          <Carousel className="relative">
            {/* Bigger and Spaced Arrows */}
            <CarouselPrevious className="hidden sm:flex absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gray-700 text-white rounded-full hover:bg-gray-900 transition z-50 pointer-events-auto" />
<CarouselNext className="hidden sm:flex absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gray-700 text-white rounded-full hover:bg-gray-900 transition z-50 pointer-events-auto" />


<CarouselContent className=" flex sm:gap-4 " style={{ scrollSnapType: "x mandatory" }}>

              {vendors.map((vendor, index) => (
                <CarouselItem
                key={index}
                className={`sm:basis-[100%] md:basis-1/2 lg:basis-1/4 flex-shrink-0 scroll-snap-start`}
              >
              
                  <VendorCard
                    id={vendor.id}
                    name={vendor.name}
                    type={vendor.category}
                    rating={vendor.rating}
                    reviews={vendor.reviews}
                    image={vendor.image}
                    price={vendor.price}
                    city={vendor.location}
                    capacity={vendor.capacity}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        <div className="text-center mt-8 md:hidden">
          <a href="/vendors" className="text-primary hover:underline">
            View all vendors →
          </a>
        </div>
      </div>
    </section>
  );
}

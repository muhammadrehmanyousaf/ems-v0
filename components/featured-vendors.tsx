import { VendorCard } from "./vendor-card"

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
  },
]

export function FeaturedVendors() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Wedding Vendors</h2>
            <p className="text-gray-600">Discover top-rated wedding professionals in your area</p>
          </div>
          <a href="/vendors" className="text-primary hover:underline hidden md:block">
            View all vendors →
          </a>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              id={vendor.id}
              name={vendor.name}
              type={vendor.category}
              rating={vendor.rating}
              reviews={vendor.reviews}
              image={vendor.image}
              price={vendor.price}
              city={vendor.location}
            />
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <a href="/vendors" className="text-primary hover:underline">
            View all vendors →
          </a>
        </div>
      </div>
    </section>
  )
}


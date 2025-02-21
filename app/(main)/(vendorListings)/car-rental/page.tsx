import VendorSearch from "@/components/VendorSearch"
// import Navbar from "@/components/Navbar"

export default function CarRentalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Navbar /> */}
      <VendorSearch
        vendorType="carRental"
        title="Wedding Car Rental Services In Pakistan"
        description="Arrive in style with luxury car rental services for your wedding day, only on Shadiyana."
      />
    </div>
  )
}


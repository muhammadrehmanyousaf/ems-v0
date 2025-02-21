import VendorSearch from "@/components/VendorSearch"
// import Navbar from "@/components/Navbar"

export default function VenuesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Navbar /> */}
      <VendorSearch
        vendorType="venues"
        title="Wedding Halls And Marquees In Pakistan"
        description="Find the best wedding venues across Pakistan for a perfect celebration, only on Shadiyana."
      />
    </div>
  )
}


import VendorSearch from "@/components/VendorSearch"
// import Navbar from "@/components/Navbar"

export default function WeddingStationeryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Navbar /> */}
      <VendorSearch
        vendorType="weddingStationery"
        title="Wedding Stationery In Pakistan"
        description="Find beautiful and unique wedding stationery for your special day, only on Shadiyana."
      />
    </div>
  )
}


import VendorSearch from "@/components/VendorSearch"
// import Navbar from "@/components/Navbar"

export default function PhotographersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Navbar /> */}
      <VendorSearch
        vendorType="photographers"
        title="Wedding Photographers In Pakistan"
        description="Capture your special moments with the best wedding photographers in Pakistan, only on Shadiyana."
      />
    </div>
  )
}


import VendorSearch from "@/components/VendorSearch"
// import Navbar from "@/components/Navbar"

export default function CateringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Navbar /> */}
      <VendorSearch
        vendorType="catering"
        title="Wedding Catering Services In Pakistan"
        description="Delight your guests with exquisite catering services for your wedding, only on Shadiyana."
      />
    </div>
  )
}


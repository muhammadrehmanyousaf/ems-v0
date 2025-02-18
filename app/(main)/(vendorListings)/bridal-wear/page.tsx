import VendorSearch from "@/components/VendorSearch"
// import Navbar from "@/components/Navbar"

export default function BridalWearPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Navbar /> */}
      <VendorSearch
        vendorType="bridalWear"
        title="Bridal Wear In Pakistan"
        description="Discover stunning bridal wear collections from top designers in Pakistan, only on Shadiyana."
      />
    </div>
  )
}


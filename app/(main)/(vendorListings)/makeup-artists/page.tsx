import VendorSearch from "@/components/VendorSearch"
// import Navbar from "@/components/Navbar"

export default function MakeupArtistsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Navbar /> */}
      <VendorSearch
        vendorType="makeupArtists"
        title="Wedding Makeup Artists In Pakistan"
        description="Get glammed up for your big day with the best makeup artists in Pakistan, only on Shadiyana."
      />
    </div>
  )
}


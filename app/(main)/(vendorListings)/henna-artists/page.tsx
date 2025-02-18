import VendorSearch from "@/components/VendorSearch"
// import Navbar from "@/components/Navbar"

export default function HennaArtistsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Navbar /> */}
      <VendorSearch
        vendorType="hennaArtists"
        title="Wedding Henna Artists In Pakistan"
        description="Adorn yourself with beautiful henna designs by the best artists in Pakistan, only on Shadiyana."
      />
    </div>
  )
}


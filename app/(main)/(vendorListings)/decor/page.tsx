import VendorSearch from "@/components/VendorSearch"
// import Navbar from "@/components/Navbar"

export default function DecorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Navbar /> */}
      <VendorSearch
        vendorType="decor"
        title="Wedding Decor Services In Pakistan"
        description="Transform your wedding venue with stunning decor services across Pakistan, only on Shadiyana."
      />
    </div>
  )
}


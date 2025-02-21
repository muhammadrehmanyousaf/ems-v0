"use client";
import { Provider, useDispatch, useSelector } from "react-redux"
import { store, RootState, AppDispatch } from "@/store"
import { useEffect } from "react"
import { fetchVendors } from "@/store/vendorSlice"
import VendorSearch from "@/components/VendorSearch"

function VenuesPageContent() {
  const dispatch = useDispatch<AppDispatch>()
  const {  all: venues, loading } = useSelector((state: RootState) => state.vendors)
  useEffect(() => {
    dispatch(fetchVendors())
  }, [dispatch])
  const filteredBusinesses = venues.filter((business: { users: { vendorType: string } }) => business.users.vendorType === "Photographer");

  // if (loading) return <div className="min-h-screen bg-gray-50">Loading venues...</div>
console.log("venues",filteredBusinesses)
  return (
    <div className="min-h-screen bg-gray-50">
      <VendorSearch
        vendorType="venues"
        title="Wedding Halls And Marquees In Pakistan"
        description="Find the best wedding venues across Pakistan for a perfect celebration, only on Shadiyana."
        vendors={venues}
      />
    </div>
  )
}

export default function VenuesPage() {
  return (
    <Provider store={store}>
      <VenuesPageContent />
    </Provider>
  )
}


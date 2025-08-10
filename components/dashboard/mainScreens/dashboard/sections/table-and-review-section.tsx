import React from 'react'
import RecentBookingTable from '../components/recent-booking-table'
import { RevenueBarChart } from '../components/revenue-bar-chart'
import CustomerReviews from '../components/customer-reviews'

const TableAndReviewSection = () => {
  return (
    <div className="grid grid-cols-6 gap-4 items-stretch">
      <div className="col-span-6 xl:col-span-4">
        <RecentBookingTable />
      </div>
      <div className="col-span-6 xl:col-span-2 md:grid md:grid-cols-2 xl:grid-cols-1 xl:grid-rows-2 gap-4 h-full">
        <div>
          <RevenueBarChart />
        </div>
        <div>
          <CustomerReviews/>
        </div>
      </div>
    </div>
  )
}

export default TableAndReviewSection

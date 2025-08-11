import React from 'react'
import RecentBookingTable from '../components/recent-booking-table'
import { RevenueBarChart } from '../components/revenue-bar-chart'
import CustomerReviews from '../components/customer-reviews'

const TableAndReviewSection = () => {
  return (
    <div className="grid grid-cols-6 gap-4 items-stretch">
      <div className="col-span-6 xl:col-span-4 max-h-[800px]">
        <RecentBookingTable />
      </div>
      <div className="col-span-6 xl:col-span-2 grid md:grid-cols-2 xl:grid-cols-1 xl:grid-rows-2 gap-4 h-full xlarge:h-auto">
        <div className='xlarge:max-h-[400px]'>
          <RevenueBarChart />
        </div>
        <div className='xlarge:max-h-[400px]'>
          <CustomerReviews/>
        </div>
      </div>
    </div>
  )
}

export default TableAndReviewSection

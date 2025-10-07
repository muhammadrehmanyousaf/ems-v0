'use client'
import React, { useState } from 'react'
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table'
import ReviewsTableActions from './reviews-table-actions'
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table'
import { Review } from '@/lib/dashboard-types'
import { reviewsData, columns } from './columns'
import ViewDialog from './view-dialog'

const ReviewsTable = () => {
    const [openViewDialog, setOpenViewDialog] = useState<boolean>(false)
    const { table, paginationState } = useDataTable<Review>({ data: reviewsData, columns: columns(setOpenViewDialog), totalItems: reviewsData.length });

    return (
        <div className='space-y-4 w-full'>
            <ReviewsTableActions
                table={table}
            />
            <GlobalTable
                table={table}
                paginationState={paginationState}
                totalItems={reviewsData.length}
            />
            <ViewDialog
                open={openViewDialog}
                setOpen={setOpenViewDialog}
            />
        </div>
    )
}

export default ReviewsTable

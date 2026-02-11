'use client'
import React from 'react'
import { BookingData } from '@/lib/dashboard-types'
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table'
import { BookingTableActions } from './booking-table-actions'
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table'
import { columns } from './columns'
import BookingTableFilters from './booking-table-filters'
import { useFetchData } from '@/hooks/use-fetch-data'
import { Loader2 } from 'lucide-react'

type Props = {
  search: string | null;
};

const BookingTable = ({ search }: Props) => {
  const { setPage, searchQuery, setSearchQuery } = BookingTableFilters()

  const urlPagination = useDataTable<BookingData>({ data: [], columns, totalItems: 0 });
  const { currentPage, pageSizeValue } = urlPagination;

  const { data, isLoading } = useFetchData({
    endpoint: `/api/v1/bookings`,
    queryKey: ['bookings'],
    Params: {
      page: currentPage,
      limit: pageSizeValue,
      sortBy: "createdAt",
      sortOrder: "DESC",
      search: searchQuery || search || undefined,
    },
  });

  const normalizedData = {
    bookings: data?.data?.data ?? [],
    total: data?.data?.filters?.total ?? 0,
  };

  const tableApi = useDataTable<BookingData>({
    data: normalizedData.bookings,
    columns,
    totalItems: normalizedData.total,
  });

  return isLoading ? (
    <div className='h-[calc(100dvh-220px)] flex items-center justify-center'>
      <div className='flex items-center gap-2'>
        <Loader2 className='size-6 animate-spin text-primary' />
        <p>Loading...</p>
      </div>
    </div>
  ) : (
    <div className='space-y-4 w-full'>
      <BookingTableActions
        table={tableApi.table}
        searchQuery={searchQuery}
        setPage={setPage}
        setSearchQuery={setSearchQuery}
      />
      <GlobalTable
        table={tableApi.table}
        paginationState={tableApi.paginationState}
        totalItems={normalizedData.total}
        setCurrentPage={tableApi.setCurrentPage}
        setPageSizeValue={tableApi.setPageSizeValue}
      />
    </div>
  );
};

export default BookingTable;

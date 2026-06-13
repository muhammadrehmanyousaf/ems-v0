'use client'
import React, { useState } from 'react'
import { BookingData } from '@/lib/dashboard-types'
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table'
import { BookingTableActions } from './booking-table-actions'
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table'
import { columns } from './columns'
import BookingTableFilters from './booking-table-filters'
import { useFetchData } from '@/hooks/use-fetch-data'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, ClipboardList, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OfflineBookingDialog } from './offline-booking-dialog'
import { useUser } from '@/context/UserContext'
import { isAdminLike, getDashboardRole } from '@/lib/dashboard-role'
// Issue #43 — pull the craft-localized "Bookings" label so the empty
// state + add button match the sidebar wording (Shoots, Fittings, etc.).
import { useBusiness } from '@/context/BusinessContext'
import { getVendorTypeConfig } from '@/lib/vendor-type-config'

type Props = {
  search: string | null;
  // Issue #26 — "active" hides Completed + Cancelled (default working
  // pipeline); "completed" surfaces the archive. Undefined falls back
  // to "active" for the URL-deep-link case.
  bucket?: 'active' | 'completed';
};

const BookingTable = ({ search, bucket = 'active' }: Props) => {
  const [addOpen, setAddOpen] = useState(false);
  const queryClient = useQueryClient();
  const { setPage, searchQuery, setSearchQuery } = BookingTableFilters()
  const { user } = useUser();
  // Issue #43 — craft-localized noun for the empty state ("No shoots yet"
  // for photographers, "No fittings yet" for bridal wear, etc.). Falls
  // back to "Bookings" when no craft override is configured.
  const { business } = useBusiness();
  const vendorConfig = getVendorTypeConfig((business as any)?.vendor?.vendorType);
  const craftLabel = vendorConfig?.navLabels?.Bookings ?? 'Bookings';
  // Singular/lowercase for inline copy (e.g. "No <noun> yet"). Most
  // craft labels are plural ("Shoots", "Fittings") so we strip a
  // trailing s; falls back gracefully when the label is already
  // singular or non-English.
  const craftNoun = craftLabel
    .replace(/s$/i, '')
    .toLowerCase();

  // Super-admin / admin gets the platform-wide endpoint (every booking on the
  // platform). Vendors hit the default endpoint that scopes to their own
  // businesses. Backend route: GET /api/v1/bookings/admin/bookings.
  const isAdmin = isAdminLike(getDashboardRole(user));
  const endpoint = isAdmin ? `/api/v1/bookings/admin/bookings` : `/api/v1/bookings`;

  const urlPagination = useDataTable<BookingData>({ data: [], columns, totalItems: 0 });
  const { currentPage, pageSizeValue } = urlPagination;

  const { data, isLoading } = useFetchData({
    endpoint,
    // queryKey includes bucket so switching tabs invalidates the cache
    // cleanly without confusing react-query.
    queryKey: ['bookings', isAdmin ? 'admin' : 'vendor', bucket],
    Params: {
      page: currentPage,
      limit: pageSizeValue,
      sortBy: "createdAt",
      sortOrder: "DESC",
      search: searchQuery || search || undefined,
      bucket,
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

  const handleBookingCreated = () => {
    // Must match the queryKey used by useFetchData above, otherwise a newly
    // created offline booking won't appear until a manual page refresh.
    // Refetch BOTH buckets so the new booking shows up regardless of which
    // tab the vendor is on.
    queryClient.refetchQueries({ queryKey: ['bookings', isAdmin ? 'admin' : 'vendor'] });
  };

  if (isLoading) {
    return (
      <div className='h-[calc(100dvh-220px)] flex items-center justify-center'>
        <div className='flex items-center gap-2'>
          <Loader2 className='size-6 animate-spin text-primary' />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoading && normalizedData.bookings.length === 0 && !searchQuery && !search) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">
            {/* Issue #43 — empty-state heading reads in the vendor's
                craft language: "No shoots yet" / "No fittings yet" etc. */}
            No {craftNoun}s yet
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            When customers book your services, they will appear here.
          </p>
          <Button className="mt-4" onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />Add offline {craftNoun}
          </Button>
        </div>
        <OfflineBookingDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onSuccess={handleBookingCreated}
        />
      </>
    );
  }

  return (
    <div className='space-y-4 w-full'>
      <BookingTableActions
        table={tableApi.table}
        searchQuery={searchQuery}
        setPage={setPage}
        setSearchQuery={setSearchQuery}
        onAddBooking={() => setAddOpen(true)}
      />
      <GlobalTable
        table={tableApi.table}
        paginationState={tableApi.paginationState}
        totalItems={normalizedData.total}
        setCurrentPage={tableApi.setCurrentPage}
        setPageSizeValue={tableApi.setPageSizeValue}
      />
      <OfflineBookingDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={handleBookingCreated}
      />
    </div>
  );
};

export default BookingTable;

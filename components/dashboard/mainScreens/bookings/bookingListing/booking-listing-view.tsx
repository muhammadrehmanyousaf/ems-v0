'use client'
import React, { useState } from 'react'
import PageContainer from '@/components/dashboard/layout/page-container'
import { Heading } from '@/components/heading'
import BookingTable from './components/booking-table'
import { Separator } from '@/components/ui/separator'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Table as TableIcon, FileUp } from 'lucide-react'
// Phase 1 #7.2 — Pipelines view (17hats pattern).
import PipelineView from '../pipeline/pipeline-view'
// Historical bookings backfill (flag-gated).
import ImportBookingsDialog from '../import-bookings-dialog'
// Issue #8 — sidebar uses craft-localized labels ("Shoots" for
// photographers, "Fittings" for bridal wear, etc.) but the page heading
// stayed hardcoded as "Bookings", confusing vendors. Source from the
// same vendor-type-config the sidebar reads.
import { useBusiness } from '@/context/BusinessContext'
import { getVendorTypeConfig } from '@/lib/vendor-type-config'

const BookingListingView = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // Client-safe read. `searchParamsCache` (nuqs/server) is server-only — calling
  // .get() here (this is a Client Component) throws and crashed the whole page.
  const search = searchParams?.get('q') ?? null;

  // Default = table (legacy behaviour). Vendor opts into pipeline via
  // ?view=pipeline. State lives in the URL so a vendor can bookmark
  // their preferred view.
  const view = searchParams?.get('view') === 'pipeline' ? 'pipeline' : 'table';

  const setView = (next: 'table' | 'pipeline') => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (next === 'pipeline') params.set('view', 'pipeline');
    else params.delete('view');
    router.push(`${pathname}${params.toString() ? `?${params}` : ''}`);
  };

  const [importOpen, setImportOpen] = useState(false);
  const showImport = process.env.NEXT_PUBLIC_BOOKING_IMPORT === '1';

  // Issue #8 — match the sidebar's craft label so a photographer who
  // sees "Shoots" in the nav also sees "Shoots" as the page heading.
  // Falls back to the default English "Bookings" when no craft override
  // exists OR the business context isn't ready yet.
  const { business } = useBusiness();
  const vendorConfig = getVendorTypeConfig((business as any)?.vendor?.vendorType);
  const headingTitle = vendorConfig?.navLabels?.Bookings ?? 'Bookings';

  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Heading title={headingTitle} />
            <div className="flex items-center gap-2">
              {/* Historical bookings backfill (vendor-only, flag-gated).
                  Bulk-load Excel/register backlog as Completed+Paid
                  offline bookings. */}
              {showImport && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setImportOpen(true)}
                >
                  <FileUp className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Import history</span>
                </Button>
              )}
              {/* Phase 1 #7.2 — view toggle. Pipeline = kanban grouped
                  by funnel stage; Table = legacy data-grid. */}
              <div className="inline-flex items-center rounded-md border bg-muted p-0.5 text-xs">
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'table' ? 'default' : 'ghost'}
                  className="h-7 px-2.5 gap-1.5"
                  onClick={() => setView('table')}
                >
                  <TableIcon className="h-3.5 w-3.5" />
                  Table
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'pipeline' ? 'default' : 'ghost'}
                  className="h-7 px-2.5 gap-1.5"
                  onClick={() => setView('pipeline')}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Pipeline
                </Button>
              </div>
            </div>
          </div>
          <Separator />
          {view === 'pipeline' ? <PipelineView /> : <BookingTable search={search} />}
          {showImport && (
            <ImportBookingsDialog
              open={importOpen}
              onOpenChange={setImportOpen}
              onImported={() => router.refresh()}
            />
          )}
        </div>
      </PageContainer>
    </div>
  )
}

export default BookingListingView

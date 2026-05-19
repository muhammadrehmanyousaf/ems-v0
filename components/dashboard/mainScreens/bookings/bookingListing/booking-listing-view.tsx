'use client'
import React from 'react'
import PageContainer from '@/components/dashboard/layout/page-container'
import { Heading } from '@/components/heading'
import BookingTable from './components/booking-table'
import { Separator } from '@/components/ui/separator'
import { searchParamsCache } from '@/lib/searchparams'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Table as TableIcon } from 'lucide-react'
// Phase 1 #7.2 — Pipelines view (17hats pattern).
import PipelineView from '../pipeline/pipeline-view'

const BookingListingView = () => {
  const search = searchParamsCache.get('q');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

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

  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Heading title="Bookings" />
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
          <Separator />
          {view === 'pipeline' ? <PipelineView /> : <BookingTable search={search} />}
        </div>
      </PageContainer>
    </div>
  )
}

export default BookingListingView

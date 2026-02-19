'use client';

import * as React from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Progress, ProgressProps } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { RecentBookingItem, BookingStats } from '@/lib/api/analytics';

interface RecentBookingTableProps {
  rows?: RecentBookingItem[];
  stats?: BookingStats;
  loading?: boolean;
  className?: string;
}

/** small KPI widget */
function Stat({
  label,
  count,
  total,
  bar,
}: {
  label: string;
  count: number;
  total?: number;
  bar: Pick<ProgressProps, 'indicatorColor'> & { trackClass?: string };
}) {
  const pct = Math.max(0, Math.min(100, total ? (count / Math.max(1, total)) * 100 : count));
  return (
    <div>
      <h2 className="text-2xl font-extrabold tabular-nums">{count.toLocaleString()}</h2>
      <div className="mt-1 space-y-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Progress
          value={pct}
          indicatorColor={bar.indicatorColor}
          className={cn('h-2', bar.trackClass)}
        />
        <p className="text-xs text-muted-foreground">{Math.round(pct)}%</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = String(status).toLowerCase();
  if (s === 'confirmed')
    return <Badge variant="outline" className="border-emerald-500 text-emerald-600">Confirmed</Badge>;
  if (s === 'pending')
    return <Badge variant="outline" className="border-amber-500 text-amber-600">Pending</Badge>;
  if (s === 'cancelled' || s === 'canceled')
    return <Badge variant="outline" className="border-red-500 text-red-600">Cancelled</Badge>;
  if (s === 'completed')
    return <Badge variant="outline" className="border-blue-500 text-blue-600">Completed</Badge>;
  return <Badge variant="secondary">New</Badge>;
}

function formatBookingDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const RecentBookingTable: React.FC<RecentBookingTableProps> = ({
  rows = [],
  stats,
  loading = false,
  className,
}) => {
  const router = useRouter();
  const computed = stats || {
    newCount: 0,
    pendingCount: 0,
    confirmedCount: 0,
    cancelledCount: 0,
    completedCount: 0,
    total: 0,
  };

  return (
    <Card className={cn('flex h-full xlarge:h-auto md:min-h-[420px] xlarge:min-h-[685px] flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Bookings</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/bookings')}
        >
          View all
        </Button>
      </CardHeader>

      <CardContent className='px-4 md:px-6'>
        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-3/4" />
              </div>
            ))
          ) : (
            <>
              <Stat
                label="Pending Bookings"
                count={computed.pendingCount}
                total={computed.total}
                bar={{ indicatorColor: 'bg-yellow-500', trackClass: 'bg-yellow-100' }}
              />
              <Stat
                label="Confirmed Bookings"
                count={computed.confirmedCount}
                total={computed.total}
                bar={{ indicatorColor: 'bg-emerald-500', trackClass: 'bg-emerald-100' }}
              />
              <Stat
                label="Completed Bookings"
                count={computed.completedCount}
                total={computed.total}
                bar={{ indicatorColor: 'bg-blue-500', trackClass: 'bg-blue-100' }}
              />
              <Stat
                label="Cancelled Bookings"
                count={computed.cancelledCount}
                total={computed.total}
                bar={{ indicatorColor: 'bg-red-500', trackClass: 'bg-red-100' }}
              />
            </>
          )}
        </div>

        {/* Table */}
        <div className="mt-6 w-full h-[250px] md:h-auto overflow-auto border rounded-lg">
          <Table aria-label="Recent bookings">
            <TableHeader>
              <TableRow>
                <TableHead className='whitespace-nowrap'>Customer</TableHead>
                <TableHead className='whitespace-nowrap'>Phone</TableHead>
                <TableHead className='whitespace-nowrap'>Business</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  </TableRow>
                ))
              ) : rows.length ? (
                rows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium whitespace-nowrap">{item.customerName}</TableCell>
                    <TableCell className="tabular-nums whitespace-nowrap">{item.customerPhone}</TableCell>
                    <TableCell className='whitespace-nowrap'>{item.eventType}</TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatBookingDate(item.bookingDate)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No bookings to show.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentBookingTable;

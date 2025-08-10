'use client';

import * as React from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardFooter,
} from '@/components/ui/card';
import { Progress, ProgressProps } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { bookings as defaultRows, formatDate } from '../../bookings/bookingListing/components/columns';

type Booking = {
  _id: string;
  name: string;
  phone: string;
  event_type: string;
  status: 'New' | 'Pending' | 'Confirmed' | 'Cancelled' | string;
  date: string;
};

type Stats = {
  total?: number;
  newCount: number;
  pendingCount: number;
  confirmedCount: number;
  cancelledCount: number;
};

interface RecentBookingTableProps {
  rows?: Booking[];
  stats?: Stats;
  loading?: boolean;
  onViewAll?: () => void;
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

function StatusBadge({ status }: { status: Booking['status'] }) {
  const s = String(status).toLowerCase();
  if (s === 'confirmed')
    return <Badge variant="outline" className="border-emerald-500 text-emerald-600">Confirmed</Badge>;
  if (s === 'pending')
    return <Badge variant="outline" className="border-amber-500 text-amber-600">Pending</Badge>;
  if (s === 'cancelled' || s === 'canceled')
    return <Badge variant="outline" className="border-red-500 text-red-600">Cancelled</Badge>;
  return <Badge variant="secondary">New</Badge>;
}

function deriveStats(rows: Booking[]): Stats {
  const counts = rows.reduce(
    (acc, r) => {
      const s = String(r.status).toLowerCase();
      if (s === 'new') acc.newCount++;
      else if (s === 'pending') acc.pendingCount++;
      else if (s === 'confirmed') acc.confirmedCount++;
      else if (s === 'cancelled' || s === 'canceled') acc.cancelledCount++;
      else acc.newCount++;
      return acc;
    },
    { newCount: 0, pendingCount: 0, confirmedCount: 0, cancelledCount: 0 }
  );
  const total =
    counts.newCount + counts.pendingCount + counts.confirmedCount + counts.cancelledCount;
  return { total, ...counts };
}

const RecentBookingTable: React.FC<RecentBookingTableProps> = ({
  rows = defaultRows as unknown as Booking[],
  stats,
  loading = false,
  onViewAll,
  className,
}) => {
  const computed = React.useMemo(() => stats ?? deriveStats(rows), [rows, stats]);
  const topRows = rows?.slice(0, 10) ?? [];

  return (
    <Card className={cn('flex h-full min-h-[420px] flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Bookings</CardTitle>
        {onViewAll && (
          <Button variant="outline" size="sm" onClick={onViewAll}>
            View all
          </Button>
        )}
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
                label="New Bookings"
                count={computed.newCount}
                total={computed.total}
                bar={{ indicatorColor: 'bg-blue-500', trackClass: 'bg-blue-100' }}
              />
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
                label="Cancelled Bookings"
                count={computed.cancelledCount}
                total={computed.total}
                bar={{ indicatorColor: 'bg-red-500', trackClass: 'bg-red-100' }}
              />
            </>
          )}
        </div>

        {/* Table */}
        <div className="mt-6 w-full overflow-x-auto border rounded-lg">
          <Table aria-label="Recent bookings">
            <TableHeader>
              <TableRow>
                <TableHead className='whitespace-nowrap'>Full Name</TableHead>
                <TableHead className='whitespace-nowrap'>Phone Number</TableHead>
                <TableHead className='whitespace-nowrap'>Event Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  </TableRow>
                ))
              ) : topRows.length ? (
                topRows.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium whitespace-nowrap">{item.name}</TableCell>
                    <TableCell className="tabular-nums whitespace-nowrap">{item.phone}</TableCell>
                    <TableCell className='whitespace-nowrap'>{item.event_type}</TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(item.date)}
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

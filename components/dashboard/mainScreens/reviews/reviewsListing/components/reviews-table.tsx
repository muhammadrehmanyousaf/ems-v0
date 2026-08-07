'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table';
import ReviewsTableActions from './reviews-table-actions';
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table';
import { Review } from '@/lib/dashboard-types';
import { columns } from './columns';
import ViewDialog from './view-dialog';
import { ReplyDialog } from './reply-dialog';
import { ReviewsAPI } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const ReviewsTable = () => {
    const [viewReview, setViewReview] = useState<Review | null>(null);
    // WWL-356 — no delete state: a business cannot erase a review about itself.
    const [replyReview, setReplyReview] = useState<Review | null>(null);
    const [data, setData] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    /**
     * WWL-380 — `getAll(1, 100)` was hard-coded and the table was built with
     * `totalItems: data.length`, so the server's own `pagination.total` and
     * `totalPages` were fetched and thrown away. A vendor with 101 reviews saw
     * 100, was TOLD the total was 100, and had no page 2 to reach the rest. The
     * server caps `limit` at 100 too, so raising the number alone would not
     * have helped — it needed real paging.
     */
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const PAGE_SIZE = 50;

    const fetchData = useCallback(() => {
        setLoading(true);
        ReviewsAPI.getAll(page, PAGE_SIZE)
            .then((result) => {
                setData(result.reviews as Review[]);
                setTotal(Number(result?.pagination?.total ?? (result.reviews as Review[]).length));
            })
            .catch(() => { setData([]); toast.error('Failed to load reviews'); })
            .finally(() => setLoading(false));
    }, [page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handlePin = async (review: Review) => {
        const intended = !review.isPinned;
        try {
            const res = await ReviewsAPI.togglePin(review.id, intended);
            // WWL-369 — this used to read `res?.isPinned` directly, so a response
            // that carried no `isPinned` made pressing "Pin" announce
            // "Review unpinned". Fall back to what was actually asked for.
            const nowPinned = typeof res?.isPinned === 'boolean' ? res.isPinned : intended;
            toast.success(nowPinned ? 'Review pinned — it’ll showcase first' : 'Review unpinned');
            fetchData();
        } catch {
            toast.error('Failed to update pin');
        }
    };

    const { table, paginationState } = useDataTable<Review>({
        data,
        columns: columns(
            (review) => setViewReview(review),
            (review) => setReplyReview(review),
            handlePin,
        ),
        totalItems: total,
    });

    if (loading) {
        return (
            <div className="space-y-4 w-full">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-60" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>
        );
    }

    return (
        <div className='space-y-4 w-full'>
            <ReviewsTableActions table={table} />
            <GlobalTable
                caption="Reviews"
                table={table}
                paginationState={paginationState}
                totalItems={data.length}
            />

            <ViewDialog
                open={!!viewReview}
                setOpen={(v) => !v && setViewReview(null)}
                review={viewReview}
                onReply={(review) => setReplyReview(review)}
            />

            <ReplyDialog
                open={!!replyReview}
                onOpenChange={(v) => !v && setReplyReview(null)}
                review={replyReview}
                onSuccess={fetchData}
            />
        </div>
    );
};

export default ReviewsTable;

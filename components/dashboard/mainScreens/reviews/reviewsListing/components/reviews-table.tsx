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
import { ConfirmDeleteDialog } from '@/components/dashboard/globalComponents/confirm-delete-dialog';
import { toast } from 'sonner';

const ReviewsTable = () => {
    const [viewReview, setViewReview] = useState<Review | null>(null);
    const [deleteReview, setDeleteReview] = useState<Review | null>(null);
    const [replyReview, setReplyReview] = useState<Review | null>(null);
    const [data, setData] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        setLoading(true);
        ReviewsAPI.getAll(1, 100)
            .then((result) => {
                setData(result.reviews as Review[]);
            })
            .catch(() => { setData([]); toast.error('Failed to load reviews'); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async () => {
        if (!deleteReview) return;
        try {
            await ReviewsAPI.delete(deleteReview.id);
            toast.success('Review deleted successfully');
            fetchData();
        } catch {
            toast.error('Failed to delete review');
        }
    };

    const { table, paginationState } = useDataTable<Review>({
        data,
        columns: columns(
            (review) => setViewReview(review),
            (review) => setDeleteReview(review),
            (review) => setReplyReview(review),
        ),
        totalItems: data.length,
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
                table={table}
                paginationState={paginationState}
                totalItems={data.length}
            />

            <ViewDialog
                open={!!viewReview}
                setOpen={(v) => !v && setViewReview(null)}
                review={viewReview}
            />

            <ReplyDialog
                open={!!replyReview}
                onOpenChange={(v) => !v && setReplyReview(null)}
                review={replyReview}
                onSuccess={fetchData}
            />

            <ConfirmDeleteDialog
                open={!!deleteReview}
                onOpenChange={(v) => !v && setDeleteReview(null)}
                title="Delete Review"
                description={`Are you sure you want to delete this review by "${deleteReview?.reviewerName}"? This action cannot be undone.`}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default ReviewsTable;

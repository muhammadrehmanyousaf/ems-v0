'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table';
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table';
import { Business } from '@/lib/dashboard-types';
import BusinessTableActions from './business-table-actions';
import { businessColumns } from './columns';
import { BusinessesAPI } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewBusinessDialog } from './view-business-dialog';
import { ConfirmDeleteDialog } from '@/components/dashboard/globalComponents/confirm-delete-dialog';
import { toast } from 'sonner';

const BusinessTable = () => {
    const [data, setData] = useState<Business[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [viewBusiness, setViewBusiness] = useState<Business | null>(null);
    const [deleteBusiness, setDeleteBusiness] = useState<Business | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        BusinessesAPI.getAll(1, 100)
            .then((result) => {
                const mapped: Business[] = (result.data || []).map((b) => ({
                    id: b.id,
                    name: b.name,
                    city: b.city || '',
                    subArea: b.subArea || '',
                    vendorType: b.vendor?.vendorType || '',
                    vendorName: b.vendor?.fullName || '',
                    total_packages: b.packages?.length ?? 0,
                    createdAt: b.createdAt,
                    updatedAt: b.updatedAt,
                }));
                setData(mapped);
                setTotal(result.pagination?.total ?? mapped.length);
            })
            .catch(() => { setData([]); toast.error('Failed to load businesses'); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async () => {
        if (!deleteBusiness) return;
        try {
            await BusinessesAPI.delete(Number(deleteBusiness.id));
            toast.success('Business deleted successfully');
            fetchData();
        } catch {
            toast.error('Failed to delete business');
        }
    };

    const { table, paginationState } = useDataTable<Business>({
        data,
        columns: businessColumns(
            (business) => setViewBusiness(business),
            (business) => setDeleteBusiness(business),
        ),
        totalItems: total,
    });

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-60" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>
        );
    }

    return (
        <div className='space-y-4'>
            <BusinessTableActions table={table} />
            <GlobalTable
                table={table}
                totalItems={total}
                paginationState={paginationState}
            />

            <ViewBusinessDialog
                open={!!viewBusiness}
                onOpenChange={(v) => !v && setViewBusiness(null)}
                business={viewBusiness}
            />

            <ConfirmDeleteDialog
                open={!!deleteBusiness}
                onOpenChange={(v) => !v && setDeleteBusiness(null)}
                title="Delete Business"
                description={`Are you sure you want to delete "${deleteBusiness?.name}"? This action cannot be undone.`}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default BusinessTable;

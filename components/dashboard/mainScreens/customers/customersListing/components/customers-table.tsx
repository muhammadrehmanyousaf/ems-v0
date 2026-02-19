'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { CustomersType } from '@/lib/dashboard-types';
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table';
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table';
import { columns } from './columns';
import { CustomersTableActions } from './customers-table-actions';
import { CustomersAPI } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewCustomerDialog } from './view-customer-dialog';
import { toast } from 'sonner';

interface CustomersTableProps {
    onRefreshReady?: (fn: () => void) => void;
}

const CustomersTable = ({ onRefreshReady }: CustomersTableProps) => {
    const [data, setData] = useState<CustomersType[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewCustomer, setViewCustomer] = useState<CustomersType | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        CustomersAPI.getAll(1, 100)
            .then((result) => {
                setData(result.customers as CustomersType[]);
            })
            .catch(() => { setData([]); toast.error('Failed to load customers'); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Expose refresh function to parent
    useEffect(() => {
        if (onRefreshReady) onRefreshReady(fetchData);
    }, [onRefreshReady, fetchData]);

    const { table, paginationState } = useDataTable<CustomersType>({
        data,
        columns: columns(
            (customer) => setViewCustomer(customer),
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
            <CustomersTableActions table={table} />
            <GlobalTable
                table={table}
                paginationState={paginationState}
                totalItems={data.length}
            />

            <ViewCustomerDialog
                open={!!viewCustomer}
                onOpenChange={(v) => !v && setViewCustomer(null)}
                customer={viewCustomer}
            />
        </div>
    );
};

export default CustomersTable;

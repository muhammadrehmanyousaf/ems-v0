'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { RolesTableActions } from './roles-table-actions';
import { Role } from '@/lib/dashboard-types';
import { columns } from './columns';
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table';
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table';
import { RolesAPI } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { EditRoleDialog } from './edit-role-dialog';
import { CreateRoleDialog } from './create-role-dialog';
import { ConfirmDeleteDialog } from '@/components/dashboard/globalComponents/confirm-delete-dialog';
import { toast } from 'sonner';

interface RolesTableProps {
    openCreate?: boolean;
    onCreateClose?: () => void;
}

const RolesTable = ({ openCreate, onCreateClose }: RolesTableProps) => {
    const [data, setData] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [editRole, setEditRole] = useState<Role | null>(null);
    const [deleteRole, setDeleteRole] = useState<Role | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        RolesAPI.getAll()
            .then((roles) => {
                const mapped: Role[] = roles.map((r) => ({
                    id: r.id,
                    name: r.name,
                    description: r.description || '',
                    type: r.type || '',
                    createdAt: r.createdAt,
                    users: r.users || [],
                }));
                setData(mapped);
            })
            .catch(() => { setData([]); toast.error('Failed to load roles'); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async () => {
        if (!deleteRole) return;
        try {
            await RolesAPI.delete(Number(deleteRole.id));
            toast.success('Role deleted successfully');
            fetchData();
        } catch {
            toast.error('Failed to delete role');
        }
    };

    const { table, paginationState } = useDataTable<Role>({
        data,
        columns: columns(
            (role) => setEditRole(role),
            (role) => setDeleteRole(role),
        ),
        totalItems: data.length,
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
            <RolesTableActions table={table} />
            <GlobalTable
                table={table}
                paginationState={paginationState}
                totalItems={data.length}
            />

            <EditRoleDialog
                open={!!editRole}
                onOpenChange={(v) => !v && setEditRole(null)}
                role={editRole}
                onSuccess={fetchData}
            />

            <ConfirmDeleteDialog
                open={!!deleteRole}
                onOpenChange={(v) => !v && setDeleteRole(null)}
                title="Delete Role"
                description={`Are you sure you want to delete role "${deleteRole?.name || deleteRole?.title}"? This action cannot be undone.`}
                onConfirm={handleDelete}
            />

            <CreateRoleDialog
                open={!!openCreate}
                onOpenChange={(v) => !v && onCreateClose?.()}
                onSuccess={fetchData}
            />
        </div>
    );
};

export default RolesTable;

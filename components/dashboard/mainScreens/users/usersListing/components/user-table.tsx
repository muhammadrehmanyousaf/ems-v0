'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table';
import UserTableActions from './user-table-actions';
import { columns } from './columns';
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table';
import { User } from '@/lib/dashboard-types';
import { UsersAPI } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { EditUserDialog } from './edit-user-dialog';
import { ConfirmDeleteDialog } from '@/components/dashboard/globalComponents/confirm-delete-dialog';
import { CreateUserDialog } from './create-user-dialog';
import { toast } from 'sonner';

interface UserTableProps {
    openCreate?: boolean;
    onCreateClose?: () => void;
}

const UserTable = ({ openCreate, onCreateClose }: UserTableProps) => {
    const [data, setData] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [deleteUser, setDeleteUser] = useState<User | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        UsersAPI.getAll()
            .then((users) => {
                const mapped: User[] = users.map((u) => ({
                    id: u.id,
                    fullName: u.fullName,
                    email: u.email,
                    phoneNumber: u.phoneNumber,
                    active: u.active,
                    isVendor: u.isVendor,
                    roles: u.roles || [],
                    createdAt: u.createdAt,
                    updatedAt: u.updatedAt,
                }));
                setData(mapped);
            })
            .catch(() => { setData([]); toast.error('Failed to load users'); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async () => {
        if (!deleteUser) return;
        try {
            await UsersAPI.delete(deleteUser.id);
            toast.success('User deleted successfully');
            fetchData();
        } catch {
            toast.error('Failed to delete user');
        }
    };

    const { table, paginationState } = useDataTable<User>({
        data,
        columns: columns(
            (user) => setEditUser(user),
            (user) => setDeleteUser(user),
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
            <UserTableActions table={table} />
            <GlobalTable
                table={table}
                paginationState={paginationState}
                totalItems={data.length}
            />

            <EditUserDialog
                open={!!editUser}
                onOpenChange={(v) => !v && setEditUser(null)}
                user={editUser}
                onSuccess={fetchData}
            />

            <ConfirmDeleteDialog
                open={!!deleteUser}
                onOpenChange={(v) => !v && setDeleteUser(null)}
                title="Delete User"
                description={`Are you sure you want to delete "${deleteUser?.fullName}"? This action cannot be undone.`}
                onConfirm={handleDelete}
            />

            <CreateUserDialog
                open={!!openCreate}
                onOpenChange={(v) => !v && onCreateClose?.()}
                onSuccess={fetchData}
            />
        </div>
    );
};

export default UserTable;

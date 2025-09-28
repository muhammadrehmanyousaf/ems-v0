'use client'
import React from 'react'
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table'
import UserTableActions from './user-table-actions';
import { users, columns } from './columns';
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table';
import { User } from '@/lib/dashboard-types';

const UserTable = () => {
  const { table, paginationState } = useDataTable<User>({ data: users, columns, totalItems: users.length });
  return (
    <div className='space-y-4'>
      <UserTableActions
        table={table}
      />
      <GlobalTable
        table={table}
        paginationState={paginationState}
        totalItems={users.length}
      />
    </div>
  )
}

export default UserTable

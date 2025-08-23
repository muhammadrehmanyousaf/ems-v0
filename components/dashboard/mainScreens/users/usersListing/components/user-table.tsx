'use client'
import React from 'react'
import { GlobalTable } from '@/components/dashboard/globalComponents/globalTable/global-table'
import UserTableActions from './user-table-actions';
import { users, columns } from './columns';
import { useDataTable } from '@/components/dashboard/globalComponents/globalTable/components/use-data-table';
import { User } from '@/lib/dashboard-types';

const UserTable = () => {
  const { table } = useDataTable<User>({ data: users, columns });
  return (
    <div className='space-y-4'>
      <UserTableActions
        table={table}
      />
      <GlobalTable
        table={table}
      />
    </div>
  )
}

export default UserTable

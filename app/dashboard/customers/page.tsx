"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MessageCircle, Pencil, Trash } from "lucide-react"
import Link from "next/link"

const customers = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    phone: "+1 234 567 8901",
    totalBookings: 3,
    totalSpent: "$15,000",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    phone: "+1 234 567 8902",
    totalBookings: 1,
    totalSpent: "$2,500",
  },
  {
    id: "3",
    name: "Carol White",
    email: "carol@example.com",
    phone: "+1 234 567 8903",
    totalBookings: 2,
    totalSpent: "$10,000",
  },
  {
    id: "4",
    name: "David Brown",
    email: "david@example.com",
    phone: "+1 234 567 8904",
    totalBookings: 1,
    totalSpent: "$6,000",
  },
  {
    id: "5",
    name: "Eva Green",
    email: "eva@example.com",
    phone: "+1 234 567 8905",
    totalBookings: 4,
    totalSpent: "$22,000",
  },
]

export default function CustomersPage() {
  const [customerList, setCustomerList] = useState(customers)

  const handleDelete = (id: string) => {
    setCustomerList(customerList.filter((customer) => customer.id !== id))
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button>Add New Customer</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Total Bookings</TableHead>
            <TableHead>Total Spent</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customerList.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.phone}</TableCell>
              <TableCell>{customer.totalBookings}</TableCell>
              <TableCell>{customer.totalSpent}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(customer.id)}>
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Link href={`/dashboard/chat/${customer.id}`} passHref>
                    <Button variant="secondary" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DashboardLayout>
  )
}


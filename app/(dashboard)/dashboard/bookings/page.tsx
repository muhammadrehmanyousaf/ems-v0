import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const bookings = [
  {
    id: "1",
    customer: "Alice Johnson",
    date: "2023-07-15",
    package: "Premium Wedding",
    status: "Confirmed",
    total: "$5,000",
  },
  {
    id: "2",
    customer: "Bob Smith",
    date: "2023-08-22",
    package: "Basic Reception",
    status: "Pending",
    total: "$2,500",
  },
  {
    id: "3",
    customer: "Carol White",
    date: "2023-09-05",
    package: "Deluxe Ceremony",
    status: "Paid",
    total: "$7,500",
  },
  {
    id: "4",
    customer: "David Brown",
    date: "2023-10-12",
    package: "Custom Package",
    status: "Confirmed",
    total: "$6,000",
  },
  {
    id: "5",
    customer: "Eva Green",
    date: "2023-11-30",
    package: "Winter Wedding Special",
    status: "Pending",
    total: "$8,000",
  },
]

export default function BookingsPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bookings</h1>
        <Button>Add New Booking</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Package</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>{booking.customer}</TableCell>
              <TableCell>{booking.date}</TableCell>
              <TableCell>{booking.package}</TableCell>
              <TableCell>{booking.status}</TableCell>
              <TableCell>{booking.total}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" className="mr-2">
                  Edit
                </Button>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DashboardLayout>
  )
}


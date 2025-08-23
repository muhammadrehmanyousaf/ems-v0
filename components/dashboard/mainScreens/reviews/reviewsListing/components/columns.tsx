import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { RowActions } from "./row-actions";
import { Review } from "@/lib/dashboard-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, StarHalf } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { StartComponent } from "./star-component";

export const columns = (
    setOpen: (v: boolean) => void
): ColumnDef<Review>[] => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                    aria-label="Select all"
                    aria-checked={
                        table.getIsSomePageRowsSelected() ? "mixed" : table.getIsAllPageRowsSelected()
                    }
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(v) => row.toggleSelected(!!v)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
            size: 36,
        },
        {
            accessorKey: "reviewerName",
            header: "Full Name",
            cell: ({ row }) => (
                <div className='flex items-center gap-2'>
                    <Avatar className='h-[34px] w-[34px]'>
                        <AvatarFallback className='bg-primary/20 text-primary'>
                            {row.original.reviewerName.charAt(0).toLocaleUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {row.original.reviewerName}
                </div>
            )
        },
        { accessorKey: "phone", header: "Phone Number" },
        { accessorKey: "email", header: "Email" },
        { accessorKey: "bookingId", header: "Booking Id" },
        {
            id: 'rating',
            header: "Rating",
            cell: ({ row }) => <StartComponent value={row.original.rating} />
        },
        {
            id: 'createdAt',
            header: "Date",
            cell: ({ row }) => (
                <span>{formatDateTime(row.original.createdAt)}</span>
            )
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) =>
            <RowActions
            data={row.original}
            setOpen={setOpen}
            />,
        },
    ];

export const reviewsData: Review[] = [
    {
        id: "R001",
        reviewerName: "Ali Khan",
        email: "ali.khan@example.com",
        phone: "+92-300-1234567",
        bookingId: "#2050",
        rating: 5,
        reviewText: "Had my wedding here, everything was perfect! Highly recommend.",
        status: "Published",
        createdAt: "2025-08-15 07:32 PM"
    },
    {
        id: "R002",
        reviewerName: "Sara Ahmed",
        email: "sara.ahmed@example.com",
        phone: "+92-321-8765432",
        bookingId: "#1987",
        rating: 4,
        reviewText: "Great venue, but food service could be a bit faster.",
        status: "Published",
        createdAt: "2025-08-14 06:10 PM"
    },
    {
        id: "R003",
        reviewerName: "Hamza Tariq",
        email: "hamza.tariq@example.com",
        phone: "+92-333-5678901",
        bookingId: "#2015",
        rating: 5,
        reviewText: "Perfect for corporate events! Staff was professional and supportive.",
        status: "Published",
        createdAt: "2025-08-13 04:45 PM"
    },
    {
        id: "R004",
        reviewerName: "Zainab Malik",
        email: "zainab.malik@example.com",
        phone: "+92-345-9876543",
        bookingId: "#2022",
        rating: 3,
        reviewText: "The place was nice but parking was limited.",
        status: "Pending",
        createdAt: "2025-08-12 02:20 PM"
    },
    {
        id: "R005",
        reviewerName: "Bilal Hussain",
        email: "bilal.hussain@example.com",
        phone: "+92-310-1112233",
        bookingId: "#2077",
        rating: 2.5,
        reviewText: "Terrible experience. Event was cancelled last minute!",
        status: "Rejected",
        createdAt: "2025-08-10 01:15 PM"
    }
]

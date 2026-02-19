import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Settings2,
  Smile,
  SquareUser,
  UserCheck,
  Users,
} from "lucide-react"

export const data = {
  mainNav: [
    {
      name: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Bookings",
      url: "/dashboard/bookings",
      icon: ClipboardList,
    },
    {
      name: "Customers",
      url: "/dashboard/customers",
      icon: SquareUser,
    },
    {
      name: "Calendar",
      url: "/dashboard/calendar",
      icon: CalendarDays,
    },
    {
      name: "Conversations",
      url: "/dashboard/chat",
      icon: MessageSquareText,
    },
    {
      name: "Payments",
      url: "/dashboard/payments",
      icon: CircleDollarSign,
    },
    {
      name: "Reviews",
      url: "/dashboard/reviews",
      icon: Smile,
    },
    {
      name: "Notifications",
      url: "/dashboard/notifications",
      icon: Bell,
    },
  ],
  vendorControls: [
    {
      name: "Users",
      url: "/dashboard/users",
      icon: Users,
    },
    {
      name: "Vendors",
      url: "/dashboard/vendors",
      icon: UserCheck,
    },
    {
      name: "Businesses",
      url: "/dashboard/businesses",
      icon: BriefcaseBusiness,
    },
    {
      name: "Roles",
      url: "/dashboard/roles",
      icon: Settings2,
    },
    {
      name: "Business Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ],

  adminSection: [
    {
      name: "Vendors",
      url: "/dashboard/vendors",
      icon: UserCheck,
    },
    {
      name: "Businesses",
      url: "/dashboard/businesses",
      icon: BriefcaseBusiness,
    },
    {
      name: "Revenue",
      url: "/dashboard/revenue",
      icon: CircleDollarSign,
    },
  ]
}
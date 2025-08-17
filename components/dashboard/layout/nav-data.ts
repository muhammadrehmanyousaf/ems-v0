import {
  AudioWaveform,
  BookOpen,
  Bot,
  Calendar,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Package,
  Settings,
  Settings2,
  Smile,
  SquareTerminal,
  Users,
} from "lucide-react"

export const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
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
      icon: Users,
    },
    {
      name: "Calendar",
      url: "/dashboard/calendar",
      icon: CalendarDays,
    },
    // {
    //   name: "Conversations",
    //   url: "/dashboard/conversations",
    //   icon: MessageSquareText,
    // },
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
  ],
  vendorControlls: [
    {
      name: "Packages",
      url: "/dashboard/packages",
      icon: Package,
    },
    {
      name: "Roles",
      url: "/dashboard/roles",
      icon: Settings2,
    },
    {
      name: "Business Settings",
      url: "/dashboard/business-settings",
      icon: Settings,
    },
  ]
}
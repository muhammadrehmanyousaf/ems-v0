import {
  AudioWaveform,
  BookOpen,
  Bot,
  Calendar,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Command,
  Frame,
  GalleryVerticalEnd,
  LayoutDashboard,
  Map,
  MessageSquareText,
  Package,
  PieChart,
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
  static: [
    {
      name: "Dashboard",
      url: "/",
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
      url: "#",
      icon: CalendarDays,
    },
    {
      name: "Packages",
      url: "#",
      icon: Package,
    },
    {
      name: "Conversations",
      url: "#",
      icon: MessageSquareText,
    },
    {
      name: "Payments",
      url: "#",
      icon: CircleDollarSign,
    },
    {
      name: "Reviews",
      url: "#",
      icon: Smile,
    },
  ],
}
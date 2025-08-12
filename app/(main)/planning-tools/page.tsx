"use client"

import Link from "next/link";
import { CalendarDays, Calculator, Users, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const tools = [
  {
    title: "Wedding Checklist",
    description: "Stay organized with our comprehensive wedding planning checklist",
    icon: CalendarDays,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    gradient: "from-rose-500 to-pink-600",
    href: "/planning-tools/checklist",
  },
  {
    title: "Budget Calculator",
    description: "Track your expenses and manage your wedding budget effectively",
    icon: Calculator,
    color: "text-green-600",
    bgColor: "bg-green-50",
    gradient: "from-green-500 to-emerald-600",
    href: "/planning-tools/budget",
  },
  {
    title: "Guest List Manager",
    description: "Organize your guest list and track RSVPs in one place",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    gradient: "from-blue-500 to-indigo-600",
    href: "/planning-tools/guest-list",
  },
  {
    title: "Timeline Creator",
    description: "Create a detailed timeline for your wedding day",
    icon: Clock,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    gradient: "from-purple-500 to-violet-600",
    href: "/planning-tools/timeline",
  },
];

export default function PlanningToolsPage() {
  return (
    <div className="py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">Essential Planning Tools</h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Everything you need to plan your perfect wedding. From checklists to budgets, 
          we've got all the tools to make your planning journey smooth and stress-free.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <Link key={tool.title} href={tool.href}>
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 group border-0 shadow-lg bg-white flex flex-col h-full">
              <CardHeader className="text-center p-6 flex-1">
                <div className={`w-16 h-16 ${tool.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <tool.icon className={`w-8 h-8 ${tool.color}`} />
                </div>
                <CardTitle className="text-xl font-bold text-neutral-900">{tool.title}</CardTitle>
                <CardDescription className="text-neutral-600">{tool.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 mt-auto">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 text-rose-600 font-medium group-hover:text-rose-700 transition-colors duration-300">
                    Open Tool
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-16 text-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Need More Help?</h2>
          <p className="text-neutral-600 mb-6">
            Our comprehensive planning tools are designed to make your wedding planning journey 
            as smooth and enjoyable as possible.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/vendors">
              <div className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg hover:from-rose-600 hover:to-pink-700 transition-all duration-300 font-medium">
                Find Vendors
              </div>
            </Link>
            <Link href="/venues">
              <div className="px-6 py-3 border border-rose-500 text-rose-600 rounded-lg hover:bg-rose-50 transition-all duration-300 font-medium">
                Browse Venues
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


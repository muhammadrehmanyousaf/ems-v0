"use client"

import Link from "next/link";
import { CalendarDays, Calculator, Users, Clock, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/components/ui/use-mobile";
import { motion } from "framer-motion";

const tools = [
  {
    title: "Wedding Checklist",
    description: "Stay organized with our comprehensive wedding planning checklist",
    icon: CalendarDays,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    gradient: "from-rose-500 to-pink-600",
    href: "/planning-tools/checklist",
    features: ["Progress tracking", "Category organization", "Due date reminders"]
  },
  {
    title: "Budget Calculator",
    description: "Track your expenses and manage your wedding budget effectively",
    icon: Calculator,
    color: "text-green-600",
    bgColor: "bg-green-50",
    gradient: "from-green-500 to-emerald-600",
    href: "/planning-tools/budget",
    features: ["Expense tracking", "Budget allocation", "Spending insights"]
  },
  {
    title: "Guest List Manager",
    description: "Organize your guest list and track RSVPs in one place",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    gradient: "from-blue-500 to-indigo-600",
    href: "/planning-tools/guest-list",
    features: ["RSVP tracking", "Guest categories", "Seating arrangements"]
  },
  {
    title: "Timeline Creator",
    description: "Create a detailed timeline for your wedding day",
    icon: Clock,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    gradient: "from-purple-500 to-violet-600",
    href: "/planning-tools/timeline",
    features: ["Visual timeline", "Vendor coordination", "Day-of schedule"]
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export default function PlanningToolsPage() {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen py-6 sm:py-8 lg:py-12">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 sm:mb-12 lg:mb-16 px-4"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-rose-500" />
          <span className="text-sm font-medium text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
            Planning Made Easy
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 leading-tight">
          Essential Planning Tools
        </h1>
        <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
          Everything you need to plan your perfect wedding. From checklists to budgets, 
          we've got all the tools to make your planning journey smooth and stress-free.
        </p>
      </motion.div>

      {/* Tools Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4 max-w-7xl mx-auto"
      >
        {tools.map((tool, index) => (
          <motion.div key={tool.title} variants={cardVariants}>
            <Link href={tool.href} className="block h-full">
              <Card className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group border-0 shadow-lg bg-white flex flex-col h-full relative overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"
                     style={{ background: `linear-gradient(135deg, ${tool.gradient.split(' ')[1]}, ${tool.gradient.split(' ')[3]})` }} />
                
                <CardHeader className="text-center p-4 sm:p-6 flex-1 relative z-10">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 ${tool.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <tool.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${tool.color}`} />
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-bold text-neutral-900 mb-2">{tool.title}</CardTitle>
                  <CardDescription className="text-sm sm:text-base text-neutral-600 mb-4">{tool.description}</CardDescription>
                  
                  {/* Features list - hidden on mobile, shown on larger screens */}
                  {!isMobile && (
                    <div className="space-y-1">
                      {tool.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-neutral-500">
                          <div className="w-1 h-1 bg-neutral-300 rounded-full" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-4 sm:p-6 pt-0 mt-auto relative z-10">
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2 text-rose-600 font-medium group-hover:text-rose-700 transition-colors duration-300">
                      <span className="text-sm sm:text-base">Open Tool</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-12 sm:mt-16 lg:mt-20 text-center px-4"
      >
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-neutral-200 max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-4">Need More Help?</h2>
          <p className="text-sm sm:text-base text-neutral-600 mb-6 max-w-2xl mx-auto">
            Our comprehensive planning tools are designed to make your wedding planning journey 
            as smooth and enjoyable as possible.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link href="/vendors" className="w-full sm:w-auto">
              <div className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg hover:from-rose-600 hover:to-pink-700 transition-all duration-300 font-medium text-center">
                Find Vendors
              </div>
            </Link>
            <Link href="/venues" className="w-full sm:w-auto">
              <div className="px-6 py-3 border border-rose-500 text-rose-600 rounded-lg hover:bg-rose-50 transition-all duration-300 font-medium text-center">
                Browse Venues
              </div>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


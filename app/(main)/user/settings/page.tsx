"use client"

import React from "react"
import { useUser } from "@/context/UserContext"
import { useRouter } from "next/navigation"
import { Settings, User, Bell, Shield, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function UserSettingsPage() {
  const { user, isAuthenticated, isLoading } = useUser()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50/80 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push("/login")
    return null
  }

  const sections = [
    {
      icon: User,
      title: "Account",
      desc: "Update your personal information and profile",
      action: "Edit Profile",
      href: "/user/profile",
      color: "purple",
    },
    {
      icon: Bell,
      title: "Notifications",
      desc: "Manage your notification preferences",
      action: "View Notifications",
      href: "/user/notifications",
      color: "blue",
    },
    {
      icon: Shield,
      title: "Security",
      desc: "Change your password and security settings",
      action: "Change Password",
      href: "/user/profile",
      color: "green",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50/80 py-4 sm:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
            <Settings className="inline w-7 h-7 text-purple-500 mr-2 -mt-1" />
            Settings
          </h1>
          <p className="text-sm sm:text-base text-neutral-600">
            Manage your account preferences
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.title} className="bg-white/80 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      section.color === "purple" ? "bg-purple-100" :
                      section.color === "blue" ? "bg-blue-100" : "bg-green-100"
                    }`}>
                      <section.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        section.color === "purple" ? "text-purple-600" :
                        section.color === "blue" ? "text-blue-600" : "text-green-600"
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-neutral-900">{section.title}</h3>
                      <p className="text-sm text-neutral-500 truncate">{section.desc}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => router.push(section.href)}
                  >
                    {section.action}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Account Info */}
        <Card className="bg-white/80 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-neutral-500">Name</span>
              <span className="text-sm font-medium text-neutral-900">{user?.fullName || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-neutral-500">Email</span>
              <span className="text-sm font-medium text-neutral-900">{user?.email || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-neutral-500">Phone</span>
              <span className="text-sm font-medium text-neutral-900">{user?.phoneNumber || "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

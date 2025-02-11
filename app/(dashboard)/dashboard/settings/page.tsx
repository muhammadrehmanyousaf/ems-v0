"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    darkMode: false,
    twoFactorAuth: true,
  })

  const handleToggle = (setting: keyof typeof settings) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      [setting]: !prevSettings[setting],
    }))
  }

  const handleSave = () => {
    // Here you would typically send the updated settings to your backend
    console.log("Saved settings:", settings)
    // Show a success message to the user
    alert("Settings saved successfully!")
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="emailNotifications" className="flex flex-col">
            <span className="font-semibold">Email Notifications</span>
            <span className="text-sm text-gray-500">Receive email updates about your account</span>
          </Label>
          <Switch
            id="emailNotifications"
            checked={settings.emailNotifications}
            onCheckedChange={() => handleToggle("emailNotifications")}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="smsNotifications" className="flex flex-col">
            <span className="font-semibold">SMS Notifications</span>
            <span className="text-sm text-gray-500">Receive text messages about your bookings</span>
          </Label>
          <Switch
            id="smsNotifications"
            checked={settings.smsNotifications}
            onCheckedChange={() => handleToggle("smsNotifications")}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="darkMode" className="flex flex-col">
            <span className="font-semibold">Dark Mode</span>
            <span className="text-sm text-gray-500">Use dark theme for the dashboard</span>
          </Label>
          <Switch id="darkMode" checked={settings.darkMode} onCheckedChange={() => handleToggle("darkMode")} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="twoFactorAuth" className="flex flex-col">
            <span className="font-semibold">Two-Factor Authentication</span>
            <span className="text-sm text-gray-500">Add an extra layer of security to your account</span>
          </Label>
          <Switch
            id="twoFactorAuth"
            checked={settings.twoFactorAuth}
            onCheckedChange={() => handleToggle("twoFactorAuth")}
          />
        </div>
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </DashboardLayout>
  )
}


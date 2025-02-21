"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 234 567 8900",
    company: "Elegant Events",
    bio: "Professional wedding planner with 10 years of experience.",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the updated profile to your backend
    // console.log("Updated profile:", profile)
    // Show a success message to the user
    alert("Profile updated successfully!")
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" value={profile.name} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={profile.email} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" value={profile.phone} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" value={profile.company} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" name="bio" value={profile.bio} onChange={handleInputChange} />
        </div>
        <Button type="submit">Update Profile</Button>
      </form>
    </DashboardLayout>
  )
}


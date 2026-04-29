"use client"

import React, { useState, useEffect, useRef } from "react"
import { useUser } from "@/context/UserContext"
import { useRouter } from "next/navigation"
import axiosInstance from "@/lib/axiosConfig"
import { toast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Lock,
  Key,
  Eye,
  EyeOff,
  Camera,
  Shield,
  CheckCircle,
  AlertCircle,
  Settings,
  LogOut,
  ChevronRight,
  Edit3,
} from "lucide-react"

interface ProfileForm {
  fullName: string
  email: string
  phoneNumber: string
  city: string
}

interface PasswordForm {
  oldPassword: string
  newPassword: string
  repeatPassword: string
}

type Section = "profile" | "security"

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"]
  const colors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"]
  const textColors = ["", "text-red-600", "text-orange-600", "text-yellow-600", "text-green-600", "text-emerald-600"]

  return (
    <div className="space-y-1.5 mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-gray-200"}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score]}`}>{labels[score]}</p>
    </div>
  )
}

export default function UserSettingsPage() {
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useUser()
  const router = useRouter()

  const [activeSection, setActiveSection] = useState<Section>("profile")
  const [profile, setProfile] = useState<ProfileForm>({ fullName: "", email: "", phoneNumber: "", city: "" })
  const [originalProfile, setOriginalProfile] = useState<ProfileForm | null>(null)
  const [passwords, setPasswords] = useState<PasswordForm>({ oldPassword: "", newPassword: "", repeatPassword: "" })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isSimpleUser =
    !user?.isVendor &&
    !user?.isSuperAdmin &&
    !user?.roles?.some((r: any) => r.name === "super admin" || r.name === "vendor" || r.name === "admin")

  // Pull the latest user once on mount so cached `user_data` from an older
  // login can't keep stale fields (e.g. city) from showing in the form.
  useEffect(() => {
    refreshUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (user) {
      const initial: ProfileForm = {
        fullName: user.fullName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        city: (user as any).city || "",
      }
      setProfile(initial)
      setOriginalProfile(initial)
    }
  }, [user])

  const hasChanges =
    originalProfile &&
    (profile.fullName !== originalProfile.fullName ||
      profile.email !== originalProfile.email ||
      profile.phoneNumber !== originalProfile.phoneNumber ||
      profile.city !== originalProfile.city)

  const handleSave = async () => {
    if (!user?.id) return
    try {
      setIsSaving(true)
      // Self-update endpoint — uses req.user.id on the server, no role tampering.
      const res = await axiosInstance.patch("/api/v1/users/profile", {
        fullName: profile.fullName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        city: profile.city,
      })
      const updatedUser = res.data?.data ?? null
      setOriginalProfile(profile)
      setIsEditing(false)
      setSavedAt(new Date())
      // Sync to localStorage so header updates
      if (typeof window !== "undefined") {
        const stored = JSON.parse(localStorage.getItem("user_data") || "{}")
        const merged = updatedUser
          ? { ...stored, ...updatedUser }
          : { ...stored, ...profile }
        localStorage.setItem("user_data", JSON.stringify(merged))
        window.dispatchEvent(new CustomEvent("profileUpdated", { detail: merged }))
      }
      await refreshUser()
      toast({ title: "Profile saved", description: "Your changes have been applied." })
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Please try again."
      toast({ title: "Save failed", description: msg, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (originalProfile) setProfile(originalProfile)
    setIsEditing(false)
  }

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.repeatPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" })
      return
    }
    if (passwords.newPassword.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" })
      return
    }
    if (!user?.id) return
    try {
      setIsChangingPassword(true)
      await axiosInstance.patch("/api/v1/users/change-password", {
        currentPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      })
      setPasswords({ oldPassword: "", newPassword: "", repeatPassword: "" })
      toast({ title: "Password changed", description: "You will be logged out for security." })
      setTimeout(() => {
        logout()
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Please check your current password."
      toast({ title: "Failed to change password", description: msg, variant: "destructive" })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Frontend size guard so we don't hit the multer limit blindly.
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Please choose an image under 5 MB.",
        variant: "destructive",
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Unsupported file",
        description: "Please choose an image file (PNG/JPG).",
        variant: "destructive",
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)
    try {
      setIsUploadingImage(true)
      const form = new FormData()
      form.append("picture", file)
      // Don't set Content-Type manually — axios + FormData adds the multipart
      // boundary automatically. Setting it by hand drops the boundary and the
      // server returns "Unexpected end of form".
      const res = await axiosInstance.post(
        "/api/v1/users/upload-profile-picture",
        form
      )
      const serverUrl = res.data?.data?.profileImage
      if (serverUrl) {
        // Cache-bust so the <img> swaps to the new file (the URL pattern is
        // stable per-user, so the browser would otherwise reuse the cached
        // previous photo).
        const bustedUrl = `${serverUrl}${serverUrl.includes("?") ? "&" : "?"}v=${Date.now()}`
        setImagePreview(bustedUrl)
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("user_data") || "{}")
          localStorage.setItem(
            "user_data",
            JSON.stringify({ ...stored, profileImage: bustedUrl })
          )
          window.dispatchEvent(
            new CustomEvent("profileUpdated", {
              detail: { profileImage: bustedUrl },
            })
          )
        }
      }
      await refreshUser()
      toast({ title: "Profile picture updated" })
    } catch (err: any) {
      setImagePreview(null)
      const msg = err?.response?.data?.message || "Please try again."
      toast({ title: "Upload failed", description: msg, variant: "destructive" })
    } finally {
      // Free the temporary object URL we created from the local file.
      try { URL.revokeObjectURL(objectUrl) } catch {}
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50/50 flex items-center justify-center">
        <Spinner size="lg" className="text-purple-500" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    router.push("/login")
    return null
  }

  const avatarSrc = imagePreview || (user as any).profileImage
  const initials = (user.fullName || "U").charAt(0).toUpperCase()

  const navItems: { id: Section; label: string; icon: React.ElementType; description: string }[] = [
    { id: "profile", label: "Personal Info", icon: User, description: "Name, email, phone & city" },
    { id: "security", label: "Security", icon: Shield, description: "Password & account safety" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50/40">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-sm text-gray-500">Manage your profile and security preferences</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar ── */}
          <aside className="lg:w-64 shrink-0 space-y-3">
            {/* Avatar card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center">
              <div className="relative group mb-3">
                {isSimpleUser && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                )}
                <button
                  type="button"
                  onClick={() => isSimpleUser && fileInputRef.current?.click()}
                  disabled={isUploadingImage || !isSimpleUser}
                  className={`w-20 h-20 rounded-full overflow-hidden border-4 border-purple-100 transition-all duration-200 ${isSimpleUser ? "cursor-pointer hover:border-purple-300" : "cursor-default"}`}
                >
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-2xl">
                      {initials}
                    </div>
                  )}
                  {isSimpleUser && (
                    <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                      {isUploadingImage ? (
                        <Spinner size="sm" className="text-white" />
                      ) : (
                        <Camera className="w-5 h-5 text-white" />
                      )}
                    </span>
                  )}
                </button>
              </div>
              <p className="font-semibold text-gray-900 text-sm">{user.fullName || "—"}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-full">{user.email}</p>
              {user.isVendor && (
                <Badge className="mt-2 bg-purple-100 text-purple-700 border-0 text-xs">Vendor</Badge>
              )}
              {isSimpleUser && (
                <p className="text-[11px] text-gray-400 mt-2">Click avatar to change photo</p>
              )}
            </div>

            {/* Navigation */}
            <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 border-b border-gray-50 last:border-0 ${
                      active
                        ? "bg-purple-50 text-purple-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-purple-100" : "bg-gray-100"}`}>
                      <Icon className={`w-4 h-4 ${active ? "text-purple-600" : "text-gray-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${active ? "text-purple-700" : "text-gray-800"}`}>{item.label}</p>
                      <p className="text-[11px] text-gray-400 truncate">{item.description}</p>
                    </div>
                    {active && <ChevronRight className="w-4 h-4 text-purple-400 shrink-0" />}
                  </button>
                )
              })}
            </nav>

            {/* Logout */}
            <button
              onClick={() => { logout(); router.push("/") }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-600 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all duration-150 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 min-w-0">

            {/* Personal Info */}
            {activeSection === "profile" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Section header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-white font-semibold text-lg">Personal Information</h2>
                        <p className="text-purple-200 text-sm">Update your profile details</p>
                      </div>
                    </div>
                    {!isEditing && (
                      <Button
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="bg-white/20 hover:bg-white/30 border-white/30 text-white border"
                        variant="outline"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Fields grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-purple-400" />
                        Full Name
                      </Label>
                      <Input
                        value={profile.fullName}
                        onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Your full name"
                        className={`h-11 transition-all duration-200 ${
                          isEditing
                            ? "border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-white"
                            : "border-gray-100 bg-gray-50 text-gray-700"
                        }`}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-purple-400" />
                        Email Address
                      </Label>
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="your@email.com"
                        className={`h-11 transition-all duration-200 ${
                          isEditing
                            ? "border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-white"
                            : "border-gray-100 bg-gray-50 text-gray-700"
                        }`}
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-purple-400" />
                        Phone Number
                      </Label>
                      <Input
                        type="tel"
                        value={profile.phoneNumber}
                        onChange={(e) => setProfile((p) => ({ ...p, phoneNumber: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="+92 300 0000000"
                        className={`h-11 transition-all duration-200 ${
                          isEditing
                            ? "border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-white"
                            : "border-gray-100 bg-gray-50 text-gray-700"
                        }`}
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-purple-400" />
                        City
                      </Label>
                      <Input
                        value={profile.city}
                        onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Your city"
                        className={`h-11 transition-all duration-200 ${
                          isEditing
                            ? "border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-white"
                            : "border-gray-100 bg-gray-50 text-gray-700"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Status / feedback banners */}
                  {isEditing && hasChanges && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Unsaved changes
                    </div>
                  )}

                  {!isEditing && savedAt && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      Saved at {savedAt.toLocaleTimeString()}
                    </div>
                  )}

                  {/* Actions */}
                  {isEditing && (
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                      <Button variant="outline" onClick={handleCancel} className="border-gray-200 text-gray-600">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md shadow-purple-200"
                      >
                        {isSaving ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security */}
            {activeSection === "security" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Section header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-white font-semibold text-lg">Security</h2>
                      <p className="text-blue-100 text-sm">Change your password to keep your account safe</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-700">
                      After changing your password you will be automatically signed out and redirected to login.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Current Password */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-400" />
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          type={showOld ? "text" : "password"}
                          value={passwords.oldPassword}
                          onChange={(e) => setPasswords((p) => ({ ...p, oldPassword: e.target.value }))}
                          placeholder="Enter current password"
                          className="h-11 border-indigo-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOld(!showOld)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-indigo-400" />
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          type={showNew ? "text" : "password"}
                          value={passwords.newPassword}
                          onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                          placeholder="Enter new password"
                          className="h-11 border-indigo-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <PasswordStrengthBar password={passwords.newPassword} />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Input
                          type={showRepeat ? "text" : "password"}
                          value={passwords.repeatPassword}
                          onChange={(e) => setPasswords((p) => ({ ...p, repeatPassword: e.target.value }))}
                          placeholder="Repeat new password"
                          className={`h-11 focus:ring-2 focus:ring-indigo-400/10 pr-10 ${
                            passwords.repeatPassword && passwords.repeatPassword !== passwords.newPassword
                              ? "border-red-300 focus:border-red-400"
                              : "border-indigo-100 focus:border-indigo-400"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRepeat(!showRepeat)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showRepeat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwords.repeatPassword && passwords.repeatPassword !== passwords.newPassword && (
                        <p className="text-xs text-red-600">Passwords do not match</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button
                      onClick={handlePasswordChange}
                      disabled={
                        !passwords.oldPassword ||
                        !passwords.newPassword ||
                        !passwords.repeatPassword ||
                        passwords.newPassword !== passwords.repeatPassword ||
                        isChangingPassword
                      }
                      className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md shadow-indigo-200"
                    >
                      {isChangingPassword ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Changing Password…
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

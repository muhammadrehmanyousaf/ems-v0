"use client"

import React, { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useUser } from "@/context/UserContext"
import { useRouter } from "next/navigation"
import axiosInstance from "@/lib/axiosConfig"
import { toast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
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
  LogOut,
  ChevronRight,
  Edit3,
} from "lucide-react"
import { cn } from "@/lib/utils"

import {
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/user-dashboard"

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

  const labels = ["", "Weak", "Fair", "Good", "Strong", "Very strong"]
  const colors = [
    "",
    "bg-bridal-coral",
    "bg-bridal-coral/70",
    "bg-bridal-gold/70",
    "bg-bridal-sage",
    "bg-[#3F6B43]",
  ]

  return (
    <div className="space-y-1.5 mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= score ? colors[score] : "bg-border",
            )}
          />
        ))}
      </div>
      <p className="text-[11px] font-medium text-muted-foreground">{labels[score]}</p>
    </div>
  )
}

export default function UserSettingsPage() {
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useUser()
  const router = useRouter()

  const [activeSection, setActiveSection] = useState<Section>("profile")
  const [profile, setProfile] = useState<ProfileForm>({
    fullName: "",
    email: "",
    phoneNumber: "",
    city: "",
  })
  const [originalProfile, setOriginalProfile] = useState<ProfileForm | null>(null)
  const [passwords, setPasswords] = useState<PasswordForm>({
    oldPassword: "",
    newPassword: "",
    repeatPassword: "",
  })
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
    !user?.roles?.some(
      (r: any) =>
        r.name === "super admin" || r.name === "vendor" || r.name === "admin",
    )

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
      const msg = err?.response?.data?.message || "Please try again."
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
      toast({
        title: "Password too short",
        description: "Use at least 8 characters.",
        variant: "destructive",
      })
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
      toast({
        title: "Password changed",
        description: "You will be logged out for security.",
      })
      setTimeout(() => {
        logout()
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Please check your current password."
      toast({
        title: "Failed to change password",
        description: msg,
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
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
      const res = await axiosInstance.post(
        "/api/v1/users/upload-profile-picture",
        form,
      )
      const serverUrl = res.data?.data?.profileImage
      if (serverUrl) {
        const bustedUrl = `${serverUrl}${serverUrl.includes("?") ? "&" : "?"}v=${Date.now()}`
        setImagePreview(bustedUrl)
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("user_data") || "{}")
          localStorage.setItem(
            "user_data",
            JSON.stringify({ ...stored, profileImage: bustedUrl }),
          )
          window.dispatchEvent(
            new CustomEvent("profileUpdated", {
              detail: { profileImage: bustedUrl },
            }),
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
      try {
        URL.revokeObjectURL(objectUrl)
      } catch {}
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const eyebrow = (
    <>
      <span>My account</span>
      <span className="size-1 rounded-full bg-muted-foreground/40" />
      <span>Settings</span>
    </>
  )

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow={eyebrow}
          title="Settings"
          description="Manage your profile and security preferences."
        />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-bridal-gold" />
        </div>
      </PageContainer>
    )
  }

  if (!isAuthenticated || !user) {
    router.push("/login")
    return null
  }

  const avatarSrc = imagePreview || (user as any).profileImage
  const initials = (user.fullName || "U").charAt(0).toUpperCase()

  const navItems: {
    id: Section
    label: string
    icon: React.ElementType
    description: string
  }[] = [
    {
      id: "profile",
      label: "Personal info",
      icon: User,
      description: "Name, email, phone, city",
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      description: "Password & account safety",
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        eyebrow={eyebrow}
        title="Settings"
        description="Manage your profile and security preferences."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        {/* Sidebar */}
        <aside className="space-y-3">
          {/* Avatar card */}
          <Card className="p-5 flex flex-col items-center text-center">
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
                className={cn(
                  "relative w-20 h-20 rounded-full overflow-hidden border-2 border-border transition-colors block",
                  isSimpleUser ? "cursor-pointer hover:border-bridal-gold/55" : "cursor-default",
                )}
              >
                {avatarSrc ? (
                  // Same blob-vs-remote handling as user/profile/page.tsx —
                  // next/image cannot serve blob: URLs.
                  avatarSrc.startsWith("blob:") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={avatarSrc}
                      alt="Profile"
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full bg-bridal-cream flex items-center justify-center text-bridal-gold-dark font-display italic text-2xl">
                    {initials}
                  </div>
                )}
                {isSimpleUser && (
                  <span className="absolute inset-0 rounded-full bg-bridal-charcoal/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    {isUploadingImage ? (
                      <Spinner size="sm" className="text-bridal-ivory" />
                    ) : (
                      <Camera className="size-4 text-bridal-ivory" />
                    )}
                  </span>
                )}
              </button>
            </div>
            <p className="font-display italic text-[16px] text-foreground">
              {user.fullName || "—"}
            </p>
            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate max-w-full">
              {user.email}
            </p>
            {user.isVendor ? (
              <span className="mt-2 inline-flex items-center rounded-full border border-bridal-gold/45 bg-bridal-cream px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-bridal-gold-dark">
                Vendor
              </span>
            ) : null}
            {isSimpleUser ? (
              <p className="text-[10.5px] text-muted-foreground mt-2">
                Click avatar to change photo
              </p>
            ) : null}
          </Card>

          {/* Section nav */}
          <Card className="overflow-hidden">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = activeSection === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "relative w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/60 last:border-0",
                    active
                      ? "bg-bridal-cream"
                      : "hover:bg-muted/40",
                  )}
                >
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-bridal-gold"
                    />
                  ) : null}
                  <div
                    className={cn(
                      "size-8 rounded-md flex items-center justify-center shrink-0",
                      active
                        ? "bg-bridal-gold/15 text-bridal-gold-dark"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-[13px] font-medium",
                        active ? "text-foreground" : "text-foreground/85",
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                  {active ? (
                    <ChevronRight className="size-4 text-bridal-gold-dark shrink-0" />
                  ) : null}
                </button>
              )
            })}
          </Card>

          {/* Sign out */}
          <button
            type="button"
            onClick={() => {
              logout()
              router.push("/")
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-[12.5px] font-medium text-muted-foreground hover:text-bridal-coral hover:border-bridal-coral/35 hover:bg-bridal-coral/5 transition-colors"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </aside>

        {/* Main content */}
        <main className="min-w-0">
          {activeSection === "profile" ? (
            <SectionCard
              title="Personal information"
              description="Update your basic profile details."
              action={
                !isEditing ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="gap-1.5"
                  >
                    <Edit3 className="size-3.5" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button onClick={handleCancel} variant="ghost" size="sm">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={!hasChanges || isSaving}
                      size="sm"
                      className="gap-1.5"
                    >
                      {isSaving ? (
                        <Spinner size="sm" className="mr-1" />
                      ) : (
                        <Save className="size-3.5" />
                      )}
                      {isSaving ? "Saving…" : "Save"}
                    </Button>
                  </div>
                )
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[11.5px] font-medium text-foreground inline-flex items-center gap-1.5">
                    <User className="size-3.5 text-muted-foreground" />
                    Full name
                  </Label>
                  <Input
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, fullName: e.target.value }))
                    }
                    disabled={!isEditing}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[11.5px] font-medium text-foreground inline-flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" />
                    Email address
                  </Label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, email: e.target.value }))
                    }
                    disabled={!isEditing}
                    placeholder="you@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[11.5px] font-medium text-foreground inline-flex items-center gap-1.5">
                    <Phone className="size-3.5 text-muted-foreground" />
                    Phone number
                  </Label>
                  <Input
                    type="tel"
                    value={profile.phoneNumber}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, phoneNumber: e.target.value }))
                    }
                    disabled={!isEditing}
                    placeholder="+92 300 1234567"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[11.5px] font-medium text-foreground inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    City
                  </Label>
                  <Input
                    value={profile.city}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, city: e.target.value }))
                    }
                    disabled={!isEditing}
                    placeholder="Your city"
                  />
                </div>
              </div>

              {isEditing && hasChanges ? (
                <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-bridal-gold/45 bg-bridal-cream px-3 py-2 text-[12px] text-bridal-gold-dark">
                  <AlertCircle className="size-3.5" />
                  Unsaved changes
                </div>
              ) : null}

              {!isEditing && savedAt ? (
                <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-bridal-sage/45 bg-bridal-sage/15 px-3 py-2 text-[12px] text-[#3F6B43]">
                  <CheckCircle className="size-3.5" />
                  Saved at {savedAt.toLocaleTimeString()}
                </div>
              ) : null}
            </SectionCard>
          ) : null}

          {activeSection === "security" ? (
            <SectionCard
              title="Security"
              description="Change your password to keep your account safe."
            >
              <div className="rounded-md border border-bridal-gold/45 bg-bridal-cream px-4 py-3 mb-5 flex items-start gap-3">
                <AlertCircle className="size-4 text-bridal-gold-dark mt-0.5 shrink-0" />
                <p className="text-[12.5px] text-foreground/85 leading-relaxed">
                  After changing your password you will be automatically signed out
                  and redirected to login.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[11.5px] font-medium text-foreground inline-flex items-center gap-1.5">
                    <Lock className="size-3.5 text-muted-foreground" />
                    Current password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showOld ? "text" : "password"}
                      value={passwords.oldPassword}
                      onChange={(e) =>
                        setPasswords((p) => ({ ...p, oldPassword: e.target.value }))
                      }
                      placeholder="Enter current password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOld(!showOld)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showOld ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11.5px] font-medium text-foreground inline-flex items-center gap-1.5">
                    <Key className="size-3.5 text-muted-foreground" />
                    New password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={passwords.newPassword}
                      onChange={(e) =>
                        setPasswords((p) => ({ ...p, newPassword: e.target.value }))
                      }
                      placeholder="Enter new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNew ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <PasswordStrengthBar password={passwords.newPassword} />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-[11.5px] font-medium text-foreground inline-flex items-center gap-1.5">
                    <CheckCircle className="size-3.5 text-muted-foreground" />
                    Confirm new password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showRepeat ? "text" : "password"}
                      value={passwords.repeatPassword}
                      onChange={(e) =>
                        setPasswords((p) => ({
                          ...p,
                          repeatPassword: e.target.value,
                        }))
                      }
                      placeholder="Repeat new password"
                      className={cn(
                        "pr-10",
                        passwords.repeatPassword &&
                          passwords.repeatPassword !== passwords.newPassword &&
                          "border-bridal-coral focus-visible:ring-bridal-coral/40",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRepeat(!showRepeat)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showRepeat ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {passwords.repeatPassword &&
                  passwords.repeatPassword !== passwords.newPassword ? (
                    <p className="text-[11px] text-bridal-coral">
                      Passwords do not match
                    </p>
                  ) : null}
                </div>
              </div>

              <Separator className="my-5" />

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
                  size="sm"
                  className="gap-1.5"
                >
                  {isChangingPassword ? (
                    <Spinner size="sm" className="mr-1" />
                  ) : (
                    <Shield className="size-3.5" />
                  )}
                  {isChangingPassword ? "Changing…" : "Change password"}
                </Button>
              </div>
            </SectionCard>
          ) : null}
        </main>
      </div>
    </PageContainer>
  )
}

"use client"

/**
 * Account settings — redesigned (Track C, bespoke). Clean profile + account +
 * business-contact cards, wired to UsersAPI.getMyProfile(). Edit profile is at
 * full 9-field parity with the original /dashboard/profile (PATCH
 * /api/v1/users/profile via UsersAPI.updateMyProfile, email excluded by design);
 * change password is live (UsersAPI.changePassword); 2FA reuses the shared
 * TwoFactor enrol/disable modals. Original settings/profile untouched. Route
 * /dashboard/settings-new. Token-only (themes).
 */

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { UsersAPI, type ApiUser } from "@/lib/api/dashboard"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { Icon, Spinner, type IconName } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TwoFactorEnrolModal } from "@/components/auth/TwoFactorEnrolModal"
import { TwoFactorDisableModal } from "@/components/auth/TwoFactorDisableModal"
import { useUser } from "@/context/UserContext"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function errMsg(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    fallback
  )
}

const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1) : "—")
const initials = (name?: string | null) =>
  (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" })
}

function Field({ icon, label, value }: { icon: IconName; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon name={icon} size={15} />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="truncate text-sm text-foreground">{value || "—"}</div>
      </div>
    </div>
  )
}

function Card({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  )
}

/* ── Edit profile dialog — full 9-field parity with /dashboard/profile.
   PATCH /api/v1/users/profile {fullName, phoneNumber, city, subArea,
   bookingEmail, primaryContactNumber, secondaryContactNumber, website,
   officeAddress}. Email is intentionally NOT edited here (parity). ── */
const EMPTY_PROFILE_FORM = {
  fullName: "",
  phoneNumber: "",
  city: "",
  subArea: "",
  bookingEmail: "",
  primaryContactNumber: "",
  secondaryContactNumber: "",
  website: "",
  officeAddress: "",
}

function EditProfileDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: ApiUser
}) {
  const qc = useQueryClient()
  const { refreshUser } = useUser()
  const [form, setForm] = React.useState({ ...EMPTY_PROFILE_FORM })

  // Re-seed from live data whenever the dialog opens. The business-contact
  // fields ride on the user object even though ApiUser doesn't type them,
  // so we read them through a string-record cast (mirrors the original).
  React.useEffect(() => {
    if (open) {
      const x = (user ?? {}) as unknown as Record<string, string>
      setForm({
        fullName: user?.fullName ?? "",
        phoneNumber: user?.phoneNumber ?? "",
        city: user?.city ?? "",
        subArea: user?.subArea ?? "",
        bookingEmail: x.bookingEmail ?? "",
        primaryContactNumber: x.primaryContactNumber ?? "",
        secondaryContactNumber: x.secondaryContactNumber ?? "",
        website: x.website ?? "",
        officeAddress: x.officeAddress ?? "",
      })
    }
  }, [open, user])

  const mutation = useMutation({
    mutationFn: () => UsersAPI.updateMyProfile(form),
    onSuccess: async () => {
      showSuccessToast("Profile updated")
      qc.invalidateQueries({ queryKey: ["account-settings-redesigned"] })
      await refreshUser()
      onOpenChange(false)
    },
    onError: (err) => toast.error(errMsg(err, "Failed to update profile")),
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your personal details and business contact information.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-5 py-2"
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
        >
          {/* Personal */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Personal
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rsa-fullName">Full name</Label>
                <Input id="rsa-fullName" value={form.fullName} onChange={set("fullName")} placeholder="Your full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsa-phone">Phone number</Label>
                <Input id="rsa-phone" value={form.phoneNumber} onChange={set("phoneNumber")} placeholder="+92 300 0000000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsa-city">City</Label>
                <Input id="rsa-city" value={form.city} onChange={set("city")} placeholder="e.g. Lahore" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsa-subArea">Area / sub-area</Label>
                <Input id="rsa-subArea" value={form.subArea} onChange={set("subArea")} placeholder="e.g. DHA Phase 5" />
              </div>
            </div>
          </div>

          {/* Business contact */}
          <div className="space-y-4 border-t border-border/60 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Business contact
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rsa-bookingEmail">Booking email</Label>
                <Input id="rsa-bookingEmail" type="email" value={form.bookingEmail} onChange={set("bookingEmail")} placeholder="bookings@yourbusiness.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsa-primaryContact">Primary contact</Label>
                <Input id="rsa-primaryContact" value={form.primaryContactNumber} onChange={set("primaryContactNumber")} placeholder="+92 300 0000000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsa-secondaryContact">Secondary contact</Label>
                <Input id="rsa-secondaryContact" value={form.secondaryContactNumber} onChange={set("secondaryContactNumber")} placeholder="+92 300 0000000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsa-website">Website</Label>
                <Input id="rsa-website" value={form.website} onChange={set("website")} placeholder="https://yourbusiness.com" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="rsa-officeAddress">Office address</Label>
                <Input id="rsa-officeAddress" value={form.officeAddress} onChange={set("officeAddress")} placeholder="Full office address" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <><Spinner size={15} className="mr-1.5" /> Saving…</>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ── Change password dialog — PATCH /api/v1/users/change-password ── */
function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [pw, setPw] = React.useState({ currentPassword: "", newPassword: "", confirmPassword: "" })

  React.useEffect(() => {
    if (open) setPw({ currentPassword: "", newPassword: "", confirmPassword: "" })
  }, [open])

  const mutation = useMutation({
    mutationFn: () =>
      UsersAPI.changePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      }),
    onSuccess: () => {
      showSuccessToast("Password changed")
      onOpenChange(false)
    },
    onError: (err) => toast.error(errMsg(err, "Failed to change password")),
  })

  const set = (k: keyof typeof pw) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPw((p) => ({ ...p, [k]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.newPassword !== pw.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }
    if (pw.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4 py-2" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="rsa-cur">Current password</Label>
            <Input id="rsa-cur" type="password" value={pw.currentPassword} onChange={set("currentPassword")} placeholder="Enter current password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rsa-new">New password</Label>
            <Input id="rsa-new" type="password" value={pw.newPassword} onChange={set("newPassword")} placeholder="Min 6 characters" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rsa-conf">Confirm new password</Label>
            <Input id="rsa-conf" type="password" value={pw.confirmPassword} onChange={set("confirmPassword")} placeholder="Repeat new password" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <><Spinner size={15} className="mr-1.5" /> Updating…</>
              ) : (
                "Update password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AccountSettingsRedesignedView() {
  const { data, isLoading } = useQuery({
    queryKey: ["account-settings-redesigned"],
    queryFn: () => UsersAPI.getMyProfile(),
  })
  const u: ApiUser | undefined = data?.user
  // Business-contact fields ride on the user object but aren't typed on
  // ApiUser; read them through a string-record cast (mirrors the original).
  const biz = (u ?? {}) as unknown as Record<string, string>

  const { user: authUser, flags } = useUser()
  const twoFactorEnabled = flags?.twoFactorEnabled ?? !!authUser?.twoFactorEnabled

  const [editOpen, setEditOpen] = React.useState(false)
  const [pwOpen, setPwOpen] = React.useState(false)
  const [enrolOpen, setEnrolOpen] = React.useState(false)
  const [disableOpen, setDisableOpen] = React.useState(false)

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Settings"
        title="Account settings"
        description="Your profile, contact details and account — redesigned, wired to live data."
      />

      {/* Profile header */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
          {isLoading ? "…" : initials(u?.fullName)}
        </span>
        <div className="min-w-0">
          <div className="text-lg font-semibold">{isLoading ? "Loading…" : (u?.fullName || "—")}</div>
          <div className="text-sm text-muted-foreground">{u?.email || "—"}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {u?.vendorType && <StatusPill tone="info">{u.vendorType}</StatusPill>}
            <StatusPill tone={u?.active ? "success" : "neutral"}>{u?.active ? "Active" : "Inactive"}</StatusPill>
            {u?.reviewProfile === false && <StatusPill tone="warning">Pending review</StatusPill>}
          </div>
        </div>
        <Button variant="outline" className="ml-auto" onClick={() => setEditOpen(true)}>
          <Icon name="Pencil" size={15} className="mr-1.5" /> Edit profile
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Personal information" action={<Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}><Icon name="Pencil" size={14} className="mr-1" /> Edit</Button>}>
          <Field icon="User" label="Full name" value={u?.fullName} />
          <div className="border-t border-border/60" />
          <Field icon="Phone" label="Phone" value={u?.phoneNumber} />
          <div className="border-t border-border/60" />
          <Field icon="MapPin" label="City" value={[u?.city, u?.subArea].filter(Boolean).join(", ") || "—"} />
        </Card>

        <Card title="Account" action={<StatusPill tone="neutral">{u?.isVendor ? "Vendor account" : "Customer account"}</StatusPill>}>
          <Field icon="Mail" label="Email" value={u?.email} />
          <div className="border-t border-border/60" />
          <Field icon="ShieldCheck" label="Role" value={u?.isVendor ? "Vendor" : "Customer"} />
          <div className="border-t border-border/60" />
          <Field icon="Calendar" label="Member since" value={fmtDate(u?.createdAt)} />
        </Card>

        <Card
          title="Business contact"
          className="lg:col-span-2"
          action={<Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}><Icon name="Pencil" size={14} className="mr-1" /> Edit</Button>}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6">
            <Field icon="Mail" label="Booking email" value={biz.bookingEmail} />
            <Field icon="Phone" label="Primary contact" value={biz.primaryContactNumber} />
            <Field icon="Phone" label="Secondary contact" value={biz.secondaryContactNumber} />
            <Field icon="Globe" label="Website" value={biz.website} />
            <div className="sm:col-span-2">
              <Field icon="MapPin" label="Office address" value={biz.officeAddress} />
            </div>
          </div>
        </Card>

        <Card title="Security" className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name="Lock" size={15} /></span>
              <div>
                <div className="text-sm font-medium">Password</div>
                <div className="text-xs text-muted-foreground">Keep your account secure with a strong password.</div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPwOpen(true)}>Change password</Button>
          </div>
          <div className="border-t border-border/60" />
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name="ShieldCheck" size={15} /></span>
              <div>
                <div className="text-sm font-medium">Two-factor authentication</div>
                <div className="text-xs text-muted-foreground">
                  {twoFactorEnabled
                    ? "Two-factor authentication is on for this account."
                    : "Add an extra layer of security at login."}
                </div>
              </div>
            </div>
            {twoFactorEnabled ? (
              <Button variant="outline" size="sm" onClick={() => setDisableOpen(true)}>Disable 2FA</Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEnrolOpen(true)}>Enable 2FA</Button>
            )}
          </div>
        </Card>
      </div>

      {/* Wired affordances */}
      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} user={u} />
      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
      <TwoFactorEnrolModal open={enrolOpen} onOpenChange={setEnrolOpen} />
      <TwoFactorDisableModal open={disableOpen} onOpenChange={setDisableOpen} />
    </div>
  )
}

export default AccountSettingsRedesignedView

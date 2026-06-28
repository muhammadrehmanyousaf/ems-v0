"use client"

/**
 * Account settings — redesigned (Track C, bespoke). Clean profile + account
 * cards, wired to UsersAPI.getMyProfile(). Edit profile + change password are
 * live (UsersAPI.updateProfile / UsersAPI.changePassword); 2FA reuses the shared
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

/* ── Edit profile dialog — PATCH /api/v1/users {fullName,email,phoneNumber} ── */
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
  const [form, setForm] = React.useState({ fullName: "", email: "", phoneNumber: "" })

  // Re-seed from live data whenever the dialog opens.
  React.useEffect(() => {
    if (open) {
      setForm({
        fullName: user?.fullName ?? "",
        email: user?.email ?? "",
        phoneNumber: user?.phoneNumber ?? "",
      })
    }
  }, [open, user?.fullName, user?.email, user?.phoneNumber])

  const mutation = useMutation({
    mutationFn: () => UsersAPI.updateProfile(form),
    onSuccess: () => {
      showSuccessToast("Profile updated")
      qc.invalidateQueries({ queryKey: ["account-settings-redesigned"] })
      onOpenChange(false)
    },
    onError: (err) => toast.error(errMsg(err, "Failed to update profile")),
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Update your name, email and phone number.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4 py-2"
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="rsa-fullName">Full name</Label>
            <Input id="rsa-fullName" value={form.fullName} onChange={set("fullName")} placeholder="Your full name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rsa-email">Email</Label>
            <Input id="rsa-email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rsa-phone">Phone</Label>
            <Input id="rsa-phone" value={form.phoneNumber} onChange={set("phoneNumber")} placeholder="+92 300 0000000" />
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

"use client"

/**
 * Account settings — redesigned (Track C, bespoke). Clean profile + account
 * cards, wired to UsersAPI.getMyProfile(). Read-only presentation (edit buttons
 * are affordances); original settings/profile untouched. Route
 * /dashboard/settings-new. Token-only (themes).
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { UsersAPI, type ApiUser } from "@/lib/api/dashboard"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { Icon, type IconName } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

export function AccountSettingsRedesignedView() {
  const { data, isLoading } = useQuery({
    queryKey: ["account-settings-redesigned"],
    queryFn: () => UsersAPI.getMyProfile(),
  })
  const u: ApiUser | undefined = data?.user

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
        <Button variant="outline" className="ml-auto">
          <Icon name="Pencil" size={15} className="mr-1.5" /> Edit profile
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Personal information" action={<Button size="sm" variant="ghost"><Icon name="Pencil" size={14} className="mr-1" /> Edit</Button>}>
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
            <Button variant="outline" size="sm">Change password</Button>
          </div>
          <div className="border-t border-border/60" />
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name="ShieldCheck" size={15} /></span>
              <div>
                <div className="text-sm font-medium">Two-factor authentication</div>
                <div className="text-xs text-muted-foreground">Add an extra layer of security at login.</div>
              </div>
            </div>
            <Button variant="outline" size="sm">Enable 2FA</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AccountSettingsRedesignedView

"use client"

// 01-VR-ENHANCE-V1-FE — Settings → Security page.
// One place for: verification status, 2FA toggle, active sessions.

import { useState, useEffect } from "react"
import { Mail, Phone, ShieldCheck, ShieldOff } from "lucide-react"
import { useUser } from "@/context/UserContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VerificationBadge, TwoFactorBadge } from "@/components/ui/verification-badge"
import { EmailVerifyModal } from "@/components/auth/EmailVerifyModal"
import { PhoneVerifyModal } from "@/components/auth/PhoneVerifyModal"
import { PHONE_OTP_AVAILABLE } from "@/lib/auth/phone-otp"
import { TwoFactorEnrolModal } from "@/components/auth/TwoFactorEnrolModal"
import { TwoFactorDisableModal } from "@/components/auth/TwoFactorDisableModal"
import { SessionList } from "@/components/auth/SessionList"

export default function SecuritySettingsPage() {
  // BUG-007 — this is a client component, so it can't export `metadata` and was
  // falling back to the generic "Wedding Wala — Dashboard" tab title. Set a
  // page-specific document title, matching every other dashboard screen.
  useEffect(() => {
    document.title = "Dashboard : Security"
  }, [])
  const { user, flags } = useUser()
  const [emailOpen, setEmailOpen] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [enrolOpen, setEnrolOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)

  const emailVerified = flags?.emailVerified ?? !!user?.emailVerified
  const phoneVerified = flags?.phoneVerified ?? !!user?.phoneVerified
  const twoFactorEnabled = flags?.twoFactorEnabled ?? !!user?.twoFactorEnabled

  return (
    <div className="px-4 py-6 lg:px-8 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="font-display italic text-3xl text-bridal-charcoal">Account security</h1>
        <p className="text-sm text-bridal-text-soft mt-1">
          Verify your contact details, manage two-factor authentication, and review active sessions.
        </p>
      </header>

      {/* Verification status */}
      <Card>
        <CardHeader>
          <CardTitle>Verification</CardTitle>
          <CardDescription>
            {PHONE_OTP_AVAILABLE
              ? "Verifying your email and phone unlocks bookings, payouts, and trust badges."
              : "Verifying your email unlocks bookings, payouts, and trust badges."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <Mail className="w-4 h-4 mt-1 text-bridal-charcoal" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-bridal-charcoal truncate">{user?.email || "—"}</p>
                <p className="text-xs text-bridal-text-soft">Email address</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <VerificationBadge verified={emailVerified} label="Email verified" />
              {!emailVerified && (
                <Button size="sm" variant="outline" onClick={() => setEmailOpen(true)}>
                  Verify
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <Phone className="w-4 h-4 mt-1 text-bridal-charcoal" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-bridal-charcoal truncate">
                  {user?.phoneE164 || user?.phoneNumber || "—"}
                </p>
                <p className="text-xs text-bridal-text-soft">Phone number</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <VerificationBadge verified={phoneVerified} label="Phone verified" />
              {/* Offer Verify only when a code can actually be delivered. With
                  no SMS gateway this button opened a modal that answered "OTP
                  delivery is not configured" — the platform explaining its own
                  missing infrastructure to a vendor who did nothing wrong. Say
                  it is unavailable instead of pretending it is their move. */}
              {!phoneVerified && (
                PHONE_OTP_AVAILABLE ? (
                  <Button size="sm" variant="outline" onClick={() => setPhoneOpen(true)}>
                    Verify
                  </Button>
                ) : (
                  <span className="text-xs text-bridal-text-soft">
                    Phone verification isn&apos;t available yet
                  </span>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            Adds an extra layer of protection using a TOTP authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <TwoFactorBadge enabled={twoFactorEnabled} />
          {twoFactorEnabled ? (
            <Button size="sm" variant="outline" onClick={() => setDisableOpen(true)}>
              <ShieldOff className="w-4 h-4 mr-1.5" />
              Disable 2FA
            </Button>
          ) : (
            <Button size="sm" onClick={() => setEnrolOpen(true)}>
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Enable 2FA
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>
            Sign out specific devices, or all devices at once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionList />
        </CardContent>
      </Card>

      <EmailVerifyModal open={emailOpen} onOpenChange={setEmailOpen} />
      <PhoneVerifyModal open={phoneOpen} onOpenChange={setPhoneOpen} />
      <TwoFactorEnrolModal open={enrolOpen} onOpenChange={setEnrolOpen} />
      <TwoFactorDisableModal open={disableOpen} onOpenChange={setDisableOpen} />
    </div>
  )
}

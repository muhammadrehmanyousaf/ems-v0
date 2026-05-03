"use client"

// 01-VR-ENHANCE-V1-FE — top-of-dashboard nudge for users who haven't verified
// their email or phone. Hidden when both are verified. Idempotent across reloads
// because flags are persisted in UserContext + localStorage.

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, Mail, Phone, ShieldCheck } from "lucide-react"
import { useUser } from "@/context/UserContext"
import { Button } from "@/components/ui/button"
import { EmailVerifyModal } from "./EmailVerifyModal"
import { PhoneVerifyModal } from "./PhoneVerifyModal"

export function VerificationBanner() {
  const { flags } = useUser()
  const [emailOpen, setEmailOpen] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)

  if (!flags) return null
  const needsEmail = !flags.emailVerified
  const needsPhone = !flags.phoneVerified
  if (!needsEmail && !needsPhone) return null

  return (
    <>
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/30 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm min-w-0">
              <p className="font-medium text-foreground">
                Finish securing your account
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {needsEmail && needsPhone && "Verify your email and phone to unlock all features."}
                {needsEmail && !needsPhone && "Please verify your email to unlock all features."}
                {!needsEmail && needsPhone && "Please verify your phone to unlock bookings."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {needsEmail && (
              <Button size="sm" variant="outline" onClick={() => setEmailOpen(true)}>
                <Mail className="w-3.5 h-3.5 mr-1.5" />
                Verify email
              </Button>
            )}
            {needsPhone && (
              <Button size="sm" variant="outline" onClick={() => setPhoneOpen(true)}>
                <Phone className="w-3.5 h-3.5 mr-1.5" />
                Verify phone
              </Button>
            )}
            <Link href="/dashboard/settings/security">
              <Button size="sm" variant="ghost" className="hidden md:inline-flex">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                Security settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <EmailVerifyModal open={emailOpen} onOpenChange={setEmailOpen} />
      <PhoneVerifyModal open={phoneOpen} onOpenChange={setPhoneOpen} />
    </>
  )
}

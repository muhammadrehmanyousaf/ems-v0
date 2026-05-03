"use client"

// 01-VR-ENHANCE-V1-FE — modal that drives the email verification OTP flow.

import { useState } from "react"
import { Mail, RefreshCw } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useUser } from "@/context/UserContext"
import { issueEmailVerification, verifyEmail } from "@/lib/api/auth"

interface EmailVerifyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful verification. */
  onVerified?: () => void
}

function rateLimitMessage(reason?: string): string {
  switch (reason) {
    case "rate_limited":
      return "Too many requests — please wait an hour before requesting another code."
    case "too_many_attempts":
      return "Too many incorrect attempts on the current code. Request a new one."
    case "no_active_code":
      return "No active code. Tap Resend to get a new one."
    case "incorrect_code":
      return "That code didn't match. Try again."
    case "invalid_format":
      return "Please enter the 6-digit code."
    default:
      return reason || "Verification failed"
  }
}

export function EmailVerifyModal({ open, onOpenChange, onVerified }: EmailVerifyModalProps) {
  const { user, setFlags } = useUser()
  const [code, setCode] = useState("")
  const [issued, setIssued] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const issue = async () => {
    setIssuing(true)
    try {
      const r = await issueEmailVerification()
      if (r.alreadyVerified) {
        setFlags({ emailVerified: true })
        onVerified?.()
        onOpenChange(false)
        toast({ title: "Already verified", description: "Your email is verified." })
        return
      }
      setIssued(true)
      toast({ title: "Code sent", description: `We sent a 6-digit code to ${user?.email ?? "your email"}.` })
    } catch (e: any) {
      const reason = e?.response?.data?.data?.code || e?.response?.data?.message
      toast({ title: "Could not send code", description: rateLimitMessage(reason) })
    } finally {
      setIssuing(false)
    }
  }

  const submit = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast({ title: "Invalid code", description: "Enter the 6-digit code we emailed you." })
      return
    }
    setSubmitting(true)
    try {
      await verifyEmail(code)
      setFlags({ emailVerified: true })
      toast({ title: "Email verified", description: "Thanks — your email is now verified." })
      setCode("")
      setIssued(false)
      onVerified?.()
      onOpenChange(false)
    } catch (e: any) {
      const reason = e?.response?.data?.data?.code || e?.response?.data?.message
      toast({ title: "Verification failed", description: rateLimitMessage(reason) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-bridal-gold" />
            <DialogTitle>Verify your email</DialogTitle>
          </div>
          <DialogDescription>
            We&apos;ll send a 6-digit code to <span className="font-medium">{user?.email ?? "your email"}</span>.
            Enter the code to confirm it&apos;s yours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {!issued ? (
            <Button onClick={issue} disabled={issuing} className="w-full">
              {issuing ? "Sending…" : "Send verification code"}
            </Button>
          ) : (
            <>
              <Input
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-lg tracking-[0.4em]"
                autoFocus
              />
              <button
                type="button"
                onClick={issue}
                disabled={issuing}
                className="text-xs text-bridal-mauve hover:text-bridal-gold inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {issuing ? "Resending…" : "Resend code"}
              </button>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {issued && (
            <Button onClick={submit} disabled={submitting || code.length !== 6}>
              {submitting ? "Verifying…" : "Verify"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

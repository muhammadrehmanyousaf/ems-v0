"use client"

// 01-VR-ENHANCE-V1-FE — phone OTP modal.

import { useState } from "react"
import { Phone, RefreshCw } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useUser } from "@/context/UserContext"
import { issuePhoneVerification, verifyPhone } from "@/lib/api/auth"

interface PhoneVerifyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified?: () => void
}

function rateLimitMessage(reason?: string): string {
  switch (reason) {
    case "rate_limited":         return "Too many SMS requests — please wait an hour."
    case "too_many_attempts":    return "Too many incorrect attempts. Request a new code."
    case "no_active_code":       return "No active code. Tap Resend to get one."
    case "incorrect_code":       return "That code didn't match. Try again."
    case "invalid_format":       return "Please enter the 6-digit code."
    case "invalid_phone":        return "Phone number is invalid. Use a Pakistani mobile starting with 03 or +92."
    default:                     return reason || "Verification failed"
  }
}

export function PhoneVerifyModal({ open, onOpenChange, onVerified }: PhoneVerifyModalProps) {
  const { user, setFlags } = useUser()
  const [phone, setPhone] = useState(user?.phoneE164 || user?.phoneNumber || "")
  const [code, setCode] = useState("")
  const [issued, setIssued] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const issue = async () => {
    setIssuing(true)
    try {
      await issuePhoneVerification(phone)
      setIssued(true)
      toast({ title: "Code sent by SMS", description: `Check your phone (${phone}).` })
    } catch (e: any) {
      const reason = e?.response?.data?.data?.code || e?.response?.data?.message
      toast({ title: "Could not send SMS", description: rateLimitMessage(reason) })
    } finally {
      setIssuing(false)
    }
  }

  const submit = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast({ title: "Invalid code", description: "Enter the 6-digit code." })
      return
    }
    setSubmitting(true)
    try {
      await verifyPhone(code)
      setFlags({ phoneVerified: true })
      toast({ title: "Phone verified", description: "Thanks — your phone is verified." })
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
            <Phone className="w-5 h-5 text-bridal-gold" />
            <DialogTitle>Verify your phone</DialogTitle>
          </div>
          <DialogDescription>
            We&apos;ll send a 6-digit code via SMS. Enter your Pakistani mobile number (e.g. 03001234567).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {!issued ? (
            <>
              <Input
                inputMode="tel"
                placeholder="03001234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
              />
              <Button onClick={issue} disabled={issuing || !phone} className="w-full">
                {issuing ? "Sending…" : "Send code"}
              </Button>
            </>
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

"use client"

// 01-VR-ENHANCE-V1-FE — TOTP 2FA enrolment.
// Flow: enroll → user scans QR or enters secret in their authenticator → user
// confirms with the first 6-digit token. Only on successful confirm does the
// backend persist the encrypted secret + flip twoFactorEnabled.

import { useState } from "react"
import { ShieldCheck, Loader2 } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useUser } from "@/context/UserContext"
import { start2FAEnrolment, confirm2FA, type TwoFactorEnrolment } from "@/lib/api/auth"

interface TwoFactorEnrolModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEnabled?: () => void
}

export function TwoFactorEnrolModal({ open, onOpenChange, onEnabled }: TwoFactorEnrolModalProps) {
  const { setFlags } = useUser()
  const [enrol, setEnrol] = useState<TwoFactorEnrolment | null>(null)
  const [token, setToken] = useState("")
  const [starting, setStarting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const start = async () => {
    setStarting(true)
    try {
      const e = await start2FAEnrolment()
      setEnrol(e)
    } catch (e: any) {
      toast({ title: "Could not start 2FA", description: e?.response?.data?.message || "Try again later." })
    } finally {
      setStarting(false)
    }
  }

  const confirm = async () => {
    if (!enrol || !/^\d{6}$/.test(token)) {
      toast({ title: "Invalid code", description: "Enter the 6-digit code from your authenticator." })
      return
    }
    setConfirming(true)
    try {
      await confirm2FA(enrol.secret, token)
      setFlags({ twoFactorEnabled: true })
      toast({ title: "2FA enabled", description: "Your account is now protected by two-factor authentication." })
      setEnrol(null)
      setToken("")
      onEnabled?.()
      onOpenChange(false)
    } catch (e: any) {
      const code = e?.response?.data?.data?.code
      toast({
        title: "Could not enable 2FA",
        description: code === "INVALID_2FA_TOKEN"
          ? "That code didn't match. Try the next one your authenticator shows."
          : (e?.response?.data?.message || "Try again."),
      })
    } finally {
      setConfirming(false)
    }
  }

  const close = (open: boolean) => {
    if (!open) {
      setEnrol(null)
      setToken("")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-bridal-gold" />
            <DialogTitle>Enable two-factor authentication</DialogTitle>
          </div>
          <DialogDescription>
            Add an extra layer of protection. Use Google Authenticator, 1Password, or any TOTP app.
          </DialogDescription>
        </DialogHeader>

        {!enrol ? (
          <Button onClick={start} disabled={starting} className="w-full">
            {starting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting…</>
            ) : (
              "Begin enrolment"
            )}
          </Button>
        ) : (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <img
                src={enrol.qrPng}
                alt="Scan with your authenticator app"
                className="mx-auto rounded-lg border border-bridal-beige"
                width={180}
                height={180}
              />
              <p className="text-xs text-bridal-text-soft mt-2">
                Or enter this secret manually:
              </p>
              <code className="block mt-1 text-xs font-mono break-all bg-bridal-cream/50 p-2 rounded select-all">
                {enrol.secret}
              </code>
            </div>

            <Input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="6-digit token from your app"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center text-lg tracking-[0.4em]"
              autoFocus
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => close(false)}>
            Cancel
          </Button>
          {enrol && (
            <Button onClick={confirm} disabled={confirming || token.length !== 6}>
              {confirming ? "Confirming…" : "Confirm & enable"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

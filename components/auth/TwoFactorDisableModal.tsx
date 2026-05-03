"use client"

// 01-VR-ENHANCE-V1-FE — TOTP 2FA disable. Requires a current valid token so a
// stolen session cannot silently turn 2FA off.

import { useState } from "react"
import { ShieldOff } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useUser } from "@/context/UserContext"
import { disable2FA } from "@/lib/api/auth"

interface TwoFactorDisableModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDisabled?: () => void
}

export function TwoFactorDisableModal({ open, onOpenChange, onDisabled }: TwoFactorDisableModalProps) {
  const { setFlags } = useUser()
  const [token, setToken] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!/^\d{6}$/.test(token)) {
      toast({ title: "Invalid code", description: "Enter the 6-digit code from your authenticator." })
      return
    }
    setSubmitting(true)
    try {
      await disable2FA(token)
      setFlags({ twoFactorEnabled: false })
      toast({ title: "2FA disabled", description: "Two-factor authentication is now off." })
      setToken("")
      onDisabled?.()
      onOpenChange(false)
    } catch (e: any) {
      const code = e?.response?.data?.data?.code
      toast({
        title: "Could not disable 2FA",
        description: code === "INVALID_2FA_TOKEN"
          ? "That code didn't match. Try the current one your authenticator shows."
          : (e?.response?.data?.message || "Try again."),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldOff className="w-5 h-5 text-bridal-coral" />
            <DialogTitle>Turn off two-factor authentication</DialogTitle>
          </div>
          <DialogDescription>
            Enter a current 6-digit code from your authenticator app to confirm.
          </DialogDescription>
        </DialogHeader>

        <Input
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="6-digit token"
          value={token}
          onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="text-center text-lg tracking-[0.4em]"
          autoFocus
        />

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={submitting || token.length !== 6}>
            {submitting ? "Disabling…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

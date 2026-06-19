import { Suspense } from "react"
import type { Metadata } from "next"
import { ClaimSetPasswordForm } from "@/components/claim/ClaimSetPasswordForm"

export const metadata: Metadata = {
  title: "Set Your Password | Wedding Wala",
  description: "Finish claiming your listing — set a password for your account.",
}

// Approved-evidence claimants land here from the emailed one-time link. The
// page consumes `?token=` and reuses the standard reset-password rails to set
// the password, then sends them to sign in.
export default function ClaimSetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bridal-surface bg-bridal-hero flex items-center justify-center">
          <div className="font-bridal text-bridal-text-soft text-sm">
            Loading…
          </div>
        </div>
      }
    >
      <ClaimSetPasswordForm />
    </Suspense>
  )
}

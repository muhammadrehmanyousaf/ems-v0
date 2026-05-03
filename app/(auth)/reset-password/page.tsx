import "../../globals.css"
import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bridal-surface bg-bridal-hero flex items-center justify-center">
          <div className="font-bridal text-bridal-text-soft text-sm">
            Loading…
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}

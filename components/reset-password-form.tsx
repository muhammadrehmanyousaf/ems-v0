"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldAlert,
  KeyRound,
} from "lucide-react"

import axiosInstance from "@/lib/axiosConfig"
import { toast } from "./ui/use-toast"

import { BridalButton } from "@/components/bridal/bridal-button"
import { BridalField, BridalInput } from "@/components/bridal/bridal-input"
import { BridalCrown, BridalTitle } from "@/components/bridal/bridal-card"
import { FloralDivider } from "@/components/bridal/floral-divider"
import {
  AuthShell,
  AuthAsideChecklist,
} from "@/components/bridal/auth-shell"

// ── Validation ──────────────────────────────────────────────────────────────
const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type FormData = z.infer<typeof formSchema>

function strengthScore(p: string): number {
  if (!p) return 0
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++
  if (/\d/.test(p)) s++
  if (/[^a-zA-Z0-9]/.test(p)) s++
  return Math.min(s, 4)
}

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"]
const STRENGTH_HUES = [
  "bg-bridal-coral",
  "bg-bridal-coral",
  "bg-bridal-gold",
  "bg-bridal-sage",
  "bg-[#3F6B43]",
]

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token =
    searchParams?.get("token") || searchParams?.get("t") || ""

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) })

  const newPassword = watch("password") || ""
  const score = useMemo(() => strengthScore(newPassword), [newPassword])

  const onSubmit = async (data: FormData) => {
    if (!token) return
    try {
      setIsLoading(true)
      await axiosInstance.post("/api/v1/auth/reset-password", {
        token,
        password: data.password,
      })
      setDone(true)
      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
      })
      setTimeout(() => router.push("/login"), 2200)
    } catch (err: any) {
      toast({
        title: "Couldn't reset password",
        description:
          err?.response?.data?.message ||
          "The link may have expired. Please request a new one.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checklistItems = [
    { icon: <CheckCircle2 className="w-4 h-4" />, label: "8+ characters" },
    { icon: <CheckCircle2 className="w-4 h-4" />, label: "Letters & numbers" },
    { icon: <CheckCircle2 className="w-4 h-4" />, label: "Mix the case" },
    { icon: <CheckCircle2 className="w-4 h-4" />, label: "A symbol or two" },
  ]

  return (
    <AuthShell
      variant="reset"
      asideAlt="Wedding florals"
      asideBadge={{
        icon: <KeyRound className="w-3 h-3" />,
        label: "Set a New Password",
      }}
      asideTitle={
        <>
          A fresh start —{" "}
          <span className="text-bridal-rose">securely.</span>
        </>
      }
      asideSubtitle="Choose a strong password — at least 8 characters, a mix of letters and numbers makes it memorable yet secure."
      asideExtra={<AuthAsideChecklist items={checklistItems} />}
      mobileCrestIcon={<KeyRound className="w-5 h-5 text-bridal-gold" />}
    >
      {/* ── Missing-token guard ── */}
      {!token ? (
        <div className="text-center">
          <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-bridal-coral/20 border border-bridal-coral/40 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-[#9B4A38]" />
          </div>
          <BridalCrown className="mb-3">Link Invalid</BridalCrown>
          <BridalTitle size="h2" className="mb-3">
            This reset link is{" "}
            <span className="text-bridal-coral">missing or expired</span>
          </BridalTitle>
          <p className="font-bridal text-bridal-text-soft text-sm mb-7">
            Please request a fresh reset link — they expire after 15 minutes
            for your security.
          </p>
          <BridalButton
            variant="primary"
            size="lg"
            block
            onClick={() => router.push("/forgot-password")}
          >
            Request a New Link
          </BridalButton>
          <div className="my-7">
            <FloralDivider />
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-bridal text-sm text-bridal-mauve hover:text-bridal-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      ) : done ? (
        // ── Success state ───────────────────────────────────────────
        <div className="text-center">
          <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-bridal-sage/20 border border-bridal-sage/40 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-[#3F6B43]" />
          </div>
          <BridalCrown className="mb-3">All Set</BridalCrown>
          <BridalTitle size="h2" className="mb-3">
            Your password has been{" "}
            <span className="text-bridal-gold">updated</span>
          </BridalTitle>
          <p className="font-bridal text-bridal-text-soft text-sm mb-7">
            Redirecting you to sign in…
          </p>
          <BridalButton
            variant="primary"
            size="lg"
            block
            onClick={() => router.push("/login")}
          >
            Continue to Sign In
          </BridalButton>
        </div>
      ) : (
        // ── Reset form ──────────────────────────────────────────────
        <>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-bridal text-[12px] tracking-wide text-bridal-text-soft hover:text-bridal-mauve transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>

          <BridalCrown className="mb-3">Reset Password</BridalCrown>
          <BridalTitle size="h2" className="text-center mb-2">
            Choose a new <span className="text-bridal-gold">password</span>
          </BridalTitle>
          <p className="text-center font-bridal text-bridal-text-soft text-sm mb-7">
            Pick something strong and memorable — you&apos;ll use it to sign
            in.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <BridalField
              id="password"
              label="New Password"
              error={errors.password?.message}
              required
            >
              <BridalInput
                id="password"
                type={showPassword ? "text" : "password"}
                autoCapitalize="none"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                leadingIcon={<Lock className="w-4 h-4" />}
                invalid={!!errors.password}
                trailing={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((p) => !p)}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-full text-bridal-text-label hover:text-bridal-mauve hover:bg-bridal-blush/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold/50"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                {...register("password")}
              />
            </BridalField>

            {newPassword && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                        i < score
                          ? STRENGTH_HUES[score]
                          : "bg-bridal-beige"
                      }`}
                    />
                  ))}
                </div>
                <p className="font-bridal text-[11px] uppercase tracking-[0.18em] text-bridal-text-soft">
                  {STRENGTH_LABELS[score]}
                </p>
              </div>
            )}

            <BridalField
              id="confirmPassword"
              label="Confirm Password"
              error={errors.confirmPassword?.message}
              required
            >
              <BridalInput
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoCapitalize="none"
                autoComplete="new-password"
                placeholder="Repeat your new password"
                leadingIcon={<CheckCircle2 className="w-4 h-4" />}
                invalid={!!errors.confirmPassword}
                trailing={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm((p) => !p)}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-full text-bridal-text-label hover:text-bridal-mauve hover:bg-bridal-blush/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold/50"
                    aria-label={
                      showConfirm ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                {...register("confirmPassword")}
              />
            </BridalField>

            <BridalButton
              type="submit"
              variant="primary"
              size="lg"
              block
              loading={isLoading}
              className="mt-2"
            >
              {isLoading ? "Updating…" : "Update Password"}
            </BridalButton>
          </form>

          <div className="my-7">
            <FloralDivider />
          </div>

          <p className="text-center font-bridal text-sm text-bridal-text-soft">
            Need a new link?{" "}
            <Link
              href="/forgot-password"
              className="text-bridal-gold hover:text-bridal-gold-dark font-medium underline-offset-4 hover:underline transition-colors"
            >
              Request again
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  )
}

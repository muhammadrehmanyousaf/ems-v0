"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react"

import axiosInstance from "@/lib/axiosConfig"
import { toast } from "./ui/use-toast"
import { useUser } from "@/context/UserContext"
import { loginErrorMessage, loginErrorCode } from "@/lib/api/auth"

import { BridalButton } from "@/components/bridal/bridal-button"
import { BridalField, BridalInput } from "@/components/bridal/bridal-input"
import { BridalCrown, BridalTitle } from "@/components/bridal/bridal-card"
import { FloralDivider } from "@/components/bridal/floral-divider"
import {
  AuthShell,
  AuthAsideTestimonial,
} from "@/components/bridal/auth-shell"

// ── Validation (unchanged) ─────────────────────────────────────────────────
const formSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
})

type FormData = z.infer<typeof formSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  // WW-172 — second-factor step-up. Revealed only after the backend asks for it
  // (TWO_FACTOR_REQUIRED), so password-only accounts see no change.
  const [twoFactorRequired, setTwoFactorRequired] = useState(false)
  const [totp, setTotp] = useState("")
  const { login } = useUser()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(formSchema) })

  // ── Submit (functional behavior preserved verbatim) ────────────────────
  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)

      const payload: Record<string, string> = {
        email: data.email,
        password: data.password,
      }
      // Only attach the code once the 2FA step is showing and the user typed one.
      if (twoFactorRequired && totp.trim()) payload.totp = totp.trim()

      const response = await axiosInstance.post("/api/v1/auth/login", payload)

      if (response.status === 200) {
        const resData = response.data
        const { user, token, jti, flags } = resData.data || {}
        // Pass jti + flags through so the dashboard can render verification banners.
        login(user, token, { jti, flags })
        toast({
          title: "Welcome back",
          description: "You're signed in.",
        })
        reset()
        setTwoFactorRequired(false)
        setTotp("")

        const isAdmin = user.roles?.some(
          (role: any) =>
            role.id === 1 ||
            role.name?.toLowerCase() === "super admin" ||
            role.name?.toLowerCase() === "admin"
        )
        const isVendor =
          user.isVendor === true ||
          user.roles?.some(
            (role: any) =>
              role.id === 2 || role.name?.toLowerCase() === "vendor"
          )

        if (isAdmin || isVendor) {
          router.push("/dashboard")
        } else {
          router.push("/")
        }
      } else {
        toast({ title: "Login failed", description: "Invalid credentials" })
      }
    } catch (error: any) {
      const code = loginErrorCode(error)
      if (code === "TWO_FACTOR_REQUIRED" || code === "TWO_FACTOR_INVALID") {
        // Password was accepted — reveal (or keep) the 2FA step and let them
        // enter the authenticator code. Don't surface it as a hard failure.
        setTwoFactorRequired(true)
        if (code === "TWO_FACTOR_INVALID") setTotp("")
        toast({
          title: code === "TWO_FACTOR_INVALID" ? "Incorrect code" : "One more step",
          description: loginErrorMessage(error),
        })
      } else {
        toast({
          title: "Login failed",
          description: loginErrorMessage(error),
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      variant="login"
      asideAlt="Pakistani bride in traditional bridal attire"
      asideBadge={{
        icon: <Heart className="w-3 h-3" />,
        label: "Pakistan's Wedding Platform",
      }}
      asideTitle={
        <>
          Where every love story finds its{" "}
          <span className="text-bridal-rose">perfect setting.</span>
        </>
      }
      asideSubtitle="Trusted by families across Pakistan to plan their most precious day — from mehndi to walima."
      asideExtra={
        <AuthAsideTestimonial
          quote="We found our photographer, our venue, and our caterer in one evening. Truly the dream platform."
          name="Sarah & Ahmed"
          meta="Lahore · 2025"
          initial="S"
        />
      }
      mobileCrestIcon={<img src="/icon-mark.png" alt="Wedding Wala" className="w-7 h-7" />}
    >
      <BridalCrown className="mb-3">Welcome Back</BridalCrown>
      <BridalTitle size="h2" className="text-center mb-2">
        Sign in to continue your{" "}
        <span className="text-bridal-gold">shaadi</span> journey
      </BridalTitle>
      <p className="text-center font-bridal text-bridal-text-soft text-sm mb-8">
        Enter your credentials to access your saved vendors, bookings, and more.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <BridalField
          id="email"
          label="Email Address"
          error={errors.email?.message}
          required
        >
          <BridalInput
            id="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="you@email.com"
            leadingIcon={<Mail className="w-4 h-4" />}
            invalid={!!errors.email}
            {...register("email")}
          />
        </BridalField>

        <BridalField
          id="password"
          label="Password"
          error={errors.password?.message}
          required
        >
          <BridalInput
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            autoCapitalize="none"
            placeholder="Your secret phrase"
            leadingIcon={<Lock className="w-4 h-4" />}
            invalid={!!errors.password}
            trailing={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((p) => !p)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-full text-bridal-text-label hover:text-bridal-mauve hover:bg-bridal-blush/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold/50"
                aria-label={showPassword ? "Hide password" : "Show password"}
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

        {twoFactorRequired && (
          <BridalField
            id="totp"
            label="Authenticator code"
            required
          >
            <BridalInput
              id="totp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="6-digit code"
              leadingIcon={<ShieldCheck className="w-4 h-4" />}
              value={totp}
              onChange={(e) =>
                setTotp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
              }
              autoFocus
            />
            <p className="font-bridal text-[12px] text-bridal-text-soft mt-1.5">
              Two-factor authentication is on for this account. Enter the current
              code from your authenticator app to finish signing in.
            </p>
          </BridalField>
        )}

        <div className="flex justify-end -mt-2">
          <Link
            href="/forgot-password"
            className="font-bridal text-[12px] tracking-wide text-bridal-mauve hover:text-bridal-gold transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <BridalButton
          type="submit"
          variant="primary"
          size="lg"
          block
          loading={isLoading}
          className="mt-2"
        >
          {isLoading ? "Signing in…" : "Sign In"}
        </BridalButton>
      </form>

      <div className="my-8">
        <FloralDivider />
      </div>

      <div className="space-y-3 text-center">
        <p className="font-bridal text-sm text-bridal-text-soft">
          New to our platform?{" "}
          <Link
            href="/register"
            className="text-bridal-gold hover:text-bridal-gold-dark font-medium underline-offset-4 hover:underline transition-colors"
          >
            Create an account
          </Link>
        </p>
        <p className="font-bridal text-sm">
          <Link
            href="/business-registration"
            className="text-bridal-mauve hover:text-bridal-gold font-medium underline-offset-4 hover:underline transition-colors"
          >
            Or list your business →
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

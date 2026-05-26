"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, Mail, Lock, Eye, EyeOff } from "lucide-react"

import axiosInstance from "@/lib/axiosConfig"
import { toast } from "./ui/use-toast"
import { useUser } from "@/context/UserContext"
import { loginErrorMessage } from "@/lib/api/auth"

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

      const response = await axiosInstance.post("/api/v1/auth/login", {
        email: data.email,
        password: data.password,
      })

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
      toast({
        title: "Login failed",
        description: loginErrorMessage(error),
      })
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

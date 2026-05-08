"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import Link from "next/link"
import { TERMS_VERSION } from "@/lib/seo"
import { useRouter } from "next/navigation"
import {
  Heart,
  Sparkles,
  Users,
  Calendar,
  Eye,
  EyeOff,
  Camera,
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
} from "lucide-react"

import { BACKEND_URL } from "@/lib/backend-url"
import { toast } from "./ui/use-toast"
import { usePlatformStats } from "@/hooks/use-platform-stats"

import { BridalButton } from "@/components/bridal/bridal-button"
import { BridalField, BridalInput } from "@/components/bridal/bridal-input"
import { BridalCrown, BridalTitle } from "@/components/bridal/bridal-card"
import { FloralDivider } from "@/components/bridal/floral-divider"
import {
  AuthShell,
  AuthAsideStatTiles,
} from "@/components/bridal/auth-shell"

// ── Validation (UNCHANGED — keeps the existing rules verbatim) ─────────────
const formSchema = z
  .object({
    fullName: z
      .string()
      .min(2, { message: "Name must be at least 2 characters" })
      .refine((value) => /^[A-Z]/.test(value), {
        message: "First letter must be capitalized",
      }),
    email: z.string().email({ message: "Invalid email address" }),
    phoneNumber: z
      .string()
      .length(11, { message: "Phone number must be exactly 11 digits" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  })

type FormData = z.infer<typeof formSchema>

export function UserRegistrationForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: stats, isLoading: isLoadingStats } = usePlatformStats()

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) })

  const router = useRouter()

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setProfileImageFile(file)
    setProfileImagePreview(URL.createObjectURL(file))
    e.target.value = ""
  }

  // ── Submit (functional behavior preserved verbatim) ────────────────────
  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      const formData = new globalThis.FormData()
      formData.append("fullName", data.fullName)
      formData.append("email", data.email)
      formData.append("phoneNumber", data.phoneNumber)
      formData.append("password", data.password)
      formData.append("roleIds", JSON.stringify([3]))
      // Record explicit T&C acceptance — required for PayFast underwriting
      // and chargeback defense. Backend persists via the User columns added
      // in migration 20260507110000-user-terms-acceptance.
      formData.append("termsVersion", TERMS_VERSION)
      formData.append("termsAcceptedAt", new Date().toISOString())
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile)
      }

      const response = await axios.post(
        `${BACKEND_URL}api/v1/auth/signup`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )

      if (response.status === 200) {
        reset()
        setProfileImageFile(null)
        setProfileImagePreview(null)
        toast({
          title: "Account created",
          description:
            "Your account has been registered. You can now sign in.",
        })
        router.push("/login")
      }
    } catch (error: any) {
      toast({
        title: "Sign-up failed",
        description:
          error.response?.data?.message ||
          "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const statTiles = [
    {
      icon: <Users className="w-5 h-5" />,
      value: isLoadingStats ? (
        <span className="inline-block w-12 h-6 rounded bg-bridal-ivory/10 animate-pulse" />
      ) : stats ? (
        `${stats.couplesServed}+`
      ) : (
        "10K+"
      ),
      label: "Happy Couples",
    },
    {
      icon: <Heart className="w-5 h-5" />,
      value: isLoadingStats ? (
        <span className="inline-block w-12 h-6 rounded bg-bridal-ivory/10 animate-pulse" />
      ) : stats ? (
        `${stats.vendors}+`
      ) : (
        "500+"
      ),
      label: "Vendors",
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      value: isLoadingStats ? (
        <span className="inline-block w-12 h-6 rounded bg-bridal-ivory/10 animate-pulse" />
      ) : stats ? (
        `${stats.cities}+`
      ) : (
        "50+"
      ),
      label: "Cities",
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      value: "4.8",
      label: "Avg Rating",
    },
  ]

  return (
    <AuthShell
      variant="register"
      asideAlt="Pakistani wedding ceremony"
      asideBadge={{
        icon: <Sparkles className="w-3 h-3" />,
        label: "Begin Your Journey",
      }}
      asideTitle={
        <>
          Where every <span className="text-bridal-rose">love story</span>{" "}
          finds its perfect setting.
        </>
      }
      asideSubtitle="Join thousands of Pakistani couples planning their dream shaadi with the country's most trusted vendors."
      asideExtra={<AuthAsideStatTiles tiles={statTiles} />}
      mobileCrestIcon={<Sparkles className="w-5 h-5 text-bridal-gold" />}
    >
      {/* Compact header row: title + inline profile photo upload */}
      <div className="flex items-start gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <BridalCrown className="mb-2 justify-start">
            Create Account
          </BridalCrown>
          <BridalTitle size="h3" className="leading-tight">
            Begin your <span className="text-bridal-gold">shaadi</span> journey
          </BridalTitle>
          <p className="font-bridal text-bridal-text-soft text-[13px] mt-1.5">
            Save vendors, manage bookings, plan with ease.
          </p>
        </div>

        {/* Profile photo upload — camera nub is a SIBLING of the rounded
            preview button, NOT clipped by overflow-hidden. */}
        <div className="relative shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="block w-[68px] h-[68px] rounded-full overflow-hidden border-2 border-dashed border-bridal-gold/55 hover:border-bridal-gold transition-colors duration-250 bg-bridal-cream"
            aria-label="Upload profile photo"
          >
            {profileImagePreview ? (
              <img
                src={profileImagePreview}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="w-full h-full flex flex-col items-center justify-center gap-0.5">
                <User className="w-5 h-5 text-bridal-gold" />
                <span className="font-bridal text-[8.5px] uppercase tracking-[0.15em] text-bridal-text-label">
                  Add Photo
                </span>
              </span>
            )}
          </button>
          <span
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-bridal-gold border-2 border-bridal-ivory flex items-center justify-center pointer-events-none shadow-sm"
            aria-hidden
          >
            <Camera className="w-3.5 h-3.5 text-bridal-charcoal" />
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <BridalField
          id="fullName"
          label="Full Name"
          error={errors.fullName?.message}
          required
        >
          <BridalInput
            id="fullName"
            type="text"
            autoCapitalize="words"
            autoComplete="name"
            autoCorrect="off"
            placeholder="e.g. Sarah Khan"
            leadingIcon={<User className="w-4 h-4" />}
            invalid={!!errors.fullName}
            {...register("fullName")}
          />
        </BridalField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <BridalField
            id="email"
            label="Email"
            error={errors.email?.message}
            required
          >
            <BridalInput
              id="email"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              placeholder="you@email.com"
              leadingIcon={<Mail className="w-4 h-4" />}
              invalid={!!errors.email}
              {...register("email")}
            />
          </BridalField>
          <BridalField
            id="phoneNumber"
            label="Phone"
            error={errors.phoneNumber?.message}
            required
          >
            <BridalInput
              id="phoneNumber"
              type="tel"
              inputMode="numeric"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="03001234567"
              leadingIcon={<Phone className="w-4 h-4" />}
              invalid={!!errors.phoneNumber}
              {...register("phoneNumber")}
            />
          </BridalField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <BridalField
            id="password"
            label="Password"
            error={errors.password?.message}
            required
          >
            <BridalInput
              id="password"
              type={showPassword ? "text" : "password"}
              autoCapitalize="none"
              autoComplete="new-password"
              placeholder="Min 8 characters"
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
          <BridalField
            id="confirmPassword"
            label="Confirm"
            error={errors.confirmPassword?.message}
            required
          >
            <BridalInput
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoCapitalize="none"
              autoComplete="new-password"
              placeholder="Repeat password"
              leadingIcon={<CheckCircle2 className="w-4 h-4" />}
              invalid={!!errors.confirmPassword}
              trailing={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-full text-bridal-text-label hover:text-bridal-mauve hover:bg-bridal-blush/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold/50"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              {...register("confirmPassword")}
            />
          </BridalField>
        </div>

        <BridalButton
          type="submit"
          variant="primary"
          size="lg"
          block
          loading={isLoading}
          className="mt-1"
        >
          {isLoading ? "Creating account…" : "Create Account"}
        </BridalButton>

        {/*
          Explicit T&C acceptance — required for PayFast underwriting and
          chargeback defense. The submit button is disabled until the user
          ticks the box, and the timestamp + version are POSTed to the
          backend. Reference: docs/payfast/01-payfast-integration-overview.md §2 item 6.
        */}
        <label className="flex items-start gap-2.5 text-left cursor-pointer">
          <input
            type="checkbox"
            required
            className="mt-1 accent-bridal-gold"
            aria-describedby="terms-policy-text"
          />
          <span
            id="terms-policy-text"
            className="font-bridal text-[12px] text-bridal-text-soft leading-relaxed"
          >
            I have read and agree to Wedding Wala&apos;s{" "}
            <Link
              href="/terms"
              className="text-bridal-mauve hover:text-bridal-gold underline-offset-4 hover:underline"
              target="_blank"
            >
              Terms of Service
            </Link>
            ,{" "}
            <Link
              href="/privacy"
              className="text-bridal-mauve hover:text-bridal-gold underline-offset-4 hover:underline"
              target="_blank"
            >
              Privacy Policy
            </Link>
            , and{" "}
            <Link
              href="/refund-policy"
              className="text-bridal-mauve hover:text-bridal-gold underline-offset-4 hover:underline"
              target="_blank"
            >
              Refund Policy
            </Link>
            .
          </span>
        </label>
      </form>

      <div className="my-3.5">
        <FloralDivider width={200} />
      </div>

      <div className="text-center">
        <p className="font-bridal text-[13px] text-bridal-text-soft">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-bridal-gold hover:text-bridal-gold-dark font-medium underline-offset-4 hover:underline transition-colors"
          >
            Sign in
          </Link>
          <span className="mx-2 text-bridal-beige">·</span>
          <Link
            href="/business-registration"
            className="text-bridal-mauve hover:text-bridal-gold font-medium underline-offset-4 hover:underline transition-colors"
          >
            List your business
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

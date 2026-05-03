"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { ArrowLeft, Mail, MailCheck } from "lucide-react"

import axiosInstance from "@/lib/axiosConfig"
import { toast } from "./ui/use-toast"

import { BridalButton } from "@/components/bridal/bridal-button"
import { BridalField, BridalInput } from "@/components/bridal/bridal-input"
import { BridalCrown, BridalTitle } from "@/components/bridal/bridal-card"
import { FloralDivider } from "@/components/bridal/floral-divider"
import { AuthShell } from "@/components/bridal/auth-shell"

// ── Validation ──────────────────────────────────────────────────────────────
const formSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address" }),
})

type FormData = z.infer<typeof formSchema>

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormData>({ resolver: zodResolver(formSchema) })

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      // Backend always returns success for both existing and unknown emails
      // (anti-enumeration). We simply acknowledge the request.
      await axiosInstance.post("/api/v1/auth/forgot-password", {
        email: data.email,
      })
      setSubmittedEmail(data.email)
    } catch (err: any) {
      toast({
        title: "Couldn't send reset link",
        description:
          err?.response?.data?.message ||
          "Please try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resend = async () => {
    const email = getValues("email") || submittedEmail
    if (!email) return
    try {
      setIsLoading(true)
      await axiosInstance.post("/api/v1/auth/forgot-password", { email })
      toast({
        title: "Reset link sent again",
        description: `We've re-sent the link to ${email}.`,
      })
    } catch (err: any) {
      toast({
        title: "Couldn't resend",
        description:
          err?.response?.data?.message || "Please try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      variant="forgot"
      asideAlt="Pakistani bride during henna ceremony"
      asideBadge={{
        icon: <Mail className="w-3 h-3" />,
        label: "Account Recovery",
      }}
      asideTitle={
        <>
          We&apos;ll help you back to{" "}
          <span className="text-bridal-rose">your love story.</span>
        </>
      }
      asideSubtitle="Enter your email and we'll send you a secure link to reset your password — back to planning in moments."
      asideExtra={
        <p className="font-display italic text-base text-bridal-ivory/80 max-w-md leading-relaxed">
          &ldquo;A wedding is a tapestry of details — the calm of knowing your
          account is secure is one thread we&apos;d rather not let fray.&rdquo;
        </p>
      }
      mobileCrestIcon={<Mail className="w-5 h-5 text-bridal-gold" />}
    >
      {/* Back link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 font-bridal text-[12px] tracking-wide text-bridal-text-soft hover:text-bridal-mauve transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to sign in
      </Link>

      {!submittedEmail ? (
        <>
          <BridalCrown className="mb-3">Forgot Password</BridalCrown>
          <BridalTitle size="h2" className="text-center mb-2">
            Reset your <span className="text-bridal-gold">password</span>
          </BridalTitle>
          <p className="text-center font-bridal text-bridal-text-soft text-sm mb-8">
            Enter the email associated with your account and we&apos;ll send
            you a link to set a new password.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <BridalField
              id="email"
              label="Email Address"
              error={errors.email?.message}
              hint="The link expires in 15 minutes for your security."
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

            <BridalButton
              type="submit"
              variant="primary"
              size="lg"
              block
              loading={isLoading}
            >
              {isLoading ? "Sending link…" : "Send Reset Link"}
            </BridalButton>
          </form>

          <div className="my-7">
            <FloralDivider />
          </div>

          <p className="text-center font-bridal text-sm text-bridal-text-soft">
            Remembered it?{" "}
            <Link
              href="/login"
              className="text-bridal-gold hover:text-bridal-gold-dark font-medium underline-offset-4 hover:underline transition-colors"
            >
              Sign in instead
            </Link>
          </p>
        </>
      ) : (
        <div className="text-center">
          <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-bridal-sage/20 border border-bridal-sage/40 flex items-center justify-center">
            <MailCheck className="w-7 h-7 text-[#3F6B43]" />
          </div>
          <BridalCrown className="mb-3">Check Your Inbox</BridalCrown>
          <BridalTitle size="h2" className="mb-3">
            A reset link is on{" "}
            <span className="text-bridal-gold">its way</span>
          </BridalTitle>
          <p className="font-bridal text-bridal-text-soft text-sm mb-2">
            If an account exists for{" "}
            <span className="text-bridal-charcoal font-medium">
              {submittedEmail}
            </span>
            , we&apos;ve sent a secure link to reset your password.
          </p>
          <p className="font-bridal text-[12px] text-bridal-text-soft/80 mb-7">
            The link expires in 15 minutes. Don&apos;t forget to check your
            spam folder.
          </p>

          <div className="space-y-3">
            <BridalButton
              variant="primary"
              size="lg"
              block
              loading={isLoading}
              onClick={resend}
            >
              Resend Link
            </BridalButton>
            <BridalButton
              variant="ghost"
              size="lg"
              block
              onClick={() => setSubmittedEmail(null)}
            >
              Use a Different Email
            </BridalButton>
          </div>

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
      )}
    </AuthShell>
  )
}

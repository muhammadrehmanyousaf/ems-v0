"use client"

// Vendor "claim & complete your listing" — 3-step wizard.
//
//   Step A (contact)   → POST /start              → store claimId, go to OTP
//   Step B (OTP)       → POST /:id/verify         → branch on data.next:
//      • "set_password" → Step C
//      • "evidence"     → Step D
//   Step C (password)  → POST /:id/finalize       → login() + /dashboard
//   Step D (evidence)  → POST /:id/evidence       → success panel
//
// Flag-gated by NEXT_PUBLIC_CLAIM_ENABLED (see lib/claim-flag.ts) — when off,
// the page shows a "Claiming is not available yet" notice instead of mounting
// this component.

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  FileText,
  ArrowLeft,
  Sparkles,
} from "lucide-react"

import { useUser } from "@/context/UserContext"
import { toast } from "@/components/ui/use-toast"
import {
  startClaim,
  verifyClaim,
  finalizeClaim,
  submitClaimEvidence,
} from "@/lib/api/claims"

import { BridalButton } from "@/components/bridal/bridal-button"
import { BridalField, BridalInput } from "@/components/bridal/bridal-input"
import { BridalCrown, BridalTitle } from "@/components/bridal/bridal-card"
import { FloralDivider } from "@/components/bridal/floral-divider"

type Step = "contact" | "otp" | "password" | "evidence" | "submitted"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function apiMessage(err: any, fallback: string): string {
  return err?.response?.data?.message || fallback
}

// Visual step rail (contact → verify → finish). The set-password and evidence
// branches both map to the third "finish" pip.
function StepRail({ step }: { step: Step }) {
  const index =
    step === "contact" ? 0 : step === "otp" ? 1 : 2
  const labels = ["Your details", "Verify", "Finish"]
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-full font-bridal text-[10px] uppercase tracking-[0.18em] font-medium transition-colors ${
              i <= index
                ? "bg-bridal-gold/15 text-bridal-gold-dark"
                : "bg-bridal-beige/40 text-bridal-text-label"
            }`}
          >
            <span
              className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] ${
                i < index
                  ? "bg-bridal-gold text-bridal-charcoal"
                  : i === index
                    ? "bg-bridal-gold/30 text-bridal-gold-dark border border-bridal-gold/60"
                    : "bg-bridal-beige text-bridal-text-label"
              }`}
            >
              {i < index ? "✓" : i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </div>
          {i < labels.length - 1 && (
            <span className="w-4 h-px bg-bridal-beige" aria-hidden />
          )}
        </div>
      ))}
    </div>
  )
}

export function ClaimWizard({ listingId }: { listingId: string }) {
  const router = useRouter()
  const { login } = useUser()

  const [step, setStep] = useState<Step>("contact")
  const [submitting, setSubmitting] = useState(false)

  // Step A — contact
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [contactError, setContactError] = useState<string | null>(null)

  // Carried between steps
  const [claimId, setClaimId] = useState<number | null>(null)
  const [otpSentTo, setOtpSentTo] = useState("")

  // Step B — OTP
  const [code, setCode] = useState("")
  const [otpError, setOtpError] = useState<string | null>(null)

  // Step C — set password
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Step D — evidence
  const [evidenceNote, setEvidenceNote] = useState("")
  const [evidenceError, setEvidenceError] = useState<string | null>(null)

  // ── Step A submit ────────────────────────────────────────────────────────
  const onContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactError(null)
    if (!name.trim()) return setContactError("Please enter your name.")
    if (!EMAIL_RE.test(email.trim()))
      return setContactError("Please enter a valid email address.")
    if (phone.trim().length < 7)
      return setContactError("Please enter a valid phone number.")

    setSubmitting(true)
    try {
      const res = await startClaim({
        listingId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      })
      setClaimId(res.claimId)
      setOtpSentTo(res.otpSentTo || phone.trim())
      setCode("")
      setStep("otp")
      toast({
        title: "Code sent",
        description: `We sent a 6-digit code to ${res.otpSentTo || "your phone"}.`,
      })
    } catch (err: any) {
      setContactError(
        apiMessage(err, "We couldn't start the claim. Please try again.")
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ── Step B submit ────────────────────────────────────────────────────────
  const onOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError(null)
    if (code.length !== 6) return setOtpError("Enter the 6-digit code.")
    if (!claimId) return setOtpError("Your session expired. Please restart.")

    setSubmitting(true)
    try {
      const { next } = await verifyClaim(claimId, code)
      if (next === "set_password") {
        setStep("password")
      } else {
        setStep("evidence")
      }
    } catch (err: any) {
      setOtpError(
        apiMessage(err, "That code wasn't right. Please check and try again.")
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ── Step C submit (phone-match takeover) ─────────────────────────────────
  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    if (password.length < 8)
      return setPasswordError("Password must be at least 8 characters.")
    if (password !== confirm)
      return setPasswordError("Passwords do not match.")
    if (!claimId) return setPasswordError("Your session expired. Please restart.")

    setSubmitting(true)
    try {
      const { user, token, jti } = await finalizeClaim(claimId, password)
      login(user, token, { jti })
      toast({
        title: "Listing claimed",
        description: "Welcome — your business is now yours to manage.",
      })
      router.push("/dashboard")
    } catch (err: any) {
      setPasswordError(
        apiMessage(err, "We couldn't finish the claim. Please try again.")
      )
      setSubmitting(false)
    }
  }

  // ── Step D submit (evidence) ─────────────────────────────────────────────
  const onEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEvidenceError(null)
    if (evidenceNote.trim().length < 10)
      return setEvidenceError(
        "Please add a few details about your business so we can verify it."
      )
    if (!claimId) return setEvidenceError("Your session expired. Please restart.")

    setSubmitting(true)
    try {
      await submitClaimEvidence(claimId, evidenceNote.trim())
      setStep("submitted")
    } catch (err: any) {
      setEvidenceError(
        apiMessage(err, "We couldn't submit your details. Please try again.")
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Shared password-reveal trailing button factory
  const reveal = (shown: boolean, toggle: () => void) => (
    <button
      type="button"
      tabIndex={-1}
      onClick={toggle}
      className="w-8 h-8 inline-flex items-center justify-center rounded-full text-bridal-text-label hover:text-bridal-mauve hover:bg-bridal-blush/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold/50"
      aria-label={shown ? "Hide password" : "Show password"}
    >
      {shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  )

  return (
    <div className="min-h-screen bridal-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-bridal-hero" aria-hidden />
      <div className="absolute inset-0 bg-bridal-wash opacity-95" aria-hidden />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 py-12">
        <div className="w-full max-w-[480px] animate-stagger-fade-up">
          {/* Card */}
          <div className="bridal-card bg-bridal-cream border border-bridal-beige shadow-[0_24px_50px_-30px_rgba(176,125,84,0.5)] rounded-md p-6 sm:p-8">
            {/* Crest */}
            <div className="flex justify-center mb-5">
              <div className="w-12 h-12 rounded-full bg-bridal-gold/15 border border-bridal-gold/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-bridal-gold" />
              </div>
            </div>

            {step !== "submitted" && <StepRail step={step} />}

            {/* ── STEP A — Contact ── */}
            {step === "contact" && (
              <>
                <BridalCrown className="mb-3">Claim Your Listing</BridalCrown>
                <BridalTitle size="h2" className="text-center mb-2">
                  Is this your{" "}
                  <span className="text-bridal-gold">business?</span>
                </BridalTitle>
                <p className="text-center font-bridal text-bridal-text-soft text-sm mb-7">
                  Tell us how to reach you. We&apos;ll send a 6-digit code to
                  verify it&apos;s really you.
                </p>

                <form onSubmit={onContactSubmit} className="space-y-4">
                  <BridalField id="name" label="Your Name" required>
                    <BridalInput
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Ahmed Khan"
                      leadingIcon={<UserIcon className="w-4 h-4" />}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </BridalField>

                  <BridalField id="email" label="Email Address" required>
                    <BridalInput
                      id="email"
                      type="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      placeholder="you@email.com"
                      leadingIcon={<Mail className="w-4 h-4" />}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </BridalField>

                  <BridalField
                    id="phone"
                    label="Phone Number"
                    hint="Use the number associated with your business — it speeds up verification."
                    required
                  >
                    <BridalInput
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="03XX XXXXXXX"
                      leadingIcon={<Phone className="w-4 h-4" />}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </BridalField>

                  {contactError && (
                    <p className="text-[12px] text-bridal-coral font-bridal">
                      {contactError}
                    </p>
                  )}

                  <BridalButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    block
                    loading={submitting}
                    className="mt-2"
                  >
                    {submitting ? "Sending code…" : "Send Verification Code"}
                  </BridalButton>
                </form>
              </>
            )}

            {/* ── STEP B — OTP ── */}
            {step === "otp" && (
              <>
                <BridalCrown className="mb-3">Verify Your Phone</BridalCrown>
                <BridalTitle size="h2" className="text-center mb-2">
                  Enter the <span className="text-bridal-gold">6-digit code</span>
                </BridalTitle>
                <p className="text-center font-bridal text-bridal-text-soft text-sm mb-2">
                  We sent a code to{" "}
                  <span className="text-bridal-charcoal font-medium">
                    {otpSentTo}
                  </span>
                  .
                </p>
                <p className="text-center font-bridal text-[12px] text-bridal-text-label mb-6">
                  In development the code is printed in the backend server
                  console.
                </p>

                <form onSubmit={onOtpSubmit} className="space-y-4">
                  <BridalField id="code" label="Verification Code" required>
                    <BridalInput
                      id="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="123456"
                      leadingIcon={<ShieldCheck className="w-4 h-4" />}
                      className="tracking-[0.4em] text-center"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
                      }
                      autoFocus
                    />
                  </BridalField>

                  {otpError && (
                    <p className="text-[12px] text-bridal-coral font-bridal">
                      {otpError}
                    </p>
                  )}

                  <BridalButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    block
                    loading={submitting}
                  >
                    {submitting ? "Verifying…" : "Verify Code"}
                  </BridalButton>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setStep("contact")
                    setOtpError(null)
                  }}
                  className="mt-5 inline-flex items-center gap-1.5 font-bridal text-[12px] tracking-wide text-bridal-text-soft hover:text-bridal-mauve transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Use a different number
                </button>
              </>
            )}

            {/* ── STEP C — Set password (phone-match) ── */}
            {step === "password" && (
              <>
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-bridal-sage/20 border border-bridal-sage/40 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-[#3F6B43]" />
                </div>
                <BridalCrown className="mb-3">You&apos;re Verified</BridalCrown>
                <BridalTitle size="h2" className="text-center mb-2">
                  Set your <span className="text-bridal-gold">password</span>
                </BridalTitle>
                <p className="text-center font-bridal text-bridal-text-soft text-sm mb-7">
                  Your phone matched this listing. Choose a password and your
                  business is yours to manage.
                </p>

                <form onSubmit={onPasswordSubmit} className="space-y-4">
                  <BridalField id="password" label="New Password" required>
                    <BridalInput
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      leadingIcon={<Lock className="w-4 h-4" />}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      trailing={reveal(showPassword, () =>
                        setShowPassword((p) => !p)
                      )}
                    />
                  </BridalField>

                  <BridalField
                    id="confirm"
                    label="Confirm Password"
                    required
                  >
                    <BridalInput
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      leadingIcon={<KeyRound className="w-4 h-4" />}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      trailing={reveal(showConfirm, () =>
                        setShowConfirm((p) => !p)
                      )}
                    />
                  </BridalField>

                  {passwordError && (
                    <p className="text-[12px] text-bridal-coral font-bridal">
                      {passwordError}
                    </p>
                  )}

                  <BridalButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    block
                    loading={submitting}
                    className="mt-2"
                  >
                    {submitting ? "Claiming…" : "Claim & Continue"}
                  </BridalButton>
                </form>
              </>
            )}

            {/* ── STEP D — Evidence ── */}
            {step === "evidence" && (
              <>
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-bridal-gold/15 border border-bridal-gold/40 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-bridal-gold-dark" />
                </div>
                <BridalCrown className="mb-3">One Last Step</BridalCrown>
                <BridalTitle size="h2" className="text-center mb-2">
                  Tell us about your{" "}
                  <span className="text-bridal-gold">business</span>
                </BridalTitle>
                <p className="text-center font-bridal text-bridal-text-soft text-sm mb-7">
                  We couldn&apos;t auto-match your phone, so our team will review
                  your claim. Share a few details that prove this business is
                  yours.
                </p>

                <form onSubmit={onEvidenceSubmit} className="space-y-4">
                  <BridalField
                    id="evidenceNote"
                    label="Business details / proof"
                    hint="e.g. your role, business address, website, social pages, or anything that confirms ownership."
                    required
                  >
                    <textarea
                      id="evidenceNote"
                      rows={5}
                      placeholder="Share details that confirm you own or manage this business…"
                      value={evidenceNote}
                      onChange={(e) => setEvidenceNote(e.target.value)}
                      className="w-full bridal-input px-4 py-3 font-bridal text-[14px] text-bridal-charcoal placeholder:text-bridal-text-label/70 outline-none resize-y min-h-[120px]"
                    />
                  </BridalField>

                  {evidenceError && (
                    <p className="text-[12px] text-bridal-coral font-bridal">
                      {evidenceError}
                    </p>
                  )}

                  <BridalButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    block
                    loading={submitting}
                    className="mt-2"
                  >
                    {submitting ? "Submitting…" : "Submit for Review"}
                  </BridalButton>
                </form>
              </>
            )}

            {/* ── SUBMITTED — Evidence success ── */}
            {step === "submitted" && (
              <div className="text-center">
                <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-bridal-sage/20 border border-bridal-sage/40 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-[#3F6B43]" />
                </div>
                <BridalCrown className="mb-3">Submitted</BridalCrown>
                <BridalTitle size="h2" className="mb-3">
                  We&apos;ll take it{" "}
                  <span className="text-bridal-gold">from here</span>
                </BridalTitle>
                <p className="font-bridal text-bridal-text-soft text-sm mb-7">
                  Thanks! Our team will review your claim and email you a link to
                  finish setting up your account. This usually takes a short
                  while.
                </p>
                <BridalButton
                  variant="primary"
                  size="lg"
                  block
                  onClick={() => router.push("/")}
                >
                  Back to Wedding Wala
                </BridalButton>
              </div>
            )}
          </div>

          {/* Footer */}
          {step !== "submitted" && (
            <>
              <div className="my-6">
                <FloralDivider />
              </div>
              <p className="text-center font-bridal text-sm text-bridal-text-soft">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-bridal-gold hover:text-bridal-gold-dark font-medium underline-offset-4 hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

/**
 * WW-CLAIM — "Is this your business?" on the public vendor page.
 *
 * Roughly 3,270 listings on this marketplace are imported public-directory rows
 * whose owner account has never been claimed. The claim flow itself has been
 * complete and live for months — POST /api/v1/claims/start works, the email
 * verification works, the admin review queue in ClaimsQueueTable.tsx works — and
 * `lib/api/claims.ts` already wrapped every endpoint.
 *
 * What was missing was the door. The public vendor detail page, which is exactly
 * where a venue owner lands when they google their own business, had no entry
 * point to any of it. Four claims had been raised in total, against 3,268
 * claimable accounts.
 *
 * So this is deliberately the smallest possible surface: a line of text and a
 * button, expanding to three fields. A vendor who recognises their own listing
 * should be one click from starting, not routed to a marketing page about
 * joining.
 *
 * Steps mirror the service exactly:
 *   start    → email a 6-digit code (email is the verification channel; the
 *              flow moved off SMS because delivery is Resend, not a telco)
 *   verify   → the server decides the proof path
 *   password → the listing's own contact details matched; they take the account
 *   evidence → they did not; a human reviews it
 */

import * as React from "react"
import { startClaim, verifyClaim, finalizeClaim, submitClaimEvidence, type ClaimNext } from "@/lib/api/claims"

type Step = "idle" | "form" | "code" | "password" | "evidence" | "done"

const err = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback

export function ClaimListingCard({
  businessId,
  businessName,
}: {
  businessId: number
  businessName: string
}) {
  const [step, setStep] = React.useState<Step>("idle")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [code, setCode] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [evidence, setEvidence] = React.useState("")

  const [claimId, setClaimId] = React.useState<string | number | null>(null)
  const [sentTo, setSentTo] = React.useState<string>("")
  const [doneMsg, setDoneMsg] = React.useState("")

  const run = async (fn: () => Promise<void>, fallback: string) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(err(e, fallback))
    } finally {
      setBusy(false)
    }
  }

  const onStart = () =>
    run(async () => {
      const r = await startClaim({ listingId: businessId, name, email, phone: phone || undefined })
      setClaimId(r.claimId)
      setSentTo(r.otpSentTo || email)
      setStep("code")
    }, "Could not start the claim. Please check your email address and try again.")

  const onVerify = () =>
    run(async () => {
      const r = await verifyClaim(claimId as string | number, code.trim())
      // The server decides: a contact-detail match can take the account
      // immediately; anything else goes to a human.
      setStep((r.next as ClaimNext) === "set_password" ? "password" : "evidence")
    }, "That code was not accepted. Check it and try again.")

  const onFinalize = () =>
    run(async () => {
      await finalizeClaim(claimId as string | number, password)
      setDoneMsg("Your listing is yours. Sign in to manage it.")
      setStep("done")
    }, "Could not set that password. Please try again.")

  const onEvidence = () =>
    run(async () => {
      await submitClaimEvidence(claimId as string | number, evidence.trim())
      setDoneMsg(
        "Thank you — our team will review this and get back to you by email, usually within a couple of working days.",
      )
      setStep("done")
    }, "Could not send that. Please try again.")

  const input =
    "w-full rounded-md border border-bridal-charcoal/15 px-3 py-2 text-[14px] outline-none focus:border-bridal-gold"
  const btn =
    "rounded-md bg-bridal-charcoal px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"

  return (
    <section className="mb-12 rounded-lg border border-bridal-gold/35 bg-bridal-gold/[0.06] p-5">
      {step === "idle" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display italic text-[20px] text-bridal-charcoal">
              Is this your business?
            </h2>
            <p className="mt-1 text-[13px] text-bridal-charcoal/70">
              {businessName} is listed from public information. Claim it to manage your
              photos, prices and bookings.
            </p>
          </div>
          <button type="button" className={btn} onClick={() => setStep("form")}>
            Claim this listing
          </button>
        </div>
      )}

      {step === "form" && (
        <div className="space-y-3">
          <h2 className="font-display italic text-[20px] text-bridal-charcoal">
            Claim {businessName}
          </h2>
          <p className="text-[13px] text-bridal-charcoal/70">
            We&apos;ll email you a 6-digit code to confirm it&apos;s really you.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={input} placeholder="Your email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input
              className={`${input} sm:col-span-2`}
              placeholder="Phone (optional — helps us verify faster)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button type="button" className={btn} disabled={busy || !email.trim()} onClick={onStart}>
              {busy ? "Sending…" : "Send code"}
            </button>
            <button type="button" className="px-3 text-[13px] text-bridal-charcoal/60" onClick={() => setStep("idle")}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === "code" && (
        <div className="space-y-3">
          <h2 className="font-display italic text-[20px] text-bridal-charcoal">Enter your code</h2>
          <p className="text-[13px] text-bridal-charcoal/70">Sent to {sentTo}.</p>
          <input
            className={`${input} max-w-[200px] tracking-[0.3em]`}
            placeholder="123456"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="button" className={btn} disabled={busy || code.trim().length < 4} onClick={onVerify}>
            {busy ? "Checking…" : "Verify"}
          </button>
        </div>
      )}

      {step === "password" && (
        <div className="space-y-3">
          <h2 className="font-display italic text-[20px] text-bridal-charcoal">
            Set a password
          </h2>
          <p className="text-[13px] text-bridal-charcoal/70">
            Your details matched this listing. Choose a password and the listing is yours.
          </p>
          <input
            className={`${input} max-w-[320px]`}
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" className={btn} disabled={busy || password.length < 8} onClick={onFinalize}>
            {busy ? "Saving…" : "Claim my listing"}
          </button>
        </div>
      )}

      {step === "evidence" && (
        <div className="space-y-3">
          <h2 className="font-display italic text-[20px] text-bridal-charcoal">
            Tell us how we can confirm it&apos;s yours
          </h2>
          <p className="text-[13px] text-bridal-charcoal/70">
            Your details didn&apos;t match what we hold, so a person will check. Anything that
            proves ownership helps — your role, a business number, a utility bill, your
            website or social page.
          </p>
          <textarea
            className={`${input} min-h-[90px]`}
            placeholder="e.g. I am the owner. Our NTN is 1234567-8 and our Facebook page is facebook.com/…"
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
          />
          <button type="button" className={btn} disabled={busy || evidence.trim().length < 10} onClick={onEvidence}>
            {busy ? "Sending…" : "Send for review"}
          </button>
        </div>
      )}

      {step === "done" && (
        <div>
          <h2 className="font-display italic text-[20px] text-bridal-charcoal">Thank you</h2>
          <p className="mt-1 text-[13px] text-bridal-charcoal/70">{doneMsg}</p>
        </div>
      )}

      {error && <p className="mt-3 text-[13px] text-red-700">{error}</p>}
    </section>
  )
}

export default ClaimListingCard

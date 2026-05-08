/**
 * Contact-form Route Handler.
 *
 * Validates input + applies basic anti-abuse heuristics, then logs the
 * enquiry server-side. Until a transactional-email provider (Resend /
 * Postmark / AWS SES) is wired, this is a thin pass-through that 200s on
 * valid input — meaning the UX doesn't lie to the customer (the form
 * appears to work) but the team needs to read server logs to see
 * incoming enquiries.
 *
 * To complete the loop:
 *   1. Add a transactional-email provider env var
 *   2. Replace the `console.info` call below with a fetch to the
 *      provider's `/email/send` API, sending to info@weddingwala.pk
 *   3. Optionally also forward to the backend `/api/v1/contact` once
 *      a backend slice is added (currently NONE — kept frontend-only
 *      per founder direction).
 *
 * Reference: docs/seo/00-master-seo-playbook.md §28 trust + §29 analytics.
 */

import { NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/backend-url"

// Minimal RFC 5322-ish validator — full parser would be overkill at this layer.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// In-memory rate limiter — IP → { count, resetAt }. Per-process.
// Same shape as the newsletter limiter; replace with Redis or a backend
// limiter when traffic justifies it.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 5 // 5 contact submits per hour per IP
const ipBucket = new Map<string, { count: number; resetAt: number }>()

function rateLimit(ip: string): { ok: boolean } {
  const now = Date.now()
  const entry = ipBucket.get(ip)
  if (!entry || entry.resetAt < now) {
    ipBucket.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { ok: true }
  }
  if (entry.count >= RATE_LIMIT_MAX) return { ok: false }
  entry.count += 1
  return { ok: true }
}

function clip(s: unknown, max: number): string {
  return String(s ?? "").trim().slice(0, max)
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"

  if (!rateLimit(ip).ok) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please try again in an hour." },
      { status: 429 },
    )
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 })
  }

  // Honeypot — `bot` field should always be empty in real submissions.
  if (typeof body?.bot === "string" && body.bot.length > 0) {
    // Silently 200 to avoid signalling honeypot detection to bots.
    return NextResponse.json({ ok: true })
  }

  const name = clip(body?.name, 200)
  const email = clip(body?.email, 254).toLowerCase()
  const subject = clip(body?.subject, 200)
  const message = clip(body?.message, 5000)

  if (!name || name.length < 2) {
    return NextResponse.json({ ok: false, error: "Please enter your name." }, { status: 400 })
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 })
  }
  if (!message || message.length < 10) {
    return NextResponse.json(
      { ok: false, error: "Please write at least a sentence so we can help." },
      { status: 400 },
    )
  }

  // Forward to backend — emailDispatchService dispatches H1 (ack to
  // sender) + H2 (notify support team) via Resend through the durable
  // outbox. Reference: docs/email/01-trigger-map.md §H1/§H2.
  try {
    const res = await fetch(`${BACKEND_URL}api/v1/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": ip,
      },
      body: JSON.stringify({ name, email, subject, message }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(
        { ok: false, error: data?.error || "Couldn't send your message. Please try again." },
        { status: res.status >= 500 ? 502 : res.status },
      )
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[contact] backend forward failed:", err)
    return NextResponse.json(
      {
        ok: false,
        error:
          "We couldn't reach our servers. Please try again, or email info@weddingwala.pk directly.",
      },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}

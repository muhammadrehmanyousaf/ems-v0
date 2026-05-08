/**
 * Newsletter subscribe — Next.js Route Handler.
 *
 * Validates email + applies basic anti-abuse heuristics, then forwards to
 * the backend API for persistence and (eventually) double-opt-in email.
 *
 * Until the backend `/api/v1/newsletter` endpoint is wired, this acts as a
 * thin pass-through that 200s on valid input so the UX doesn't lie. Real
 * persistence is a TODO tracked below.
 *
 * Reference: docs/seo/00-master-seo-playbook.md §6 item 295 + §29 newsletter.
 */

import { NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/backend-url"

// Minimal RFC 5322-ish validator — full parser would be overkill at this layer.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// In-memory rate limiter — IP → { count, resetAt }. Per-process, OK at small
// scale; replace with Redis or a backend-side limiter when traffic grows.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 5 // 5 subscribes per hour per IP
const ipBucket = new Map<string, { count: number; resetAt: number }>()

function rateLimit(ip: string): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = ipBucket.get(ip)
  if (!entry || entry.resetAt < now) {
    ipBucket.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { ok: true, remaining: RATE_LIMIT_MAX - 1 }
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { ok: false, remaining: 0 }
  }
  entry.count += 1
  return { ok: true, remaining: RATE_LIMIT_MAX - entry.count }
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"

  const rl = rateLimit(ip)
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many subscribe attempts. Please try again later." },
      { status: 429 },
    )
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    )
  }

  const email = String(body?.email ?? "").trim().toLowerCase()
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Email is required." },
      { status: 400 },
    )
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 },
    )
  }

  // Honeypot — `bot` field should always be empty in real submissions.
  if (typeof body?.bot === "string" && body.bot.length > 0) {
    // Silently 200 to avoid signalling honeypot-detection to bots.
    return NextResponse.json({ ok: true })
  }

  // Forward to backend for persistence + double-opt-in. The backend endpoint
  // does not exist yet (TODO); for now we log + 200 so the UX doesn't lie.
  // When the backend is ready, drop the try/catch and let the response shape
  // come straight through.
  try {
    await fetch(`${BACKEND_URL}api/v1/newsletter/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": ip,
      },
      body: JSON.stringify({ email }),
      // Don't block the user response on backend latency.
      signal: AbortSignal.timeout(2000),
    })
  } catch (err) {
    // Backend not yet wired or unreachable. Log and continue — we'll
    // capture intent in server logs until persistence lands.
    // eslint-disable-next-line no-console
    console.info("[newsletter] subscribe (backend pending):", email, ip)
  }

  return NextResponse.json({ ok: true })
}

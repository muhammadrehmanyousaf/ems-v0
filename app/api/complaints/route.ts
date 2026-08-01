/**
 * Complaints Route Handler.
 *
 * Forwards to the backend, which stores the complaint, mints its reference,
 * acknowledges the complainant, and alerts every super-admin.
 *
 * Unlike the contact form, this one returns something the caller needs: the
 * case reference. The acknowledgement email restates it, but a person should
 * not have to wait for an inbox to learn their own case number — they may need
 * to read it out on a phone call in the next five minutes.
 *
 * The Authorization header is passed through when present so a complaint from
 * a signed-in user attaches to their account. It is never required.
 */

import { NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/backend-url"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX = 10
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
      { ok: false, error: "Too many complaints submitted. Please try again in an hour." },
      { status: 429 },
    )
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 })
  }

  if (typeof body?.bot === "string" && body.bot.length > 0) {
    return NextResponse.json({ ok: true, reference: null })
  }

  const contactName = clip(body?.contactName, 120)
  const contactEmail = clip(body?.contactEmail, 160).toLowerCase()
  const contactPhone = clip(body?.contactPhone, 40)
  const category = clip(body?.category, 32)
  const subject = clip(body?.subject, 200)
  const complaintBody = clip(body?.body, 8000)

  if (!contactEmail || !EMAIL_RE.test(contactEmail)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address so we can reply." },
      { status: 400 },
    )
  }
  if (!subject || subject.length < 3) {
    return NextResponse.json(
      { ok: false, error: "Please give your complaint a short title." },
      { status: 400 },
    )
  }
  if (!complaintBody || complaintBody.length < 20) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please describe what happened in a few sentences so we can investigate.",
      },
      { status: 400 },
    )
  }

  const auth = request.headers.get("authorization")

  try {
    const res = await fetch(`${BACKEND_URL}api/v1/complaints`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": ip,
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify({
        contactName,
        contactEmail,
        contactPhone,
        category,
        subject,
        body: complaintBody,
        bookingId: body?.bookingId,
      }),
      signal: AbortSignal.timeout(8000),
    })

    const data = await res.json().catch(() => ({}) as any)
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: data?.message || "Couldn't record your complaint. Please try again." },
        { status: res.status >= 500 ? 502 : res.status },
      )
    }

    return NextResponse.json({
      ok: true,
      reference: data?.data?.reference ?? null,
      dueAt: data?.data?.dueAt ?? null,
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[complaints] backend forward failed:", err)
    return NextResponse.json(
      {
        ok: false,
        error:
          "We couldn't reach our servers. Please try again, or email info@weddingwala.pk directly.",
      },
      { status: 502 },
    )
  }
}

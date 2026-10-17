/**
 * On-demand revalidation for a vendor's public listing.
 *
 * Every public page reads the backend through `next: { revalidate: 3600 }`, and
 * Vercel's Data Cache is keyed by fetch URL and shared across deployments. The
 * consequence, confirmed on production on 2026-09-26: a vendor who uploaded a
 * photo or a walkthrough clip saw their own listing unchanged for up to an
 * hour, with no way to push it — and redeploying did not help, because the
 * cache survives deploys. The same mechanism made a freshly shipped public-page
 * feature look like it had never deployed.
 *
 * There was no `revalidatePath`, no `revalidateTag` and no route like this
 * anywhere in the app, so nothing could clear a single entry.
 *
 * Authorisation deliberately reuses the caller's own session rather than a
 * shared secret: we ask the backend which businesses this token owns, and
 * revalidate only those. A shared secret in the browser bundle would let anyone
 * evict cache entries at will, which is a cheap way to hammer the backend.
 *
 * PLANS (PL-A hook). The backend itself calls this route, server to server, when a
 * vendor's plan locks or unlocks, so a paused venue shows its "not taking
 * enquiries" notice (and drops out of the lists) at once instead of up to an hour
 * later. That caller has no vendor session, so it proves itself with the shared
 * secret PUBLIC_REVALIDATE_SECRET (never in a browser bundle: it is a server env
 * var, and this route only ever evicts cache entries, it returns nothing private):
 *
 *   POST { secret, event: "vendor_listing_changed", reason: "locked" | "unlocked",
 *          userId, businesses: [{ id, slug, city }] }
 */

import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { timingSafeEqual } from "node:crypto"
import { BACKEND_URL } from "@/lib/backend-url"
import { vendorCacheTag } from "@/lib/seo/fetch-vendor"

export const runtime = "nodejs"
// This route must never itself be cached.
export const dynamic = "force-dynamic"

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}
const slug = (v: unknown) => String(v ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

/** The backend's lock/unlock hook: evict every cached page that shows these venues (their pages and the lists). */
function handleBackendHook(body: { secret?: unknown; businesses?: unknown }) {
  const expected = process.env.PUBLIC_REVALIDATE_SECRET
  if (!expected) return NextResponse.json({ ok: false, message: "Not configured" }, { status: 503 })
  if (typeof body.secret !== "string" || !safeEqual(body.secret, expected)) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 })
  }
  const list = (Array.isArray(body.businesses) ? body.businesses : []).slice(0, 50) as Array<{ id?: unknown; slug?: unknown; city?: unknown }>
  const tags: string[] = []
  const paths = new Set<string>(["/", "/venues", "/search", "/wedding-venues"])
  for (const b of list) {
    const id = Number(b?.id)
    if (!Number.isFinite(id) || id <= 0) continue
    tags.push(vendorCacheTag(id))
    revalidateTag(vendorCacheTag(id))
    const city = slug(b?.city)
    if (city) paths.add(`/wedding-venues/${city}`)
  }
  for (const pth of paths) revalidatePath(pth)
  return NextResponse.json({ ok: true, revalidated: tags, paths: [...paths] })
}

export async function POST(req: Request) {
  let businessId: number
  try {
    const body = (await req.json()) as { businessId?: number | string; secret?: unknown; businesses?: unknown }
    if (body && typeof body === "object" && "secret" in body) return handleBackendHook(body)
    businessId = Number(body?.businessId)
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid body" }, { status: 400 })
  }
  if (!Number.isFinite(businessId) || businessId <= 0) {
    return NextResponse.json({ ok: false, message: "A businessId is required" }, { status: 400 })
  }

  const auth = req.headers.get("authorization")
  if (!auth) {
    return NextResponse.json({ ok: false, message: "Not signed in" }, { status: 401 })
  }

  // Ask the backend what this token actually owns. Anything we cannot prove
  // ownership of is refused rather than revalidated.
  let owned: number[] = []
  try {
    const res = await fetch(`${BACKEND_URL}api/v1/businesses/user-business`, {
      headers: { Authorization: auth, Accept: "application/json" },
      cache: "no-store",
    })
    if (!res.ok) {
      return NextResponse.json({ ok: false, message: "Could not verify ownership" }, { status: 403 })
    }
    const json = (await res.json()) as { data?: unknown }
    const rows = Array.isArray(json?.data)
      ? (json.data as Array<{ id?: number | string }>)
      : ((json?.data as { rows?: Array<{ id?: number | string }> })?.rows ?? [])
    owned = rows.map((r) => Number(r?.id)).filter((n) => Number.isFinite(n))
  } catch {
    return NextResponse.json({ ok: false, message: "Could not verify ownership" }, { status: 502 })
  }

  if (!owned.includes(businessId)) {
    return NextResponse.json({ ok: false, message: "Not your listing" }, { status: 403 })
  }

  revalidateTag(vendorCacheTag(businessId))
  return NextResponse.json({ ok: true, revalidated: vendorCacheTag(businessId) })
}

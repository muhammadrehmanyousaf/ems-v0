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
 */

import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { BACKEND_URL } from "@/lib/backend-url"
import { vendorCacheTag } from "@/lib/seo/fetch-vendor"

export const runtime = "nodejs"
// This route must never itself be cached.
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  let businessId: number
  try {
    const body = (await req.json()) as { businessId?: number | string }
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

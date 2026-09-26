/**
 * Push a vendor's edit to their public listing immediately.
 *
 * The public pages read the backend through a 1-hour ISR window, so without
 * this a vendor changes a photo, a clip or a price and their own listing keeps
 * showing the old one for up to an hour — with nothing to click and no way to
 * tell whether it saved. Calling this after a successful save drops just that
 * vendor's cache entry.
 *
 * Deliberately best-effort and silent: the save already succeeded, and a failed
 * cache hint is not something to interrupt the vendor about. The hourly refresh
 * remains the backstop.
 */
export async function pushLive(businessId: number | string): Promise<boolean> {
  if (typeof window === "undefined") return false
  const id = Number(businessId)
  if (!Number.isFinite(id) || id <= 0) return false

  let token: string | null = null
  try {
    token = localStorage.getItem("auth_token")
  } catch {
    // private mode / blocked storage — nothing to do
    return false
  }
  if (!token) return false

  try {
    const res = await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ businessId: id }),
    })
    return res.ok
  } catch {
    return false
  }
}

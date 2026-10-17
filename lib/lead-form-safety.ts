/**
 * WP33 / LEADS-060 + LEADS-061 - two small pure helpers behind the Leads drawer.
 *
 * safeDateValue: the calendar deep link /dashboard/leads?new=<value> prefilled the date input from the URL. The value was
 * written raw into value="..." and assigned with innerHTML, so a crafted link executed script in the vendor's session (the
 * auth token is in localStorage). Only a real YYYY-MM-DD day is ever used.
 *
 * assignableReps: the "Assign to" picker used to map the Staff roster straight into <option value=StaffMember.id>, but
 * Lead.assignedToUserId is a Users FK. The picker now offers the people who can act on a lead and sends their USER id: the
 * owner (when the signed-in user is one) and staff members that have a login.
 */

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/

/** The value if it is a real calendar day written YYYY-MM-DD, else "" (never throws, never returns markup). */
export function safeDateValue(v: unknown): string {
  if (typeof v !== "string") return ""
  const s = v.trim()
  const m = YMD.exec(s)
  if (!m) return ""
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3])
  if (mo < 1 || mo > 12 || d < 1) return ""
  const dim = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  return d <= dim ? s : ""
}

export type RepOption = { userId: number; label: string }

type RosterMember = { id: number; userId?: number | null; fullName?: string; name?: string }

/** Owner (the signed-in user) first, then every staff member that has a login; each option's value is a USER id. */
export function assignableReps(members: RosterMember[], me: { id: number; name?: string | null } | null): RepOption[] {
  const out: RepOption[] = []
  const seen = new Set<number>()
  if (me && Number.isFinite(me.id) && me.id > 0) {
    out.push({ userId: me.id, label: `${me.name ? me.name : "Mein"} (aap)` })
    seen.add(me.id)
  }
  for (const m of members || []) {
    const uid = m && m.userId != null ? Number(m.userId) : NaN
    if (!Number.isFinite(uid) || uid <= 0 || seen.has(uid)) continue
    seen.add(uid)
    out.push({ userId: uid, label: m.fullName || m.name || `Staff #${m.id}` })
  }
  return out
}

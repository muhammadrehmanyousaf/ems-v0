/**
 * Shared <BookingForm> — the ONE booking-create form for the whole console.
 *
 * Replaces the three thin, divergent drawers (Bookings / Lead→Booking /
 * Customer→Booking) with a single full-payload form used from every surface
 * (bookings, lead, customer, chat, calendar). It surfaces the booking model the
 * backend already supports: venue → sub-venue cascade (with server SPACE_CONFLICT),
 * package + menu, advance (downPayment), gender-mode, event city, duration, and
 * special requests. Pricing stays SERVER-side — the form shows a hint, never the
 * authoritative figure.
 *
 * Integration is one line per screen: `openBookingForm(shadow, { prefill,
 * businesses, activeBiz, onSaved })`. The module binds its own change/click
 * listeners once per shadow (scoped to `bf-*` ids), so it never collides with a
 * screen's own handlers.
 */

import { toast } from "sonner"
import {
  BookingsAPI, PackagesAPI, MenusAPI,
  type CreateBookingPayload, type CreateBookingVendor, type ApiPackage, type ApiMenu,
} from "@/lib/api/dashboard"
import { venueSpacesApi, type SubVenueNode } from "@/lib/api/venueSpaces"
import { openDrawer, closeDrawer, escHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

export type BizLite = { id: number; name?: string | null }
export type BookingPrefill = {
  customerName?: string; customerPhone?: string; customerEmail?: string
  bookingDate?: string; bookingTime?: string; guestCount?: number | null
  businessId?: number | null; subVenueId?: number | null
  leadId?: number // when converting a lead (caller marks it won on success)
}
type Opts = { prefill?: BookingPrefill; businesses?: BizLite[]; activeBiz?: number | null; onSaved?: (res?: unknown) => void }

const BF_STATE = new WeakMap<ShadowRoot, Opts>()
const BF_BOUND = new WeakSet<ShadowRoot>()

const GENDER = [["", "— gender mode —"], ["MIXED", "Mixed"], ["MARDANA", "Mardana"], ["ZENANA", "Zenana"], ["SEGREGABLE", "Alag (segregable)"]]
const METHODS = [["cash", "Cash"], ["jazzcash", "JazzCash"], ["easypaisa", "EasyPaisa"], ["bank_transfer", "Bank transfer"], ["raast", "Raast"], ["ibft", "IBFT"], ["other", "Other"]]

function bookingFormBody(prefill?: BookingPrefill, businesses?: BizLite[], activeBiz?: number | null): string {
  const p = prefill || {}
  const v = (x: unknown) => (x != null && x !== "" ? escHtml(String(x)) : "")
  const today = p.bookingDate ? String(p.bookingDate).slice(0, 10) : new Date().toISOString().slice(0, 10)
  const selBiz = p.businessId ?? activeBiz ?? (businesses && businesses[0]?.id) ?? ""
  const bizOpts = (businesses || []).map((b) => `<option value="${b.id}"${b.id === selBiz ? " selected" : ""}>${escHtml(b.name || `Venue #${b.id}`)}</option>`).join("")
  const genderOpts = GENDER.map(([k, l]) => `<option value="${k}">${l}</option>`).join("")
  const methodOpts = METHODS.map(([k, l]) => `<option value="${k}">${l}</option>`).join("")
  return `${p.leadId ? `<div style="font-size:12px;color:var(--ink-3);background:var(--accent-wash);border-radius:8px;padding:8px 11px;margin-bottom:14px">Lead se booking ban rahi hai — details bhari hain, confirm karein.</div>` : ""}
    <div class="bf-sec">Customer</div>
    <div class="dfield"><label class="dlabel">Naam <span class="req">*</span></label><input id="bf-name" value="${v(p.customerName)}" placeholder="Customer ka naam"/></div>
    <div class="dfield row2"><div><label class="dlabel">Phone <span class="req">*</span></label><input id="bf-phone" value="${v(p.customerPhone)}" placeholder="0300…"/></div><div><label class="dlabel">Email</label><input id="bf-email" value="${v(p.customerEmail)}" placeholder="optional"/></div></div>

    <div class="bf-sec">Event</div>
    <div class="dfield row2"><div><label class="dlabel">Tareekh <span class="req">*</span></label><input type="date" id="bf-date" value="${today}"/></div><div><label class="dlabel">Waqt <span class="req">*</span></label><input type="time" id="bf-time" value="${v(p.bookingTime) || "18:00"}"/></div></div>
    <div class="dfield row2"><div><label class="dlabel">Mehmaan</label><input type="number" id="bf-guests" value="${p.guestCount != null ? p.guestCount : ""}" placeholder="e.g. 400"/></div><div><label class="dlabel">Gender mode</label><select id="bf-gender">${genderOpts}</select></div></div>
    <div class="dfield"><label class="dlabel">Event city <span style="color:var(--ink-4);font-weight:400">(agar doosre shehar mein)</span></label><input id="bf-city" placeholder="optional — travel surcharge"/></div>

    <div class="bf-sec">Venue &amp; space</div>
    <div class="dfield row2"><div><label class="dlabel">Venue <span class="req">*</span></label><select id="bf-biz">${bizOpts || `<option value="">—</option>`}</select></div><div><label class="dlabel">Hall / space</label><select id="bf-subvenue"><option value="">— poora venue —</option></select></div></div>

    <div class="bf-sec">Package &amp; menu</div>
    <div class="dfield row2"><div><label class="dlabel">Package</label><select id="bf-package"><option value="">— koi nahi —</option></select></div><div><label class="dlabel">Menu</label><select id="bf-menu"><option value="">— koi nahi —</option></select></div></div>
    <div class="bf-hint" id="bf-pricehint">Server final qeemat calculate karega (package/menu/guests/add-ons se).</div>
    <div class="dfield"><label class="dlabel">Tay raqam <span style="color:var(--ink-4);font-weight:400">(sirf agar package select nahi)</span></label><input type="number" id="bf-agreed" placeholder="agreed price (unpriced venue)"/></div>

    <div class="bf-sec">Paisa</div>
    <div class="dfield row2"><div><label class="dlabel">Advance (mila)</label><input type="number" id="bf-advance" placeholder="booking advance"/></div><div><label class="dlabel">Tareeqa</label><select id="bf-method">${methodOpts}</select></div></div>

    <div class="dfield"><label class="dlabel">Khaas farmaish</label><textarea id="bf-special" placeholder="stage, decor, timing…"></textarea></div>
    <div class="ww-dfoot"><button class="btn btn-ghost" data-drawer-close type="button">Cancel</button><button class="btn btn-primary" data-bf-save type="button">Booking banayein</button></div>`
}

async function populateBookingDeps(shadow: ShadowRoot, businessId: number, prefill?: BookingPrefill) {
  const subSel = shadow.getElementById("bf-subvenue") as HTMLSelectElement | null
  const pkgSel = shadow.getElementById("bf-package") as HTMLSelectElement | null
  const menuSel = shadow.getElementById("bf-menu") as HTMLSelectElement | null
  if (subSel) subSel.innerHTML = `<option value="">— poora venue —</option>`
  if (pkgSel) pkgSel.innerHTML = `<option value="">— koi nahi —</option>`
  if (menuSel) menuSel.innerHTML = `<option value="">— koi nahi —</option>`
  if (!businessId) return
  try {
    const tree = await venueSpacesApi.getTree(businessId)
    const flat: SubVenueNode[] = []
    const walk = (ns: SubVenueNode[]) => ns.forEach((n) => { flat.push(n); if (n.children?.length) walk(n.children) })
    walk(tree.tree || [])
    if (subSel) subSel.innerHTML = `<option value="">— poora venue —</option>` +
      flat.map((n) => `<option value="${n.id}"${n.id === prefill?.subVenueId ? " selected" : ""}>${"— ".repeat(Math.max(0, n.depth))}${escHtml(n.name)}</option>`).join("")
  } catch { /* no spaces */ }
  try {
    const pkgs: ApiPackage[] = await PackagesAPI.getAll(businessId)
    if (pkgSel) pkgSel.innerHTML = `<option value="">— koi nahi —</option>` +
      pkgs.map((p) => `<option value="${p.id}" data-price="${p.price}" data-unit="${p.pricingUnit || "per_event"}">${escHtml(p.name)} — Rs ${Number(p.price).toLocaleString("en-PK")}${p.pricingUnit === "per_head" ? "/head" : ""}</option>`).join("")
  } catch { /* no packages */ }
  try {
    const menus: ApiMenu[] = await MenusAPI.getAll(businessId)
    if (menuSel) menuSel.innerHTML = `<option value="">— koi nahi —</option>` +
      menus.map((m) => `<option value="${m.id}" data-price="${m.price}" data-unit="${m.pricingUnit || "per_event"}">${escHtml(m.title)} — Rs ${Number(m.price).toLocaleString("en-PK")}${m.pricingUnit === "per_head" ? "/head" : ""}</option>`).join("")
  } catch { /* no menus */ }
  refreshPriceHint(shadow)
}

function refreshPriceHint(shadow: ShadowRoot) {
  const hint = shadow.getElementById("bf-pricehint"); if (!hint) return
  const guests = Number((shadow.getElementById("bf-guests") as HTMLInputElement)?.value) || 0
  const parts: string[] = []
  let est = 0
  for (const id of ["bf-package", "bf-menu"]) {
    const sel = shadow.getElementById(id) as HTMLSelectElement | null
    const opt = sel?.selectedOptions?.[0]
    if (opt && opt.value) {
      const price = Number(opt.dataset.price) || 0
      const unit = opt.dataset.unit
      const line = unit === "per_head" ? price * (guests || 0) : price
      est += line
      parts.push(`${id === "bf-package" ? "Package" : "Menu"}: Rs ${price.toLocaleString("en-PK")}${unit === "per_head" ? `/head${guests ? ` × ${guests}` : ""}` : ""}`)
    }
  }
  hint.innerHTML = parts.length
    ? `${parts.join(" · ")}${est ? ` &nbsp;≈&nbsp; <b>Rs ${est.toLocaleString("en-PK")}</b>` : ""} <span style="color:var(--ink-4)">— server final calculate karega</span>`
    : "Server final qeemat calculate karega (package/menu/guests/add-ons se)."
}

function ensureBound(shadow: ShadowRoot) {
  if (BF_BOUND.has(shadow)) return
  BF_BOUND.add(shadow)
  shadow.addEventListener("change", (e) => {
    const t = e.target as HTMLElement
    if (t.id === "bf-biz") populateBookingDeps(shadow, Number((t as HTMLSelectElement).value))
    else if (t.id === "bf-package" || t.id === "bf-menu") refreshPriceHint(shadow)
  })
  shadow.addEventListener("input", (e) => {
    if ((e.target as HTMLElement).id === "bf-guests") refreshPriceHint(shadow)
  })
  shadow.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("[data-bf-save]")) { void submitBookingForm(shadow) }
  })
}

const val = (shadow: ShadowRoot, id: string) => (shadow.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.value?.trim() ?? ""

async function submitBookingForm(shadow: ShadowRoot) {
  const opts = BF_STATE.get(shadow) || {}
  const name = val(shadow, "bf-name"), phone = val(shadow, "bf-phone")
  if (!name) return toast.error("Customer ka naam likhein")
  if (!phone) return toast.error("Phone likhein")
  const bizId = Number(val(shadow, "bf-biz")) || Number(opts.activeBiz) || 0
  if (!bizId) return toast.error("Venue select karein")
  if (!val(shadow, "bf-date")) return toast.error("Tareekh chunein")

  const vendor: CreateBookingVendor = { businessId: bizId }
  const sub = Number(val(shadow, "bf-subvenue")); if (sub) vendor.subVenueId = sub
  const pkg = Number(val(shadow, "bf-package")); if (pkg) vendor.packageId = pkg
  const menu = Number(val(shadow, "bf-menu")); if (menu) vendor.menuId = menu
  const agreed = Number(val(shadow, "bf-agreed")); if (!pkg && agreed) vendor.agreedAmount = agreed
  const adv = Number(val(shadow, "bf-advance")); if (adv) vendor.downPayment = adv
  const special = val(shadow, "bf-special"); if (special) vendor.specialRequests = special

  const payload: CreateBookingPayload = {
    customerName: name, customerPhone: phone, customerEmail: val(shadow, "bf-email") || undefined,
    bookingDate: val(shadow, "bf-date"), bookingTime: val(shadow, "bf-time") || "18:00",
    guestCount: val(shadow, "bf-guests") ? Number(val(shadow, "bf-guests")) : undefined,
    vendors: [vendor], isOfflineBooking: true,
  }
  const gender = val(shadow, "bf-gender"); if (gender) (payload as CreateBookingPayload & { requestedGenderMode?: string }).requestedGenderMode = gender
  const city = val(shadow, "bf-city"); if (city) (payload as CreateBookingPayload & { eventCity?: string }).eventCity = city
  const method = val(shadow, "bf-method"); if (method && adv) (payload as CreateBookingPayload & { paymentMethod?: string }).paymentMethod = method

  const btn = shadow.querySelector("[data-bf-save]") as HTMLButtonElement | null
  if (btn) { btn.disabled = true; btn.textContent = "Ban rahi…" }
  try {
    const res = await BookingsAPI.create(payload)
    toast.success("Booking ban gayi")
    closeDrawer(shadow)
    opts.onSaved?.(res)
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string; code?: string; data?: { code?: string } } } }
    const code = e.response?.data?.code || e.response?.data?.data?.code
    const msg = code === "SPACE_CONFLICT" || code === "PARTITION_CONFLICT" ? "Ye hall us din pehle se booked hai — doosra space/date chunein."
      : code === "DATE_BLOCKED" ? "Ye date block hai — pehle unblock karein."
      : code === "CLOSURE_CUTOFF" ? "Event raat 10 baje ke baad ja raha hai — duration kam karein ya legal ack chahiye."
      : (e.response?.data?.message || "Booking nahi bani")
    toast.error(msg)
    if (btn) { btn.disabled = false; btn.textContent = "Booking banayein" }
  }
}

/** Open the shared booking form. One call is all a screen needs. */
export function openBookingForm(shadow: ShadowRoot, opts: Opts = {}) {
  BF_STATE.set(shadow, opts)
  ensureBound(shadow)
  openDrawer(shadow, opts.prefill?.leadId ? "Lead → Booking" : "Nayi booking", bookingFormBody(opts.prefill, opts.businesses, opts.activeBiz))
  const biz = Number((shadow.getElementById("bf-biz") as HTMLSelectElement | null)?.value) || Number(opts.prefill?.businessId) || Number(opts.activeBiz) || 0
  void populateBookingDeps(shadow, biz, opts.prefill)
}

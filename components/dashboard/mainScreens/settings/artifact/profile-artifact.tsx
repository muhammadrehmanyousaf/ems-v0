"use client"

/**
 * Account settings — premium rebuild on the shared champagne shell.
 *
 * Personal + business-contact fields are inline-editable with a sticky save bar
 * wired to UsersAPI.updateMyProfile (login email stays read-only by design).
 * Change-password is its own inline form → UsersAPI.changePassword. Account
 * facts (role, member-since, balance) are read-only.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { UsersAPI, type ApiUser } from "@/lib/api/dashboard"
import { useUser } from "@/context/UserContext"
import { CITIES } from "@/lib/seo/constants"
import { validatePkPhone, normalizePkPhone, validateEmail, normalizeEmail } from "@/lib/validation/pk-fields"
import { useArtifactShell, escHtml, initialsOf } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const STR_FIELDS = ["fullName", "phoneNumber", "city", "subArea", "bookingEmail", "primaryContactNumber", "secondaryContactNumber", "website", "officeAddress"] as const

const IC = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  building: '<path d="M3 21h18M6 21V7l6-4 6 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/>',
  cal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
}
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const fmtDate = (s?: string | null) => { if (!s) return "—"; const d = new Date(s); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }) }

const EXTRA_CSS = String.raw`
.content{ max-width:1120px; padding-bottom:96px; }
.acc-hero{ display:flex; align-items:center; gap:16px; padding:18px; }
.acc-ava{ width:60px; height:60px; border-radius:16px; background:linear-gradient(150deg,var(--accent),var(--accent-ink)); color:var(--on-accent); display:grid; place-items:center; font-weight:700; font-size:21px; flex:none; box-shadow:var(--shadow-xs); }
.acc-nm{ font-size:18px; font-weight:600; letter-spacing:-.02em; } .acc-em{ font-size:12.5px; color:var(--ink-3); margin-top:2px; }
.acc-badges{ display:flex; gap:7px; margin-top:9px; flex-wrap:wrap; }
.two{ display:grid; grid-template-columns:1fr 1fr; gap:14px; align-items:start; margin-top:14px; } .col-stack{ display:flex; flex-direction:column; gap:14px; min-width:0; }
.panel-h{ display:flex; align-items:center; gap:12px; padding:15px 18px 13px; border-bottom:1px solid var(--border); }
.panel-ic{ width:34px; height:34px; border-radius:9px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .panel-ic svg{ width:17px; height:17px; }
.panel-h h2{ font-size:14px; font-weight:600; } .panel-h .sub{ font-size:11.5px; color:var(--ink-3); margin-top:1px; }
.panel-body{ padding:16px 18px; }
.field{ display:flex; flex-direction:column; gap:6px; margin-bottom:15px; } .field:last-child{ margin-bottom:0; }
.frow{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
@media (max-width:560px){ .frow{ grid-template-columns:1fr; } }
.flabel{ font-size:12px; font-weight:600; color:var(--ink-2); }
.fhint{ font-size:11px; color:var(--ink-3); }
.field input,.field select{ width:100%; border:1px solid var(--border-2); border-radius:9px; background:var(--surface-2); color:var(--ink); padding:9px 11px; font:inherit; font-size:13px; outline:none; transition:border-color .12s,background .12s; }
.field input:focus,.field select:focus{ border-color:var(--accent); background:var(--surface); box-shadow:0 0 0 3px var(--accent-wash); }
.field input[readonly]{ background:var(--surface-3); color:var(--ink-3); cursor:not-allowed; }
/* read-only rows */
.dl-row{ display:flex; align-items:center; gap:12px; padding:11px 0; border-bottom:1px solid var(--border); } .dl-row:last-child{ border-bottom:0; }
.dl-ic{ width:32px; height:32px; border-radius:8px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--ink-3); flex:none; } .dl-ic svg{ width:15px; height:15px; }
.dl-main{ flex:1; min-width:0; } .dl-k{ font-size:11px; color:var(--ink-3); } .dl-v{ font-weight:600; font-size:13px; margin-top:1px; word-break:break-word; }
/* security */
.sec-row{ display:flex; align-items:flex-start; gap:12px; padding:13px 0; border-bottom:1px solid var(--border); } .sec-row:last-child{ border-bottom:0; }
.sec-main{ flex:1; } .sec-t{ font-weight:600; font-size:13px; } .sec-s{ font-size:11.5px; color:var(--ink-3); margin-top:2px; }
.pwform{ margin-top:8px; display:none; } .pwform.on{ display:block; }
.savebar{ position:fixed; left:236px; right:0; bottom:0; z-index:30; display:flex; align-items:center; gap:12px; padding:12px 26px; background:color-mix(in srgb,var(--surface) 90%,transparent); backdrop-filter:blur(10px); border-top:1px solid var(--border); transform:translateY(120%); transition:transform .2s; }
.savebar.on{ transform:translateY(0); } .savebar .sb-txt{ font-size:12.5px; color:var(--ink-2); font-weight:500; } .savebar .sb-sp{ flex:1; }
.btn.sm{ height:32px; padding:0 12px; font-size:12.5px; }
@media (max-width:900px){ .two{ grid-template-columns:1fr; } .savebar{ left:0; } }
`

function fieldInput(label: string, field: string, val: string, hint?: string, readonly = false): string {
  return `<div class="field"><label class="flabel">${escHtml(label)}</label><input type="text" ${readonly ? "readonly" : `data-field="${field}"`} value="${escHtml(val)}"/>${hint ? `<span class="fhint">${escHtml(hint)}</span>` : ""}</div>`
}

function buildContent(u: ApiUser & Record<string, unknown>): string {
  const name = u.fullName || "User"
  const role = u.roles?.[0]?.name || (u.isVendor ? "Vendor" : "User")
  const cityOpts = ["", ...CITIES.map((c) => c.name)].map((c) => `<option value="${escHtml(c)}"${(u.city || "") === c ? " selected" : ""}>${escHtml(c || "— sheher —")}</option>`).join("")
  const str = (k: string) => escHtml((u[k] as string) || "")

  const hero = `<div class="card"><div class="acc-hero"><span class="acc-ava">${escHtml(initialsOf(name))}</span>
    <div style="flex:1;min-width:0"><div class="acc-nm">${escHtml(name)}</div><div class="acc-em">${escHtml(u.email || "")}</div>
      <div class="acc-badges"><span class="st acc"><i></i> ${escHtml(role)}</span>${u.active ? `<span class="st ok"><i></i> Active</span>` : `<span class="st bad"><i></i> Inactive</span>`}</div></div></div></div>`

  const personal = `<div class="card"><div class="panel-h"><span class="panel-ic">${svg(IC.user, 1.9)}</span><div><h2>Zaati maloomat</h2><div class="sub">Aapka naam aur raabta</div></div></div>
    <div class="panel-body">
      ${fieldInput("Poora naam", "fullName", str("fullName"))}
      <div class="frow"><div class="field"><label class="flabel">Phone</label><input type="text" data-field="phoneNumber" value="${str("phoneNumber")}"/><span class="fhint">Jaise: 0300 1234567</span></div>
        <div class="field"><label class="flabel">Sheher</label><select data-field="city">${cityOpts}</select></div></div>
      ${fieldInput("Ilaqa / locality", "subArea", str("subArea"))}
    </div></div>`

  const account = `<div class="card"><div class="panel-h"><span class="panel-ic">${svg(IC.shield, 1.9)}</span><div><h2>Account</h2><div class="sub">Ye badla nahi ja sakta</div></div></div>
    <div class="panel-body" style="padding-top:6px">
      <div class="dl-row"><span class="dl-ic">${svg(IC.mail, 1.8)}</span><div class="dl-main"><div class="dl-k">Login email</div><div class="dl-v">${escHtml(u.email || "—")}</div></div></div>
      <div class="dl-row"><span class="dl-ic">${svg(IC.shield, 1.8)}</span><div class="dl-main"><div class="dl-k">Role</div><div class="dl-v">${escHtml(role)}</div></div></div>
      <div class="dl-row"><span class="dl-ic">${svg(IC.cal, 1.8)}</span><div class="dl-main"><div class="dl-k">Member since</div><div class="dl-v">${escHtml(fmtDate(u.createdAt))}</div></div></div>
      ${u.balance != null ? `<div class="dl-row"><span class="dl-ic">${svg(IC.wallet, 1.8)}</span><div class="dl-main"><div class="dl-k">Wallet balance</div><div class="dl-v">Rs ${escHtml(String(u.balance))}</div></div></div>` : ""}
    </div></div>`

  const bizcontact = `<div class="card"><div class="panel-h"><span class="panel-ic">${svg(IC.building, 1.8)}</span><div><h2>Business raabta</h2><div class="sub">Jahan enquiries aur bookings aati hain</div></div></div>
    <div class="panel-body">
      ${fieldInput("Booking email", "bookingEmail", str("bookingEmail"), "Har enquiry yahan aati hai.")}
      <div class="frow">${fieldInput("Primary number", "primaryContactNumber", str("primaryContactNumber"))}${fieldInput("Secondary number", "secondaryContactNumber", str("secondaryContactNumber"))}</div>
      ${fieldInput("Website", "website", str("website"))}
      ${fieldInput("Office address", "officeAddress", str("officeAddress"))}
    </div></div>`

  const security = `<div class="card"><div class="panel-h"><span class="panel-ic">${svg(IC.lock, 1.8)}</span><div><h2>Security</h2><div class="sub">Password aur account ki hifazat</div></div></div>
    <div class="panel-body" style="padding-top:6px">
      <div class="sec-row"><div class="sec-main"><div class="sec-t">Password</div><div class="sec-s">Account ko mazboot password se mehfooz rakhein.</div>
        <div class="pwform" id="pwform">
          <div class="field" style="margin-top:12px"><label class="flabel">Mojooda password</label><input type="password" id="pw-cur" autocomplete="current-password"/></div>
          <div class="frow"><div class="field"><label class="flabel">Naya password</label><input type="password" id="pw-new" autocomplete="new-password"/><span class="fhint">Kam se kam 6 characters</span></div>
            <div class="field"><label class="flabel">Dobara likhein</label><input type="password" id="pw-conf" autocomplete="new-password"/></div></div>
          <button class="btn btn-primary sm" id="pwsave">Password update karein</button>
        </div></div>
        <button class="btn btn-ghost sm" id="pwtoggle">Change password</button></div>
      <div class="sec-row"><div class="sec-main"><div class="sec-t">Two-factor authentication</div><div class="sec-s">Login par ek extra layer — jald aa raha hai.</div></div><span class="st mut"><i></i> Off</span></div>
    </div></div>`

  return `
  <div class="head"><div><h1>Account settings</h1><div class="sub">Aapki profile, raabta aur account.</div></div></div>
  ${hero}
  <div class="two">
    <div class="col-stack">${personal}${bizcontact}</div>
    <div class="col-stack">${account}${security}</div>
  </div>
  <div class="savebar" id="savebar"><span class="sb-txt" id="sbtxt">Sab mehfooz hai</span><span class="sb-sp"></span><button class="btn btn-ghost" id="sbreset">Waapas</button><button class="btn btn-primary" id="sbsave">Save changes</button></div>`
}

export function ProfileArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/profile", crumbBold: "Account", crumbSub: "Profile & security", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const { refreshUser } = useUser()
  const { data } = useQuery({ queryKey: ["profile-me"], queryFn: () => UsersAPI.getMyProfile() })
  const user = (data?.user ?? null) as (ApiUser & Record<string, unknown>) | null
  const baseline = React.useRef<Record<string, string>>({})
  const userRef = React.useRef(user); userRef.current = user

  const computeBaseline = React.useCallback((u: Record<string, unknown>) => {
    const bl: Record<string, string> = {}
    STR_FIELDS.forEach((f) => { bl[f] = String((u[f] as string) ?? "") })
    baseline.current = bl
  }, [])

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!data) { wwc.innerHTML = `<div style="padding:80px 16px;text-align:center;color:var(--ink-3)">Account load ho raha hai…</div>`; return }
    if (!user) { wwc.innerHTML = `<div style="padding:80px 16px;text-align:center;color:var(--ink-3)">Account nahi mila.</div>`; return }
    computeBaseline(user)
    wwc.innerHTML = buildContent(user)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true

    const refreshDirty = () => {
      const bar = s.getElementById("savebar"); if (!bar) return
      let dirty = 0
      s.querySelectorAll("[data-field]").forEach((el) => { const f = (el as HTMLElement).dataset.field!; if ((el as HTMLInputElement).value !== (baseline.current[f] ?? "")) dirty++ })
      const txt = s.getElementById("sbtxt"); bar.classList.toggle("on", dirty > 0)
      if (txt) txt.textContent = dirty > 0 ? `${dirty} cheez badli — save karein` : "Sab mehfooz hai"
    }
    const doSave = async () => {
      const patch: Record<string, string> = {}
      s.querySelectorAll("[data-field]").forEach((el) => { const f = (el as HTMLElement).dataset.field!; const v = (el as HTMLInputElement).value; if (v !== (baseline.current[f] ?? "")) patch[f] = v })
      if (!Object.keys(patch).length) return
      if (patch.phoneNumber?.trim()) { const p = validatePkPhone(patch.phoneNumber); if (p) { toast.error(p); return } patch.phoneNumber = normalizePkPhone(patch.phoneNumber) }
      if (patch.bookingEmail?.trim()) { const e = validateEmail(patch.bookingEmail, { label: "Booking email" }); if (e) { toast.error(e); return } patch.bookingEmail = normalizeEmail(patch.bookingEmail) }
      const btn = s.getElementById("sbsave") as HTMLButtonElement | null
      if (btn) { btn.disabled = true; btn.textContent = "Save ho raha…" }
      try {
        await UsersAPI.updateMyProfile(patch)
        Object.keys(patch).forEach((f) => { baseline.current[f] = patch[f] })
        toast.success("Profile update ho gaya")
        qc.invalidateQueries({ queryKey: ["profile-me"] })
        await refreshUser()
        refreshDirty()
      } catch { toast.error("Save nahi hua — dobara koshish karein") }
      finally { if (btn) { btn.disabled = false; btn.textContent = "Save changes" } }
    }
    const doPassword = async () => {
      const cur = (s.getElementById("pw-cur") as HTMLInputElement | null)?.value || ""
      const nw = (s.getElementById("pw-new") as HTMLInputElement | null)?.value || ""
      const cf = (s.getElementById("pw-conf") as HTMLInputElement | null)?.value || ""
      if (!cur || !nw) { toast.error("Mojooda aur naya password dono likhein"); return }
      if (nw.length < 6) { toast.error("Password kam se kam 6 characters ka ho"); return }
      if (nw !== cf) { toast.error("Naye password match nahi karte"); return }
      const btn = s.getElementById("pwsave") as HTMLButtonElement | null
      if (btn) { btn.disabled = true; btn.textContent = "Update ho raha…" }
      try {
        await UsersAPI.changePassword({ currentPassword: cur, newPassword: nw })
        toast.success("Password badal gaya")
        ;["pw-cur", "pw-new", "pw-conf"].forEach((id) => { const el = s.getElementById(id) as HTMLInputElement | null; if (el) el.value = "" })
        s.getElementById("pwform")?.classList.remove("on")
      } catch { toast.error("Password nahi badla — mojooda password check karein") }
      finally { if (btn) { btn.disabled = false; btn.textContent = "Password update karein" } }
    }

    s.addEventListener("click", (e) => {
      const t = e.target as HTMLElement
      if (t.closest("#pwtoggle")) { s.getElementById("pwform")?.classList.toggle("on"); return }
      if (t.closest("#pwsave")) { doPassword(); return }
      if (t.closest("#sbsave")) { doSave(); return }
      if (t.closest("#sbreset")) { const u = userRef.current; const wwc = s.getElementById("wwc"); if (u && wwc) { computeBaseline(u); wwc.innerHTML = buildContent(u); refreshDirty() } return }
    })
    s.addEventListener("input", (e) => { if ((e.target as HTMLElement).hasAttribute?.("data-field")) refreshDirty() })
    s.addEventListener("change", (e) => { if ((e.target as HTMLElement).hasAttribute?.("data-field")) refreshDirty() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default ProfileArtifact

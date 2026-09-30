/**
 * Booking journey — look at it, measure it, at every step, on desktop and phone.
 *
 * Usage:
 *   node scripts/qa/booking-journey.cjs [--base http://localhost:3001] [--venue 3358]
 *        [--email … --password …] [--out DIR] [--submit] [--headless]
 *
 * Why this exists: on 2026-09-29 a redesign shipped that scored perfectly on
 * every speed instrument and was invisible. Nothing here measures speed. It
 * walks the six steps as a customer would, and at each one records:
 *   - a viewport screenshot (what a person actually sees on arrival)
 *   - whether the DOCUMENT scrolls (it should not; the working panel may)
 *   - whether the Continue action is inside the viewport
 *   - large elements at opacity 0 that hold text (the outage signature)
 *   - overflow past the right edge
 * Then it does it again at 390×844.
 *
 * Contract with the UI (stable hooks, independent of the visual design):
 *   [data-booking-step="<key>"]       the working panel for the current step
 *   [data-booking-action="continue"]  the primary action
 *   [data-booking-action="back"]      the secondary action
 *   [data-booking-field="guestCount"] the guest number input
 * Everything else is driven by accessible roles/names, which the redesign must
 * keep anyway.
 */
const { chromium, devices } = require("playwright")
const fs = require("fs")
const path = require("path")

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d
}
const flag = (k) => process.argv.includes(`--${k}`)

const BASE = arg("base", "http://localhost:3001").replace(/\/$/, "")
const VENUE = arg("venue", "3358")
const EMAIL = arg("email", "muhammadrehmanyousaf7866@gmail.com")
const PASSWORD = arg("password", "mian@A12345")
const OUT = arg("out", path.join(process.cwd(), ".qa", "booking-journey"))
const SUBMIT = flag("submit")
const HEADLESS = flag("headless")
const STATE = path.join(OUT, "state.json")

fs.mkdirSync(OUT, { recursive: true })

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)

async function dismissConsent(p) {
  const ess = p.getByRole("button", { name: /essential only/i }).first()
  if (await ess.count()) await ess.click({ timeout: 2000 }).catch(() => {})
}

async function login(ctx) {
  const p = await ctx.newPage()
  await p.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 90000 })
  // A cold dev server compiles the login route on first hit and the form is
  // client-rendered; give it the time a cold compile takes, not a warm one.
  await p.waitForSelector('input[type="email"]', { timeout: 120000 })
  await p.waitForTimeout(1500)
  await dismissConsent(p)
  await p.fill('input[type="email"]', EMAIL)
  await p.fill('input[type="password"]', PASSWORD)
  await p.getByRole("button", { name: /sign in/i }).first().click()
  await p.waitForFunction(() => !!localStorage.getItem("auth_token") || !location.pathname.startsWith("/login"), null, { timeout: 30000 })
  await p.waitForTimeout(1500)
  const token = await p.evaluate(() => localStorage.getItem("auth_token"))
  if (!token) throw new Error("Login did not produce auth_token — aborting (vacuous-pass guard)")
  await ctx.storageState({ path: STATE })
  await p.close()
  log("logged in, session saved")
}

/** What a person sees, and the numbers behind it. */
async function measure(p, label, viewport) {
  // Let entrance keyframes finish first. A section that mounts when its data
  // arrives starts its 500ms fade then; measuring mid-fade reads as "hidden"
  // when nothing is. Infinite animations (the Stage's slow pan, a pulse) are
  // ignored — they never end.
  await p
    .waitForFunction(
      () =>
        document
          .getAnimations()
          .every((a) => a.playState !== "running" || a.effect?.getTiming?.().iterations === Infinity),
      null,
      { timeout: 4000 },
    )
    .catch(() => {})
  const m = await p.evaluate(() => {
    const vw = window.innerWidth, vh = window.innerHeight
    const doc = document.documentElement
    const panel = document.querySelector("[data-booking-step]")
    const cont = document.querySelector('[data-booking-action="continue"]')
    const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) } }
    const inView = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= vh && r.left >= 0 && r.right <= vw && r.width > 0 && r.height > 0 }
    // Hidden content: the outage signature. Large, holds text, opacity 0,
    // not a hover-reveal scrim.
    const hidden = []
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el)
      if (cs.opacity !== "0") continue
      const r = el.getBoundingClientRect()
      if (r.width < 120 || r.height < 40) continue
      if (!(el.textContent || "").trim()) continue
      if (/group-hover:opacity|hover:opacity/.test(el.className || "")) continue
      hidden.push({ tag: el.tagName, cls: String(el.className).slice(0, 80), w: Math.round(r.width), h: Math.round(r.height) })
    }
    // Overflow past the right edge — counted, and the first few named, so a
    // failure says which element rather than just that one exists.
    let overflow = 0
    const overflowEls = []
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect()
      if (r.right > vw + 1 && r.width > 8 && getComputedStyle(el).position !== "fixed") {
        overflow++
        if (overflowEls.length < 6) overflowEls.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")} right=${Math.round(r.right)}`)
      }
    }
    return {
      viewport: `${vw}x${vh}`,
      documentScrolls: doc.scrollHeight > vh + 1,
      documentHeight: doc.scrollHeight,
      step: panel ? panel.getAttribute("data-booking-step") : null,
      panel: rect(panel),
      panelScrolls: panel ? panel.scrollHeight > panel.clientHeight + 1 : null,
      panelOverflowPx: panel ? panel.scrollHeight - panel.clientHeight : null,
      continueInView: inView(cont),
      continueRect: rect(cont),
      hidden,
      overflow,
      overflowEls,
      h1: (document.querySelector("h1,h2") || {}).textContent?.trim().slice(0, 60) || null,
    }
  })
  const file = path.join(OUT, `${viewport}-${label}.png`)
  await p.screenshot({ path: file })
  m.screenshot = file
  // On the desk tiers the document must not scroll (the desk body does). On a
  // phone or tablet the document scrolls by design and the action bar is
  // pinned, so only the pinned button, hidden content and overflow count.
  const deskTier = (viewport.startsWith("1440") || viewport.startsWith("1366") || viewport.startsWith("1024")) && viewport !== "1366x640"
  // Arrival screens (request sent, bank transfer, success) have no Continue —
  // their own buttons act — so the pinned-button rule does not apply there.
  const arrival = ["sent", "bank", "success"].includes(m.step)
  const bad = (deskTier && m.documentScrolls) || (!arrival && !m.continueInView) || m.hidden.length || m.overflow
  log(`${viewport} ${label.padEnd(14)} ${bad ? "✗" : "✓"} docScroll=${m.documentScrolls} (${m.documentHeight}px) panelOverflow=${m.panelOverflowPx} continue=${m.continueInView} hidden=${m.hidden.length} overflow=${m.overflow}${m.overflow ? " → " + m.overflowEls.join(" | ") : ""}`)
  return m
}

async function clickContinue(p) {
  const btn = p.locator('[data-booking-action="continue"]').first()
  await btn.waitFor({ state: "visible", timeout: 15000 })
  await btn.click()
  await p.waitForTimeout(900)
}

async function walk(ctx, viewport) {
  const p = await ctx.newPage()
  const results = []
  await p.goto(`${BASE}/${VENUE}/booking`, { waitUntil: "domcontentloaded", timeout: 90000 })
  await p.waitForSelector("[data-booking-step]", { timeout: 60000 })
  await p.waitForTimeout(2500)
  await dismissConsent(p)
  // The TanStack Query devtools launcher exists only in development; hide it
  // so the screenshots show what a customer sees.
  await p.addStyleTag({ content: ".tsqd-open-btn-container{display:none !important}" }).catch(() => {})

  // A resumed draft would skip steps; discard it so every run walks the same road.
  const discard = p.getByRole("button", { name: /discard|start over|start fresh/i }).first()
  if (await discard.count()) { await discard.click().catch(() => {}); await p.waitForTimeout(600) }

  // 1 — event
  results.push(await measure(p, "s1-event", viewport))
  await p.getByRole("button", { name: /^Mehndi/i }).first().click()
  await p.waitForTimeout(400)
  results.push(await measure(p, "s1-event-picked", viewport))
  await clickContinue(p)

  // 2 — date & time
  await p.waitForSelector('[data-booking-step="datetime"]', { timeout: 30000 })
  await p.waitForTimeout(2500)
  results.push(await measure(p, "s2-date", viewport))
  // First enabled future day that is not disabled. Days are buttons labelled
  // "Weekday, Month D, YYYY" — the redesign must keep that.
  // The eighth bookable day, not the first: the first is usually today, and a
  // request for tonight is not a booking anyone would send.
  const days = p.locator('[data-booking-step="datetime"] button[aria-label*=", 20"]:not([disabled])')
  const dayCount = await days.count()
  const day = days.nth(Math.min(7, Math.max(0, dayCount - 1)))
  if (dayCount) { await day.scrollIntoViewIfNeeded(); await day.click(); await p.waitForTimeout(1200) }
  else log("!! no enabled day found")
  results.push(await measure(p, "s2-date-picked", viewport))
  // A slot: first enabled button inside the slots region, if the design marks it.
  const slot = p.locator('[data-booking-slots] button:not([disabled])').first()
  if (await slot.count()) { await slot.scrollIntoViewIfNeeded(); await slot.click(); await p.waitForTimeout(700) }
  else {
    const anySlot = p.getByRole("button", { name: /morning|afternoon|evening|day|night|\d{1,2}:\d{2}/i }).filter({ hasNot: p.locator("[aria-label*=', 20']") }).first()
    if (await anySlot.count()) { await anySlot.scrollIntoViewIfNeeded(); await anySlot.click(); await p.waitForTimeout(700) } else log("!! no slot found")
  }
  const guests = p.locator('[data-booking-field="guestCount"]').first()
  if (await guests.count()) { await guests.scrollIntoViewIfNeeded(); await guests.fill("250"); await p.waitForTimeout(400) }
  results.push(await measure(p, "s2-date-slot", viewport))
  await clickContinue(p)

  // 3 — packages (or whatever comes next; read the key)
  for (let i = 0; i < 6; i++) {
    await p.waitForTimeout(1500)
    const key = await p.evaluate(() => document.querySelector("[data-booking-step]")?.getAttribute("data-booking-step"))
    if (!key || key === "datetime") { log("!! did not advance from datetime"); break }
    results.push(await measure(p, `s${i + 3}-${key}`, viewport))
    if (key === "packages") {
      const pkg = p.locator('[data-booking-step="packages"] button[aria-pressed]').first()
      if (await pkg.count()) { await pkg.click(); await p.waitForTimeout(500) }
      results.push(await measure(p, `s${i + 3}-${key}-picked`, viewport))
    } else if (key === "menu") {
      const radio = p.locator('[data-booking-step="menu"] [role="radio"], [data-booking-step="menu"] button[aria-pressed]').first()
      if (await radio.count()) { await radio.click(); await p.waitForTimeout(500) }
      results.push(await measure(p, `s${i + 3}-${key}-picked`, viewport))
    } else if (key === "requirements") {
      const ta = p.locator('[data-booking-step="requirements"] textarea').first()
      if (await ta.count()) { await ta.fill("QA walk — please ignore. Stage on the garden side."); await p.waitForTimeout(300) }
    } else if (key === "review") {
      // One real request, on the desktop walk only — every submit lands in
      // the vendor's live queue.
      if (SUBMIT && viewport === "1440x900") {
        await clickContinue(p)
        await p.waitForSelector('[data-booking-step="sent"], [data-booking-step="bank"], [data-booking-step="success"]', { timeout: 60000 }).catch(() => {})
        await p.waitForTimeout(2500)
        results.push(await measure(p, "s7-after-submit", viewport))
      }
      break
    } else if (key === "success") {
      break
    }
    await clickContinue(p)
  }
  await p.close()
  return results
}

;(async () => {
  const browser = await chromium.launch({ headless: HEADLESS })
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await login(desktop)
  const desk = await walk(desktop, "1440x900")
  await desktop.close()

  const laptop = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, storageState: STATE })
  const lap = await walk(laptop, "1366x768")
  await laptop.close()

  // The narrowest split tier, and the release valve (a laptop with a
  // bookmarks bar and the taskbar, where the document is allowed to scroll).
  const extra = []
  if (flag("all")) {
    for (const [w, h] of [[1024, 768], [1366, 640]]) {
      const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, storageState: STATE })
      extra.push(...(await walk(c, `${w}x${h}`)))
      await c.close()
    }
  }

  const phone = await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, storageState: STATE })
  const mob = await walk(phone, "390x844")
  await phone.close()
  await browser.close()

  const all = [...desk, ...lap, ...extra, ...mob]
  const fails = all.filter((m) => {
    // Locked tiers: ≥1024 wide and ≥700 tall. The release valve (1366x640)
    // and the phone scroll the document by design.
    const locked = !m.viewport.startsWith("390") && !m.viewport.startsWith("1366x640")
    const arrival = ["sent", "bank", "success"].includes(m.step)
    return (locked && m.documentScrolls) || (!arrival && !m.continueInView) || m.hidden.length || m.overflow
  })
  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(all, null, 2))
  log(`done: ${all.length} screens, ${fails.length} with a problem → ${OUT}`)
  for (const f of fails) log("  ✗", f.viewport, path.basename(f.screenshot), { docScroll: f.documentScrolls, continue: f.continueInView, hidden: f.hidden.length, overflow: f.overflow })
  process.exit(fails.length ? 1 : 0)
})().catch((e) => { console.error(e); process.exit(2) })

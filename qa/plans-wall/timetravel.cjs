/**
 * The real backend (PL-A) on a shifted clock: the trial vendor, N days later. For every offset the lab backend is restarted
 * with FAKE_CLOCK_OFFSET_MS (tools/fake-clock.cjs shifts the backend's JS Date), the console is loaded and shot.
 *
 *   BE_SCRIPT=<the lab backend launcher (bash)> node qa/plans-wall/timetravel.cjs [w] [h] [tag] [filter]
 *
 * Needs: the vendor already in a running trial (qa/plans-wall/real.cjs), dev server :3011 -> proxy :5190 -> backend :5132.
 * Leaves the backend running at offset 0 (never leave it shifted).
 */
const { spawn, spawnSync } = require("child_process")
const L = require("./lib.cjs")

const BE = process.env.BE_SCRIPT
if (!BE) { console.error("set BE_SCRIPT to the lab backend launcher"); process.exit(1) }
const DAY = 86400e3

const STEPS = [
  { name: "tt-day0", days: 0, wait: "[data-testid=plan-chip]" },
  { name: "tt-t7", days: 23, wait: "[data-testid=plan-banners]" },
  { name: "tt-t3", days: 28, wait: "[data-testid=plan-banners]" },
  { name: "tt-t1", days: 29, wait: "[data-testid=plan-banners]" },
  { name: "tt-today", days: 30, wait: "[data-testid=plan-banners]" },
  { name: "tt-locked", days: 31, wait: "[data-testid=access-wall]" },
  { name: "tt-dormant", days: 125, wait: "[data-testid=access-wall]" },
]

function listenerPid(port) {
  const r = spawnSync("cmd", ["/c", `netstat -ano | findstr :${port} | findstr LISTENING`], { encoding: "utf8" })
  const m = /LISTENING\s+(\d+)/.exec(r.stdout || "")
  return m ? m[1] : null
}
async function restartBackend(offsetMs) {
  const old = listenerPid(5132)
  if (old) spawnSync("taskkill", ["/PID", old, "/T", "/F"])
  await new Promise((r) => setTimeout(r, 1500))
  const env = { ...process.env, FAKE_CLOCK_OFFSET_MS: String(offsetMs), BILLING_ENFORCE: "on", SUBSCRIPTION_TRIAL_DAYS: "30" }
  const child = spawn("bash", [BE, "32"], { env, detached: true, stdio: "ignore" })
  child.unref()
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 1000))
    if (listenerPid(5132)) { await new Promise((r) => setTimeout(r, 2500)); return }
  }
  throw new Error("backend did not come up")
}

;(async () => {
  const [w = "1536", h = "864", tag = "d1536", filter = ""] = process.argv.slice(2)
  const b = await L.launch()
  const ctx = await L.login(b, { width: +w, height: +h })
  try {
    for (const st of STEPS) {
      if (filter && !new RegExp(filter).test(st.name)) continue
      await restartBackend(st.days * DAY)
      const page = await ctx.newPage()
      const errors = []
      page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)))
      await page.addInitScript(() => { try { Object.keys(localStorage).filter((k) => k.startsWith("ww:plans:dismiss")).forEach((k) => localStorage.removeItem(k)) } catch {} })
      await page.goto(`${L.BASE}/dashboard/bookings`, { waitUntil: "domcontentloaded", timeout: 180000 })
      await page.waitForSelector(st.wait, { timeout: 120000 }).catch(() => console.log("  (never saw", st.wait, ")"))
      await page.waitForTimeout(1500)
      const info = await page.evaluate(() => {
        const q = (s) => document.querySelector(s)
        return { wall: q("[data-testid=access-wall]")?.getAttribute("data-variant") || null, banner: q("[data-kind]")?.getAttribute("data-kind") || null, chip: q("[data-testid=plan-chip]")?.textContent || null }
      })
      await L.shot(page, `${tag}-${st.name}`)
      console.log(st.name.padEnd(12), JSON.stringify(info), "errors:", errors.length ? errors.join(" | ") : "NONE")
      await page.close()
    }
  } finally {
    await restartBackend(0)
    await b.close()
  }
})().catch((e) => { console.error("FAILED", e); process.exit(1) })

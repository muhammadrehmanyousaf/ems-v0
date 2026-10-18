/**
 * PL-F font check: screenshots (1536 wide, headed) + computed font-family + the font faces the page really loaded, for
 * a public page, a vendor console page and a customer page, plus an injected specimen of every family / weight / style / subset.
 *   node qa/fonts/font-compare.cjs <tag> <frontendPort> <backendApi>        e.g.  before 3011 http://localhost:5135/api/v1
 * Writes <OUT>/<tag>-*.png and <OUT>/<tag>-fonts.json; `node qa/fonts/font-compare.cjs diff before after` compares the PNGs pixel by pixel.
 */
const { chromium } = require("playwright")
const fs = require("fs")
const path = require("path")
const OUT = process.env.OUT || "C:/Projects/WW-PAYMENT-TEST/regression/pl-f-evidence/fonts"
fs.mkdirSync(OUT, { recursive: true })

const SPECIMEN = `
<div id="font-specimen" style="position:fixed;inset:0;z-index:2147483647;background:#fff;color:#000;overflow:auto;padding:16px;width:1536px">
  <div class="font-sans" style="font-size:20px;line-height:1.35">
    <div style="font-weight:400">Inter 400 Wedding Wala venues in Lahore 0123456789 Rs 250,000 (ā ś ñ ł) Tiếng Việt</div>
    <div style="font-weight:500">Inter 500 Wedding Wala venues in Lahore 0123456789 Rs 250,000</div>
    <div style="font-weight:600">Inter 600 Wedding Wala venues in Lahore 0123456789 Rs 250,000</div>
    <div style="font-weight:700">Inter 700 Wedding Wala venues in Lahore 0123456789 Rs 250,000</div>
  </div>
  <div class="font-heading" style="font-size:26px;line-height:1.3;margin-top:8px">
    <div style="font-weight:400">Playfair 400 Dream wedding (ā ś Ł)</div><div style="font-weight:500">Playfair 500 Dream wedding</div>
    <div style="font-weight:600">Playfair 600 Dream wedding</div><div style="font-weight:700">Playfair 700 Dream wedding</div>
    <div style="font-weight:800">Playfair 800 Dream wedding</div><div style="font-weight:900">Playfair 900 Dream wedding</div>
    <div style="font-weight:400;font-style:italic">Playfair 400 italic Dream wedding (ā ś Ł)</div><div style="font-weight:700;font-style:italic">Playfair 700 italic Dream wedding</div>
    <div style="font-weight:900;font-style:italic">Playfair 900 italic Dream wedding</div>
  </div>
  <div class="font-bridal" style="font-size:20px;line-height:1.35;margin-top:8px">
    <div style="font-weight:300">DM Sans 300 Bridal collection (ā ś)</div><div style="font-weight:400">DM Sans 400 Bridal collection</div>
    <div style="font-weight:500">DM Sans 500 Bridal collection</div><div style="font-weight:600">DM Sans 600 (asks 600: 700 face today) Bridal collection</div>
    <div style="font-weight:700">DM Sans 700 Bridal collection</div>
  </div>
  <div class="font-nastaliq" dir="rtl" style="font-size:26px;line-height:2.2;margin-top:8px">
    <div style="font-weight:400">شادی ہال لاہور میں بکنگ ۰۱۲۳۴۵۶۷۸۹ Wedding Wala (ā)</div><div style="font-weight:700">شادی ہال لاہور میں بکنگ ۰۱۲۳۴۵۶۷۸۹</div>
  </div>
</div>`

async function login(browser, base, api, email, password = "localtestpassword") {
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 }, locale: "en-GB", timezoneId: "Asia/Karachi" })
  const p = await ctx.newPage()
  await p.goto(base + "/login", { waitUntil: "domcontentloaded", timeout: 180000 })
  await p.waitForSelector("input[type=email]", { timeout: 180000 })
  const ess = p.getByRole("button", { name: /essential only/i }).first()
  if (await ess.count()) await ess.click().catch(() => {})
  await p.fill("input[type=email]", email)
  await p.fill("input[type=password]", password)
  await p.press("input[type=password]", "Enter")
  await p.waitForFunction(() => !!localStorage.getItem("auth_token"), null, { timeout: 90000 })
  await p.waitForTimeout(1500)
  await p.close()
  return ctx
}

async function inspect(page, tag, name, outFonts) {
  await page.waitForTimeout(2500)
  await page.addStyleTag({ content: ".tsqd-open-btn-container,[data-nextjs-toast],nextjs-portal{display:none !important}" }).catch(() => {})
  const info = await page.evaluate(async () => {
    await document.fonts.ready
    const pick = (sel) => { const e = document.querySelector(sel); if (!e) return null; const c = getComputedStyle(e); return { fontFamily: c.fontFamily, fontWeight: c.fontWeight, fontSize: c.fontSize, fontStyle: c.fontStyle } }
    const faces = [...document.fonts].map((f) => ({ family: f.family.replace(/"/g, ""), weight: f.weight, style: f.style, status: f.status, range: (f.unicodeRange || "").slice(0, 30) }))
    return {
      url: location.pathname,
      body: pick("body"), h1: pick("h1"), h2: pick("h2"), button: pick("button"), p: pick("p"),
      vars: ["--font-inter", "--font-playfair", "--font-dm-sans", "--font-nastaliq"].map((v) => [v, getComputedStyle(document.body).getPropertyValue(v).trim().slice(0, 140)]),
      loadedFaces: faces.filter((f) => f.status === "loaded"),
      allFaceCount: faces.length,
    }
  })
  outFonts[name] = info
  await page.screenshot({ path: path.join(OUT, `${tag}-${name}.png`), fullPage: false })
  return info
}

async function specimen(page, tag, name, outFonts) {
  await page.evaluate((html) => { document.body.insertAdjacentHTML("beforeend", html) }, SPECIMEN)
  await page.evaluate(async () => { await document.fonts.load("400 20px Inter").catch(() => {}); await document.fonts.ready })
  await page.waitForTimeout(2500)
  const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family.replace(/"/g, "")}|${f.weight}|${f.style}`))
  outFonts[name + "-loaded"] = [...new Set(loaded)].sort()
  await page.screenshot({ path: path.join(OUT, `${tag}-${name}.png`) })
  await page.evaluate(() => document.getElementById("font-specimen")?.remove())
}

async function run(tag, fePort, api) {
  const base = `http://localhost:${fePort}`
  const browser = await chromium.launch({ headless: false })
  const fonts = {}
  const shots = [
    ["home", null, "/"],
    ["vendor-bookings", "vendor.ww-local-test-fixture@localhost.test", "/dashboard/bookings"],
    ["vendor-money", "vendor.ww-local-test-fixture@localhost.test", "/dashboard/money"],
    ["customer-bookings", "customer.ww-local-test-fixture@localhost.test", "/user/bookings"],
  ]
  for (const [name, email, url] of shots) {
    const ctx = email ? await login(browser, base, api, email) : await browser.newContext({ viewport: { width: 1536, height: 864 }, locale: "en-GB", timezoneId: "Asia/Karachi" })
    const page = await ctx.newPage()
    const errs = []
    page.on("console", (m) => { if (m.type() === "error" && /font|woff/i.test(m.text())) errs.push(m.text().slice(0, 160)) })
    const fontReq = []
    page.on("response", (r) => { if (/\.woff2?(\?|$)/.test(r.url())) fontReq.push(r.status() + " " + r.url().replace(base, "")) })
    await page.goto(base + url, { waitUntil: "domcontentloaded", timeout: 180000 })
    const ess = page.getByRole("button", { name: /essential only/i }).first()
    if (await ess.count()) await ess.click().catch(() => {})
    await inspect(page, tag, name, fonts)
    fonts[name].fontRequests = fontReq
    fonts[name].fontErrors = errs
    if (name === "home") await specimen(page, tag, "specimen", fonts)
    await ctx.close()
  }
  await browser.close()
  fs.writeFileSync(path.join(OUT, `${tag}-fonts.json`), JSON.stringify(fonts, null, 1))
  for (const [k, v] of Object.entries(fonts)) if (v && v.body) console.log(k, v.url, "| body:", v.body.fontFamily.slice(0, 90), "| h1:", v.h1 && v.h1.fontFamily.slice(0, 60), "| woff2 requests:", (v.fontRequests || []).length)
}

async function diff(a, b) {
  const sharp = require("sharp")
  for (const name of ["home", "vendor-bookings", "vendor-money", "customer-bookings", "specimen"]) {
    const fa = path.join(OUT, `${a}-${name}.png`), fb = path.join(OUT, `${b}-${name}.png`)
    if (!fs.existsSync(fa) || !fs.existsSync(fb)) { console.log(name, "missing"); continue }
    const A = await sharp(fa).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const B = await sharp(fb).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    if (A.info.width !== B.info.width || A.info.height !== B.info.height) { console.log(name, "SIZE DIFFERS", A.info, B.info); continue }
    let n = 0
    for (let i = 0; i < A.data.length; i += 4) if (A.data[i] !== B.data[i] || A.data[i + 1] !== B.data[i + 1] || A.data[i + 2] !== B.data[i + 2]) n++
    console.log(name, "differing pixels:", n, "of", A.info.width * A.info.height, (100 * n / (A.info.width * A.info.height)).toFixed(4) + "%")
  }
}

const [cmd, a, b] = process.argv.slice(2)
if (cmd === "diff") diff(a, b).catch((e) => { console.error(e); process.exit(1) })
else run(cmd, a || "3011", b || "http://localhost:5135/api/v1").catch((e) => { console.error(e); process.exit(1) })

const { chromium } = require("playwright")
;(async () => {
  const b = await chromium.launch({ headless: false })
  const p = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
  p.on("response", (r) => { if (/woff2/.test(r.url())) console.log(r.status(), r.url().split("/").pop()) })
  p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("console", m.type(), m.text().slice(0, 200)) })
  await p.goto("http://localhost:3011/", { waitUntil: "domcontentloaded" })
  await p.waitForTimeout(2500)
  const r = await p.evaluate(async () => {
    document.body.insertAdjacentHTML("beforeend", '<p id="u" class="font-nastaliq" style="font-size:30px">شادی ہال Wedding</p>')
    const e = document.getElementById("u")
    await new Promise((r) => setTimeout(r, 2500))
    const c = getComputedStyle(e)
    return { family: c.fontFamily, faces: [...document.fonts].filter((f) => /Nastaliq/.test(f.family)).map((f) => f.family + "|" + f.weight + "|" + f.status + "|" + f.unicodeRange.slice(0, 20)) }
  })
  console.log(JSON.stringify(r, null, 1))
  await b.close()
})()

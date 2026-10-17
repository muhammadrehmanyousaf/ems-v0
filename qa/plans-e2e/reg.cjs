// Register a brand-new vendor through the real registration endpoint (same one the web form posts to).
process.env.WW_API = "http://localhost:5134/api/v1"
const API = process.env.WW_API
const stamp = Date.now() % 1e8
const email = process.argv[2] || `ple.vendor.${stamp}@localhost.test`
;(async () => {
  const body = { name: `PLE Grand Marquee ${stamp}`, email, password: "Localtest#1234", fullName: "Ple Vendor", phoneNumber: "0311" + String(1000000 + (stamp % 8999999)), vendorType: "Wedding venue", subBusinessType: ["Banquet hall"], city: "Lahore", minimumPrice: 100000, maxCapacity: 500, minCapacity: 50, address: "Test road 1", isVendor: true, roleIds: "[]" }
  const r = await fetch(API + "/businesses/create-business-with-vendor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
  console.log(r.status, (await r.text()).slice(0, 600))
  console.log("EMAIL", email)
})()

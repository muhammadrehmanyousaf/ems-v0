// Simulates the render-time latch in header-avatar.tsx against the exact
// sequence the recording shows: a user whose `roles` disappears on a background
// refresh and comes back from localStorage, repeatedly.
const latch = { userId: null, value: false };
const compute = (u) => u ? (u.isVendor === true || u.isSuperAdmin === true ||
  !!u.roles?.some(r => r.id === 1 || r.id === 2 ||
    ["super admin","vendor","admin"].includes(String(r.name||"").toLowerCase()))) : false;
const render = (u) => {
  const now = compute(u);
  const id = u?.id ?? null;
  if (latch.userId !== id) { latch.userId = id; latch.value = false; }
  if (now) latch.value = true;
  return latch.value;
};

const rich = { id: 7, roles: [{ id: 2, name: "Vendor" }] };
const thin = { id: 7 };                       // /users/:id "plain DB user"
const other = { id: 99, roles: [] };          // a different account

const seq = [rich, thin, rich, thin, thin, rich, thin];
const out = seq.map(render);
console.log("flip sequence (rich/thin x7):", out.join(" "));
console.log(out.every(Boolean) ? "PASS — access never flickers off" : "FAIL — tree would swap");

console.log("different user  ->", render(other), "(expect false — latch resets)");
console.log("logged out      ->", render(null), "(expect false)");
console.log("back as vendor  ->", render(rich), "(expect true)");

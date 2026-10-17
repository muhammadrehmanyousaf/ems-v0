/**
 * Guard - WP34: a session ends in ONE way, and one password rule serves every screen that SETS a password.
 *
 * The defects (portal audit SETUP-035 / BOOKINGS-075 / MONEY-069 / CUSTOMER-060 / SETUP-036 / SETUP-039 /
 * SETUP-001 / CUSTOMER-026 / PUBLIC-006):
 *   - a 401 mid-session ran `localStorage.clear(); location = "/login"`. The auth COOKIES survived, middleware.ts
 *     read them as "signed in" and bounced /login back to /dashboard, which rendered nothing: a blank page only
 *     clearing cookies by hand could leave. clear() also deleted the unsent booking draft, the theme and consent;
 *   - Sign-out never told the server (the token stayed valid) and left the previous vendor's active-venue id behind;
 *   - the screens promised 6 or 8 characters while the server demanded 10 (and sign-in demanded 8).
 *
 * What this holds:
 *   1. lib/auth/session.ts, driven against a fake window + cookie jar: endSessionAndGoToLogin() removes all six auth
 *      keys from storage AND cookies and the active-venue scope, leaves a booking draft / theme / consent alone,
 *      navigates once to /login?redirect=<where they were>&reason=expired (and the redirect survives safeRedirect);
 *   2. lib/validation/password.ts answers the server's table (backend tests/unit/wp34PasswordAndShifts.test.js);
 *   3. the 401 branch of axiosConfig uses the shared helper and has no localStorage.clear(); the sign-in form no
 *      longer carries a password length rule; every setter screen uses the shared rule;
 *   4. middleware.ts lets /login?reason=expired through while a cookie is present, and still bounces plain /login.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/session-check.mts
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

let failures = 0;
const ok = (cond: boolean, label: string) => {
  if (cond) console.log(`  ok   ${label}`);
  else {
    failures++;
    console.log(`  FAIL ${label}`);
  }
};

// ─── a fake browser: storage, a cookie jar and a navigable location ──────────
const store = new Map<string, string>();
const localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
};
const jar = new Map<string, string>();
const documentFake = {
  get cookie() {
    return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  },
  set cookie(line: string) {
    const [pair, ...attrs] = line.split(";").map((s) => s.trim());
    const eq = pair.indexOf("=");
    const name = decodeURIComponent(pair.slice(0, eq));
    const value = pair.slice(eq + 1);
    const exp = attrs.find((a) => a.toLowerCase().startsWith("expires="));
    if (exp && new Date(exp.slice(8)).getTime() <= Date.now()) jar.delete(name);
    else jar.set(name, value);
  },
};
const navigations: string[] = [];
const events: string[] = [];
const windowFake: any = {
  localStorage,
  location: {
    pathname: "/dashboard/bookings",
    search: "?tab=2",
    assign: (u: string) => void navigations.push(u),
  },
  dispatchEvent: (e: { type: string }) => void events.push(e.type),
};
(globalThis as any).window = windowFake;
(globalThis as any).localStorage = localStorage;
(globalThis as any).document = documentFake;
(globalThis as any).CustomEvent = class { type: string; constructor(t: string) { this.type = t; } };

const session = await import("../lib/auth/session.ts");
const { safeRedirect } = await import("../lib/auth/safe-redirect.ts");
const { useActiveBusinessStore } = await import("../lib/store/active-business-store.ts");
const Cookies = (await import("js-cookie")).default;

// ─── 1. ending a session ─────────────────────────────────────────────────────
console.log("1. a session ends in one way");
const seed = () => {
  store.clear();
  jar.clear();
  navigations.length = 0;
  events.length = 0;
  session._resetEndingForTests();
  for (const k of session.AUTH_KEYS) {
    localStorage.setItem(k, "v-" + k);
    Cookies.set(k, "v-" + k, { expires: 1 });
  }
  localStorage.setItem("booking_draft_5", '{"step":3}');
  localStorage.setItem("theme", "dark");
  localStorage.setItem("cookie_consent", "granted");
  useActiveBusinessStore.setState({ activeBusinessId: 7 });
};
seed();
ok(session.hasAuthTrace(), "a seeded browser has an auth trace");
session.endSessionAndGoToLogin();
ok(session.AUTH_KEYS.every((k) => localStorage.getItem(k) === null), "every auth key is gone from localStorage");
ok(session.AUTH_KEYS.every((k) => Cookies.get(k) === undefined), "every auth key is gone from the cookies (the blank-dashboard loop's cause)");
ok(!session.hasAuthTrace(), "no auth trace is left");
ok(localStorage.getItem("ww-active-business") === null, "the persisted active-venue key is removed");
ok(useActiveBusinessStore.getState().activeBusinessId === null, "the in-memory active venue is reset");
ok(localStorage.getItem("booking_draft_5") === '{"step":3}', "the unsent booking draft survives (CUSTOMER-060)");
ok(localStorage.getItem("theme") === "dark" && localStorage.getItem("cookie_consent") === "granted", "theme and consent survive");
ok(navigations.length === 1, "exactly one navigation");
const dest = navigations[0] || "";
ok(dest.startsWith("/login?") && dest.includes("reason=expired"), "it goes to /login with reason=expired");
const back = new URL(dest, "http://x").searchParams.get("redirect");
ok(back === "/dashboard/bookings?tab=2", "it carries the page the person was on");
ok(safeRedirect(back) === "/dashboard/bookings?tab=2", "the login form's safeRedirect accepts that return path");
ok(events.includes("userLogout"), "it tells the rest of the app (userLogout)");
session.endSessionAndGoToLogin();
ok(navigations.length === 1, "ten parallel 401s navigate once");

windowFake.location.pathname = "/login";
windowFake.location.search = "";
session._resetEndingForTests();
navigations.length = 0;
session.endSessionAndGoToLogin();
ok(!(navigations[0] || "").includes("redirect="), "ending a session on /login never sets redirect=/login (that loops)");
windowFake.location.pathname = "/";
ok(session.expiredLoginUrl("//evil.example/x") === "/login?reason=expired", "a protocol-relative return path is dropped");
ok(session.expiredLoginUrl("https://evil.example/x") === "/login?reason=expired", "an absolute return path is dropped");
ok(session.expiredLoginUrl(null) === "/login?reason=expired", "no return path is fine");

// ─── 2. the password rule ────────────────────────────────────────────────────
console.log("2. one password rule");
const { checkPassword, passwordProblem } = await import("../lib/validation/password.ts");
// THE SAME TABLE as ems-v0-backend tests/unit/wp34PasswordAndShifts.test.js (server: src/utils/passwordPolicy.js)
const TABLE: Array<[string, boolean, string | null]> = [
  ["", false, "Password must be at least 10 characters"],
  ["abc123", false, "Password must be at least 10 characters"],
  ["Abcdefgh1", false, "Password must be at least 10 characters"],
  ["        ", false, "Password must be at least 10 characters"],
  ["ABCDEFGHIJK1", false, "Password must contain a lowercase letter"],
  ["abcdefghijkl", false, "Password must contain an uppercase letter, digit, or symbol"],
  ["1234567890", false, "Password must contain a lowercase letter"],
  ["Password123", false, "This password is too common — please choose another"],
  ["password123", false, "This password is too common — please choose another"],
  ["abcdefghi1", true, null],
  ["Abcdefghij", true, null],
  ["abcdefghi!", true, null],
  ["Old-pass-1234!", true, null],
];
for (const [pw, want, reason] of TABLE) {
  const r = checkPassword(pw);
  ok(r.ok === want && (r.ok || r.reason === reason), `checkPassword(${JSON.stringify(pw)}) -> ${want ? "ok" : reason}`);
}
ok(passwordProblem(undefined) === "Password is required", "a missing password is refused");
ok(passwordProblem("Old-pass-1234!") === null, "a compliant password has no problem");

// ─── 3. the screens ──────────────────────────────────────────────────────────
console.log("3. the screens use the shared helpers");
const axiosSrc = read("lib/axiosConfig.js");
ok(!/localStorage\.clear\(\)/.test(axiosSrc), "axiosConfig no longer calls localStorage.clear()");
ok(/endSessionAndGoToLogin\(\)/.test(axiosSrc) && /skipAuthRedirect/.test(axiosSrc), "axiosConfig ends the session through the shared helper");
const loginSrc = read("components/login-form.tsx");
ok(!/min\(8/.test(loginSrc) && /min\(1/.test(loginSrc), "the sign-in form has no password length rule (accounts with 6-7 characters exist)");
ok(/reason"\) === "expired"/.test(loginSrc) && /clearAuthStorage\(\)/.test(loginSrc), "the sign-in form clears stale cookies and says the session ended");
const SETTERS = [
  "components/user-registration-form.tsx",
  "components/reset-password-form.tsx",
  "components/claim/ClaimSetPasswordForm.tsx",
  "components/dashboard/mainScreens/settings/artifact/profile-artifact.tsx",
  "components/dashboard/mainScreens/settings/redesigned/account-settings-redesigned-view.tsx",
  "components/dashboard/mainScreens/users/redesigned/user-form-dialog.tsx",
  "app/(main)/user/settings/page.tsx",
  "app/(main)/user/profile/page.tsx",
];
for (const f of SETTERS) {
  const src = read(f);
  ok(/lib\/validation\/password/.test(src) && /passwordProblem\(/.test(src), `${f} uses the shared password rule`);
  ok(!/Min(imum)? [68] characters|at least [68] characters|length < [68]\b|length >= [68]\b/.test(src.replace(/vendor|business/gi, "")), `${f} states no 6/8 character rule of its own`);
}
const ctx = read("context/UserContext.tsx");
ok(/clearAuthStorage\(\)/.test(ctx) && /auth\/sessions\/\$\{encodeURIComponent\(jtiToRevoke\)\}\/revoke`/.test(ctx), "UserContext clears through the shared helper and revokes the session on sign-out");
const pr = read("lib/protected-routes.tsx");
ok(/clearAuthStorage\(\)/.test(pr) && /expiredLoginUrl\(/.test(pr) && !/return null/.test(pr) && /Redirecting/.test(pr), "ProtectedRoutes cleans stale cookies and never renders an empty page");

// ─── 4. middleware ───────────────────────────────────────────────────────────
console.log("4. middleware");
const mw = read("middleware.ts");
ok(/reason'\) === 'expired'/.test(mw) && /!sessionEnded/.test(mw), "middleware lets /login?reason=expired through while cookies are present");
ok(/pathname === '\/login' \|\| pathname === '\/register'\) && isAuthenticated/.test(mw), "middleware still bounces a signed-in visitor off plain /login");

console.log(failures ? `\n${failures} check(s) FAILED` : "\nall session checks passed");
process.exit(failures ? 1 : 0);

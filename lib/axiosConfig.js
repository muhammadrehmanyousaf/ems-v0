import axios from "axios";
import { BACKEND_URL } from './backend-url'
import { useActiveBusinessStore } from './store/active-business-store'

const instance = axios.create({
  baseURL: BACKEND_URL
});

// Per-venue scope. When the vendor picks a specific venue in the switcher, its
// businessId is auto-appended to business-scopable dashboard GETs so every module
// re-scopes without wiring each hook. null = "All venues" → no param → combined
// view (unchanged default). Whitelisted prefixes only; a few paths must NEVER be
// scoped (the switcher's own business list, user-level chat/notifications).
const BUSINESS_SCOPED_PREFIXES = [
  "/api/v1/bookings",
  "/api/v1/leads",
  "/api/v1/staff",
  "/api/v1/suppliers",
  "/api/v1/brokers",
  "/api/v1/generator",
  "/api/v1/expenses",
  "/api/v1/function-sheets",
  "/api/v1/pdcs",
  "/api/v1/receipts",
  "/api/v1/payments/vendor-revenue",
  "/api/v1/analytics/",
  /**
   * WWL-190 — `/api/v1/tax` was missing from this list, so all four venue
   * selections sent a byte-identical `tax/annual-report?year=2026&basis=fiscal`
   * with no businessId. A vendor selecting "Rehman Grand Marquee" read
   * Rs 14,349,700 gross revenue — the whole group's figure, three times that
   * venue's real Rs 4,888,250 — on the document they hand to an accountant.
   * The backend was never at fault: it scopes correctly and the three venues
   * partition to the group total exactly.
   *
   * WWL-243 — the same omission on `/api/v1/inventory`, where the venue
   * switcher did nothing and there is no venue column anywhere on the screen.
   *
   * Both verified to read `req.query.businessId` server-side before adding.
   * Prefixes whose controllers ignore it are deliberately NOT listed here —
   * an unread parameter is noise, and the venue-blindness on those screens is
   * a backend gap rather than a missing client parameter.
   */
  "/api/v1/tax",
  "/api/v1/inventory",
  /**
   * WWL-224 — `AutomationRule.businessId` was written on create and never read
   * back, so the venue switcher did nothing here: a vendor scoped to one venue
   * saw every venue's rules, including ones that message customers of a venue
   * they were not looking at. `listRules` reads it now (rules with a null
   * businessId are global and still shown), so the parameter is no longer noise.
   */
  "/api/v1/automation",
];
const BUSINESS_SCOPE_EXCLUDE = [
  "/api/v1/businesses/user-business", // feeds the switcher — must show ALL venues
  "/api/v1/chat",
  "/api/v1/notifications",
  "/api/v1/analytics/platform",          // super-admin, cross-vendor
  "/api/v1/analytics/vendor-performance", // super-admin, cross-vendor
];
function shouldBusinessScope(url) {
  if (!url) return false;
  if (BUSINESS_SCOPE_EXCLUDE.some((p) => url.includes(p))) return false;
  return BUSINESS_SCOPED_PREFIXES.some((p) => url.includes(p));
}

// Request Interceptor
instance.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem("auth_token") || (typeof window !== 'undefined' ? document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1] : null);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Auto-scope business-scopable dashboard GETs to the active venue.
    try {
      if (
        typeof window !== "undefined" &&
        (config.method || "get").toLowerCase() === "get" &&
        shouldBusinessScope(config.url)
      ) {
        const activeBusinessId = useActiveBusinessStore.getState().activeBusinessId;
        const alreadyHas =
          (typeof config.url === "string" && config.url.includes("businessId=")) ||
          (config.params && config.params.businessId != null);
        if (activeBusinessId != null && !alreadyHas) {
          config.params = { ...(config.params || {}), businessId: activeBusinessId };
        }
      }
    } catch (e) {
      /* non-fatal — fall back to unscoped */
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

/**
 * F1 / WWL-142, 159, 312, 333, 351, 370, 416, 435, 473, 492, 503, 556, 591,
 * 605, 606 — "the write failed and the product said it worked", 41 times.
 *
 * The backend's own convention is `{ status: boolean, message, data }`. A
 * handler that refuses a write answers `status: false` — and several of them do
 * it on an HTTP **200**, so axios resolved, the caller's `await` returned, and
 * the unconditional `toast.success` fired over an explicit server-side refusal.
 * Separately, until WWL-107 every unmatched path answered 200 with the API's
 * running banner, so a renamed route toasted success and wrote nothing.
 *
 * WWL-370 — the Reviews module is the clearest demonstration of the family and
 * is covered here, not at its three call sites: with writes diverted to the
 * catch-all, "Reply posted successfully", "Review deleted successfully" and
 * "Removed from silent list" all fired while nothing changed. None of the three
 * handlers inspected the response body; none of them needs to now.
 *
 * Rejecting here fixes the whole family at the transport layer rather than at 41
 * call sites, and every one of those call sites already has a `catch` that shows
 * an error toast — that code was simply unreachable.
 */
const API_BANNER = "Event Planner API is running";

function envelopeRefusal(response) {
  const body = response && response.data;
  if (!body || typeof body !== "object") return null;
  if (body.message === API_BANNER) {
    return "The server didn't recognise that request, so nothing was saved.";
  }
  if (body.status === false) {
    return body.message || "That didn't go through. Please try again.";
  }
  return null;
}

// Response Interceptor
instance.interceptors.response.use(
  function (response) {
    const refusal = envelopeRefusal(response);
    if (refusal) {
      const err = new Error(refusal);
      err.response = response;
      err.isEnvelopeRefusal = true;
      return Promise.reject(err);
    }
    return response;
  },
  function (error) {
    // An envelope refusal carries a 2xx response; it is not an auth failure and
    // must not be treated as one.
    if (error.isEnvelopeRefusal) return Promise.reject(error);

    if (error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data?.message || "";

      // Handle authentication failures — only clear session on true 401
      // (expired/invalid token). Do NOT clear on 400/403/404/500.
      if (status === 401) {
        // Only bounce to /login if the user actually HAD a session that just
        // expired/was rejected. A guest (no token) hitting an auth-gated
        // endpoint on a PUBLIC page (e.g. a vendor profile fetching booking
        // availability) must stay put — otherwise browsing any vendor page
        // boots them to /login. Guests just get the failed call rejected.
        const hadToken =
          typeof window !== "undefined" &&
          (localStorage.getItem("auth_token") ||
            document.cookie.split("; ").some((row) => row.startsWith("auth_token=")));
        if (hadToken && !window.location.pathname.includes("/login")) {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default instance;

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
  "/api/v1/payments/vendor-revenue",
  "/api/v1/analytics/",
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

// Response Interceptor
instance.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
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

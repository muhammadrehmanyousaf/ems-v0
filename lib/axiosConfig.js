import axios from "axios";
import { BACKEND_URL } from './backend-url'

const instance = axios.create({
  baseURL: BACKEND_URL
});

// Request Interceptor
instance.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem("auth_token") || (typeof window !== 'undefined' ? document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1] : null);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

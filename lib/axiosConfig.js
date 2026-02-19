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

      // Handle authentication failures (401) and deactivated accounts
      if (
        status === 401 ||
        errorMessage === "Please get your account activated"
      ) {
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default instance;

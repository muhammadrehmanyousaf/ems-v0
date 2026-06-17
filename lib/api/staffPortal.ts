// Staff Portal — Phase 2 FE API client.
//
// The staff portal runs on its OWN token (`staff_auth_token`) and its own axios
// instance, fully isolated from the vendor/customer `auth_token`. A staff
// session therefore never collides with a vendor/customer session on the same
// browser, and a staff token only ever unlocks /staff/* calls.
import axios from "axios";
import { BACKEND_URL } from "@/lib/backend-url";

const STAFF_TOKEN_KEY = "staff_auth_token";

export const staffAxios = axios.create({ baseURL: BACKEND_URL });

staffAxios.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const t = localStorage.getItem(STAFF_TOKEN_KEY);
    if (t) config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

staffAxios.interceptors.response.use(
  (r) => r,
  (error) => {
    if (
      error?.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.endsWith("/staff/login")
    ) {
      localStorage.removeItem(STAFF_TOKEN_KEY);
      window.location.href = "/staff/login";
    }
    return Promise.reject(error);
  },
);

export function getStaffToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(STAFF_TOKEN_KEY) : null;
}
export function clearStaffToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(STAFF_TOKEN_KEY);
}

export interface StaffProfile {
  id: number;
  fullName: string;
  role: string;
  businessId: number;
  businessName: string | null;
}

export interface MyShift {
  id: number;
  shiftDate: string;
  startTime: string | null;
  endTime: string | null;
  roleSnapshot: string | null;
  dihariRate: string | number | null;
  grossPayable: string | number | null;
  netPayable: string | number | null;
  paymentStatus: string;
  attendanceStatus: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  bookingId: number | null;
  businessId: number;
}

export const StaffPortalAPI = {
  /** Log in via the shared auth endpoint, but store the token under the staff key. */
  async login(email: string, password: string): Promise<StaffProfile> {
    const res = await axios.post(`${BACKEND_URL}api/v1/auth/login`, { email, password });
    const token = res.data?.data?.token;
    if (!token) throw new Error("Login failed");
    if (typeof window !== "undefined") localStorage.setItem(STAFF_TOKEN_KEY, token);
    return StaffPortalAPI.getMe();
  },

  logout(): void {
    clearStaffToken();
  },

  async getMe(): Promise<StaffProfile> {
    const res = await staffAxios.get("/api/v1/staff/me");
    return res.data.data as StaffProfile;
  },

  async getMyShifts(): Promise<MyShift[]> {
    const res = await staffAxios.get("/api/v1/staff/me/shifts");
    return (res.data?.data?.shifts || []) as MyShift[];
  },

  async checkIn(shiftId: number): Promise<MyShift> {
    const res = await staffAxios.post(`/api/v1/staff/me/shifts/${shiftId}/check-in`);
    return res.data?.data?.shift as MyShift;
  },

  async checkOut(shiftId: number): Promise<MyShift> {
    const res = await staffAxios.post(`/api/v1/staff/me/shifts/${shiftId}/check-out`);
    return res.data?.data?.shift as MyShift;
  },
};

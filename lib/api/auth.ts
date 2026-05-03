// 01-VR-ENHANCE-V1-FE — typed wrappers for the new auth endpoints.
// Existing /auth/login + /auth/signup keep using inline axios calls in the
// form components for now; new surfaces (verification, sessions, 2FA) live here.

import axiosInstance from "../axiosConfig"

export type LoginErrorCode =
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_DISABLED"
  | "ACCOUNT_DELETED"
  | "NO_ROLE"
  | "NO_PERMISSIONS"
  | "VALIDATION_FAILED"

export interface LoginFlags {
  emailVerified: boolean
  phoneVerified: boolean
  twoFactorEnabled: boolean
  reviewProfile: boolean
}

export interface LoginResponseData {
  user: any
  token: string
  jti?: string
  sessionId?: number
  flags?: LoginFlags
}

/** Wraps the standard apiResponse envelope. */
function unwrap<T>(res: any): T {
  return (res?.data?.data ?? null) as T
}

// ---------- Email verification ----------

export async function issueEmailVerification(): Promise<{ alreadyVerified: boolean }> {
  const res = await axiosInstance.post("/api/v1/auth/verify-email/issue", {})
  return unwrap<{ alreadyVerified: boolean }>(res) ?? { alreadyVerified: false }
}

export async function verifyEmail(code: string): Promise<void> {
  await axiosInstance.post("/api/v1/auth/verify-email", { code })
}

// ---------- Phone verification ----------

export async function issuePhoneVerification(phoneNumber?: string): Promise<void> {
  await axiosInstance.post("/api/v1/auth/verify-phone/issue", phoneNumber ? { phoneNumber } : {})
}

export async function verifyPhone(code: string): Promise<{ phoneE164: string }> {
  const res = await axiosInstance.post("/api/v1/auth/verify-phone", { code })
  return unwrap<{ phoneE164: string }>(res) ?? { phoneE164: "" }
}

// ---------- Sessions ----------

export interface ActiveSession {
  id: number
  jti: string
  createdAt: string
  lastSeenAt: string
  userAgent: string | null
  current: boolean
}

export async function listSessions(): Promise<ActiveSession[]> {
  const res = await axiosInstance.get("/api/v1/auth/sessions")
  return unwrap<{ sessions: ActiveSession[] }>(res)?.sessions ?? []
}

export async function revokeSession(jti: string): Promise<void> {
  await axiosInstance.post(`/api/v1/auth/sessions/${encodeURIComponent(jti)}/revoke`, {})
}

export async function revokeAllSessions(): Promise<{ revoked: number }> {
  const res = await axiosInstance.post("/api/v1/auth/sessions/revoke-all", {})
  return unwrap<{ revoked: number }>(res) ?? { revoked: 0 }
}

// ---------- 2FA ----------

export interface TwoFactorEnrolment {
  otpauth: string
  qrPng: string
  secret: string
}

export async function start2FAEnrolment(): Promise<TwoFactorEnrolment> {
  const res = await axiosInstance.post("/api/v1/auth/2fa/enroll", {})
  return unwrap<TwoFactorEnrolment>(res) as TwoFactorEnrolment
}

export async function confirm2FA(secret: string, token: string): Promise<void> {
  await axiosInstance.post("/api/v1/auth/2fa/confirm", { secret, token })
}

export async function disable2FA(token: string): Promise<void> {
  await axiosInstance.post("/api/v1/auth/2fa/disable", { token })
}

// ---------- Login error helper ----------

const LOGIN_MESSAGES: Record<LoginErrorCode, string> = {
  INVALID_CREDENTIALS: "Email or password is incorrect.",
  ACCOUNT_DISABLED: "Your account is deactivated. Please contact support.",
  ACCOUNT_DELETED: "This account no longer exists.",
  NO_ROLE: "Your account has no role assigned. Please contact support.",
  NO_PERMISSIONS: "You don't have permission to log in. Please contact support.",
  VALIDATION_FAILED: "Some of the details you entered are invalid.",
}

export function loginErrorMessage(error: any, fallback = "Something went wrong"): string {
  const code: string | undefined = error?.response?.data?.data?.code
  if (code && code in LOGIN_MESSAGES) return LOGIN_MESSAGES[code as LoginErrorCode]
  return error?.response?.data?.message || fallback
}

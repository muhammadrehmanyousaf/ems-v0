"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StaffPortalAPI } from "@/lib/api/staffPortal";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // WP34 (PUBLIC-017): the shared sign-in can ask for a second step (the e-mailed
  // 6-digit code, or an authenticator code). Revealed only when the server asks, so
  // an account that is not challenged sees exactly the old form.
  const [step, setStep] = useState<null | "emailOtp" | "totp">(null);
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await StaffPortalAPI.login(
        email.trim().toLowerCase(),
        password,
        step === "emailOtp" ? { emailOtp: code.trim() } : step === "totp" ? { totp: code.trim() } : undefined,
      );
      router.push("/staff/today");
    } catch (err: any) {
      const apiCode = err?.response?.data?.data?.code;
      if (apiCode === "EMAIL_OTP_REQUIRED" || apiCode === "EMAIL_OTP_INVALID") {
        setStep("emailOtp");
        setSentTo(err?.response?.data?.data?.sentTo || null);
        if (apiCode === "EMAIL_OTP_INVALID") setCode("");
      } else if (apiCode === "TWO_FACTOR_REQUIRED" || apiCode === "TWO_FACTOR_INVALID") {
        setStep("totp");
        if (apiCode === "TWO_FACTOR_INVALID") setCode("");
      }
      setError(
        err?.response?.data?.message ||
          "Could not sign in. Check your email and password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col justify-center">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-bridal-gold-dark">Wedding Wala</h1>
        <p className="mt-1 text-sm text-muted-foreground">Staff sign in</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="staff-email">
            Email
          </label>
          <Input
            id="staff-email"
            type="email"
            autoComplete="username"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12 text-base"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="staff-password">
            Password
          </label>
          <Input
            id="staff-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="h-12 text-base"
          />
        </div>

        {step && (
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="staff-code">
              {step === "emailOtp" ? "Code from your email" : "Authenticator code"}
            </label>
            <Input
              id="staff-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              placeholder="6-digit code"
              className="h-12 text-base"
            />
            {step === "emailOtp" && sentTo && (
              <p className="mt-1 text-xs text-muted-foreground">We sent a 6-digit code to {sentTo}.</p>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading || !email || !password || (step !== null && code.length !== 6)}
          className="h-12 w-full text-base"
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Your manager gives you this login. Trouble signing in? Ask them to reset it.
      </p>
    </div>
  );
}

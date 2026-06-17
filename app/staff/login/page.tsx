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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await StaffPortalAPI.login(email.trim().toLowerCase(), password);
      router.push("/staff/today");
    } catch (err: any) {
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

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading || !email || !password}
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

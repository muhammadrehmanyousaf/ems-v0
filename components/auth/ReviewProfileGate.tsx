"use client";

/**
 * Issue #1 — Vendor able to log in while profile is in review state.
 *
 * Background: the backend deliberately stopped blocking login on
 * `reviewProfile=false` (authController.js line 50–56) and shifted the
 * gate to the dashboard UX. The dashboard UX was never built, so today
 * a freshly-registered vendor signs in, hits a half-broken dashboard
 * (no business attached, empty tiles, errors on lead/booking modules),
 * and bounces in confusion.
 *
 * This gate closes that gap. When the logged-in user is a vendor AND
 * their `reviewProfile` flag is explicitly false, we render an
 * "Under Review" full-screen instead of the dashboard children. Super
 * admins and approved vendors fall through untouched.
 *
 * Design choices:
 *   * Soft gate — vendor stays logged in so they can sign out, check
 *     their email for status updates, contact support, etc. Hard
 *     blocking at the auth layer was rejected because a vendor who
 *     can't log in also can't see WHY.
 *   * Hides every navigation surface (sidebar already lives outside
 *     this gate at the layout level — see app/(dashboard)/dashboard/
 *     layout.tsx — so we deliberately render an inline full-screen
 *     panel that overlays the dashboard content area).
 *   * Sign-out is the one action available; everything else is gated
 *     until super admin flips reviewProfile to true.
 */

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { ShieldCheck, Clock, Mail, LogOut, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewProfileGateProps {
  children: React.ReactNode;
}

export function ReviewProfileGate({ children }: ReviewProfileGateProps) {
  const { user, flags, logout } = useUser();
  const router = useRouter();

  // Super admins always pass through.
  const isSuperAdmin =
    user?.isSuperAdmin === true ||
    user?.roles?.some(
      (r: any) => r?.id === 1 || String(r?.name || "").toLowerCase() === "super admin",
    );
  if (isSuperAdmin) return <>{children}</>;

  // Non-vendor accounts (e.g. customers) shouldn't see the gate either.
  const isVendor =
    user?.isVendor === true ||
    user?.roles?.some(
      (r: any) => r?.id === 2 || String(r?.name || "").toLowerCase() === "vendor",
    );
  if (!isVendor) return <>{children}</>;

  // ONLY block when the BE-supplied reviewProfile flag is explicitly false.
  // Grandfathered users (no flag, or flag === true) pass through to match
  // the BE's behaviour (see authController.js line 55). If flags is null
  // for any reason (e.g. session restored without the soft-flags blob),
  // default to "approved" — safer than locking a legitimate vendor out
  // of their own dashboard on a transient cache miss.
  if (!flags || flags.reviewProfile !== false) return <>{children}</>;

  const handleSignOut = async () => {
    try {
      await logout?.();
    } finally {
      router.replace("/login");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        <div className="bg-bridal-cream/90 border border-bridal-gold/40 rounded-2xl shadow-[0_8px_24px_-20px_rgba(176,125,84,0.45)] p-8 sm:p-10 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-bridal-gold/15 border-2 border-bridal-gold/50 flex items-center justify-center">
            <Clock className="w-8 h-8 text-bridal-gold" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display italic text-2xl sm:text-3xl text-bridal-charcoal">
              Your profile is{" "}
              <span className="text-bridal-gold">under review</span>
            </h1>
            <p className="font-bridal text-bridal-text-soft text-sm sm:text-base leading-relaxed">
              Thanks for signing up with Wedding Wala. Our team is reviewing your
              business details to make sure everything's ready for couples to
              discover you. This usually takes <strong>1–2 business days</strong>.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-left text-[13px] text-bridal-text">
            <div className="bg-white/60 rounded-md border border-bridal-beige px-3 py-2.5 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-bridal-sage mt-0.5 flex-shrink-0" />
              <span>
                We verify your business details, photos, and packages so couples
                see only trusted vendors.
              </span>
            </div>
            <div className="bg-white/60 rounded-md border border-bridal-beige px-3 py-2.5 flex items-start gap-2">
              <Mail className="w-4 h-4 text-bridal-gold mt-0.5 flex-shrink-0" />
              <span>
                We'll email you at{" "}
                <strong className="break-all">{user?.email || "your registered address"}</strong>{" "}
                the moment your profile goes live.
              </span>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <p className="text-xs text-bridal-text-soft">
              Need to make changes or have a question?{" "}
              <a
                href="mailto:support@weddingwala.pk"
                className="text-bridal-gold hover:underline font-medium"
              >
                support@weddingwala.pk
              </a>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-bridal-beige"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Sign out
            </Button>
          </div>
        </div>

        <p className="text-center mt-4 text-[11px] text-bridal-text-soft font-bridal inline-flex items-center gap-1.5 justify-center w-full">
          <Heart className="w-3 h-3 text-bridal-gold" />
          Wedding Wala — Pakistan's wedding marketplace
        </p>
      </div>
    </div>
  );
}

"use client";

/**
 * Shaadi Plan polish — couple portal share card (reconciliation).
 *
 * Surfaces the umbrella's Phase-4 couple portal (a read-only, no-login
 * wedding page at `/wedding/:token`) on the plan builder so the plan is a
 * SUPERSET of the legacy umbrella view rather than a sibling. A plan IS a
 * WeddingUmbrella under the hood, so this reuses `WeddingUmbrellasAPI`
 * against the SAME id — no backend contract change.
 *
 * The detail endpoints don't echo the current token to the client, so the
 * card is generate-on-demand: the owner clicks to mint a fresh private
 * link, copies it, and can rotate/revoke it. Rotating invalidates any
 * previously shared link — the copy makes that explicit.
 *
 * Self-contained + only rendered by already-flag-gated surfaces, so it
 * never affects legacy screens.
 */

import * as React from "react";
import {
  Share2,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Link2Off,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SectionCard } from "@/components/user-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  WeddingUmbrellasAPI,
  type PortalTokenResult,
} from "@/lib/api/weddingUmbrellas";

interface CouplePortalCardProps {
  /** Umbrella/plan id — same row, same id. */
  umbrellaId: number;
}

function portalUrl(token: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/wedding/${token}`;
}

function fmtExpiry(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function CouplePortalCard({ umbrellaId }: CouplePortalCardProps) {
  const [issued, setIssued] = React.useState<PortalTokenResult | null>(null);
  const [working, setWorking] = React.useState(false);
  const [revoking, setRevoking] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const url = issued ? portalUrl(issued.token) : "";

  const issue = async () => {
    setWorking(true);
    try {
      const res = await WeddingUmbrellasAPI.issuePortalToken(umbrellaId);
      setIssued(res);
      setCopied(false);
      toast({
        title: issued ? "New link created" : "Share link ready",
        description: issued
          ? "Your previous link no longer works."
          : "Copy it and send it to your partner or family.",
      });
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (e as Error)?.message ||
        "Couldn't create a share link";
      toast({ title: "Couldn't share", description: msg, variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  const revoke = async () => {
    setRevoking(true);
    try {
      await WeddingUmbrellasAPI.revokePortalToken(umbrellaId);
      setIssued(null);
      setCopied(false);
      toast({
        title: "Link revoked",
        description: "The shared wedding page can no longer be opened.",
      });
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (e as Error)?.message ||
        "Couldn't revoke the link";
      toast({ title: "Couldn't revoke", description: msg, variant: "destructive" });
    } finally {
      setRevoking(false);
    }
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Select the link and copy it manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <SectionCard
      title="Share with the couple & family"
      description="A private, read-only link to every function, vendor and payment — no login needed."
    >
      {!issued ? (
        <div className="space-y-3">
          <p className="text-xs text-bridal-text-soft leading-relaxed">
            Send your partner and family one link that shows the whole
            wedding — dates, vendors, contracts and what&apos;s paid. They
            can view it on WhatsApp without signing in.
          </p>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={issue}
            disabled={working}
          >
            {working ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
            Create a shareable link
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={url}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              className="h-9 text-xs font-mono bg-bridal-cream"
              aria-label="Couple portal link"
            />
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5"
              onClick={copy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-[#3F6B43]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-bridal-gold-dark hover:text-bridal-charcoal"
            >
              <ExternalLink className="h-3 w-3" />
              Preview the page
            </a>
            {issued.expiresAt && (
              <span className="text-[11px] text-bridal-text-soft">
                Works until {fmtExpiry(issued.expiresAt)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-bridal-beige/70">
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-bridal-text-soft hover:text-bridal-charcoal"
              onClick={issue}
              disabled={working}
            >
              {working ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Regenerate
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-bridal-text-soft hover:text-bridal-coral"
              onClick={revoke}
              disabled={revoking}
            >
              {revoking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2Off className="h-3.5 w-3.5" />
              )}
              Revoke
            </Button>
          </div>
          <p className="text-[10.5px] text-bridal-text-soft italic leading-relaxed">
            Regenerating creates a fresh link and stops the previous one
            from working.
          </p>
        </div>
      )}
    </SectionCard>
  );
}

export default CouplePortalCard;

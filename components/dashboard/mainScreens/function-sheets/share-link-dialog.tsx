'use client';

/**
 * Share-link dialog — issues a public customer-share token for a
 * Function Sheet and surfaces the URL the vendor sends via WhatsApp
 * or email. Customer opens it, reviews the sheet, signs in-browser,
 * no login required.
 *
 * State:
 *   - First open OR no live token → "Generate share link" button
 *   - Live token → URL with copy / open / share-via-WhatsApp /
 *     re-issue / revoke actions
 *   - Expired or revoked → "Re-issue" button (rotates token)
 */

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Loader2,
  Share2,
  Copy,
  ExternalLink,
  MessageSquare,
  RotateCw,
  Ban,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  FunctionSheetAPI,
  type FunctionSheet,
} from '@/lib/api/functionSheets';

interface ShareLinkDialogProps {
  sheet: FunctionSheet | null;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => Promise<void> | void;
}

function buildShareUrl(token: string): string {
  if (typeof window === 'undefined') return `/sign/${token}`;
  return `${window.location.origin}/sign/${token}`;
}

function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const t = new Date(iso).getTime();
    const diff = Math.round((t - Date.now()) / 1000);
    if (diff > 86400) return `in ${Math.round(diff / 86400)}d`;
    if (diff > 3600) return `in ${Math.round(diff / 3600)}h`;
    if (diff > 60) return `in ${Math.round(diff / 60)}m`;
    if (diff > -60) return 'now';
    if (diff > -3600) return `${Math.abs(Math.round(diff / 60))}m ago`;
    if (diff > -86400) return `${Math.abs(Math.round(diff / 3600))}h ago`;
    return `${Math.abs(Math.round(diff / 86400))}d ago`;
  } catch {
    return iso;
  }
}

export function ShareLinkDialog({
  sheet,
  onOpenChange,
  onSaved,
}: ShareLinkDialogProps) {
  const [busy, setBusy] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState('30');
  const [issuedToken, setIssuedToken] = useState<{
    token: string;
    issuedAt: string;
    expiresAt: string;
  } | null>(null);

  useEffect(() => {
    // When the dialog opens with an existing live token on the row,
    // pre-populate the issuedToken so the vendor sees the URL right
    // away (no re-issue needed unless they want to rotate).
    if (sheet) {
      const live =
        sheet.customerShareToken &&
        !sheet.shareTokenRevokedAt &&
        (!sheet.shareTokenExpiresAt ||
          new Date(sheet.shareTokenExpiresAt) > new Date());
      if (live) {
        setIssuedToken({
          token: sheet.customerShareToken!,
          issuedAt: sheet.shareTokenIssuedAt!,
          expiresAt: sheet.shareTokenExpiresAt!,
        });
      } else {
        setIssuedToken(null);
      }
    }
  }, [sheet]);

  if (!sheet) return null;

  const handleIssue = async () => {
    setBusy(true);
    try {
      const days = Math.max(1, Math.min(365, Number(expiresInDays) || 30));
      const res = await FunctionSheetAPI.issueShareToken(sheet.id, days);
      setIssuedToken({
        token: res.token,
        issuedAt: res.issuedAt,
        expiresAt: res.expiresAt,
      });
      toast.success(
        `Share link ready · expires ${new Date(res.expiresAt).toLocaleDateString('en-PK')}`,
      );
      if (onSaved) await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not issue share token');
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    setBusy(true);
    try {
      await FunctionSheetAPI.revokeShareToken(sheet.id);
      setIssuedToken(null);
      toast.success('Share link revoked');
      if (onSaved) await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not revoke');
    } finally {
      setBusy(false);
    }
  };

  const url = issuedToken ? buildShareUrl(issuedToken.token) : '';

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied');
    } catch {
      toast.error('Could not copy — long-press the URL to copy manually');
    }
  };

  const waMessage = useMemo(() => {
    if (!url) return '';
    const name = sheet.customerName || 'there';
    const title = sheet.title || 'your event';
    return [
      `Assalam-o-Alaikum ${name},`,
      ``,
      `Please review and sign the ${title} contract here:`,
      url,
      ``,
      `Link expires ${new Date(issuedToken?.expiresAt || Date.now()).toLocaleDateString('en-PK')}.`,
      `Wedding Wala vendor`,
    ].join('\n');
  }, [url, sheet, issuedToken]);

  const handleWhatsappShare = () => {
    if (!waMessage) return;
    // wa.me works for web + mobile + desktop. Vendor picks the contact
    // OR uses the customer's number from the row.
    const phone = (sheet.customerPhone || '').replace(/[^\d+]/g, '');
    const base = phone
      ? `https://wa.me/${phone.replace(/^\+/, '')}`
      : 'https://wa.me/';
    const url = `${base}?text=${encodeURIComponent(waMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={!!sheet} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Customer share link
          </DialogTitle>
          <DialogDescription>
            For customers who can't come to the office to sign — overseas
            family, different city, parents who handle bookings on the
            bride+groom's behalf. They open the link, see a clean view of
            the sheet, and sign in-browser (no login).
          </DialogDescription>
        </DialogHeader>

        {!issuedToken ? (
          <div className="space-y-3">
            <div className="rounded-md border border-blue-200 bg-blue-50/40 px-3 py-2 text-xs text-blue-900">
              <AlertTriangle className="mr-1 inline h-3 w-3" />
              No active share link. Generating one creates a public,
              token-based URL anyone with the link can use to view + sign.
              Old tokens die instantly if you re-issue.
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Expires in
              </label>
              <Select
                value={expiresInDays}
                onValueChange={(v) => setExpiresInDays(v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days (default)</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md border border-emerald-300 bg-emerald-50/50 px-3 py-2 text-xs text-emerald-900">
              <CheckCircle2 className="mr-1 inline h-3 w-3" />
              Active share link. Expires{' '}
              <strong>
                {new Date(issuedToken.expiresAt).toLocaleString('en-PK')}
              </strong>{' '}
              ({fmtRelative(issuedToken.expiresAt)}).
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Share URL
              </label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={url}
                  className="font-mono text-xs"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  <Copy className="mr-1 h-3 w-3" />
                  Copy
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(url, '_blank')}
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleWhatsappShare}
                  className="border-emerald-300 text-emerald-800"
                >
                  <MessageSquare className="mr-1 h-3 w-3" />
                  Share on WhatsApp
                </Button>
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  Issued {new Date(issuedToken.issuedAt).toLocaleDateString('en-PK')}
                </Badge>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2">
          {issuedToken && (
            <Button
              variant="outline"
              onClick={handleRevoke}
              disabled={busy}
              className="text-rose-700"
            >
              <Ban className="mr-1 h-3 w-3" />
              Revoke
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Close
          </Button>
          <Button onClick={handleIssue} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {issuedToken ? (
              <>
                <RotateCw className="mr-1 h-3 w-3" />
                Re-issue (rotates)
              </>
            ) : (
              <>
                <Share2 className="mr-1 h-3 w-3" />
                Generate link
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

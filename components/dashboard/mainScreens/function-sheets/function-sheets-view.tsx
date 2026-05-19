'use client';

/**
 * Vendor Portal Phase 1 #7.1 — Function Sheet view (FE).
 *
 * Layer 1 backend shipped earlier; this is the FE surface pairing
 * with Layer 2 PDF generation + composer dialog.
 *
 * Surfaces:
 *   - 9-pill state summary (draft / quote_sent / ... / paid / archived / cancelled)
 *   - State filter pills + booking-id filter + event date range
 *   - "New function sheet" button → opens composer with empty form
 *   - Per-sheet card showing morphing-doc identity (which face it's
 *     in now) + customer + event + grandTotal + sentAt/signedAt/
 *     invoicedAt/paidAt timeline + variant-aware "PDF" button
 *     dropdown
 *   - Transition action buttons (forward arrows for happy-path moves)
 *   - Edit button (non-terminal sheets) → opens composer with row data
 *   - Cancel button
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axiosConfig';
import {
  Loader2,
  FileText,
  Filter,
  Calendar,
  Phone,
  Building,
  Trash2,
  ArrowRight,
  Download,
  ExternalLink,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Plus,
  PenLine,
  MessageSquare,
  Share2,
  Activity,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import {
  FunctionSheetAPI,
  STATE_LABELS,
  PDF_VARIANT_LABELS,
  STATE_TONES,
  variantsAvailable,
  type FunctionSheet,
  type FunctionSheetState,
  type FunctionSheetSummary,
  type PdfVariant,
} from '@/lib/api/functionSheets';
import { FunctionSheetComposer } from './function-sheet-composer';
import { SignDialog, type SignSide } from './sign-dialog';
import { SendWhatsappDialog } from './send-whatsapp-dialog';
import { ShareLinkDialog } from './share-link-dialog';
import { ActivityDialog } from './activity-dialog';

interface VendorBusinessOption {
  id: number;
  name: string;
}

function fmtPKR(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `Rs. ${Math.round(x).toLocaleString('en-PK')}`;
}
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// Forward-only happy path → next states the vendor can pick.
const NEXT_STATES: Record<FunctionSheetState, FunctionSheetState[]> = {
  draft: ['quote_sent'],
  quote_sent: ['contract_pending'],
  contract_pending: ['signed'],
  signed: ['beo_ready'],
  beo_ready: ['invoiced'],
  invoiced: ['paid'],
  paid: ['archived'],
  archived: [],
  cancelled: [],
};

export default function FunctionSheetsView() {
  const [sheets, setSheets] = useState<FunctionSheet[]>([]);
  const [summary, setSummary] = useState<FunctionSheetSummary>({
    byState: {},
    totalGrand: 0,
  });
  const [businesses, setBusinesses] = useState<VendorBusinessOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<FunctionSheetState | 'all'>(
    'all',
  );
  const [bookingFilter, setBookingFilter] = useState('');
  const [eventFrom, setEventFrom] = useState('');
  const [eventTo, setEventTo] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editSheet, setEditSheet] = useState<FunctionSheet | null>(null);
  const [signTarget, setSignTarget] = useState<{
    sheet: FunctionSheet;
    side: SignSide;
  } | null>(null);
  const [whatsappTarget, setWhatsappTarget] = useState<{
    sheet: FunctionSheet;
    variant?: PdfVariant;
  } | null>(null);
  const [shareSheet, setShareSheet] = useState<FunctionSheet | null>(null);
  const [activitySheet, setActivitySheet] = useState<FunctionSheet | null>(
    null,
  );
  const [cancelSheet, setCancelSheet] = useState<FunctionSheet | null>(null);
  const [deleteSheet, setDeleteSheet] = useState<FunctionSheet | null>(null);

  useEffect(() => {
    axiosInstance
      .get('/api/v1/businesses/user-business')
      .then((res) => {
        const list = res.data?.data;
        const arr = Array.isArray(list) ? list : list?.data || [];
        setBusinesses(
          arr.map((b: any) => ({ id: b.id, name: b.name || `Business #${b.id}` })),
        );
      })
      .catch(() => {});
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await FunctionSheetAPI.list({
        state: stateFilter === 'all' ? undefined : stateFilter,
        bookingId: bookingFilter ? Number(bookingFilter) : undefined,
        eventFrom: eventFrom || undefined,
        eventTo: eventTo || undefined,
      });
      setSheets(res.functionSheets);
      setSummary(res.summary);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load function sheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFilter, eventFrom, eventTo]);

  useEffect(() => {
    const id = setTimeout(() => fetchAll(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingFilter]);

  const handleTransition = async (
    sheet: FunctionSheet,
    to: FunctionSheetState,
  ) => {
    setBusy(sheet.id);
    try {
      await FunctionSheetAPI.transition(sheet.id, { to });
      toast.success(`Moved to ${STATE_LABELS[to]}`);
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || `Transition refused`);
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelSheet) return;
    setBusy(cancelSheet.id);
    try {
      await FunctionSheetAPI.transition(cancelSheet.id, { to: 'cancelled' });
      toast.success('Sheet cancelled');
      setCancelSheet(null);
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not cancel');
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteSheet) return;
    setBusy(deleteSheet.id);
    try {
      await FunctionSheetAPI.remove(deleteSheet.id);
      toast.success('Sheet removed');
      setDeleteSheet(null);
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not remove');
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = async (
    sheet: FunctionSheet,
    variant: PdfVariant,
    mode: 'preview' | 'download',
  ) => {
    setBusy(sheet.id);
    try {
      const blob = await FunctionSheetAPI.pdfBlob(sheet.id, variant);
      const url = window.URL.createObjectURL(blob);
      if (mode === 'preview') {
        window.open(url, '_blank');
        // Revoke after a delay so the browser tab has time to load.
        setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${PDF_VARIANT_LABELS[variant]
          .replace(/[^a-z0-9-]+/gi, '-')
          .toLowerCase()}-${sheet.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || 'Could not generate PDF',
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted-foreground">
          One Smart File per booking. The same row morphs into
          Quote → Contract → BEO → Invoice → Receipt as you advance
          the state. Print a PDF in any variant the current state has
          unlocked.
        </p>
        <Button onClick={() => setComposerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New function sheet
        </Button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {(Object.keys(STATE_LABELS) as FunctionSheetState[]).map((s) => {
          const tone = STATE_TONES[s];
          const count = summary.byState[s] || 0;
          const active = stateFilter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStateFilter(active ? 'all' : s)}
              className={`rounded-md border px-2 py-1.5 text-left transition ${
                active
                  ? `${tone.border} ${tone.bg} ${tone.text}`
                  : 'border-neutral-200 bg-white hover:bg-neutral-50'
              }`}
            >
              <div className="text-[10px] font-medium uppercase tracking-wide">
                {STATE_LABELS[s]}
              </div>
              <div className="text-base font-semibold">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Total card */}
      {summary.totalGrand > 0 && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          <span className="font-semibold">{fmtPKR(summary.totalGrand)}</span>{' '}
          total grand-value across all visible sheets.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Quick:
          </span>
          <button
            type="button"
            onClick={() => setStateFilter('all')}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              stateFilter === 'all'
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            All
          </button>
        </div>
        <div className="ml-auto flex flex-wrap items-end gap-2">
          <div>
            <label className="text-[11px] text-muted-foreground">
              Booking #
            </label>
            <Input
              type="number"
              value={bookingFilter}
              onChange={(e) => setBookingFilter(e.target.value)}
              placeholder="e.g. 42"
              className="w-28"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">
              Event from
            </label>
            <Input
              type="date"
              value={eventFrom}
              onChange={(e) => setEventFrom(e.target.value)}
              className="w-36"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">
              Event to
            </label>
            <Input
              type="date"
              value={eventTo}
              onChange={(e) => setEventTo(e.target.value)}
              className="w-36"
            />
          </div>
          {(bookingFilter || eventFrom || eventTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBookingFilter('');
                setEventFrom('');
                setEventTo('');
              }}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Sheets list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : sheets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No function sheets in this view. Click{' '}
              <strong>New function sheet</strong> above to start a Smart
              File with line items, terms, and a payment schedule.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sheets.map((s) => (
            <SheetCard
              key={s.id}
              sheet={s}
              busy={busy === s.id}
              onTransition={(to) => handleTransition(s, to)}
              onEdit={() => setEditSheet(s)}
              onSign={(side) => setSignTarget({ sheet: s, side })}
              onCancel={() => setCancelSheet(s)}
              onDelete={() => setDeleteSheet(s)}
              onPdf={(variant, mode) => handlePdf(s, variant, mode)}
              onWhatsapp={(variant) =>
                setWhatsappTarget({ sheet: s, variant })
              }
              onShare={() => setShareSheet(s)}
              onActivity={() => setActivitySheet(s)}
            />
          ))}
        </div>
      )}

      <FunctionSheetComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        businesses={businesses}
        onSaved={async () => {
          setComposerOpen(false);
          await fetchAll();
        }}
      />

      <FunctionSheetComposer
        open={!!editSheet}
        onOpenChange={(o) => !o && setEditSheet(null)}
        businesses={businesses}
        sheet={editSheet || undefined}
        onSaved={async () => {
          setEditSheet(null);
          await fetchAll();
        }}
      />

      <SignDialog
        sheet={signTarget?.sheet ?? null}
        side={signTarget?.side ?? 'vendor'}
        onOpenChange={(o) => !o && setSignTarget(null)}
        onSaved={async () => {
          setSignTarget(null);
          await fetchAll();
        }}
      />

      <SendWhatsappDialog
        sheet={whatsappTarget?.sheet ?? null}
        initialVariant={whatsappTarget?.variant}
        onOpenChange={(o) => !o && setWhatsappTarget(null)}
        onSent={async () => {
          setWhatsappTarget(null);
          await fetchAll();
        }}
      />

      <ShareLinkDialog
        sheet={shareSheet}
        onOpenChange={(o) => !o && setShareSheet(null)}
        onSaved={fetchAll}
      />

      <ActivityDialog
        sheet={activitySheet}
        onOpenChange={(o) => !o && setActivitySheet(null)}
      />

      <AlertDialog
        open={!!cancelSheet}
        onOpenChange={(o) => !o && setCancelSheet(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this function sheet?</AlertDialogTitle>
            <AlertDialogDescription>
              The sheet flips to <strong>cancelled</strong> (terminal).
              Existing PDFs already printed for the customer remain valid
              historical records; the row is locked from further edits.
              {cancelSheet?.state === 'paid' && (
                <span className="mt-2 block text-rose-700">
                  This sheet is already <strong>paid</strong> — cancellation
                  here is for refund-and-void scenarios (force-majeure post-
                  deposit). The transition is allowed but rare.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>
              Cancel sheet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteSheet}
        onOpenChange={(o) => !o && setDeleteSheet(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this function sheet?</AlertDialogTitle>
            <AlertDialogDescription>
              Soft-deleted; the row is hidden from your dashboard but stays
              in the database for legal / tax audit. You can restore it
              later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SheetCard({
  sheet,
  busy,
  onTransition,
  onEdit,
  onSign,
  onCancel,
  onDelete,
  onPdf,
  onWhatsapp,
  onShare,
  onActivity,
}: {
  sheet: FunctionSheet;
  busy: boolean;
  onTransition: (to: FunctionSheetState) => void;
  onEdit: () => void;
  onSign: (side: SignSide) => void;
  onCancel: () => void;
  onDelete: () => void;
  onPdf: (variant: PdfVariant, mode: 'preview' | 'download') => void;
  onWhatsapp: (variant?: PdfVariant) => void;
  onShare: () => void;
  onActivity: () => void;
}) {
  const tone = STATE_TONES[sheet.state];
  const nextOptions = NEXT_STATES[sheet.state] || [];
  const variants = variantsAvailable(sheet.state);
  const isTerminal = sheet.state === 'archived' || sheet.state === 'cancelled';

  // Signature presence
  const sigs = (sheet.signaturesJson || {}) as any;
  const vendorSigned = !!sigs?.vendor?.signedAt;
  const customerSigned = !!sigs?.customer?.signedAt;
  // Signing makes sense from contract_pending onwards; vendor can
  // also sign earlier to lock their side. Stop showing the buttons
  // on terminal / paid / archived rows since they're frozen.
  const canSign =
    !isTerminal && sheet.state !== 'paid' && sheet.state !== 'archived';

  // Share-link state. A link is "live" when it exists, isn't revoked,
  // and hasn't expired yet.
  const shareTokenLive =
    !!sheet.customerShareToken &&
    !sheet.shareTokenRevokedAt &&
    (!sheet.shareTokenExpiresAt ||
      new Date(sheet.shareTokenExpiresAt) > new Date());
  const canShare =
    !isTerminal && sheet.state !== 'archived' && sheet.state !== 'cancelled';

  return (
    <Card className={isTerminal ? 'opacity-70' : ''}>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">
                {sheet.title || `Function sheet #${sheet.id}`}
              </span>
              <Badge
                variant="outline"
                className={`${tone.bg} ${tone.text} ${tone.border}`}
              >
                {STATE_LABELS[sheet.state]}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                #{sheet.id}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {sheet.customerName && <span>{sheet.customerName}</span>}
              {sheet.customerPhone && (
                <a
                  href={`tel:${sheet.customerPhone}`}
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {sheet.customerPhone}
                </a>
              )}
              {sheet.eventDate && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {fmtDate(sheet.eventDate)}
                </span>
              )}
              {sheet.bookingId && <span>Booking #{sheet.bookingId}</span>}
              {sheet.business?.name && (
                <span className="inline-flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {sheet.business.name}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">
              {fmtPKR(sheet.grandTotal)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Grand total
            </div>
            {Number(sheet.taxAmount) > 0 && (
              <div className="text-[11px] text-muted-foreground">
                inc. {fmtPKR(sheet.taxAmount)} tax
              </div>
            )}
          </div>
        </div>

        {/* Lifecycle timeline */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          {sheet.sentAt && (
            <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-800">
              Quote sent {fmtDate(sheet.sentAt)}
            </span>
          )}
          {vendorSigned && (
            <span className="inline-flex items-center gap-1 rounded bg-violet-50 px-2 py-0.5 text-violet-800">
              <PenLine className="h-3 w-3" />
              Vendor signed
            </span>
          )}
          {customerSigned && (
            <span className="inline-flex items-center gap-1 rounded bg-violet-50 px-2 py-0.5 text-violet-800">
              <PenLine className="h-3 w-3" />
              Customer signed
            </span>
          )}
          {sheet.signedAt && (
            <span className="rounded bg-violet-100 px-2 py-0.5 font-medium text-violet-900">
              Both signed {fmtDate(sheet.signedAt)}
            </span>
          )}
          {sheet.invoicedAt && (
            <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-900">
              Invoiced {fmtDate(sheet.invoicedAt)}
            </span>
          )}
          {sheet.paidAt && (
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-800">
              Paid {fmtDate(sheet.paidAt)}
            </span>
          )}
          {shareTokenLive && (
            <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-sky-800">
              <Share2 className="h-3 w-3" />
              Share link live
              {sheet.shareTokenExpiresAt &&
                ` · expires ${fmtDate(sheet.shareTokenExpiresAt)}`}
            </span>
          )}
          {Array.isArray(sheet.lineItemsJson) &&
            sheet.lineItemsJson.length > 0 && (
              <span className="ml-auto rounded bg-neutral-100 px-2 py-0.5">
                {sheet.lineItemsJson.length} line item
                {sheet.lineItemsJson.length === 1 ? '' : 's'}
              </span>
            )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* PDF dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                className="border-neutral-300"
              >
                {busy ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <FileText className="mr-1 h-3 w-3" />
                )}
                PDF
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Available variants</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {variants.map((v) => (
                <React.Fragment key={v}>
                  <DropdownMenuItem onClick={() => onPdf(v, 'preview')}>
                    <ExternalLink className="mr-2 h-3 w-3" />
                    Preview {PDF_VARIANT_LABELS[v]}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPdf(v, 'download')}>
                    <Download className="mr-2 h-3 w-3" />
                    Download {PDF_VARIANT_LABELS[v]}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onWhatsapp(v)}>
                    <MessageSquare className="mr-2 h-3 w-3" />
                    Send {PDF_VARIANT_LABELS[v]} via WhatsApp
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
              {variants.length === 0 && (
                <DropdownMenuItem disabled>
                  <AlertTriangle className="mr-2 h-3 w-3 text-amber-600" />
                  No variants available
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Forward-only transitions */}
          {nextOptions.map((to) => {
            const t = STATE_TONES[to];
            return (
              <Button
                key={to}
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => onTransition(to)}
                className={`${t.border} ${t.text}`}
              >
                {to === 'paid' || to === 'archived' ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowRight className="mr-1 h-3 w-3" />
                )}
                {STATE_LABELS[to]}
              </Button>
            );
          })}

          {/* Edit — only on non-terminal sheets (server-side rule) */}
          {!isTerminal && sheet.state !== 'paid' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              disabled={busy}
            >
              <Pencil className="mr-1 h-3 w-3" />
              Edit
            </Button>
          )}
          {/* Sign buttons — vendor / customer */}
          {canSign && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSign('vendor')}
                disabled={busy}
                className={
                  vendorSigned
                    ? 'border-violet-300 bg-violet-50 text-violet-800'
                    : 'border-neutral-300'
                }
              >
                <PenLine className="mr-1 h-3 w-3" />
                {vendorSigned ? 'Re-sign as vendor' : 'Sign as vendor'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSign('customer')}
                disabled={busy}
                className={
                  customerSigned
                    ? 'border-violet-300 bg-violet-50 text-violet-800'
                    : 'border-neutral-300'
                }
              >
                <PenLine className="mr-1 h-3 w-3" />
                {customerSigned ? 'Re-sign customer' : 'Sign as customer'}
              </Button>
            </>
          )}
          {/* Share-link — for remote customers (overseas / different city) */}
          {canShare && (
            <Button
              size="sm"
              variant="outline"
              onClick={onShare}
              disabled={busy}
              className={
                shareTokenLive
                  ? 'border-sky-300 bg-sky-50 text-sky-800'
                  : 'border-neutral-300'
              }
            >
              <Share2 className="mr-1 h-3 w-3" />
              {shareTokenLive ? 'Manage share link' : 'Share link'}
            </Button>
          )}
          {/* Activity — always visible (compliance + dispute proof) */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onActivity}
            disabled={busy}
          >
            <Activity className="mr-1 h-3 w-3" />
            Activity
          </Button>
          {/* Cancel — visible on any non-terminal state */}
          {!isTerminal && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              disabled={busy}
              className="text-rose-700 hover:text-rose-900"
            >
              <XCircle className="mr-1 h-3 w-3" />
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={busy}
            className="ml-auto text-rose-700 hover:text-rose-900"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

/**
 * Function Sheet detail view — the full working surface for a single
 * sheet. The card list at /dashboard/function-sheets is for scanning;
 * this page is for ACTUALLY USING the sheet (Pakistani vendor managing
 * a Rs. 1M+ Walima needs a dedicated working surface).
 *
 * Layout:
 *   - Header: back-link + title + state badge + lifecycle timeline
 *   - Two-column body:
 *     - Left (main): customer + event blocks side-by-side; full
 *       line items table; totals strip; terms (bullets/text); payment
 *       schedule; signatures with image previews; notes
 *     - Right (sidebar): all action buttons grouped — PDF / WhatsApp /
 *       Share link / FBR / Sign / Edit / Cancel
 *   - Bottom: inline activity log (chronological audit timeline)
 *
 * All existing dialogs (composer, sign, pdf, whatsapp, share, fbr) are
 * reused — this page just opens them when the matching action is hit.
 * Zero backend changes; reuses GET /:id endpoint already shipped.
 */

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axiosConfig';
import {
  Loader2,
  ArrowLeft,
  Pencil,
  Trash2,
  ArrowRight,
  Download,
  ExternalLink,
  MessageSquare,
  Share2,
  Activity,
  ShieldCheck,
  PenLine,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  Building,
  FileText,
  HandCoins,
  Receipt,
  CreditCard,
  Handshake,
  Banknote,
  HardHat,
  Boxes,
  TrendingUp,
  TrendingDown,
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

import {
  FunctionSheetAPI,
  STATE_LABELS,
  PDF_VARIANT_LABELS,
  STATE_TONES,
  variantsAvailable,
  type FunctionSheet,
  type FunctionSheetState,
  type PdfVariant,
  type AuditEvent,
  type LinkedFinancials,
} from '@/lib/api/functionSheets';
import { FunctionSheetComposer } from './function-sheet-composer';
import { SignDialog, type SignSide } from './sign-dialog';
import { SendWhatsappDialog } from './send-whatsapp-dialog';
import { ShareLinkDialog } from './share-link-dialog';
import { FbrSubmitDialog } from './fbr-submit-dialog';

// Forward-only happy path mirroring the list view.
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

function fmtPKR(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `Rs. ${Math.round(x).toLocaleString('en-PK')}`;
}
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}
function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-PK');
  } catch {
    return iso;
  }
}
function termsToList(termsJson: any): string[] | null {
  if (!termsJson) return null;
  if (typeof termsJson === 'string') return [termsJson];
  if (Array.isArray(termsJson?.lines)) return termsJson.lines;
  if (typeof termsJson?.text === 'string') return [termsJson.text];
  return null;
}

interface VendorBusinessOption {
  id: number;
  name: string;
}

export default function FunctionSheetDetailView({
  sheetId,
}: {
  sheetId: number;
}) {
  const router = useRouter();
  const [sheet, setSheet] = useState<FunctionSheet | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [financials, setFinancials] = useState<LinkedFinancials | null>(null);
  const [businesses, setBusinesses] = useState<VendorBusinessOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Dialogs.
  const [composerOpen, setComposerOpen] = useState(false);
  const [signSide, setSignSide] = useState<SignSide | null>(null);
  const [whatsappVariant, setWhatsappVariant] = useState<PdfVariant | null>(
    null,
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [fbrOpen, setFbrOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const loadAll = async () => {
    if (!Number.isFinite(sheetId)) return;
    setLoading(true);
    setError(null);
    try {
      const [row, audit, fin] = await Promise.all([
        FunctionSheetAPI.get(sheetId),
        FunctionSheetAPI.auditLog(sheetId, 200).catch(() => ({ events: [] })),
        FunctionSheetAPI.linkedFinancials(sheetId).catch(() => null),
      ]);
      if (!row) {
        setError('Function sheet not found');
        setSheet(null);
      } else {
        setSheet(row);
        setEvents(audit.events || []);
        setFinancials(fin);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load function sheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId]);

  useEffect(() => {
    axiosInstance
      .get('/api/v1/businesses/user-business')
      .then((res) => {
        const list = res.data?.data;
        const arr = Array.isArray(list) ? list : list?.data || [];
        setBusinesses(
          arr.map((b: any) => ({
            id: b.id,
            name: b.name || `Business #${b.id}`,
          })),
        );
      })
      .catch(() => {});
  }, []);

  const handleTransition = async (to: FunctionSheetState) => {
    if (!sheet) return;
    setBusy(true);
    try {
      await FunctionSheetAPI.transition(sheet.id, { to });
      toast.success(`Moved to ${STATE_LABELS[to]}`);
      await loadAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Transition refused');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!sheet) return;
    setBusy(true);
    try {
      await FunctionSheetAPI.transition(sheet.id, { to: 'cancelled' });
      toast.success('Sheet cancelled');
      setCancelConfirmOpen(false);
      await loadAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not cancel');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!sheet) return;
    setBusy(true);
    try {
      await FunctionSheetAPI.remove(sheet.id);
      toast.success('Sheet removed');
      router.push('/dashboard/function-sheets');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not remove');
    } finally {
      setBusy(false);
    }
  };

  const handlePdf = async (
    variant: PdfVariant,
    mode: 'preview' | 'download',
  ) => {
    if (!sheet) return;
    setBusy(true);
    try {
      const blob = await FunctionSheetAPI.pdfBlob(sheet.id, variant);
      const url = window.URL.createObjectURL(blob);
      if (mode === 'preview') {
        window.open(url, '_blank');
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
      toast.error(e?.response?.data?.message || 'Could not generate PDF');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-2/3" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !sheet) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/function-sheets"
          className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to function sheets
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-600" />
            <p className="text-sm text-muted-foreground">
              {error || 'Function sheet not found.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tone = STATE_TONES[sheet.state];
  const nextOptions = NEXT_STATES[sheet.state] || [];
  const variants = variantsAvailable(sheet.state);
  const isTerminal =
    sheet.state === 'archived' || sheet.state === 'cancelled';

  const sigs = (sheet.signaturesJson || {}) as any;
  const vendorSig = sigs.vendor || null;
  const customerSig = sigs.customer || null;
  const terms = termsToList(sheet.termsJson);
  const ps = Array.isArray(sheet.paymentScheduleJson)
    ? sheet.paymentScheduleJson
    : null;

  const shareTokenLive =
    !!sheet.customerShareToken &&
    !sheet.shareTokenRevokedAt &&
    (!sheet.shareTokenExpiresAt ||
      new Date(sheet.shareTokenExpiresAt) > new Date());

  const fbrEligible = sheet.state === 'invoiced' || sheet.state === 'paid';
  const canSign =
    !isTerminal && sheet.state !== 'paid' && sheet.state !== 'archived';
  const canShare = canSign;
  const canEdit = !isTerminal && sheet.state !== 'paid';

  return (
    <div className="space-y-4">
      {/* Top bar — back link + title row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard/function-sheets"
          className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to function sheets
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {nextOptions.map((to) => {
            const t = STATE_TONES[to];
            return (
              <Button
                key={to}
                size="sm"
                variant="outline"
                onClick={() => handleTransition(to)}
                disabled={busy}
                className={`${t.border} ${t.text}`}
              >
                {to === 'paid' || to === 'archived' ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowRight className="mr-1 h-3 w-3" />
                )}
                Move to {STATE_LABELS[to]}
              </Button>
            );
          })}
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setComposerOpen(true)}
              disabled={busy}
            >
              <Pencil className="mr-1 h-3 w-3" />
              Edit
            </Button>
          )}
          {!isTerminal && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCancelConfirmOpen(true)}
              disabled={busy}
              className="text-rose-700 hover:text-rose-900"
            >
              <XCircle className="mr-1 h-3 w-3" />
              Cancel sheet
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={busy || sheet.state === 'paid'}
            className="text-rose-700 hover:text-rose-900"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Remove
          </Button>
        </div>
      </div>

      {/* Title block */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">{sheet.title}</h1>
                <Badge
                  variant="outline"
                  className={`${tone.bg} ${tone.text} ${tone.border}`}
                >
                  {STATE_LABELS[sheet.state]}
                </Badge>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  Function Sheet #{sheet.id}
                </Badge>
              </div>
              {sheet.business?.name && (
                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Building className="h-3 w-3" />
                  {sheet.business.name}
                  {sheet.bookingId && (
                    <span className="ml-2">· Booking #{sheet.bookingId}</span>
                  )}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{fmtPKR(sheet.grandTotal)}</div>
              <div className="text-xs text-muted-foreground">Grand total</div>
              {Number(sheet.taxAmount) > 0 && (
                <div className="text-xs text-muted-foreground">
                  inc. {fmtPKR(sheet.taxAmount)} tax
                </div>
              )}
            </div>
          </div>

          {/* Lifecycle pills */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            {sheet.sentAt && (
              <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-800">
                Quote sent {fmtDate(sheet.sentAt)}
              </span>
            )}
            {sigs.vendor?.signedAt && (
              <span className="inline-flex items-center gap-1 rounded bg-violet-50 px-2 py-0.5 text-violet-800">
                <PenLine className="h-3 w-3" />
                Vendor signed {fmtDate(sigs.vendor.signedAt)}
              </span>
            )}
            {sigs.customer?.signedAt && (
              <span className="inline-flex items-center gap-1 rounded bg-violet-50 px-2 py-0.5 text-violet-800">
                <PenLine className="h-3 w-3" />
                Customer signed {fmtDate(sigs.customer.signedAt)}
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
                Share link live · expires {fmtDate(sheet.shareTokenExpiresAt)}
              </span>
            )}
            {sheet.fbrSubmissionStatus === 'accepted' &&
              sheet.fbrInvoiceNumber && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 font-mono text-emerald-900">
                  <ShieldCheck className="h-3 w-3" />
                  FBR {sheet.fbrInvoiceNumber}
                </span>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Two-column body */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Customer + event */}
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Customer
                </div>
                <div className="text-base font-semibold">
                  {sheet.customerName || '—'}
                </div>
                {sheet.customerPhone && (
                  <a
                    href={`tel:${sheet.customerPhone}`}
                    className="inline-flex items-center gap-1 text-xs hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {sheet.customerPhone}
                  </a>
                )}
                {sheet.customerEmail && (
                  <a
                    href={`mailto:${sheet.customerEmail}`}
                    className="block text-xs hover:underline"
                  >
                    <Mail className="mr-1 inline h-3 w-3" />
                    {sheet.customerEmail}
                  </a>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Event
                </div>
                {sheet.eventDate && (
                  <div className="inline-flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3 text-neutral-500" />
                    {fmtDate(sheet.eventDate)}
                  </div>
                )}
                {sheet.validUntil && (
                  <div className="text-xs text-muted-foreground">
                    Quote valid until: {fmtDate(sheet.validUntil)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line items full table */}
          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Line items
              </div>
              {sheet.lineItemsJson.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No line items.
                </p>
              ) : (
                <div className="overflow-hidden rounded-md border border-neutral-200">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">
                          Description
                        </th>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase">
                          Qty
                        </th>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase">
                          Unit (Rs.)
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.lineItemsJson.map((it, idx) => {
                        const qty = Number(it.qty) || 0;
                        const unit = Number(it.unitPrice) || 0;
                        const total =
                          it.total != null
                            ? Number(it.total)
                            : Math.round(qty * unit);
                        return (
                          <tr
                            key={idx}
                            className={
                              idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                            }
                          >
                            <td className="px-3 py-2">
                              <div>{it.label}</div>
                              {it.notes && (
                                <div className="text-[11px] text-muted-foreground">
                                  {it.notes}
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {qty.toLocaleString('en-PK')}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {unit.toLocaleString('en-PK')}
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {fmtPKR(total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals strip */}
              <div className="ml-auto mt-2 max-w-sm space-y-0.5 rounded-md bg-neutral-50 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{fmtPKR(sheet.subtotal)}</span>
                </div>
                {Number(sheet.discountAmount) > 0 && (
                  <div className="flex items-center justify-between text-rose-700">
                    <span>− Discount</span>
                    <span>{fmtPKR(sheet.discountAmount)}</span>
                  </div>
                )}
                {Number(sheet.taxAmount) > 0 && (
                  <div className="flex items-center justify-between text-blue-700">
                    <span>+ Sales tax</span>
                    <span>{fmtPKR(sheet.taxAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-neutral-200 pt-1 text-base font-bold text-emerald-700">
                  <span>Grand total</span>
                  <span>{fmtPKR(sheet.grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          {terms && terms.length > 0 && (
            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Terms &amp; conditions
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
                  {terms.map((t, idx) => (
                    <li key={idx} className="whitespace-pre-line">
                      {t}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Payment schedule */}
          {ps && ps.length > 0 && (
            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Payment schedule
                </div>
                <ul className="space-y-1 text-sm text-neutral-700">
                  {ps.map((p: any, idx: number) => (
                    <li
                      key={idx}
                      className="flex flex-wrap items-center gap-2 rounded-md bg-neutral-50 px-3 py-2"
                    >
                      <span className="font-medium">{p?.label}</span>
                      {p?.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          · due {fmtDate(p.dueDate)}
                        </span>
                      )}
                      {p?.paidOn && (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-50 text-emerald-800"
                        >
                          paid {fmtDate(p.paidOn)}
                        </Badge>
                      )}
                      <span className="ml-auto font-mono font-medium">
                        {fmtPKR(p?.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Signatures with image previews */}
          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Signatures
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SignatureBlock side="vendor" sig={vendorSig} />
                <SignatureBlock side="customer" sig={customerSig} />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {sheet.notes && (
            <Card>
              <CardContent className="space-y-1 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Internal notes
                </div>
                <p className="whitespace-pre-line text-sm text-neutral-700">
                  {sheet.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Linked financials — receipts / PDCs / supplier invoices / commissions / expenses / staff / inventory consumption */}
          {financials && financials.bookingId && (
            <LinkedFinancialsSection financials={financials} />
          )}
          {financials && !financials.bookingId && (
            <Card>
              <CardContent className="space-y-1 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Linked financials
                </div>
                <p className="text-sm text-muted-foreground">
                  Link this Function Sheet to a Booking to see receipts,
                  cheques, supplier invoices, expenses, and staff payroll for
                  the event in one place.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Activity log inline */}
          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Activity className="h-3 w-3" />
                Activity log
              </div>
              <InlineActivity events={events} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — action toolbox */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <FileText className="mr-1 inline h-3 w-3" />
                PDF
              </div>
              {variants.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No variants unlocked yet.
                </p>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <FileText className="mr-2 h-3 w-3" />
                      )}
                      Generate PDF…
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72">
                    <DropdownMenuLabel>Available variants</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {variants.map((v) => (
                      <React.Fragment key={v}>
                        <DropdownMenuItem onClick={() => handlePdf(v, 'preview')}>
                          <ExternalLink className="mr-2 h-3 w-3" />
                          Preview {PDF_VARIANT_LABELS[v]}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handlePdf(v, 'download')}
                        >
                          <Download className="mr-2 h-3 w-3" />
                          Download {PDF_VARIANT_LABELS[v]}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setWhatsappVariant(v)}
                        >
                          <MessageSquare className="mr-2 h-3 w-3" />
                          Send {PDF_VARIANT_LABELS[v]} via WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </React.Fragment>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardContent>
          </Card>

          {canSign && (
            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <PenLine className="mr-1 inline h-3 w-3" />
                  Signatures
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setSignSide('vendor')}
                  disabled={busy}
                >
                  <PenLine className="mr-2 h-3 w-3" />
                  {vendorSig?.signedAt ? 'Re-sign as vendor' : 'Sign as vendor'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setSignSide('customer')}
                  disabled={busy}
                >
                  <PenLine className="mr-2 h-3 w-3" />
                  {customerSig?.signedAt ? 'Re-sign customer' : 'Sign as customer'}
                </Button>
              </CardContent>
            </Card>
          )}

          {canShare && (
            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Share2 className="mr-1 inline h-3 w-3" />
                  Customer share link
                </div>
                <Button
                  variant="outline"
                  className={`w-full justify-start ${shareTokenLive ? 'border-sky-300 bg-sky-50 text-sky-800' : ''}`}
                  onClick={() => setShareOpen(true)}
                  disabled={busy}
                >
                  <Share2 className="mr-2 h-3 w-3" />
                  {shareTokenLive ? 'Manage share link' : 'Generate share link'}
                </Button>
              </CardContent>
            </Card>
          )}

          {fbrEligible && (
            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <ShieldCheck className="mr-1 inline h-3 w-3" />
                  FBR e-invoicing
                </div>
                <Button
                  variant="outline"
                  className={`w-full justify-start ${
                    sheet.fbrSubmissionStatus === 'accepted'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : sheet.fbrSubmissionStatus === 'rejected'
                        ? 'border-rose-300 bg-rose-50 text-rose-800'
                        : ''
                  }`}
                  onClick={() => setFbrOpen(true)}
                  disabled={busy}
                >
                  <ShieldCheck className="mr-2 h-3 w-3" />
                  {sheet.fbrSubmissionStatus === 'accepted'
                    ? 'Re-submit to FBR'
                    : 'Submit to FBR'}
                </Button>
                {sheet.fbrInvoiceNumber && (
                  <p className="text-[11px] text-muted-foreground">
                    Current FBR #{' '}
                    <span className="font-mono">{sheet.fbrInvoiceNumber}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {/* Dialogs */}
      <FunctionSheetComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        businesses={businesses}
        sheet={sheet}
        onSaved={async () => {
          setComposerOpen(false);
          await loadAll();
        }}
      />

      <SignDialog
        sheet={signSide ? sheet : null}
        side={signSide ?? 'vendor'}
        onOpenChange={(o) => !o && setSignSide(null)}
        onSaved={async () => {
          setSignSide(null);
          await loadAll();
        }}
      />

      <SendWhatsappDialog
        sheet={whatsappVariant ? sheet : null}
        initialVariant={whatsappVariant ?? undefined}
        onOpenChange={(o) => !o && setWhatsappVariant(null)}
        onSent={async () => {
          setWhatsappVariant(null);
          await loadAll();
        }}
      />

      <ShareLinkDialog
        sheet={shareOpen ? sheet : null}
        onOpenChange={setShareOpen}
        onSaved={loadAll}
      />

      <FbrSubmitDialog
        sheet={fbrOpen ? sheet : null}
        onOpenChange={setFbrOpen}
        onSubmitted={loadAll}
      />

      <AlertDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this function sheet?</AlertDialogTitle>
            <AlertDialogDescription>
              The sheet flips to <strong>cancelled</strong> (terminal).
              Existing customer-printed PDFs remain valid historical
              records; the row is locked from further edits.
              {sheet.state === 'paid' && (
                <span className="mt-2 block text-rose-700">
                  This sheet is <strong>paid</strong> — cancellation here is
                  for refund-and-void scenarios (force-majeure post-deposit).
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
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this function sheet?</AlertDialogTitle>
            <AlertDialogDescription>
              Soft-deleted. The row is hidden but stays in the database for
              legal / tax audit. You can restore it later if needed.
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

// ─── Signature block (with image preview) ─────────────────────────

function SignatureBlock({
  side,
  sig,
}: {
  side: 'vendor' | 'customer';
  sig: any;
}) {
  const label = side === 'vendor' ? 'Vendor' : 'Customer';
  if (!sig?.signedAt) {
    return (
      <div className="rounded-md border border-neutral-200 p-3 text-xs text-muted-foreground">
        <div className="text-[10px] uppercase tracking-wide">{label}</div>
        <div className="mt-1">Not yet signed</div>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-violet-300 bg-violet-50/30 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-medium">{sig.name || '—'}</div>
      <div className="text-[11px] text-emerald-700">
        <CheckCircle2 className="mr-1 inline h-3 w-3" />
        Signed {fmtDateTime(sig.signedAt)}
        {sig.mode && (
          <Badge variant="secondary" className="ml-2 text-[10px]">
            {sig.mode}
          </Badge>
        )}
        {sig.viaShareToken && (
          <Badge
            variant="outline"
            className="ml-1 border-sky-300 bg-sky-50 text-[10px] text-sky-800"
          >
            via share link
          </Badge>
        )}
      </div>
      {sig.dataUrl && (
        <img
          src={sig.dataUrl}
          alt={`${label} signature`}
          className="mt-2 max-h-24 rounded border border-neutral-200 bg-white"
        />
      )}
      {sig.scanUrl && !sig.dataUrl && (
        <a
          href={sig.scanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          View scan
        </a>
      )}
    </div>
  );
}

// ─── Inline activity timeline ─────────────────────────────────────

function InlineActivity({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="py-2 text-center text-xs text-muted-foreground">
        No activity yet.
      </p>
    );
  }
  return (
    <ol className="relative space-y-2 pl-5">
      <div
        className="absolute left-1.5 top-0 h-full w-px bg-neutral-200"
        aria-hidden
      />
      {events.slice(0, 50).map((e) => (
        <li key={e.id} className="relative">
          <span
            className="absolute -left-3.5 top-1 h-2 w-2 rounded-full bg-neutral-400"
            aria-hidden
          />
          <div className="flex flex-wrap items-baseline gap-2 text-xs">
            <span className="font-medium">{formatAction(e.action)}</span>
            <span className="text-[10px] text-muted-foreground">
              {e.actor?.fullName || e.actor?.email || (
                e.action === 'customer:signed-via-token'
                  ? 'Customer (share link)'
                  : 'System'
              )}
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {fmtDateTime(e.at)}
            </span>
          </div>
        </li>
      ))}
      {events.length > 50 && (
        <li className="text-[10px] text-muted-foreground">
          + {events.length - 50} more older events
        </li>
      )}
    </ol>
  );
}

// ─── Linked financials section ────────────────────────────────────

function LinkedFinancialsSection({
  financials,
}: {
  financials: LinkedFinancials;
}) {
  const { pnl, receipts, pdcs, supplierInvoices, brokerCommissions, expenses, staffShifts, inventoryMovements } = financials;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <HandCoins className="h-3 w-3" />
          Linked financials &amp; per-event P&amp;L
        </div>

        {pnl && (
          <div className="space-y-2">
            {/* Top-line P&L summary */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <PnlCard
                label="Gross"
                value={pnl.gross}
                tone="neutral"
                icon={FileText}
              />
              <PnlCard
                label="Received"
                value={pnl.inflows.totalReceived}
                tone="emerald"
                icon={TrendingUp}
                subtitle={
                  pnl.inflows.pdcsHeld > 0
                    ? `+ ${fmtPKR(pnl.inflows.pdcsHeld)} in held cheques`
                    : undefined
                }
              />
              <PnlCard
                label="Spent"
                value={pnl.outflows.totalOutflows}
                tone="rose"
                icon={TrendingDown}
                subtitle={
                  pnl.outflows.totalCommitted > 0
                    ? `+ ${fmtPKR(pnl.outflows.totalCommitted)} committed`
                    : undefined
                }
              />
              <PnlCard
                label="Net (paid only)"
                value={pnl.net}
                tone={pnl.net >= 0 ? 'emerald' : 'rose'}
                icon={HandCoins}
                subtitle={
                  pnl.customerOutstanding > 0
                    ? `${fmtPKR(pnl.customerOutstanding)} outstanding from customer`
                    : 'customer fully paid'
                }
              />
            </div>

            {/* Cashflow vs net distinction */}
            <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px]">
              <span className="font-semibold">Realised cashflow:</span>{' '}
              <span
                className={
                  pnl.cashflow >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }
              >
                {fmtPKR(pnl.cashflow)}
              </span>{' '}
              <span className="text-muted-foreground">
                (cash received − cash paid out)
              </span>
            </div>
          </div>
        )}

        {/* Per-resource lists in collapsible-style sub-cards */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ResourceList
            title="Payment receipts"
            count={receipts.length}
            icon={Receipt}
            total={receipts.reduce((s, r) => s + (Number(r.amount) || 0), 0)}
            rows={receipts.map((r) => ({
              key: r.id,
              primary: r.method,
              secondary: `${fmtDate(r.receivedDate)} ${r.transactionRef ? `· ${r.transactionRef}` : ''}`,
              amount: Number(r.amount) || 0,
              tone: 'emerald',
            }))}
          />
          <ResourceList
            title="Post-dated cheques"
            count={pdcs.length}
            icon={Banknote}
            total={pdcs
              .filter((p) => p.status !== 'bounced' && p.status !== 'cancelled')
              .reduce((s, p) => s + (Number(p.amount) || 0), 0)}
            rows={pdcs.map((p) => ({
              key: p.id,
              primary: `${p.bankName} · ${p.chequeNumber}`,
              secondary: `${fmtDate(p.chequeDate)} · ${p.status}${p.bounceReason ? ` (${p.bounceReason})` : ''}`,
              amount: Number(p.amount) || 0,
              tone:
                p.status === 'cleared'
                  ? 'emerald'
                  : p.status === 'bounced'
                    ? 'rose'
                    : p.status === 'deposited'
                      ? 'sky'
                      : 'amber',
            }))}
          />
          <ResourceList
            title="Supplier invoices"
            count={supplierInvoices.length}
            icon={CreditCard}
            total={supplierInvoices.reduce(
              (s, inv) =>
                inv.status === 'void'
                  ? s
                  : s + (Number(inv.totalAmount) || 0),
              0,
            )}
            rows={supplierInvoices.map((inv) => {
              const outstanding = Math.max(
                0,
                (Number(inv.totalAmount) || 0) -
                  (Number(inv.amountPaid) || 0),
              );
              return {
                key: inv.id,
                primary: `${inv.supplierNameSnapshot}${inv.invoiceNumber ? ` · #${inv.invoiceNumber}` : ''}`,
                secondary: `${fmtDate(inv.invoiceDate)} · ${inv.status}${outstanding > 0 ? ` · ${fmtPKR(outstanding)} outstanding` : ''}`,
                amount: Number(inv.totalAmount) || 0,
                tone:
                  inv.status === 'paid'
                    ? 'emerald'
                    : inv.status === 'overdue' || inv.status === 'disputed'
                      ? 'rose'
                      : 'amber',
              };
            })}
          />
          <ResourceList
            title="Broker commissions"
            count={brokerCommissions.length}
            icon={Handshake}
            total={brokerCommissions.reduce(
              (s, c) =>
                c.status === 'void' ? s : s + (Number(c.commissionAmount) || 0),
              0,
            )}
            rows={brokerCommissions.map((c) => {
              const outstanding = Math.max(
                0,
                (Number(c.commissionAmount) || 0) -
                  (Number(c.amountPaid) || 0),
              );
              return {
                key: c.id,
                primary: `${c.brokerNameSnapshot} · ${c.commissionType === 'percentage' && c.commissionPct ? `${c.commissionPct}%` : 'flat'}`,
                secondary: `${fmtDate(c.accruedDate)} · ${c.status}${outstanding > 0 ? ` · ${fmtPKR(outstanding)} unpaid` : ''}`,
                amount: Number(c.commissionAmount) || 0,
                tone:
                  c.status === 'paid'
                    ? 'emerald'
                    : c.status === 'disputed'
                      ? 'rose'
                      : 'amber',
              };
            })}
          />
          <ResourceList
            title="Expenses"
            count={expenses.length}
            icon={TrendingDown}
            total={expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)}
            rows={expenses.map((e) => ({
              key: e.id,
              primary: `${e.category}${e.subcategory ? ` · ${e.subcategory}` : ''}${e.supplierName ? ` · ${e.supplierName}` : ''}`,
              secondary: `${fmtDate(e.spentDate)} · ${e.paymentMethod}`,
              amount: Number(e.amount) || 0,
              tone: 'rose',
            }))}
          />
          <ResourceList
            title="Staff payroll"
            count={staffShifts.length}
            icon={HardHat}
            total={staffShifts.reduce(
              (s, sh) => s + (Number(sh.grossPayable) || 0),
              0,
            )}
            rows={staffShifts.map((sh) => ({
              key: sh.id,
              primary: `${sh.staffNameSnapshot} · ${sh.roleSnapshot.replace(/_/g, ' ')}`,
              secondary: `${fmtDate(sh.shiftDate)} · ${sh.paymentStatus}${sh.paidVia ? ` · via ${sh.paidVia}` : ''}`,
              amount: Number(sh.grossPayable) || 0,
              tone:
                sh.paymentStatus === 'paid'
                  ? 'emerald'
                  : sh.paymentStatus === 'disputed'
                    ? 'rose'
                    : 'amber',
            }))}
          />
          {inventoryMovements.length > 0 && (
            <div className="lg:col-span-2">
              <ResourceList
                title="Inventory consumed"
                count={inventoryMovements.length}
                icon={Boxes}
                rows={inventoryMovements.map((m) => ({
                  key: m.id,
                  primary: m.item?.name || '(unknown item)',
                  secondary: `${fmtDate(m.occurredAt)}${m.reason ? ` · ${m.reason}` : ''}`,
                  amount: undefined,
                  amountLabel: `${m.quantity} ${m.item?.unit || ''}`.trim(),
                  tone: 'sky',
                }))}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// PnlCard — top-line summary tile.

const PNL_TONE: Record<
  'neutral' | 'emerald' | 'rose' | 'amber' | 'sky',
  { border: string; bg: string; iconColor: string }
> = {
  neutral: {
    border: 'border-neutral-200',
    bg: 'bg-white',
    iconColor: 'text-neutral-500',
  },
  emerald: {
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/40',
    iconColor: 'text-emerald-700',
  },
  rose: {
    border: 'border-rose-200',
    bg: 'bg-rose-50/40',
    iconColor: 'text-rose-700',
  },
  amber: {
    border: 'border-amber-200',
    bg: 'bg-amber-50/40',
    iconColor: 'text-amber-700',
  },
  sky: {
    border: 'border-sky-200',
    bg: 'bg-sky-50/40',
    iconColor: 'text-sky-700',
  },
};

function PnlCard({
  label,
  value,
  tone,
  icon: Icon,
  subtitle,
}: {
  label: string;
  value: number;
  tone: keyof typeof PNL_TONE;
  icon: React.ElementType;
  subtitle?: string;
}) {
  const t = PNL_TONE[tone];
  return (
    <div className={`rounded-md border ${t.border} ${t.bg} px-3 py-2`}>
      <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className={`h-3 w-3 ${t.iconColor}`} />
        {label}
      </div>
      <div className="text-base font-bold">{fmtPKR(value)}</div>
      {subtitle && (
        <div className="text-[10px] text-muted-foreground">{subtitle}</div>
      )}
    </div>
  );
}

// ResourceList — collapsible per-resource list.

function ResourceList({
  title,
  count,
  icon: Icon,
  total,
  rows,
}: {
  title: string;
  count: number;
  icon: React.ElementType;
  total?: number;
  rows: Array<{
    key: number | string;
    primary: string;
    secondary?: string;
    amount?: number;
    amountLabel?: string;
    tone?: 'neutral' | 'emerald' | 'rose' | 'amber' | 'sky';
  }>;
}) {
  const [expanded, setExpanded] = useState(rows.length <= 3);
  if (count === 0) return null;
  const visible = expanded ? rows : rows.slice(0, 3);
  return (
    <div className="rounded-md border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2 text-left hover:bg-neutral-50"
      >
        <div className="inline-flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-neutral-500" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            {title}
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {count}
          </Badge>
        </div>
        {total != null && (
          <span className="text-xs font-mono">{fmtPKR(total)}</span>
        )}
      </button>
      <ul className="space-y-0 divide-y divide-neutral-100 text-xs">
        {visible.map((r) => {
          const toneCls = r.tone ? PNL_TONE[r.tone] : null;
          return (
            <li key={r.key} className="flex items-baseline gap-2 px-3 py-1.5">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{r.primary}</div>
                {r.secondary && (
                  <div className="truncate text-[10px] text-muted-foreground">
                    {r.secondary}
                  </div>
                )}
              </div>
              {r.amount != null ? (
                <div
                  className={`font-mono text-xs ${toneCls?.iconColor || 'text-neutral-900'}`}
                >
                  {fmtPKR(r.amount)}
                </div>
              ) : r.amountLabel ? (
                <div className="font-mono text-xs text-neutral-700">
                  {r.amountLabel}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {rows.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full border-t border-neutral-100 px-3 py-1 text-[10px] text-blue-700 hover:bg-neutral-50"
        >
          {expanded ? 'Show less' : `Show ${rows.length - 3} more`}
        </button>
      )}
    </div>
  );
}

function formatAction(action: string): string {
  if (action.startsWith('state:'))
    return `State → ${action.slice(6).replace(/_/g, ' ')}`;
  const m: Record<string, string> = {
    created: 'Created',
    updated: 'Edited',
    deleted: 'Removed',
    'pdf:generated': 'PDF generated',
    'whatsapp:sent': 'WhatsApp sent',
    'share-token:issued': 'Share link issued',
    'share-token:revoked': 'Share link revoked',
    'customer:signed-via-token': 'Customer signed (share link)',
    'fbr:submitted': 'FBR submitted',
  };
  return m[action] || action;
}

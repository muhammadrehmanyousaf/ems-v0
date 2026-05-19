'use client';

/**
 * Public customer-share sign page.
 *
 * No auth — token-based access. Customer opens the WhatsApp/email
 * link from the vendor, sees a clean view of the function sheet,
 * reviews PDF, signs in-browser. Backend captures the signature
 * + stamps signaturesJson.customer.{name, signedAt, dataUrl, mode,
 * viaShareToken: true, ipHash}.
 *
 * Note: customer-side signature does NOT auto-advance state to
 * 'signed' — vendor still has to flip the state from the dashboard
 * once both signatures are in. This keeps the vendor in control of
 * the lifecycle (the customer signing isn't the same as the vendor
 * confirming).
 */

import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  Calendar,
  Phone,
  Mail,
  PenLine,
  Type,
  Eye,
  Download,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { BACKEND_URL } from '@/lib/backend-url';
import {
  SignaturePad,
  type SignaturePadHandle,
} from '@/components/dashboard/mainScreens/function-sheets/signature-pad';

// ─── Types mirroring backend response ─────────────────────────────

interface PublicVendor {
  name: string | null;
  ntn: string | null;
  strn: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
}
interface PublicLineItem {
  label: string;
  qty: number | string;
  unitPrice: number | string;
  total?: number | string;
  notes?: string | null;
}
interface PublicSignatureSnapshot {
  name: string | null;
  signedAt: string | null;
  mode: string | null;
}
interface PublicSheet {
  id: number;
  title: string;
  state: string;
  eventDate: string | null;
  validUntil: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  lineItemsJson: PublicLineItem[];
  subtotal: number | string | null;
  discountAmount: number | string | null;
  taxAmount: number | string | null;
  grandTotal: number | string | null;
  termsJson: any;
  paymentScheduleJson: any;
  signatures: {
    vendor: PublicSignatureSnapshot | null;
    customer: PublicSignatureSnapshot | null;
  };
  sentAt: string | null;
  signedAt: string | null;
  paidAt: string | null;
  vendor: PublicVendor;
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
  if (Array.isArray(termsJson.lines)) return termsJson.lines;
  if (typeof termsJson.text === 'string') return [termsJson.text];
  return null;
}

// ─── Page ─────────────────────────────────────────────────────────

export default function PublicSignPage() {
  const params = useParams() as { token: string };
  const token = params?.token;

  const [sheet, setSheet] = useState<PublicSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    status: number;
    message: string;
  } | null>(null);
  const [signOpen, setSignOpen] = useState(false);

  const pdfUrl = useMemo(() => {
    if (!token) return '';
    return `${BACKEND_URL}api/v1/public/function-sheets/share/${token}/pdf`;
  }, [token]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}api/v1/public/function-sheets/share/${token}`,
        { headers: { Accept: 'application/json' }, cache: 'no-store' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({
          status: res.status,
          message: json?.message || `Request failed (${res.status})`,
        });
        setSheet(null);
      } else {
        setSheet(json?.data?.sheet || null);
      }
    } catch (e: any) {
      setError({
        status: 0,
        message: 'Network error — please check your connection',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-32 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  if (error || !sheet) {
    const isExpired = error?.status === 410;
    const isNotFound = error?.status === 404;
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" />
            <h1 className="text-lg font-semibold">
              {isExpired
                ? 'Link expired or revoked'
                : isNotFound
                  ? 'Link not found'
                  : 'Could not load this sheet'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isExpired
                ? "The vendor's share link is no longer active. Please contact them to issue a fresh link."
                : isNotFound
                  ? 'Double-check the URL or ask the vendor to resend.'
                  : error?.message || 'An unknown error occurred.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customerSigned = !!sheet.signatures.customer?.signedAt;
  const vendorSigned = !!sheet.signatures.vendor?.signedAt;
  const terms = termsToList(sheet.termsJson);
  const ps = Array.isArray(sheet.paymentScheduleJson)
    ? sheet.paymentScheduleJson
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:py-10">
      {/* Header / vendor identity */}
      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                From
              </div>
              <div className="flex items-center gap-2 text-base font-semibold">
                <Building className="h-4 w-4 text-neutral-500" />
                {sheet.vendor.name || 'Wedding vendor'}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {sheet.vendor.address && <span>{sheet.vendor.address}</span>}
                {sheet.vendor.phone && (
                  <a
                    href={`tel:${sheet.vendor.phone}`}
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {sheet.vendor.phone}
                  </a>
                )}
                {sheet.vendor.email && (
                  <a
                    href={`mailto:${sheet.vendor.email}`}
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    <Mail className="h-3 w-3" />
                    {sheet.vendor.email}
                  </a>
                )}
              </div>
              {(sheet.vendor.ntn || sheet.vendor.strn) && (
                <div className="text-[11px] text-muted-foreground">
                  {sheet.vendor.ntn ? `NTN ${sheet.vendor.ntn}` : null}
                  {sheet.vendor.ntn && sheet.vendor.strn ? ' · ' : null}
                  {sheet.vendor.strn ? `STRN ${sheet.vendor.strn}` : null}
                </div>
              )}
            </div>
            <Badge variant="outline" className="capitalize">
              {sheet.state.replace(/_/g, ' ')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Title + event */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div>
            <h1 className="text-xl font-bold">{sheet.title}</h1>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
              {sheet.eventDate && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Event: {fmtDate(sheet.eventDate)}
                </span>
              )}
              {sheet.validUntil && (
                <span>Valid until: {fmtDate(sheet.validUntil)}</span>
              )}
            </div>
          </div>

          {sheet.customerName && (
            <div className="rounded-md bg-neutral-50 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Customer:</span>{' '}
              <strong>{sheet.customerName}</strong>
              {sheet.customerPhone && (
                <span className="ml-2 text-muted-foreground">
                  · {sheet.customerPhone}
                </span>
              )}
            </div>
          )}

          {/* Line items */}
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Line items
            </div>
            {sheet.lineItemsJson.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">
                No line items.
              </p>
            ) : (
              <div className="overflow-hidden rounded-md border border-neutral-200">
                <table className="w-full text-xs">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-2 py-2 text-right">Qty</th>
                      <th className="px-2 py-2 text-right">Unit</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.lineItemsJson.map((it, idx) => (
                      <tr
                        key={idx}
                        className={
                          idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                        }
                      >
                        <td className="px-3 py-2">
                          <div>{it.label}</div>
                          {it.notes && (
                            <div className="text-[10px] text-muted-foreground">
                              {it.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {Number(it.qty).toLocaleString('en-PK')}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {fmtPKR(it.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {fmtPKR(it.total ?? Number(it.qty) * Number(it.unitPrice))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-0.5 rounded-md bg-neutral-50 px-3 py-2 text-xs">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
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
            <div className="flex items-center justify-between pt-1 text-sm font-bold text-emerald-700">
              <span>Grand total</span>
              <span>{fmtPKR(sheet.grandTotal)}</span>
            </div>
          </div>

          {/* Terms */}
          {terms && terms.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Terms &amp; conditions
              </div>
              <ul className="list-disc space-y-1 pl-5 text-xs text-neutral-700">
                {terms.map((t, idx) => (
                  <li key={idx} className="whitespace-pre-line">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Payment schedule */}
          {ps && ps.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Payment schedule
              </div>
              <ul className="space-y-1 text-xs text-neutral-700">
                {ps.map((p: any, idx: number) => (
                  <li
                    key={idx}
                    className="flex flex-wrap items-center gap-2 rounded-md bg-neutral-50 px-2 py-1"
                  >
                    <span className="font-medium">{p?.label}</span>
                    {p?.dueDate && (
                      <span className="text-muted-foreground">
                        · due {fmtDate(p.dueDate)}
                      </span>
                    )}
                    <span className="ml-auto font-mono">
                      {fmtPKR(p?.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF actions */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Printable PDF for your records:
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(pdfUrl, '_blank')}
          >
            <Eye className="mr-1 h-3 w-3" />
            Preview
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const a = document.createElement('a');
              a.href = pdfUrl;
              a.download = `function-sheet-${sheet.id}.pdf`;
              a.click();
            }}
          >
            <Download className="mr-1 h-3 w-3" />
            Download
          </Button>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Signatures
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-neutral-200 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Vendor
              </div>
              {vendorSigned ? (
                <>
                  <div className="font-medium">
                    {sheet.signatures.vendor!.name || '—'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    <CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-700" />
                    Signed {fmtDateTime(sheet.signatures.vendor!.signedAt)}
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Not yet signed by vendor
                </div>
              )}
            </div>
            <div
              className={`rounded-md border p-3 ${
                customerSigned ? 'border-emerald-300 bg-emerald-50/40' : ''
              }`}
            >
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Customer (you)
              </div>
              {customerSigned ? (
                <>
                  <div className="font-medium">
                    {sheet.signatures.customer!.name || '—'}
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    <CheckCircle2 className="mr-1 inline h-3 w-3" />
                    Signed {fmtDateTime(sheet.signatures.customer!.signedAt)}
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Not yet signed
                </div>
              )}
            </div>
          </div>
          {!customerSigned ? (
            <Button onClick={() => setSignOpen(true)} className="w-full sm:w-auto">
              <PenLine className="mr-2 h-4 w-4" />
              Sign now
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setSignOpen(true)}
              className="w-full sm:w-auto"
            >
              <PenLine className="mr-2 h-4 w-4" />
              Re-sign (replaces previous)
            </Button>
          )}
        </CardContent>
      </Card>

      <CustomerSignDialog
        open={signOpen}
        onOpenChange={setSignOpen}
        token={token}
        defaultName={
          sheet.signatures.customer?.name ||
          sheet.customerName ||
          ''
        }
        onSigned={async () => {
          setSignOpen(false);
          await load();
          toast.success('Signature saved');
        }}
      />
    </div>
  );
}

// ─── Customer sign dialog ─────────────────────────────────────────

type Mode = 'draw' | 'type';

function CustomerSignDialog({
  open,
  onOpenChange,
  token,
  defaultName,
  onSigned,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  token: string;
  defaultName: string;
  onSigned: () => Promise<void> | void;
}) {
  const [name, setName] = useState(defaultName);
  const [mode, setMode] = useState<Mode>('draw');
  const [submitting, setSubmitting] = useState(false);
  const padRef = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setMode('draw');
    }
  }, [open, defaultName]);

  useEffect(() => {
    if (mode === 'type' && padRef.current) {
      padRef.current.renderTypedSignature(name);
    }
  }, [name, mode]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    const dataUrl = padRef.current?.getDataUrl();
    if (!dataUrl) {
      toast.error(
        mode === 'draw'
          ? 'Please sign in the box above'
          : 'Type your name to render the signature',
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}api/v1/public/function-sheets/share/${token}/sign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            mode: mode === 'draw' ? 'drawn' : 'typed',
            dataUrl,
          }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.message || `Could not save (${res.status})`);
        return;
      }
      await onSigned();
    } catch (e: any) {
      toast.error('Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sign the contract</DialogTitle>
          <DialogDescription>
            Your signature is recorded with a timestamp and shared with
            the vendor. You can re-sign later if needed; the latest
            version always overrides.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">
              Your full name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Type your name as it should appear on the contract"
            />
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList>
              <TabsTrigger value="draw">
                <PenLine className="mr-1 h-3 w-3" />
                Draw
              </TabsTrigger>
              <TabsTrigger value="type">
                <Type className="mr-1 h-3 w-3" />
                Type
              </TabsTrigger>
            </TabsList>

            <TabsContent value="draw" className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Sign using your finger (mobile) or mouse. The line
                thickness adjusts to your speed.
              </div>
              <SignaturePad ref={padRef} width={480} height={180} />
            </TabsContent>

            <TabsContent value="type" className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Your name above is rendered in cursive — useful if you
                can't easily draw on a touchscreen.
              </div>
              <SignaturePad ref={padRef} width={480} height={180} />
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

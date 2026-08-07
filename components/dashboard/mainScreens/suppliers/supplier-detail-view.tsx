'use client';

/**
 * Supplier detail — the mirror of the staff page, with the money flowing out.
 *
 * Staff asks "how much do you owe me". This asks the same question from the
 * other side: what do I owe this supplier, and what is already overdue. Those
 * are the two numbers a vendor needs before picking up the phone to the tent
 * wallah in December, and before this page they lived in an invoice list
 * filtered by hand.
 *
 * Outstanding leads, overdue is called out separately in red, and every invoice
 * tied to an event links to that booking — so "which wedding was this for?" is
 * one click.
 *
 * `amountPaid` is respected throughout: a Rs 200,000 invoice with Rs 150,000
 * against it shows Rs 50,000 outstanding, not Rs 200,000. Partial settlement is
 * the norm with Pakistani suppliers, not an edge case.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Building,
  FileText,
  Phone,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SupplierAPI, type Supplier, type SupplierInvoice } from '@/lib/api/suppliers';
import { todayInKarachi } from "@/lib/utils/pk-date"

const n = (v: number | string | null | undefined) => Number(v) || 0;
const fmtPKR = (v: number | string | null | undefined) =>
  `Rs. ${Math.round(n(v)).toLocaleString('en-PK')}`;
const dial = (v: string | null | undefined) => String(v || '').replace(/\D/g, '');

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-neutral-500 shrink-0">{label}</span>
      <span className="font-medium text-neutral-800 text-right break-all">{children}</span>
    </div>
  );
}

export default function SupplierDetailView({ supplierId }: { supplierId: number }) {
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  // The API already computes outstanding server-side. Prefer its number over a
  // client sum: the invoice list here is capped, so recomputing from it would
  // quietly under-report the debt on a supplier with a long history.
  const [serverOutstanding, setServerOutstanding] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!Number.isFinite(supplierId)) {
      setError('Invalid supplier id');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await SupplierAPI.get(supplierId);
        if (cancelled) return;
        if (!res?.supplier) {
          setError('Supplier not found');
          setLoading(false);
          return;
        }
        setSupplier(res.supplier);
        setServerOutstanding(Number(res.outstanding) || 0);
        const inv = await SupplierAPI.listInvoices({ supplierId }).catch(() => ({
          invoices: [] as SupplierInvoice[],
          summary: {} as any,
        }));
        if (!cancelled) setInvoices(inv.invoices ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.message || 'Failed to load supplier');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supplierId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/suppliers')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Suppliers
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {error || 'Supplier not found'}
        </div>
      </div>
    );
  }

  const outstandingInvoices = invoices.filter(
    (i) => n(i.totalAmount) - n(i.amountPaid) > 0,
  );
  const outstanding =
    serverOutstanding != null
      ? serverOutstanding
      : outstandingInvoices.reduce((sum, i) => sum + (n(i.totalAmount) - n(i.amountPaid)), 0);
  const today = todayInKarachi();
  const overdueInvoices = outstandingInvoices.filter(
    (i) => i.dueDate && i.dueDate.slice(0, 10) < today,
  );
  const overdue = overdueInvoices.reduce(
    (sum, i) => sum + (n(i.totalAmount) - n(i.amountPaid)),
    0,
  );

  const phone = supplier.phoneNumber || supplier.whatsappNumber;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1"
            onClick={() => router.push('/dashboard/suppliers')}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Suppliers
          </Button>
          <h1 className="text-2xl font-semibold text-neutral-900">{supplier.name}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {supplier.category}
            {supplier.contactPerson ? ` · ${supplier.contactPerson}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              supplier.isActive
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-neutral-100 text-neutral-600 border-neutral-300',
            )}
          >
            {supplier.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {phone && (
            <>
              <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
                <a
                  href={`https://wa.me/${dial(phone).replace(/^0/, '92')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
                <a href={`tel:${dial(phone)}`}>
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* What we owe — leads, because it is the reason to open this page. */}
          <Card className={cn(overdue > 0 ? 'border-red-300 bg-red-50/40' : outstanding > 0 && 'border-amber-300 bg-amber-50/40')}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet
                    className={cn(
                      'h-4 w-4',
                      overdue > 0 ? 'text-red-700' : outstanding > 0 ? 'text-amber-700' : 'text-bridal-gold',
                    )}
                  />
                  <span className="text-sm font-semibold text-neutral-700">
                    Outstanding to {supplier.name}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs bg-white">
                  {fmtPKR(outstanding)}
                </Badge>
              </div>

              {/* Overdue is called out separately — "you owe 400k" and "180k of
                  it was due three weeks ago" are different conversations. */}
              {overdue > 0 && (
                <div className="ml-6 flex items-center gap-2 rounded-md border border-red-200 bg-white px-2.5 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                  <span className="text-[12px] text-red-800">
                    <strong>{fmtPKR(overdue)}</strong> is past its due date
                    {overdueInvoices.length > 1 ? ` across ${overdueInvoices.length} invoices` : ''}.
                  </span>
                </div>
              )}

              {outstandingInvoices.length === 0 ? (
                <p className="ml-6 text-sm text-neutral-500">
                  Nothing outstanding. Every invoice is settled.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {outstandingInvoices.map((i) => {
                    const left = n(i.totalAmount) - n(i.amountPaid);
                    const partly = n(i.amountPaid) > 0;
                    const isOverdue = !!i.dueDate && i.dueDate.slice(0, 10) < today;
                    return (
                      <li
                        key={i.id}
                        className={cn(
                          'flex items-center justify-between gap-3 rounded-md border bg-white px-2.5 py-2',
                          isOverdue ? 'border-red-200' : 'border-neutral-100',
                        )}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-neutral-800">
                            {fmtPKR(left)}
                            {partly && (
                              <span className="ml-2 text-[11px] font-normal text-neutral-500">
                                of {fmtPKR(i.totalAmount)} — part-paid
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            {i.invoiceNumber ? `${i.invoiceNumber} · ` : ''}
                            {i.dueDate ? `due ${fmtDate(i.dueDate)}` : `raised ${fmtDate(i.invoiceDate)}`}
                          </div>
                        </div>
                        {i.bookingId && (
                          <Link
                            href={`/dashboard/bookings/${i.bookingId}`}
                            className="shrink-0 text-[12px] text-bridal-gold hover:underline"
                          >
                            Booking #{i.bookingId} →
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Everything billed, settled or not */}
          {invoices.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-bridal-gold" />
                    <span className="text-sm font-semibold text-neutral-700">All invoices</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {invoices.length}
                  </Badge>
                </div>
                <ul className="space-y-1.5">
                  {invoices.slice(0, 25).map((i) => (
                    <li
                      key={i.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-neutral-100 px-2.5 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-neutral-800">
                          {fmtPKR(i.totalAmount)}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {i.invoiceNumber ? `${i.invoiceNumber} · ` : ''}
                          {fmtDate(i.invoiceDate)}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] py-0 capitalize shrink-0">
                        {String(i.status).replace(/_/g, ' ')}
                      </Badge>
                    </li>
                  ))}
                </ul>
                {invoices.length > 25 && (
                  <p className="text-[11px] text-neutral-400">
                    Showing the 25 most recent of {invoices.length}.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">Contact</span>
              </div>
              <div className="space-y-1.5 ml-6">
                {supplier.contactPerson && <Row label="Person">{supplier.contactPerson}</Row>}
                {supplier.phoneNumber && (
                  <Row label="Phone">
                    <a href={`tel:${dial(supplier.phoneNumber)}`} className="hover:underline">
                      {supplier.phoneNumber}
                    </a>
                  </Row>
                )}
                {supplier.address && <Row label="Address">{supplier.address}</Row>}
                {supplier.ntn && <Row label="NTN">{supplier.ntn}</Row>}
                {supplier.strn && <Row label="STRN">{supplier.strn}</Row>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">Payment terms</span>
              </div>
              <div className="space-y-1.5 ml-6">
                <Row label="Terms">
                  {supplier.defaultPaymentTermsDays
                    ? `${supplier.defaultPaymentTermsDays} days`
                    : 'On receipt'}
                </Row>
                {n(supplier.creditLimit) > 0 && (
                  <Row label="Credit limit">{fmtPKR(supplier.creditLimit)}</Row>
                )}
                {supplier.jazzcashNumber && <Row label="JazzCash">{supplier.jazzcashNumber}</Row>}
                {supplier.easypaisaNumber && <Row label="Easypaisa">{supplier.easypaisaNumber}</Row>}
                {supplier.raastId && <Row label="Raast">{supplier.raastId}</Row>}
                {supplier.bankName && (
                  <Row label="Bank">
                    {supplier.bankName}
                    {supplier.bankAccountNumber ? ` · ${supplier.bankAccountNumber}` : ''}
                  </Row>
                )}
              </div>
              {/* Over the credit limit is a real operational stop — a supplier
                  will refuse the next delivery, and that is a wedding day. */}
              {n(supplier.creditLimit) > 0 && outstanding > n(supplier.creditLimit) && (
                <div className="ml-6 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                  <span className="text-[12px] text-red-800">
                    Outstanding is over the agreed credit limit.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * Lead detail — the object page that did not exist.
 *
 * Every other spine object has a real page: a booking, a customer, a function
 * sheet. A lead had only a row in a list. That is backwards for a marketplace:
 * the lead is where money STARTS, and it is the one object a vendor touches
 * before they have any relationship to fall back on.
 *
 * What it answers, in the order a vendor asks:
 *   who is this        contact, and how to reach them right now
 *   what do they want  event type, date, guests, budget, their own words
 *   where is it        status, who owns it, when to chase
 *   did it convert     the booking it became, drilling straight through
 *
 * The "did it convert" line is the point of the whole object. A lead that
 * became a booking and a lead that went cold look identical in a list.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Inbox,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import {
  LeadAPI,
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_TONES,
  type Lead,
  type LeadStatus,
} from '@/lib/api/leads';

function fmtPKR(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) return '—';
  return `Rs. ${Math.round(x).toLocaleString('en-PK')}`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function fmtWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-PK', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/** Digits-only for a tel:/wa.me link. Pakistani numbers are typed every way imaginable. */
function dial(v: string | null | undefined): string {
  return String(v || '').replace(/\D/g, '');
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-neutral-500 shrink-0">{label}</span>
      <span className="font-medium text-neutral-800 text-right">{children}</span>
    </div>
  );
}

export default function LeadDetailView({ leadId }: { leadId: number }) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  // LEAD-1 — the desktop lead detail had no way to advance a lead's status
  // (only WhatsApp/Call/Contact); the status transitions were mobile-only.
  // Surface a status control here so a desktop vendor can move New → Qualified
  // → Booked etc. Writes route through /transition (LeadAPI.transition).
  const handleStatusChange = async (to: LeadStatus) => {
    if (!lead || to === lead.status || savingStatus) return;
    setSavingStatus(true);
    try {
      const updated = await LeadAPI.transition(lead.id, { to });
      setLead(updated);
      toast({ title: `Lead marked "${LEAD_STATUS_LABELS?.[to] ?? to}"` });
    } catch (e: any) {
      toast({
        title: "Couldn't update status",
        description: e?.response?.data?.message || "Try again.",
      });
    } finally {
      setSavingStatus(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (!Number.isFinite(leadId)) {
      setError('Invalid lead id');
      setLoading(false);
      return;
    }
    LeadAPI.get(leadId)
      .then((l) => {
        if (cancelled) return;
        if (!l) setError('Lead not found');
        else setLead(l);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.response?.data?.message || 'Failed to load lead');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/leads')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Lead inbox
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {error || 'Lead not found'}
        </div>
      </div>
    );
  }

  const name = lead.contactName || lead.contactPhone || lead.contactEmail || `Lead #${lead.id}`;
  const phone = lead.contactPhone || lead.contactWhatsapp;
  // LEAD_STATUS_TONES is a {bg,text,border} triple, not a class string — the
  // same shape the leads list uses. Compose it rather than casting.
  const t = LEAD_STATUS_TONES?.[lead.status];
  const tone = t ? `${t.bg} ${t.text} ${t.border}` : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1"
            onClick={() => router.push('/dashboard/leads')}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Lead inbox
          </Button>
          <h1 className="text-2xl font-semibold text-neutral-900">{name}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Lead #{lead.id} · {LEAD_SOURCE_LABELS?.[lead.source] ?? lead.source} ·{' '}
            {fmtWhen(lead.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn('text-xs', tone)}>
            {LEAD_STATUS_LABELS?.[lead.status] ?? lead.status}
          </Badge>
          {/* Reply where Pakistani vendors actually reply. WhatsApp first —
              it is the channel, not a nice-to-have. */}
          {phone && (
            <>
              <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
                <a href={`https://wa.me/${dial(phone).replace(/^0/, '92')}`} target="_blank" rel="noreferrer">
                  <MessageSquareText className="h-3.5 w-3.5" /> WhatsApp
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
          {/* Contact */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">Contact</span>
              </div>
              <div className="space-y-1.5 ml-6">
                <Row label="Name">{lead.contactName || '—'}</Row>
                {lead.contactPhone && (
                  <Row label="Phone">
                    <a href={`tel:${dial(lead.contactPhone)}`} className="hover:underline">
                      {lead.contactPhone}
                    </a>
                  </Row>
                )}
                {lead.contactWhatsapp && lead.contactWhatsapp !== lead.contactPhone && (
                  <Row label="WhatsApp">{lead.contactWhatsapp}</Row>
                )}
                {lead.contactEmail && (
                  <Row label="Email">
                    <a href={`mailto:${lead.contactEmail}`} className="hover:underline">
                      {lead.contactEmail}
                    </a>
                  </Row>
                )}
                {/* A lead whose contact is a registered customer drills to that
                    customer's 360 — their whole history with this vendor. */}
                {lead.contactCustomer?.email && (
                  <Row label="Customer record">
                    <Link
                      href={`/dashboard/customers/${encodeURIComponent(lead.contactCustomer.email)}`}
                      className="text-bridal-gold hover:underline"
                    >
                      View history →
                    </Link>
                  </Row>
                )}
              </div>
            </CardContent>
          </Card>

          {/* What they asked for */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">The enquiry</span>
              </div>
              <div className="space-y-1.5 ml-6">
                <Row label="Event">{lead.eventType || '—'}</Row>
                <Row label="Date">{fmtDate(lead.eventDate)}</Row>
                <Row label="Guests">
                  {lead.estimatedGuests ? (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-neutral-400" />
                      {lead.estimatedGuests}
                    </span>
                  ) : (
                    '—'
                  )}
                </Row>
                <Row label="Budget">
                  <span className="inline-flex items-center gap-1">
                    <Wallet className="h-3.5 w-3.5 text-neutral-400" />
                    {fmtPKR(lead.estimatedBudget)}
                  </span>
                </Row>
              </div>
              {lead.inquiry && (
                <div className="ml-6 rounded-md border border-neutral-100 bg-neutral-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">
                    In their words
                  </p>
                  <p className="whitespace-pre-line text-sm text-neutral-700">{lead.inquiry}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {lead.notes && (
            <Card>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-bridal-gold" />
                  <span className="text-sm font-semibold text-neutral-700">Internal notes</span>
                </div>
                <p className="whitespace-pre-line text-sm text-neutral-700 ml-6">{lead.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          {/* Did it convert — the reason this page exists. */}
          <Card className={cn(lead.bookingId ? 'border-emerald-200' : undefined)}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">Outcome</span>
              </div>
              {lead.bookingId ? (
                <div className="ml-6 space-y-2">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                    Converted
                  </Badge>
                  <Link
                    href={`/dashboard/bookings/${lead.bookingId}`}
                    className="block rounded-md border border-neutral-100 px-2.5 py-2 hover:bg-neutral-50"
                  >
                    <div className="text-sm font-medium text-neutral-800">
                      Booking #{lead.bookingId}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      {lead.booking?.bookingDate ? fmtDate(lead.booking.bookingDate) : 'View booking'}
                      {lead.booking?.status ? ` · ${lead.booking.status}` : ''}
                    </div>
                  </Link>
                  {lead.functionSheetId && (
                    <Link
                      href={`/dashboard/function-sheets/${lead.functionSheetId}`}
                      className="block text-[12px] text-bridal-gold hover:underline"
                    >
                      Function sheet #{lead.functionSheetId} →
                    </Link>
                  )}
                </div>
              ) : (
                <p className="ml-6 text-sm text-neutral-500">
                  Not converted yet. Reply on WhatsApp, then mark the status so it stops
                  showing as unanswered.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Ownership + timing */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">Tracking</span>
              </div>
              <div className="space-y-1.5 ml-6">
                <Row label="Status">
                  <select
                    value={lead.status}
                    disabled={savingStatus}
                    onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                    aria-label="Lead status"
                    className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-bridal-gold/40 disabled:opacity-50"
                  >
                    {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {savingStatus && <Loader2 className="inline-block ml-2 h-3.5 w-3.5 animate-spin text-neutral-400" />}
                </Row>
                {lead.statusReason && <Row label="Reason">{lead.statusReason}</Row>}
                <Row label="Owner">
                  {lead.assignedTo?.fullName || lead.createdBy?.fullName || '—'}
                </Row>
                <Row label="Received">{fmtWhen(lead.createdAt)}</Row>
                <Row label="First reply">
                  {lead.respondedAt ? (
                    fmtWhen(lead.respondedAt)
                  ) : (
                    <span className="text-amber-700">Not yet</span>
                  )}
                </Row>
                <Row label="Next follow-up">{fmtWhen(lead.nextFollowUpAt)}</Row>
                <Row label="Last activity">{fmtWhen(lead.lastActivityAt)}</Row>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

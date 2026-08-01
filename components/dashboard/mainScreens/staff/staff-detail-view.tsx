'use client';

/**
 * Staff member detail — the object page for one crew member.
 *
 * The question this page exists to answer is the one a vendor gets asked in
 * person, usually on a Monday morning: "Mera kitna baqi hai?" — how much do you
 * still owe me. Before this, the answer lived in a shifts list filtered by hand,
 * and the staff screen was a directory of names and phone numbers.
 *
 * So the money leads. Unpaid comes first, then partially paid, then the history.
 * `partial` is a first-class state on this platform — a dihari worker paid
 * Rs 1,500 of Rs 2,000 is not "unpaid", and treating them as such is how a
 * vendor loses a good crew member.
 *
 * Every shift that belongs to an event links to that booking, so "which wedding
 * was that?" is one click, not a memory test.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  IdCard,
  Phone,
  ShieldAlert,
  User,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { StaffAPI, type StaffMember, type StaffShift } from '@/lib/api/staff';

const n = (v: number | string | null | undefined) => Number(v) || 0;

function fmtPKR(v: number | string | null | undefined): string {
  const x = n(v);
  return `Rs. ${Math.round(x).toLocaleString('en-PK')}`;
}

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

/** Digits only — Pakistani numbers get typed every way imaginable. */
const dial = (v: string | null | undefined) => String(v || '').replace(/\D/g, '');

export default function StaffDetailView({ staffId }: { staffId: number }) {
  const router = useRouter();
  const [member, setMember] = useState<StaffMember | null>(null);
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!Number.isFinite(staffId)) {
      setError('Invalid staff id');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const m = await StaffAPI.getMember(staffId);
        if (cancelled) return;
        if (!m) {
          setError('Staff member not found');
          setLoading(false);
          return;
        }
        setMember(m);
        // Best-effort: a missing shift history must not blank the page.
        const s = await StaffAPI.listShifts({ staffMemberId: staffId }).catch(() => ({
          shifts: [] as StaffShift[],
        }));
        if (!cancelled) setShifts(s.shifts ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.message || 'Failed to load staff member');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [staffId]);

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

  if (error || !member) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/staff')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Staff
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {error || 'Staff member not found'}
        </div>
      </div>
    );
  }

  // Owed = net payable minus what has actually been paid, across every shift.
  // `paidAmount` is what makes a partial payment count properly; without it a
  // Rs 1,500-of-2,000 shift reads as fully outstanding.
  const owed = shifts.reduce((sum, s) => {
    const net = n(s.netPayable);
    const paid = n((s as any).paidAmount);
    const remaining = Math.max(0, net - paid);
    return sum + remaining;
  }, 0);

  const unpaidShifts = shifts.filter((s) => {
    const remaining = n(s.netPayable) - n((s as any).paidAmount);
    return remaining > 0;
  });

  const phone = member.phoneNumber || member.whatsappNumber;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1"
            onClick={() => router.push('/dashboard/staff')}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Staff
          </Button>
          <h1 className="text-2xl font-semibold text-neutral-900">{member.fullName}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {member.role}
            {member.employmentType ? ` · ${member.employmentType}` : ''}
            {member.joinedDate ? ` · joined ${fmtDate(member.joinedDate)}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              member.isActive
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-neutral-100 text-neutral-600 border-neutral-300',
            )}
          >
            {member.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {phone && (
            <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
              <a href={`tel:${dial(phone)}`}>
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Money owed — the reason this page exists, so it leads. */}
          <Card className={cn(owed > 0 && 'border-amber-300 bg-amber-50/40')}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet
                    className={cn('h-4 w-4', owed > 0 ? 'text-amber-700' : 'text-bridal-gold')}
                  />
                  <span className="text-sm font-semibold text-neutral-700">
                    Still owed to {member.fullName.split(' ')[0]}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    owed > 0 ? 'border-amber-300 bg-white text-amber-900' : undefined,
                  )}
                >
                  {fmtPKR(owed)}
                </Badge>
              </div>
              {unpaidShifts.length === 0 ? (
                <p className="ml-6 text-sm text-neutral-500">
                  Nothing outstanding. Every shift is settled.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {unpaidShifts.map((s) => {
                    const remaining = n(s.netPayable) - n((s as any).paidAmount);
                    const partly = n((s as any).paidAmount) > 0;
                    return (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-white px-2.5 py-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-neutral-800">
                            {fmtPKR(remaining)}
                            {partly && (
                              <span className="ml-2 text-[11px] font-normal text-neutral-500">
                                of {fmtPKR(s.netPayable)} — part-paid
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            {fmtDate(s.shiftDate)}
                            {s.roleSnapshot ? ` · ${s.roleSnapshot}` : ''}
                          </div>
                        </div>
                        {s.bookingId && (
                          <Link
                            href={`/dashboard/bookings/${s.bookingId}`}
                            className="shrink-0 text-[12px] text-bridal-gold hover:underline"
                          >
                            Booking #{s.bookingId} →
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Full shift history */}
          {shifts.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-bridal-gold" />
                    <span className="text-sm font-semibold text-neutral-700">Shifts</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {shifts.length}
                  </Badge>
                </div>
                <ul className="space-y-1.5">
                  {shifts.slice(0, 25).map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-neutral-100 px-2.5 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-neutral-800">
                          {fmtDate(s.shiftDate)}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {fmtPKR(s.netPayable)}
                          {s.bookingId ? ` · booking #${s.bookingId}` : ' · no event'}
                        </div>
                      </div>
                      {s.bookingId && (
                        <Link
                          href={`/dashboard/bookings/${s.bookingId}`}
                          className="shrink-0 text-[12px] text-bridal-gold hover:underline"
                        >
                          Open →
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
                {shifts.length > 25 && (
                  <p className="text-[11px] text-neutral-400">
                    Showing the 25 most recent of {shifts.length}.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Contact + identity */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">Contact</span>
              </div>
              <div className="space-y-1.5 ml-6">
                {member.phoneNumber && (
                  <Row label="Phone">
                    <a href={`tel:${dial(member.phoneNumber)}`} className="hover:underline">
                      {member.phoneNumber}
                    </a>
                  </Row>
                )}
                {member.whatsappNumber && member.whatsappNumber !== member.phoneNumber && (
                  <Row label="WhatsApp">{member.whatsappNumber}</Row>
                )}
                {/* nicDisplay is the masked form. Never render the raw NIC on a
                    page a passing colleague can read over a shoulder. */}
                {member.nicDisplay && (
                  <Row label="NIC">
                    <span className="inline-flex items-center gap-1">
                      <IdCard className="h-3.5 w-3.5 text-neutral-400" />
                      {member.nicDisplay}
                    </span>
                  </Row>
                )}
                {member.business?.name && <Row label="Venue">{member.business.name}</Row>}
              </div>
            </CardContent>
          </Card>

          {/* How they get paid */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">Pay</span>
              </div>
              <div className="space-y-1.5 ml-6">
                {n(member.defaultDihariRate) > 0 && (
                  <Row label="Dihari rate">{fmtPKR(member.defaultDihariRate)}</Row>
                )}
                {n(member.monthlySalary) > 0 && (
                  <Row label="Monthly">{fmtPKR(member.monthlySalary)}</Row>
                )}
                {member.jazzcashNumber && <Row label="JazzCash">{member.jazzcashNumber}</Row>}
                {member.easypaisaNumber && <Row label="Easypaisa">{member.easypaisaNumber}</Row>}
                {member.bankName && (
                  <Row label="Bank">
                    {member.bankName}
                    {member.bankAccountNumber ? ` · ${member.bankAccountNumber}` : ''}
                  </Row>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emergency contact — a crew member on a venue floor at 2am is a
              safety matter, not an admin field. */}
          {member.emergencyContactPhone && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-bridal-gold" />
                  <span className="text-sm font-semibold text-neutral-700">In an emergency</span>
                </div>
                <div className="space-y-1.5 ml-6">
                  <Row label="Contact">{member.emergencyContactName || '—'}</Row>
                  <Row label="Phone">
                    <a href={`tel:${dial(member.emergencyContactPhone)}`} className="hover:underline">
                      {member.emergencyContactPhone}
                    </a>
                  </Row>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

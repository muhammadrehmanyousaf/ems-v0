'use client';

/**
 * Staff — redesigned (Track C). "Shifts & payroll" tab.
 *
 * The redesign-style SHELL for the payroll subsystem ported from the original
 * staff-view.tsx ShiftsTab. Built on the redesign primitives (PageHeader stat
 * banner, DataTable/Column, StatusPill, MoneyCell, Icon, Button). Row actions
 * open the REUSED dialogs (payroll-dialogs.tsx — same forms + same StaffAPI
 * calls as the original). Functional parity: outstanding-pay banner, shift
 * table (base+OT+bonus−deduction → gross / net / status), Log shift, Mark paid
 * (partial-aware), Dispute, Void, attendance (check-in/out/absent/excused/
 * replaced) and the flag-gated leave queue.
 *
 * Live-system safety: pure consumer of /api/v1/staff. Original file untouched.
 */

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  StaffAPI,
  STAFF_ROLE_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  ATTENDANCE_STATUS_LABELS,
  type StaffShift,
  type PaymentStatus,
  type AttendanceStatus,
} from '@/lib/api/staff';
import { PageHeader } from '@/components/dashboard/primitives/page-header';
import { StatCard } from '@/components/dashboard/primitives/stat-card';
import { DataTable, type Column } from '@/components/dashboard/primitives/data-table';
import { StatusPill, type StatusTone } from '@/components/dashboard/primitives/status-pill';
import { MoneyCell, formatPkr } from '@/components/dashboard/primitives/money-cell';
import { Icon } from '@/components/dashboard/shared/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { showSuccessToast } from '@/lib/toast/undo';
import { StaffLeaveQueue } from '@/components/staff-portal/staff-leave-queue';
import {
  ShiftDialog,
  PayDialog,
  DisputeDialog,
  VoidDialog,
  ReplaceDialog,
  type VendorBusinessOption,
} from './payroll-dialogs';

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0);

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso as string;
  }
}

// Payment-status → forward transitions a vendor can take (mirrors the original).
const NEXT_STATUS_OPTIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['paid', 'disputed', 'void'],
  partial: ['paid', 'disputed', 'void'],
  paid: ['disputed'],
  disputed: ['paid', 'void', 'pending'],
  void: ['pending'],
};

// Forward attendance actions ('replaced' handled via dialog, not a plain button).
const NEXT_ATTENDANCE_OPTIONS: Record<AttendanceStatus, AttendanceStatus[]> = {
  scheduled: ['checked_in', 'absent', 'excused'],
  checked_in: ['completed', 'absent'],
  completed: ['checked_in'],
  absent: ['excused', 'scheduled'],
  excused: ['scheduled', 'absent'],
  replaced: ['scheduled'],
};

const PAYMENT_TONE: Record<PaymentStatus, StatusTone> = {
  pending: 'warning',
  partial: 'warning',
  paid: 'success',
  disputed: 'error',
  void: 'neutral',
};

const ATTENDANCE_TONE: Record<AttendanceStatus, StatusTone> = {
  scheduled: 'neutral',
  checked_in: 'info',
  completed: 'success',
  absent: 'error',
  excused: 'warning',
  replaced: 'info',
};

export function PayrollTab({ businesses }: { businesses: VendorBusinessOption[] }) {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = React.useState<PaymentStatus | 'all'>('all');
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  // Dialog targets.
  const [addOpen, setAddOpen] = React.useState(false);
  const [payShift, setPayShift] = React.useState<StaffShift | null>(null);
  const [disputeShift, setDisputeShift] = React.useState<StaffShift | null>(null);
  const [voidShift, setVoidShift] = React.useState<StaffShift | null>(null);
  const [replaceShift, setReplaceShift] = React.useState<StaffShift | null>(null);
  const [deleteShift, setDeleteShift] = React.useState<StaffShift | null>(null);

  const shiftsQuery = useQuery({
    queryKey: ['staff-redesigned-shifts', statusFilter, fromDate, toDate],
    queryFn: () =>
      StaffAPI.listShifts({
        paymentStatus: statusFilter === 'all' ? undefined : statusFilter,
        from: fromDate || undefined,
        to: toDate || undefined,
      }),
  });
  const payrollQuery = useQuery({
    queryKey: ['staff-redesigned-payroll', fromDate, toDate],
    queryFn: () =>
      StaffAPI.payrollSummary({ from: fromDate || undefined, to: toDate || undefined }),
  });
  const membersQuery = useQuery({
    queryKey: ['staff-redesigned-members-active'],
    queryFn: () => StaffAPI.listMembers({ isActive: true }),
  });

  const shifts = shiftsQuery.data?.shifts ?? [];
  const summary = payrollQuery.data ?? {
    totalShifts: 0,
    byStatus: {},
    byMethod: {},
    pendingTotal: 0,
    paidTotal: 0,
    disputedTotal: 0,
  };
  const members = membersQuery.data?.members ?? [];

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ['staff-redesigned-shifts'] }).then(() => {
      qc.invalidateQueries({ queryKey: ['staff-redesigned-payroll'] });
    });

  const outstanding = summary.outstandingTotal ?? summary.pendingTotal;
  const partialBalance = Math.max(0, (summary.outstandingTotal ?? 0) - summary.pendingTotal);

  // Quick (no-dialog) payment transitions; the rest open a capture dialog.
  const handleTransition = async (shift: StaffShift, to: PaymentStatus) => {
    if (to === 'paid') return setPayShift(shift);
    if (to === 'disputed') return setDisputeShift(shift);
    if (to === 'void') return setVoidShift(shift);
    setBusyId(shift.id);
    try {
      await StaffAPI.transitionShift(shift.id, { to });
      showSuccessToast(`Moved to ${PAYMENT_STATUS_LABELS[to]}`);
      await refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Transition failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleAttendance = async (shift: StaffShift, to: AttendanceStatus) => {
    if (to === 'replaced') return setReplaceShift(shift);
    setBusyId(shift.id);
    try {
      await StaffAPI.markAttendance(shift.id, { to });
      showSuccessToast(`Attendance: ${ATTENDANCE_STATUS_LABELS[to]}`);
      await refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not update attendance');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteShift) return;
    setBusyId(deleteShift.id);
    try {
      await StaffAPI.removeShift(deleteShift.id);
      showSuccessToast('Shift removed');
      setDeleteShift(null);
      await refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not remove shift');
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<StaffShift>[] = [
    {
      key: 'date',
      header: 'Date',
      cellClassName: 'whitespace-nowrap text-muted-foreground',
      render: (s) => fmtDate(s.shiftDate),
    },
    {
      key: 'staff',
      header: 'Staff',
      render: (s) => (
        <div className="min-w-0">
          <div className="font-medium">{s.staffNameSnapshot}</div>
          <div className="text-xs text-muted-foreground">
            {STAFF_ROLE_LABELS[s.roleSnapshot] || s.roleSnapshot}
            {s.booking?.id ? ` · Booking #${s.booking.id}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'breakdown',
      header: 'Base / OT / Bonus / Ded.',
      render: (s) => {
        const base = num(s.dihariRate);
        const ot = num(s.overtimeHours) * num(s.overtimeRate);
        const bonus = num(s.bonusAmount);
        const ded = num(s.deductionAmount);
        return (
          <div className="flex flex-wrap gap-1 text-[11px]">
            <span className="rounded bg-muted px-1.5 py-0.5">Base {formatPkr(base)}</span>
            {ot > 0 && (
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                +OT {formatPkr(ot)}
              </span>
            )}
            {bonus > 0 && (
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                +Bonus {formatPkr(bonus)}
              </span>
            )}
            {ded > 0 && (
              <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700 dark:bg-red-500/15 dark:text-red-300">
                −Ded {formatPkr(ded)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'gross',
      header: 'Gross',
      align: 'right',
      render: (s) => <MoneyCell amount={Math.round(num(s.grossPayable))} tone="muted" />,
    },
    {
      key: 'net',
      header: 'Net',
      align: 'right',
      render: (s) => {
        const net = Math.round(num(s.netPayable));
        const balance =
          s.paymentStatus === 'partial'
            ? Math.max(0, net - Math.round(num(s.paidAmount)))
            : 0;
        return (
          <div className="text-right">
            <MoneyCell
              amount={net}
              tone={s.paymentStatus === 'paid' ? 'success' : 'default'}
            />
            {(s.paymentStatus === 'paid' || s.paymentStatus === 'partial') &&
              s.paidAmount != null && (
                <div
                  className={
                    s.paymentStatus === 'partial'
                      ? 'text-[11px] text-amber-600 dark:text-amber-400'
                      : 'text-[11px] text-emerald-600 dark:text-emerald-400'
                  }
                >
                  Paid {formatPkr(Math.round(num(s.paidAmount)))}
                  {s.paidVia ? ` · ${PAYMENT_METHOD_LABELS[s.paidVia]}` : ''}
                  {s.paymentStatus === 'partial' && balance > 0 && (
                    <span className="block font-semibold">
                      {formatPkr(balance)} due
                    </span>
                  )}
                </div>
              )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => {
        const att = s.attendanceStatus || 'scheduled';
        return (
          <div className="flex flex-col items-start gap-1">
            <StatusPill tone={PAYMENT_TONE[s.paymentStatus]} variant="icon">
              {PAYMENT_STATUS_LABELS[s.paymentStatus]}
            </StatusPill>
            <StatusPill tone={ATTENDANCE_TONE[att]}>
              {ATTENDANCE_STATUS_LABELS[att]}
            </StatusPill>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => {
        const att = s.attendanceStatus || 'scheduled';
        const attNext = NEXT_ATTENDANCE_OPTIONS[att] || [];
        return (
          <div className="flex flex-col items-end gap-1">
            {/* Payment transitions */}
            <div className="flex flex-wrap items-center justify-end gap-1">
              {NEXT_STATUS_OPTIONS[s.paymentStatus].map((to) => (
                <Button
                  key={to}
                  size="sm"
                  variant="outline"
                  disabled={busyId === s.id}
                  onClick={() => handleTransition(s, to)}
                  className="h-7 px-2 text-xs"
                >
                  {to === 'paid'
                    ? 'Mark paid'
                    : to === 'disputed'
                      ? 'Dispute'
                      : to === 'void'
                        ? 'Void'
                        : PAYMENT_STATUS_LABELS[to]}
                </Button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                disabled={busyId === s.id}
                onClick={() =>
                  StaffAPI.openPayslipPdf(s.id).catch(() =>
                    toast.error('Could not open payslip'),
                  )
                }
                aria-label="Open payslip"
                className="h-7 px-2 text-xs"
              >
                <Icon name="FileText" size={13} className="mr-1" /> Payslip
              </Button>
              {s.paymentStatus !== 'paid' && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === s.id}
                  onClick={() => setDeleteShift(s)}
                  aria-label="Remove shift"
                  className="h-7 px-2"
                >
                  <Icon name="Trash2" size={13} className="text-muted-foreground hover:text-destructive" />
                </Button>
              )}
            </div>
            {/* Attendance transitions */}
            <div className="flex flex-wrap items-center justify-end gap-1">
              {attNext.map((to) => (
                <Button
                  key={to}
                  size="sm"
                  variant="outline"
                  disabled={busyId === s.id}
                  onClick={() => handleAttendance(s, to)}
                  className="h-7 px-2 text-xs"
                >
                  {to === 'checked_in'
                    ? 'Check in'
                    : to === 'completed'
                      ? 'Worked'
                      : ATTENDANCE_STATUS_LABELS[to]}
                </Button>
              ))}
              {att !== 'replaced' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === s.id}
                  onClick={() => handleAttendance(s, 'replaced')}
                  className="h-7 px-2 text-xs"
                >
                  <Icon name="Repeat" size={13} className="mr-1" /> Replace
                </Button>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operate"
        title="Shifts & payroll"
        description="Append-only payroll ledger — every shift snapshots staff name, role and pay math so the record stays auditable forever."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Icon name="Plus" size={16} className="mr-1.5" /> Log shift
          </Button>
        }
      />

      {/* Outstanding-pay banner (StatCards). */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="To pay out"
          value={formatPkr(Math.round(outstanding))}
          delta={`${summary.byStatus.pending || 0} pending${
            (summary.byStatus.partial || 0) > 0
              ? ` · ${summary.byStatus.partial} part-paid (${formatPkr(Math.round(partialBalance))} bal.)`
              : ''
          }`}
          trend={outstanding > 0 ? 'down' : 'flat'}
          icon="Wallet"
        />
        <StatCard label="Paid" value={formatPkr(Math.round(summary.paidTotal))} icon="CheckCircle2" trend="up" />
        <StatCard
          label="In dispute"
          value={formatPkr(Math.round(summary.disputedTotal))}
          delta={`${summary.byStatus.disputed || 0} shift(s)`}
          trend={summary.disputedTotal > 0 ? 'down' : 'flat'}
          icon="AlertTriangle"
        />
        <StatCard label="Shifts" value={summary.totalShifts} icon="FileText" />
      </div>

      {/* Flag-gated pending leave queue (reused from the original). */}
      <StaffLeaveQueue />

      <DataTable
        columns={columns}
        data={shifts}
        getRowId={(s) => String(s.id)}
        loading={shiftsQuery.isLoading}
        error={shiftsQuery.isError ? "Couldn't load shifts." : null}
        onRetry={() => shiftsQuery.refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: 'FileText',
          title: 'No shifts in this window',
          description: 'Log a casual labour or permanent assignment to start the payroll ledger.',
          action: (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Icon name="Plus" size={14} className="mr-1" /> Log shift
            </Button>
          ),
        }}
        toolbar={
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'pending', 'partial', 'paid', 'disputed', 'void'] as Array<'all' | PaymentStatus>).map(
                (s) => {
                  const active = statusFilter === s;
                  const count =
                    s === 'all' ? summary.totalShifts : summary.byStatus[s as PaymentStatus] || 0;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {s === 'all' ? 'All' : PAYMENT_STATUS_LABELS[s as PaymentStatus]}
                      <span className="ml-1 opacity-70">({count})</span>
                    </button>
                  );
                },
              )}
            </div>
            <div className="ml-auto flex items-end gap-2">
              <div>
                <label className="text-[11px] text-muted-foreground">From</label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-36" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">To</label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 w-36" />
              </div>
              {(fromDate || toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                  }}
                  aria-label="Clear date filter"
                >
                  <Icon name="XCircle" size={16} />
                </Button>
              )}
            </div>
          </>
        }
        renderCard={(s) => {
          const att = s.attendanceStatus || 'scheduled';
          return (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{s.staffNameSnapshot}</div>
                  <div className="text-xs text-muted-foreground">
                    {STAFF_ROLE_LABELS[s.roleSnapshot] || s.roleSnapshot} · {fmtDate(s.shiftDate)}
                  </div>
                </div>
                <MoneyCell amount={Math.round(num(s.netPayable))} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <StatusPill tone={PAYMENT_TONE[s.paymentStatus]} variant="icon">
                  {PAYMENT_STATUS_LABELS[s.paymentStatus]}
                </StatusPill>
                <StatusPill tone={ATTENDANCE_TONE[att]}>{ATTENDANCE_STATUS_LABELS[att]}</StatusPill>
              </div>
              <div className="flex flex-wrap gap-1">
                {NEXT_STATUS_OPTIONS[s.paymentStatus].map((to) => (
                  <Button
                    key={to}
                    size="sm"
                    variant="outline"
                    disabled={busyId === s.id}
                    onClick={() => handleTransition(s, to)}
                    className="h-7 px-2 text-xs"
                  >
                    {to === 'paid' ? 'Mark paid' : to === 'disputed' ? 'Dispute' : to === 'void' ? 'Void' : PAYMENT_STATUS_LABELS[to]}
                  </Button>
                ))}
              </div>
            </div>
          );
        }}
      />

      {/* Reused dialogs (same forms + StaffAPI calls as the original). */}
      <ShiftDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        businesses={businesses}
        members={members}
        onSaved={async () => {
          setAddOpen(false);
          await refresh();
        }}
      />
      <PayDialog
        shift={payShift}
        onOpenChange={(o) => !o && setPayShift(null)}
        onSaved={async () => {
          setPayShift(null);
          await refresh();
        }}
      />
      <DisputeDialog
        shift={disputeShift}
        onOpenChange={(o) => !o && setDisputeShift(null)}
        onSaved={async () => {
          setDisputeShift(null);
          await refresh();
        }}
      />
      <VoidDialog
        shift={voidShift}
        onOpenChange={(o) => !o && setVoidShift(null)}
        onSaved={async () => {
          setVoidShift(null);
          await refresh();
        }}
      />
      <ReplaceDialog
        shift={replaceShift}
        onOpenChange={(o) => !o && setReplaceShift(null)}
        onSaved={async () => {
          setReplaceShift(null);
          await refresh();
        }}
      />

      <AlertDialog open={!!deleteShift} onOpenChange={(o) => !o && setDeleteShift(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this shift?</AlertDialogTitle>
            <AlertDialogDescription>
              Soft delete only — the row is hidden from your ledger but preserved in the database. Paid shifts
              cannot be removed; move to <strong>disputed</strong> first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PayrollTab;

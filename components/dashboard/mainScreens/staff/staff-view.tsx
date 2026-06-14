'use client';

/**
 * Vendor Portal Phase 2 #8.2 — Staff rota + payroll view.
 *
 * Two tabs:
 *
 *   1. Roster — vendor's people (permanent + casual). Add new
 *      members, edit defaults, mark inactive. NIC normalisation,
 *      JazzCash/Easypaisa number entry, photo upload (URL only —
 *      asset host is out of scope here), emergency contact.
 *
 *   2. Shifts — payroll ledger. Filter by date range + member +
 *      status. Per-row pay breakdown (base / OT / bonus / deduction
 *      → gross / net). "Rs. X to pay out tonight" banner (sum of
 *      pending netPayable in the visible window). Per-shift action
 *      buttons advance payment status through the backend state
 *      machine; "Mark paid" dialog captures paidAmount + paidVia +
 *      paymentRef + receiptPhotoUrl + thumbprintCaptured checkbox.
 *
 * Live-system safety: pure consumer of /api/v1/staff. Zero mutation
 * of any existing surface.
 */

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Users,
  Banknote,
  AlertTriangle,
  Phone,
  Building,
  Pencil,
  Trash2,
  Filter,
  Search,
  ArrowRight,
  Calendar,
  Receipt,
  Fingerprint,
  CheckCircle2,
  XCircle,
  HandCoins,
  UserCheck,
  UserX,
  Repeat,
  Clock,
} from 'lucide-react';
import axiosInstance from '@/lib/axiosConfig';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Label } from '@/components/ui/label';
import { LinkedFunctionSheetBadge } from '@/components/shared/linked-function-sheet-badge';
import {
  StaffAPI,
  STAFF_ROLE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  PAYMENT_METHOD_LABELS,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_TONES,
  type StaffMember,
  type StaffShift,
  type StaffRole,
  type EmploymentType,
  type PaymentStatus,
  type PaymentMethod,
  type AttendanceStatus,
  type MemberSummary,
  type PayrollSummary,
  type CreateMemberInput,
  type CreateShiftInput,
} from '@/lib/api/staff';

// Issue #37 — phone fields on the staff/team form were plain
// <Input> tags with no input-mode and no character filter, so a
// vendor could type letters into a "phone number" field and the
// row would save (until the BE rejected it on a later mutation,
// far from where the typo happened). All phone variants
// (primary, WhatsApp, JazzCash, Easypaisa, emergency contact)
// share this constraint: digits + the formatting characters a
// vendor would naturally use to read out a Pakistani mobile
// number (+, -, space). Anything else is stripped before it
// hits form state.
function filterPhoneInput(value: string): string {
  return value.replace(/[^0-9+\-\s]/g, '');
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

const NEXT_STATUS_OPTIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['paid', 'disputed', 'void'],
  paid: ['disputed'],
  disputed: ['paid', 'void', 'pending'],
  void: ['pending'],
};

// Forward attendance actions the vendor can take from each status. Mirrors
// the backend VALID_ATTENDANCE_TRANSITIONS, trimmed to the useful buttons
// ('replaced' is handled via a dialog, not a plain button).
const NEXT_ATTENDANCE_OPTIONS: Record<AttendanceStatus, AttendanceStatus[]> = {
  scheduled: ['checked_in', 'absent', 'excused'],
  checked_in: ['completed', 'absent'],
  completed: ['checked_in'],
  absent: ['excused', 'scheduled'],
  excused: ['scheduled', 'absent'],
  replaced: ['scheduled'],
};

interface VendorBusinessOption {
  id: number;
  name: string;
}

export default function StaffView() {
  const [businesses, setBusinesses] = useState<VendorBusinessOption[]>([]);

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

  return (
    <Tabs defaultValue="roster" className="space-y-4">
      <TabsList>
        <TabsTrigger value="roster">
          <Users className="mr-2 h-4 w-4" />
          Roster
        </TabsTrigger>
        <TabsTrigger value="shifts">
          <Receipt className="mr-2 h-4 w-4" />
          Shifts &amp; payroll
        </TabsTrigger>
      </TabsList>
      <TabsContent value="roster">
        <RosterTab businesses={businesses} />
      </TabsContent>
      <TabsContent value="shifts">
        <ShiftsTab businesses={businesses} />
      </TabsContent>
    </Tabs>
  );
}

// ─── Roster tab ───────────────────────────────────────────────────

const memberSchema = z.object({
  businessId: z.coerce.number().int().positive('Pick a business'),
  fullName: z.string().trim().min(1, 'Required').max(160),
  role: z.string().min(1),
  employmentType: z.enum(['permanent_monthly', 'casual_dihari', 'contract']),
  nicNumber: z
    .string()
    .trim()
    .max(20)
    .optional()
    .refine((v) => !v || /^[\d-]+$/.test(v), 'Digits + dashes only'),
  phoneNumber: z.string().trim().max(30).optional(),
  whatsappNumber: z.string().trim().max(30).optional(),
  defaultDihariRate: z.coerce.number().min(0).max(100_000).optional(),
  monthlySalary: z.coerce.number().min(0).max(5_000_000).optional(),
  jazzcashNumber: z.string().trim().max(30).optional(),
  easypaisaNumber: z.string().trim().max(30).optional(),
  bankName: z.string().trim().max(100).optional(),
  bankAccountNumber: z.string().trim().max(40).optional(),
  emergencyContactName: z.string().trim().max(120).optional(),
  emergencyContactPhone: z.string().trim().max(30).optional(),
  cnicAddress: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(5000).optional(),
  isActive: z.boolean().optional(),
});
type MemberFormValues = z.input<typeof memberSchema>;

function RosterTab({ businesses }: { businesses: VendorBusinessOption[] }) {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [summary, setSummary] = useState<MemberSummary>({
    byRole: {},
    activeCount: 0,
    inactiveCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
  const [activeOnly, setActiveOnly] = useState(true);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [deleteMember, setDeleteMember] = useState<StaffMember | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await StaffAPI.listMembers({
        role: roleFilter === 'all' ? undefined : roleFilter,
        isActive: activeOnly ? true : undefined,
        search: search.trim() || undefined,
      });
      setMembers(res.members);
      setSummary(res.summary);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, activeOnly]);

  useEffect(() => {
    const id = setTimeout(() => fetchMembers(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = async () => {
    if (!deleteMember) return;
    setBusy(deleteMember.id);
    try {
      await StaffAPI.removeMember(deleteMember.id);
      toast.success('Member removed');
      setDeleteMember(null);
      await fetchMembers();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not remove member');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Your people — permanent staff and casual <em>dihari</em> labour
          you regularly call on. NIC photo + emergency contact on every
          row keeps you covered for tax season and dispute resolution.
        </p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add staff
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Active
            </div>
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <Users className="h-5 w-5 text-emerald-600" />
              {summary.activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Inactive
            </div>
            <div className="text-2xl font-semibold">{summary.inactiveCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Roles tracked
            </div>
            <div className="text-2xl font-semibold">
              {Object.keys(summary.byRole).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Role:
          </span>
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              roleFilter === 'all'
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            All
          </button>
          {(Object.keys(STAFF_ROLE_LABELS) as StaffRole[])
            .filter((r) => (summary.byRole[r] || 0) > 0 || roleFilter === r)
            .map((r) => {
              const active = roleFilter === r;
              const count = summary.byRole[r] || 0;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(active ? 'all' : r)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${
                    active
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {STAFF_ROLE_LABELS[r]}
                  {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                </button>
              );
            })}
          <button
            type="button"
            onClick={() => setActiveOnly((v) => !v)}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              activeOnly
                ? 'border-emerald-500 bg-emerald-100 text-emerald-900'
                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            Active only
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, NIC…"
            className="pl-8"
          />
        </div>
      </div>

      {/* Members list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No staff match this filter. Click <strong>Add staff</strong> to
              build your roster.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              busy={busy === m.id}
              onEdit={() => setEditMember(m)}
              onDelete={() => setDeleteMember(m)}
            />
          ))}
        </div>
      )}

      <MemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        businesses={businesses}
        onSaved={async () => {
          setAddOpen(false);
          await fetchMembers();
        }}
      />
      <MemberDialog
        open={!!editMember}
        onOpenChange={(o) => !o && setEditMember(null)}
        businesses={businesses}
        member={editMember || undefined}
        onSaved={async () => {
          setEditMember(null);
          await fetchMembers();
        }}
      />

      <AlertDialog
        open={!!deleteMember}
        onOpenChange={(o) => !o && setDeleteMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this staff member?</AlertDialogTitle>
            <AlertDialogDescription>
              The member is soft-deleted. Their shift history is preserved
              for audit / wage-dispute records.
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

function MemberCard({
  member,
  busy,
  onEdit,
  onDelete,
}: {
  member: StaffMember;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className={member.isActive ? '' : 'opacity-60'}>
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">{member.fullName}</span>
              <Badge variant="outline">{STAFF_ROLE_LABELS[member.role]}</Badge>
              <Badge variant="secondary" className="text-[10px]">
                {EMPLOYMENT_TYPE_LABELS[member.employmentType]}
              </Badge>
              {!member.isActive && <Badge variant="outline">Inactive</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {member.phoneNumber && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {member.phoneNumber}
                </span>
              )}
              {member.nicDisplay && (
                <span className="font-mono">{member.nicDisplay}</span>
              )}
              {member.business?.name && (
                <span className="inline-flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {member.business.name}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            {member.employmentType === 'casual_dihari' &&
              member.defaultDihariRate != null && (
                <div>
                  <div className="text-lg font-semibold">
                    {fmtPKR(member.defaultDihariRate)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Default dihari / shift
                  </div>
                </div>
              )}
            {member.employmentType === 'permanent_monthly' &&
              member.monthlySalary != null && (
                <div>
                  <div className="text-lg font-semibold">
                    {fmtPKR(member.monthlySalary)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Monthly salary
                  </div>
                </div>
              )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button size="sm" variant="ghost" onClick={onEdit} disabled={busy}>
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={busy}
            className="text-rose-700 hover:text-rose-900"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MemberDialog({
  open,
  onOpenChange,
  businesses,
  member,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businesses: VendorBusinessOption[];
  member?: StaffMember;
  onSaved: () => Promise<void> | void;
}) {
  const isEdit = !!member;
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      businessId: member?.businessId ?? businesses[0]?.id,
      fullName: member?.fullName ?? '',
      role: member?.role ?? 'waiter',
      employmentType: member?.employmentType ?? 'casual_dihari',
      nicNumber: member?.nicDisplay ?? '',
      phoneNumber: member?.phoneNumber ?? '',
      whatsappNumber: member?.whatsappNumber ?? '',
      defaultDihariRate:
        member?.defaultDihariRate != null
          ? Number(member.defaultDihariRate)
          : undefined,
      monthlySalary:
        member?.monthlySalary != null ? Number(member.monthlySalary) : undefined,
      jazzcashNumber: member?.jazzcashNumber ?? '',
      easypaisaNumber: member?.easypaisaNumber ?? '',
      bankName: member?.bankName ?? '',
      bankAccountNumber: member?.bankAccountNumber ?? '',
      emergencyContactName: member?.emergencyContactName ?? '',
      emergencyContactPhone: member?.emergencyContactPhone ?? '',
      cnicAddress: member?.cnicAddress ?? '',
      notes: member?.notes ?? '',
      isActive: member?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        businessId: member?.businessId ?? businesses[0]?.id,
        fullName: member?.fullName ?? '',
        role: member?.role ?? 'waiter',
        employmentType: member?.employmentType ?? 'casual_dihari',
        nicNumber: member?.nicDisplay ?? '',
        phoneNumber: member?.phoneNumber ?? '',
        whatsappNumber: member?.whatsappNumber ?? '',
        defaultDihariRate:
          member?.defaultDihariRate != null
            ? Number(member.defaultDihariRate)
            : undefined,
        monthlySalary:
          member?.monthlySalary != null ? Number(member.monthlySalary) : undefined,
        jazzcashNumber: member?.jazzcashNumber ?? '',
        easypaisaNumber: member?.easypaisaNumber ?? '',
        bankName: member?.bankName ?? '',
        bankAccountNumber: member?.bankAccountNumber ?? '',
        emergencyContactName: member?.emergencyContactName ?? '',
        emergencyContactPhone: member?.emergencyContactPhone ?? '',
        cnicAddress: member?.cnicAddress ?? '',
        notes: member?.notes ?? '',
        isActive: member?.isActive ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member, businesses]);

  const employmentType = form.watch('employmentType');

  const onSubmit = async (values: MemberFormValues) => {
    try {
      if (isEdit && member) {
        await StaffAPI.updateMember(member.id, {
          fullName: values.fullName,
          role: values.role as StaffRole,
          employmentType: values.employmentType as EmploymentType,
          nicNumber: values.nicNumber || undefined,
          phoneNumber: values.phoneNumber || undefined,
          whatsappNumber: values.whatsappNumber || undefined,
          defaultDihariRate:
            values.defaultDihariRate != null
              ? Number(values.defaultDihariRate)
              : undefined,
          monthlySalary:
            values.monthlySalary != null
              ? Number(values.monthlySalary)
              : undefined,
          jazzcashNumber: values.jazzcashNumber || undefined,
          easypaisaNumber: values.easypaisaNumber || undefined,
          bankName: values.bankName || undefined,
          bankAccountNumber: values.bankAccountNumber || undefined,
          emergencyContactName: values.emergencyContactName || undefined,
          emergencyContactPhone: values.emergencyContactPhone || undefined,
          cnicAddress: values.cnicAddress || undefined,
          notes: values.notes || undefined,
          isActive: !!values.isActive,
        });
        toast.success('Member updated');
      } else {
        const payload: CreateMemberInput = {
          businessId: Number(values.businessId),
          fullName: values.fullName,
          role: values.role as StaffRole,
          employmentType: values.employmentType as EmploymentType,
          nicNumber: values.nicNumber || undefined,
          phoneNumber: values.phoneNumber || undefined,
          whatsappNumber: values.whatsappNumber || undefined,
          defaultDihariRate:
            values.defaultDihariRate != null
              ? Number(values.defaultDihariRate)
              : undefined,
          monthlySalary:
            values.monthlySalary != null
              ? Number(values.monthlySalary)
              : undefined,
          jazzcashNumber: values.jazzcashNumber || undefined,
          easypaisaNumber: values.easypaisaNumber || undefined,
          bankName: values.bankName || undefined,
          bankAccountNumber: values.bankAccountNumber || undefined,
          emergencyContactName: values.emergencyContactName || undefined,
          emergencyContactPhone: values.emergencyContactPhone || undefined,
          cnicAddress: values.cnicAddress || undefined,
          notes: values.notes || undefined,
          isActive: !!values.isActive,
        };
        await StaffAPI.createMember(payload);
        toast.success('Staff member added');
      }
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not save member');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit staff member' : 'Add staff member'}
          </DialogTitle>
          <DialogDescription>
            Capture enough to pay them correctly and stay covered for
            disputes / tax season.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {!isEdit && (
              <FormField
                control={form.control}
                name="businessId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business *</FormLabel>
                    <Select
                      value={String(field.value ?? '')}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a business" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businesses.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Ustad Zafar Hussain"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(STAFF_ROLE_LABELS).map(([k, label]) => (
                          <SelectItem key={k} value={k}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(EMPLOYMENT_TYPE_LABELS).map(
                          ([k, label]) => (
                            <SelectItem key={k} value={k}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nicNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNIC</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="35202-1234567-1"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      13 digits (any format — auto-normalised).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="0300-1234567"
                        {...field}
                        onChange={(e) => field.onChange(filterPhoneInput(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="+92 300 1234567"
                        {...field}
                        onChange={(e) => field.onChange(filterPhoneInput(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {employmentType === 'casual_dihari' && (
                <FormField
                  control={form.control}
                  name="defaultDihariRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default dihari rate (PKR / shift)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="e.g. 2000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {employmentType === 'permanent_monthly' && (
                <FormField
                  control={form.control}
                  name="monthlySalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly salary (PKR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="e.g. 80000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="jazzcashNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>JazzCash number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="0300-1234567"
                        {...field}
                        onChange={(e) => field.onChange(filterPhoneInput(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="easypaisaNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Easypaisa number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="0345-1234567"
                        {...field}
                        onChange={(e) => field.onChange(filterPhoneInput(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank</FormLabel>
                    <FormControl>
                      <Input placeholder="HBL / Meezan / UBL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bankAccountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank account / IBAN</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="PK36HABB0000123456789012"
                      className="font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency contact name</FormLabel>
                    <FormControl>
                      <Input placeholder="Father / spouse" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency contact phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="0321-1234567"
                        {...field}
                        onChange={(e) => field.onChange(filterPhoneInput(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cnicAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (per CNIC)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="House #, street, area, city"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Used in wage-dispute proofs.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(!!v)}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">
                      Active (uncheck to retire this member)
                    </FormLabel>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? 'Save changes' : 'Add member'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Shifts tab ───────────────────────────────────────────────────

const shiftSchema = z.object({
  businessId: z.coerce.number().int().positive('Pick a business'),
  staffMemberId: z.coerce.number().int().positive().optional(),
  staffNameSnapshot: z.string().trim().max(160).optional(),
  roleSnapshot: z.string().max(30).optional(),
  bookingId: z.coerce.number().int().positive().optional(),
  shiftDate: z.string().trim().min(1, 'Required'),
  dihariRate: z.coerce.number().min(0).max(100_000),
  overtimeHours: z.coerce.number().min(0).max(24).optional(),
  overtimeRate: z.coerce.number().min(0).max(50_000).optional(),
  bonusAmount: z.coerce.number().min(0).max(1_000_000).optional(),
  deductionAmount: z.coerce.number().min(0).max(1_000_000).optional(),
  deductionReason: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(5000).optional(),
});
type ShiftFormValues = z.input<typeof shiftSchema>;

const transitionPaidSchema = z.object({
  paidAmount: z.coerce.number().min(0),
  paidVia: z.enum([
    'cash',
    'jazzcash',
    'easypaisa',
    'raast',
    'ibft',
    'bank_transfer',
    'sadapay',
    'nayapay',
    'other',
  ]),
  paymentRef: z.string().trim().max(100).optional(),
  receiptPhotoUrl: z.string().trim().max(500).optional(),
  thumbprintCaptured: z.boolean().optional(),
});
type TransitionPaidValues = z.input<typeof transitionPaidSchema>;

function ShiftsTab({ businesses }: { businesses: VendorBusinessOption[] }) {
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [summary, setSummary] = useState<PayrollSummary>({
    totalShifts: 0,
    byStatus: {},
    byMethod: {},
    pendingTotal: 0,
    paidTotal: 0,
    disputedTotal: 0,
  });
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [payShift, setPayShift] = useState<StaffShift | null>(null);
  const [disputeShift, setDisputeShift] = useState<StaffShift | null>(null);
  const [voidShift, setVoidShift] = useState<StaffShift | null>(null);
  const [deleteShift, setDeleteShift] = useState<StaffShift | null>(null);
  const [replaceShift, setReplaceShift] = useState<StaffShift | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [shiftsRes, payroll, membersRes] = await Promise.all([
        StaffAPI.listShifts({
          paymentStatus: statusFilter === 'all' ? undefined : statusFilter,
          from: fromDate || undefined,
          to: toDate || undefined,
        }),
        StaffAPI.payrollSummary({
          from: fromDate || undefined,
          to: toDate || undefined,
        }),
        StaffAPI.listMembers({ isActive: true }),
      ]);
      setShifts(shiftsRes.shifts);
      setSummary(payroll);
      setMembers(membersRes.members);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, fromDate, toDate]);

  const handleQuickTransition = async (
    shift: StaffShift,
    to: PaymentStatus,
  ) => {
    if (to === 'paid') {
      setPayShift(shift);
      return;
    }
    if (to === 'disputed') {
      setDisputeShift(shift);
      return;
    }
    if (to === 'void') {
      setVoidShift(shift);
      return;
    }
    setBusy(shift.id);
    try {
      await StaffAPI.transitionShift(shift.id, { to });
      toast.success(`Moved to ${PAYMENT_STATUS_LABELS[to]}`);
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Transition failed');
    } finally {
      setBusy(null);
    }
  };

  const handleAttendance = async (shift: StaffShift, to: AttendanceStatus) => {
    if (to === 'replaced') {
      setReplaceShift(shift);
      return;
    }
    setBusy(shift.id);
    try {
      await StaffAPI.markAttendance(shift.id, { to });
      toast.success(`Attendance: ${ATTENDANCE_STATUS_LABELS[to]}`);
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not update attendance');
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteShift) return;
    setBusy(deleteShift.id);
    try {
      await StaffAPI.removeShift(deleteShift.id);
      toast.success('Shift removed');
      setDeleteShift(null);
      await fetchAll();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not remove shift');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Floor banner */}
      {summary.pendingTotal > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-amber-700" />
            <div>
              <div className="text-sm font-semibold text-amber-900">
                {fmtPKR(summary.pendingTotal)} to pay out
              </div>
              <div className="text-[11px] text-amber-800">
                {(summary.byStatus.pending || 0)} pending shift(s) in this window
              </div>
            </div>
          </div>
          {summary.disputedTotal > 0 && (
            <div className="text-xs text-rose-700">
              {fmtPKR(summary.disputedTotal)} in dispute (
              {summary.byStatus.disputed || 0})
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Append-only payroll ledger. Every shift snapshots staff name + role
          + pay math so the record stays auditable forever.
        </p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Log shift
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            ['all', 'pending', 'paid', 'disputed', 'void'] as Array<
              'all' | PaymentStatus
            >
          ).map((s) => {
            const active = statusFilter === s;
            const count =
              s === 'all'
                ? summary.totalShifts
                : summary.byStatus[s as PaymentStatus] || 0;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s as any)}
                className={`rounded-full border px-2.5 py-0.5 text-xs ${
                  active
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {s === 'all' ? 'All' : PAYMENT_STATUS_LABELS[s as PaymentStatus]}
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-end gap-2">
          <div>
            <label className="text-[11px] text-muted-foreground">From</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-36"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">To</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-36"
            />
          </div>
          {(fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No shifts in this window. Click <strong>Log shift</strong> to
              record a casual labour assignment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {shifts.map((s) => (
            <ShiftCard
              key={s.id}
              shift={s}
              busy={busy === s.id}
              onTransition={(to) => handleQuickTransition(s, to)}
              onAttendance={(to) => handleAttendance(s, to)}
              onDelete={() => setDeleteShift(s)}
            />
          ))}
        </div>
      )}

      <ShiftDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        businesses={businesses}
        members={members}
        onSaved={async () => {
          setAddOpen(false);
          await fetchAll();
        }}
      />

      <PayDialog
        shift={payShift}
        onOpenChange={(o) => !o && setPayShift(null)}
        onSaved={async () => {
          setPayShift(null);
          await fetchAll();
        }}
      />

      <DisputeDialog
        shift={disputeShift}
        onOpenChange={(o) => !o && setDisputeShift(null)}
        onSaved={async () => {
          setDisputeShift(null);
          await fetchAll();
        }}
      />

      <VoidDialog
        shift={voidShift}
        onOpenChange={(o) => !o && setVoidShift(null)}
        onSaved={async () => {
          setVoidShift(null);
          await fetchAll();
        }}
      />

      <ReplaceDialog
        shift={replaceShift}
        onOpenChange={(o) => !o && setReplaceShift(null)}
        onSaved={async () => {
          setReplaceShift(null);
          await fetchAll();
        }}
      />

      <AlertDialog
        open={!!deleteShift}
        onOpenChange={(o) => !o && setDeleteShift(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this shift?</AlertDialogTitle>
            <AlertDialogDescription>
              Soft delete only. The row is hidden from your ledger but
              preserved in the database. Paid shifts cannot be removed —
              move to <strong>disputed</strong> first.
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

function ShiftCard({
  shift,
  busy,
  onTransition,
  onAttendance,
  onDelete,
}: {
  shift: StaffShift;
  busy: boolean;
  onTransition: (to: PaymentStatus) => void;
  onAttendance: (to: AttendanceStatus) => void;
  onDelete: () => void;
}) {
  const tone = PAYMENT_STATUS_TONES[shift.paymentStatus];
  const next = NEXT_STATUS_OPTIONS[shift.paymentStatus];
  const att = shift.attendanceStatus || 'scheduled';
  const attTone = ATTENDANCE_STATUS_TONES[att];
  const attNext = NEXT_ATTENDANCE_OPTIONS[att] || [];
  const ATT_ICON: Partial<Record<AttendanceStatus, typeof UserCheck>> = {
    checked_in: UserCheck,
    completed: CheckCircle2,
    absent: UserX,
    excused: Clock,
    scheduled: ArrowRight,
  };

  const base = Number(shift.dihariRate) || 0;
  const overtime =
    (Number(shift.overtimeHours) || 0) * (Number(shift.overtimeRate) || 0);
  const bonus = Number(shift.bonusAmount) || 0;
  const deduction = Number(shift.deductionAmount) || 0;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">
                {shift.staffNameSnapshot}
              </span>
              <Badge variant="outline">
                {STAFF_ROLE_LABELS[shift.roleSnapshot] || shift.roleSnapshot}
              </Badge>
              <Badge
                variant="outline"
                className={`${tone.bg} ${tone.text} ${tone.border}`}
              >
                {PAYMENT_STATUS_LABELS[shift.paymentStatus]}
              </Badge>
              <Badge
                variant="outline"
                className={`${attTone.bg} ${attTone.text} ${attTone.border}`}
              >
                {ATTENDANCE_STATUS_LABELS[att]}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {fmtDate(shift.shiftDate)}
              </span>
              {shift.staffMember?.phoneNumber && (
                <a
                  href={`tel:${shift.staffMember.phoneNumber}`}
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {shift.staffMember.phoneNumber}
                </a>
              )}
              {shift.booking?.id && (
                <>
                  <span>Booking #{shift.booking.id}</span>
                  <LinkedFunctionSheetBadge bookingId={shift.booking.id} variant="inline" />
                </>
              )}
              {shift.thumbprintCaptured && (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <Fingerprint className="h-3 w-3" />
                  Thumbprint
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-semibold">{fmtPKR(shift.netPayable)}</div>
            <div className="text-[10px] text-muted-foreground">
              Net payable
            </div>
            {shift.paymentStatus === 'paid' && shift.paidAmount != null && (
              <div className="mt-1 text-[11px] text-emerald-700">
                Paid {fmtPKR(shift.paidAmount)}
                {shift.paidVia ? ` via ${PAYMENT_METHOD_LABELS[shift.paidVia]}` : ''}
              </div>
            )}
          </div>
        </div>

        {/* Pay breakdown strip */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded bg-neutral-100 px-2 py-0.5">
            Base {fmtPKR(base)}
          </span>
          {overtime > 0 && (
            <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-800">
              + OT ({shift.overtimeHours}h × {fmtPKR(shift.overtimeRate)}) = {fmtPKR(overtime)}
            </span>
          )}
          {bonus > 0 && (
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-800">
              + Bonus {fmtPKR(bonus)}
            </span>
          )}
          {deduction > 0 && (
            <span className="rounded bg-rose-50 px-2 py-0.5 text-rose-800">
              − Deduction {fmtPKR(deduction)}{' '}
              {shift.deductionReason ? `(${shift.deductionReason})` : ''}
            </span>
          )}
          <span className="ml-auto rounded bg-neutral-900 px-2 py-0.5 text-white">
            Gross {fmtPKR(shift.grossPayable)}
          </span>
        </div>

        {shift.disputeNotes && (
          <p className="rounded bg-rose-50 px-2 py-1 text-xs text-rose-900">
            <strong>Dispute:</strong> {shift.disputeNotes}
          </p>
        )}

        {/* Attendance — check-in/out times + replacement details */}
        {(shift.checkInAt || shift.checkOutAt || shift.replacementDetailsJson || shift.attendanceNotes) && (
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            {shift.checkInAt && (
              <span className="inline-flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-blue-600" />
                In {new Date(shift.checkInAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
            {shift.checkOutAt && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Out {new Date(shift.checkOutAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
            {shift.replacementDetailsJson?.name && (
              <span className="inline-flex items-center gap-1 text-violet-700">
                <Repeat className="h-3 w-3" />
                Covered by {shift.replacementDetailsJson.name}
                {shift.replacementDetailsJson.phone ? ` (${shift.replacementDetailsJson.phone})` : ''}
              </span>
            )}
            {shift.attendanceNotes && <span className="italic">“{shift.attendanceNotes}”</span>}
          </div>
        )}

        {/* Attendance action row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Attendance</span>
          {attNext.map((to) => {
            const at = ATTENDANCE_STATUS_TONES[to];
            const Icon = ATT_ICON[to] || ArrowRight;
            return (
              <Button
                key={to}
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => onAttendance(to)}
                className={`h-7 ${at.border} ${at.text}`}
              >
                <Icon className="mr-1 h-3 w-3" />
                {to === 'checked_in' ? 'Check in'
                  : to === 'completed' ? 'Worked'
                  : ATTENDANCE_STATUS_LABELS[to]}
              </Button>
            );
          })}
          {att !== 'replaced' && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => onAttendance('replaced')}
              className="h-7 border-violet-300 text-violet-700"
            >
              <Repeat className="mr-1 h-3 w-3" />
              Replace
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {next.map((to) => {
            const t = PAYMENT_STATUS_TONES[to];
            return (
              <Button
                key={to}
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => onTransition(to)}
                className={`${t.border} ${t.text}`}
              >
                {to === 'paid' ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : to === 'disputed' ? (
                  <AlertTriangle className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowRight className="mr-1 h-3 w-3" />
                )}
                {to === 'paid' ? 'Mark paid' : PAYMENT_STATUS_LABELS[to]}
              </Button>
            );
          })}
          {/* §M5 — printable payslip */}
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              StaffAPI.openPayslipPdf(shift.id).catch(() =>
                toast.error('Could not open payslip'),
              );
            }}
          >
            <Receipt className="mr-1 h-3 w-3" />
            Payslip
          </Button>
          {shift.paymentStatus !== 'paid' && (
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ShiftDialog({
  open,
  onOpenChange,
  businesses,
  members,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businesses: VendorBusinessOption[];
  members: StaffMember[];
  onSaved: () => Promise<void> | void;
}) {
  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      businessId: businesses[0]?.id,
      shiftDate: new Date().toISOString().slice(0, 10),
      dihariRate: 1500,
    },
  });
  const memberId = form.watch('staffMemberId');

  useEffect(() => {
    if (open) {
      form.reset({
        businessId: businesses[0]?.id,
        shiftDate: new Date().toISOString().slice(0, 10),
        dihariRate: 1500,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, businesses]);

  // Auto-populate dihariRate when a member is picked.
  useEffect(() => {
    if (!memberId) return;
    const m = members.find((mm) => mm.id === Number(memberId));
    if (m?.defaultDihariRate != null) {
      form.setValue('dihariRate', Number(m.defaultDihariRate));
    }
    if (m?.role) {
      form.setValue('roleSnapshot', m.role);
    }
    if (m?.fullName) {
      form.setValue('staffNameSnapshot', m.fullName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  const liveBreakdown = useMemo(() => {
    const v = form.getValues();
    const base = Number(v.dihariRate) || 0;
    const ot = (Number(v.overtimeHours) || 0) * (Number(v.overtimeRate) || 0);
    const bonus = Number(v.bonusAmount) || 0;
    const ded = Number(v.deductionAmount) || 0;
    const gross = base + ot + bonus;
    const net = Math.max(0, gross - ded);
    return { base, ot, bonus, ded, gross, net };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.watch('dihariRate'),
    form.watch('overtimeHours'),
    form.watch('overtimeRate'),
    form.watch('bonusAmount'),
    form.watch('deductionAmount'),
  ]);

  const onSubmit = async (values: ShiftFormValues) => {
    try {
      const payload: CreateShiftInput = {
        businessId: Number(values.businessId),
        staffMemberId:
          values.staffMemberId != null
            ? Number(values.staffMemberId)
            : undefined,
        staffNameSnapshot: values.staffNameSnapshot || undefined,
        roleSnapshot: (values.roleSnapshot as StaffRole) || undefined,
        bookingId:
          values.bookingId != null ? Number(values.bookingId) : undefined,
        shiftDate: values.shiftDate,
        dihariRate: Number(values.dihariRate),
        overtimeHours:
          values.overtimeHours != null
            ? Number(values.overtimeHours)
            : undefined,
        overtimeRate:
          values.overtimeRate != null
            ? Number(values.overtimeRate)
            : undefined,
        bonusAmount:
          values.bonusAmount != null ? Number(values.bonusAmount) : undefined,
        deductionAmount:
          values.deductionAmount != null
            ? Number(values.deductionAmount)
            : undefined,
        deductionReason: values.deductionReason || undefined,
        notes: values.notes || undefined,
      };
      await StaffAPI.createShift(payload);
      toast.success('Shift logged');
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not log shift');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log a shift</DialogTitle>
          <DialogDescription>
            Record a casual or permanent staff assignment. Gross + net pay
            are computed server-side and snapshotted onto the row.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="businessId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business *</FormLabel>
                    <Select
                      value={String(field.value ?? '')}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a business" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businesses.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="staffMemberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff member</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(v) =>
                        field.onChange(v ? Number(v) : undefined)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick from roster (or fill name below)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.fullName} — {STAFF_ROLE_LABELS[m.role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Or leave blank and type a one-off name below.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!memberId && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="staffNameSnapshot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>One-off name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Ad-hoc dhol player" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roleSnapshot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>One-off role</FormLabel>
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pick role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(STAFF_ROLE_LABELS).map(([k, label]) => (
                            <SelectItem key={k} value={k}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="shiftDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dihariRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dihari rate (PKR) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={100_000}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bookingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking ID</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Tie to a specific event"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="overtimeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overtime hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.25"
                        min={0}
                        max={24}
                        placeholder="e.g. 4 (for Walima past midnight)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="overtimeRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overtime rate (PKR / hour)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="e.g. 250"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="bonusAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bonus / bakshish share (PKR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deductionAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deduction (PKR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="deductionReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deduction reason</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Advance taken / discipline / broken glass"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs">
              <div className="mb-1 font-semibold">Live pay preview</div>
              <div className="flex flex-wrap gap-2">
                <span>Base {fmtPKR(liveBreakdown.base)}</span>
                {liveBreakdown.ot > 0 && (
                  <span>+ OT {fmtPKR(liveBreakdown.ot)}</span>
                )}
                {liveBreakdown.bonus > 0 && (
                  <span>+ Bonus {fmtPKR(liveBreakdown.bonus)}</span>
                )}
                {liveBreakdown.ded > 0 && (
                  <span>− Deduction {fmtPKR(liveBreakdown.ded)}</span>
                )}
                <span className="ml-auto rounded bg-neutral-900 px-2 text-white">
                  Gross {fmtPKR(liveBreakdown.gross)}
                </span>
                <span className="rounded bg-emerald-600 px-2 text-white">
                  Net {fmtPKR(liveBreakdown.net)}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Log shift
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PayDialog({
  shift,
  onOpenChange,
  onSaved,
}: {
  shift: StaffShift | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const form = useForm<TransitionPaidValues>({
    resolver: zodResolver(transitionPaidSchema),
    defaultValues: {
      paidAmount: shift ? Math.round(Number(shift.netPayable)) : 0,
      paidVia: 'cash',
      thumbprintCaptured: false,
    },
  });

  useEffect(() => {
    if (shift) {
      form.reset({
        paidAmount: Math.round(Number(shift.netPayable)),
        paidVia: 'cash',
        thumbprintCaptured: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shift?.id]);

  if (!shift) return null;

  const onSubmit = async (values: TransitionPaidValues) => {
    try {
      await StaffAPI.transitionShift(shift.id, {
        to: 'paid',
        paidAmount: Number(values.paidAmount),
        paidVia: values.paidVia as PaymentMethod,
        paymentRef: values.paymentRef || undefined,
        receiptPhotoUrl: values.receiptPhotoUrl || undefined,
        thumbprintCaptured: !!values.thumbprintCaptured,
      });
      toast.success('Marked paid');
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not mark paid');
    }
  };

  return (
    <Dialog open={!!shift} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark paid — {shift.staffNameSnapshot}</DialogTitle>
          <DialogDescription>
            Net payable was{' '}
            <strong>{fmtPKR(shift.netPayable)}</strong>. You can record a
            different amount if you paid more or less in practice.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount paid (PKR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paidVia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PAYMENT_METHOD_LABELS).map(
                          ([k, label]) => (
                            <SelectItem key={k} value={k}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction ref</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="JazzCash / Easypaisa / IBFT txn id"
                      className="font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptPhotoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt photo URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://… (thumbprint receipt photo)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbprintCaptured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={(v) => field.onChange(!!v)}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">
                    Thumbprint captured on receipt
                  </FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm paid
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DisputeDialog({
  shift,
  onOpenChange,
  onSaved,
}: {
  shift: StaffShift | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setNotes('');
  }, [shift?.id]);

  if (!shift) return null;

  const submit = async () => {
    if (!notes.trim()) {
      toast.error('Dispute notes required');
      return;
    }
    setSubmitting(true);
    try {
      await StaffAPI.transitionShift(shift.id, {
        to: 'disputed',
        disputeNotes: notes.trim(),
      });
      toast.success('Moved to disputed');
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not move to disputed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!shift} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark disputed — {shift.staffNameSnapshot}</DialogTitle>
          <DialogDescription>
            Capture the specifics of the dispute (staff says X, vendor says Y).
            You can move back to paid once resolved.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Staff says he was underpaid by Rs. 500 for the Walima overtime"
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VoidDialog({
  shift,
  onOpenChange,
  onSaved,
}: {
  shift: StaffShift | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setReason(''), [shift?.id]);

  if (!shift) return null;

  const submit = async () => {
    setSubmitting(true);
    try {
      await StaffAPI.transitionShift(shift.id, {
        to: 'void',
        reason: reason.trim() || undefined,
      });
      toast.success('Voided');
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not void');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!shift} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void shift — {shift.staffNameSnapshot}</DialogTitle>
          <DialogDescription>
            Use for cancelled bookings, no-shows, or any case where the
            shift was logged but no pay is owed.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm void
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReplaceDialog({
  shift,
  onOpenChange,
  onSaved,
}: {
  shift: StaffShift | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rate, setRate] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName('');
    setPhone('');
    setRate('');
    setNote('');
  }, [shift?.id]);

  if (!shift) return null;

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Replacement name required');
      return;
    }
    setSubmitting(true);
    try {
      await StaffAPI.markAttendance(shift.id, {
        to: 'replaced',
        replacement: {
          name: name.trim(),
          phone: phone.trim() || undefined,
          role: shift.roleSnapshot,
          rate: rate ? Number(rate) : undefined,
          note: note.trim() || undefined,
        },
      });
      toast.success('Replacement recorded');
      await onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not record replacement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!shift} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign replacement — {shift.staffNameSnapshot}</DialogTitle>
          <DialogDescription>
            {shift.staffNameSnapshot} couldn&apos;t make it. Record who covered the
            shift so the rota and your records stay accurate.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Replacement name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Asif Khan"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Phone (optional)</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-1234567"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rate paid (optional)</Label>
              <Input
                type="number"
                min={0}
                max={100000}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="Rs."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note (optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Regular cover, came on short notice"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record replacement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

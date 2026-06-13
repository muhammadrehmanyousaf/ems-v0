'use client';

/**
 * Vendor Portal Phase 1 #7.3 — Lead Inbox view.
 *
 * Pakistani wedding vendors get inquiries from FOUR uncoordinated
 * channels (WhatsApp, phone, walk-in, online form) plus the existing
 * in-app chat. They track them today on sticky notes + WhatsApp chats
 * + their own memory; conversion rate suffers because they forget to
 * follow up.
 *
 * This view replaces that chaos with one inbox:
 *   - Funnel cards: per-status pill counts (new / contacted /
 *     qualified / quoted / booked / lost / archived)
 *   - Source filter chips
 *   - Search across name / phone / WhatsApp / email / inquiry
 *   - Mobile-first card list (vendor checks this on the shop floor)
 *   - Per-row actions: advance status (routes through the backend
 *     state-machine helper, so the lifecycle stays enforced), send
 *     WhatsApp reply (best-effort — empty banner if no provider yet),
 *     soft-delete
 *   - Manual entry dialog for phone / walk-in / other leads
 *
 * Live-system safety: pure consumer of /api/v1/leads. No mutation of
 * any existing FE surface.
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
  Phone,
  MessageSquare,
  MailOpen,
  Calendar,
  Users,
  Building,
  Trash2,
  Filter,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  UserCheck,
  Send,
} from 'lucide-react';
import axiosInstance from '@/lib/axiosConfig';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { LinkedFunctionSheetBadge } from '@/components/shared/linked-function-sheet-badge';
import { AiSuggestButton } from '@/components/ai/ai-suggest-button';
import { AiAPI } from '@/lib/api/ai';
import {
  LeadAPI,
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_EVENT_TYPE_LABELS,
  type ConversionAnalytics,
  LEAD_STATUS_TONES,
  type Lead,
  type LeadStatus,
  type LeadSource,
  type LeadEventType,
  type LeadSummary,
  type CreateLeadInput,
} from '@/lib/api/leads';

// ─── Helpers ──────────────────────────────────────────────────────

function fmtPKR(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x) || x === 0) return '—';
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

function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const t = new Date(iso).getTime();
    const diffSec = Math.round((Date.now() - t) / 1000);
    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h ago`;
    if (diffSec < 86400 * 30) return `${Math.round(diffSec / 86400)}d ago`;
    return fmtDate(iso);
  } catch {
    return iso;
  }
}

// Forward-only happy path; back edges and terminal moves both surfaced.
// Issue #13 — quoted → contacted now allowed (re-engagement use case);
// qualified → new also allowed for parity with the BE state machine in
// event-planner-api/src/utils/leadHelpers.js.
const NEXT_STATUS: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'qualified', 'lost', 'archived'],
  contacted: ['qualified', 'quoted', 'lost', 'archived'],
  qualified: ['new', 'contacted', 'quoted', 'lost', 'archived'],
  quoted: ['contacted', 'qualified', 'booked', 'lost', 'archived'],
  booked: [],
  lost: [],
  archived: [],
};

// ─── Manual-entry form schema ─────────────────────────────────────

const phoneRegex = /^[+\d\s\-().]{4,30}$/;

const createSchema = z
  .object({
    businessId: z.coerce.number().int().positive('Pick a business'),
    source: z.enum([
      'whatsapp',
      'form_inquiry',
      'manual_phone',
      'manual_walkin',
      'other',
    ]),
    contactName: z.string().trim().max(120).optional(),
    contactPhone: z
      .string()
      .trim()
      .max(30)
      .optional()
      .refine((v) => !v || phoneRegex.test(v), 'Invalid phone'),
    contactWhatsapp: z
      .string()
      .trim()
      .max(30)
      .optional()
      .refine((v) => !v || phoneRegex.test(v), 'Invalid WhatsApp number'),
    contactEmail: z
      .string()
      .trim()
      .max(160)
      .optional()
      .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Invalid email'),
    eventType: z
      .enum([
        'mehndi',
        'nikah',
        'baraat',
        'walima',
        'engagement',
        'dholki',
        'other',
      ])
      .optional(),
    eventDate: z.string().trim().optional(),
    estimatedGuests: z.coerce.number().int().min(0).max(100_000).optional(),
    estimatedBudget: z.coerce.number().min(0).max(500_000_000).optional(),
    inquiry: z.string().trim().max(5000).optional(),
    notes: z.string().trim().max(5000).optional(),
  })
  .refine(
    (v) =>
      !!v.contactName ||
      !!v.contactPhone ||
      !!v.contactWhatsapp ||
      !!v.contactEmail,
    {
      message: 'Enter at least one contact field (name / phone / WhatsApp / email)',
      path: ['contactName'],
    },
  );

type CreateFormValues = z.input<typeof createSchema>;

// ─── Main view ────────────────────────────────────────────────────

interface VendorBusinessOption {
  id: number;
  name: string;
}

export default function LeadsInboxView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [summary, setSummary] = useState<LeadSummary>({
    byStatus: {},
    bySource: {},
  });
  const [provider, setProvider] = useState<string>('noop');
  const [analytics, setAnalytics] = useState<ConversionAnalytics | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | 'all'>('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [whatsappLead, setWhatsappLead] = useState<Lead | null>(null);
  const [whatsappBody, setWhatsappBody] = useState('');
  const [whatsappSending, setWhatsappSending] = useState(false);
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [businesses, setBusinesses] = useState<VendorBusinessOption[]>([]);
  // Phase 4 polish — bulk selection state. Set keyed by lead id; the
  // bar appears above the list when at least one is selected.
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await LeadAPI.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
        source: sourceFilter === 'all' ? undefined : sourceFilter,
        search: search.trim() || undefined,
      });
      setLeads(res.leads || []);
      setSummary(res.summary || { byStatus: {}, bySource: {} });
      setProvider(res.provider || 'noop');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  // Conversion analytics — fetched once on mount, refreshed when
  // vendor expands the analytics panel. Independent of the filter
  // state so the bigger picture stays visible regardless of which
  // status / source the vendor is currently inspecting.
  const loadAnalytics = async () => {
    try {
      const a = await LeadAPI.conversionAnalytics();
      setAnalytics(a);
    } catch (e: any) {
      // Soft-fail — keep the inbox usable even if analytics 500s.
      // eslint-disable-next-line no-console
      console.warn('[leads] analytics load failed:', e?.message || e);
    }
  };

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sourceFilter]);

  useEffect(() => {
    // Debounced search.
    const id = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Load vendor's own businesses for the "Add lead" dialog.
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
      .catch(() => {
        // Silently — vendor may have no business yet.
      });
  }, []);

  const totalCount = leads.length;
  const conversionRate = useMemo(() => {
    const booked = summary.byStatus.booked || 0;
    const total = Object.values(summary.byStatus).reduce(
      (s, n) => s + (n || 0),
      0,
    );
    if (!total) return 0;
    return Math.round((booked / total) * 100);
  }, [summary]);

  // ─── Mutations ──────────────────────────────────────────────────

  const handleTransition = async (lead: Lead, to: LeadStatus) => {
    setBusy(lead.id);
    try {
      await LeadAPI.transition(lead.id, { to });
      toast.success(`Moved to ${LEAD_STATUS_LABELS[to]}`);
      await fetchLeads();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || `Could not move to ${LEAD_STATUS_LABELS[to]}`,
      );
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteLead) return;
    setBusy(deleteLead.id);
    try {
      await LeadAPI.remove(deleteLead.id);
      toast.success('Lead archived');
      setDeleteLead(null);
      await fetchLeads();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not remove lead');
    } finally {
      setBusy(null);
    }
  };

  const handleSendWhatsapp = async () => {
    if (!whatsappLead) return;
    const body = whatsappBody.trim();
    if (!body) {
      toast.error('Message body required');
      return;
    }
    setWhatsappSending(true);
    try {
      const res = await LeadAPI.sendWhatsapp(whatsappLead.id, { body });
      if (res?.result?.ok) {
        toast.success('WhatsApp message sent');
      } else if (res?.result?.reason === 'no_provider') {
        toast.warning(
          'WhatsApp provider not configured yet. Lead activity logged.',
        );
      } else {
        toast.error(
          `WhatsApp send failed: ${res?.result?.reason || 'unknown'}`,
        );
      }
      setWhatsappLead(null);
      setWhatsappBody('');
      await fetchLeads();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'WhatsApp send failed');
    } finally {
      setWhatsappSending(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            One inbox for WhatsApp, phone, walk-ins, website form & in-app chat
            inquiries. Move them through the funnel and never lose another
            booking to a forgotten follow-up.
          </p>
          {provider === 'noop' && (
            <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                WhatsApp provider not configured. Inbound WhatsApp messages
                won&apos;t auto-create leads yet, but every other channel works
                today. You can still log WhatsApp leads manually.
              </span>
            </div>
          )}
        </div>
        <Button onClick={() => setAddOpen(true)} className="self-start sm:self-auto">
          <Plus className="mr-2 h-4 w-4" /> Log a lead
        </Button>
      </div>

      {/* Conversion analytics — collapsible card showing per-source
          funnel + revenue. Closed by default to keep the inbox
          scannable; vendor clicks to expand. */}
      {analytics && analytics.totalLeads > 0 && (
        <Card>
          <CardContent className="space-y-3 p-3">
            <button
              type="button"
              onClick={() => setAnalyticsOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Conversion analytics
                </div>
                <div className="mt-0.5 text-sm">
                  <span className="font-semibold">
                    {analytics.totalBooked} of {analytics.totalLeads} leads booked
                  </span>{' '}
                  <span className="text-muted-foreground">
                    ({analytics.overallConversionRate}% conversion)
                  </span>
                  {analytics.totalRevenue > 0 && (
                    <>
                      {' · '}
                      <span className="font-semibold text-emerald-700">
                        {fmtPKR(analytics.totalRevenue)}
                      </span>{' '}
                      <span className="text-muted-foreground">
                        revenue · {fmtPKR(analytics.avgTicketSize)} avg ticket
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-xs text-blue-700">
                {analyticsOpen ? 'Hide details' : 'Show per-source breakdown'}
              </span>
            </button>
            {analyticsOpen && analytics.perSource.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {analytics.perSource.map((s) => {
                  const isWinner =
                    s.revenue === Math.max(...analytics.perSource.map((p) => p.revenue)) &&
                    s.revenue > 0;
                  return (
                    <div
                      key={s.source}
                      className={`rounded-md border p-3 text-xs ${
                        isWinner
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : 'border-neutral-200 bg-neutral-50/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {LEAD_SOURCE_LABELS[s.source as LeadSource] || s.source}
                        </span>
                        {isWinner && (
                          <Badge
                            variant="outline"
                            className="border-emerald-300 bg-emerald-100 text-[10px] text-emerald-900"
                          >
                            top channel
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 grid grid-cols-3 gap-1 text-[11px]">
                        <div>
                          <div className="text-muted-foreground">Total</div>
                          <div className="font-semibold">{s.total}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Booked</div>
                          <div className="font-semibold text-emerald-700">
                            {s.booked}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Rate</div>
                          <div className="font-semibold">{s.conversionRate}%</div>
                        </div>
                      </div>
                      {s.revenue > 0 && (
                        <div className="mt-1 border-t border-neutral-200 pt-1">
                          <div className="text-muted-foreground text-[10px] uppercase tracking-wide">
                            Revenue
                          </div>
                          <div className="font-semibold text-emerald-700">
                            {fmtPKR(s.revenue)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {fmtPKR(s.avgTicketSize)} avg ticket
                            {s.avgDaysToBooking != null &&
                              ` · ${s.avgDaysToBooking}d to book`}
                          </div>
                        </div>
                      )}
                      {s.revenue === 0 && s.booked === 0 && s.lost > 0 && (
                        <div className="mt-1 text-[10px] text-rose-700">
                          {s.lost} lost · 0 converted
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Funnel summary */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => {
          const count = summary.byStatus[s] || 0;
          const tone = LEAD_STATUS_TONES[s];
          const active = statusFilter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(active ? 'all' : s)}
              className={`rounded-md border px-3 py-2 text-left transition ${
                active
                  ? `${tone.border} ${tone.bg} ${tone.text}`
                  : 'border-neutral-200 bg-white hover:bg-neutral-50'
              }`}
            >
              <div className="text-[11px] font-medium uppercase tracking-wide">
                {LEAD_STATUS_LABELS[s]}
              </div>
              <div className="text-lg font-semibold">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Source filter + search */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Source:
          </span>
          <button
            type="button"
            onClick={() => setSourceFilter('all')}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              sourceFilter === 'all'
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            All
          </button>
          {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((src) => {
            const active = sourceFilter === src;
            const count = summary.bySource[src] || 0;
            return (
              <button
                key={src}
                type="button"
                onClick={() => setSourceFilter(active ? 'all' : src)}
                className={`rounded-full border px-2.5 py-0.5 text-xs ${
                  active
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {LEAD_SOURCE_LABELS[src]}
                {count > 0 && (
                  <span className="ml-1 opacity-70">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, WhatsApp, email…"
            className="pl-8"
          />
        </div>
      </div>

      {/* Conversion summary strip */}
      {totalCount > 0 && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          <span className="font-semibold">Conversion:</span> {conversionRate}% of
          your leads end up booked.
        </div>
      )}

      {/* Lead list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <MailOpen className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No leads match this filter yet. Log a walk-in or phone inquiry
              with the button above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Phase 4 polish — bulk action bar, sticky-feeling on
              scroll. Renders only when at least one lead is selected. */}
          {selected.size > 0 && (
            <BulkActionsBar
              count={selected.size}
              totalShown={leads.length}
              busy={bulkBusy}
              onSelectAll={() => {
                if (selected.size === leads.length) setSelected(new Set());
                else setSelected(new Set(leads.map((l) => l.id)));
              }}
              onClear={() => setSelected(new Set())}
              onBulkTransition={async (to) => {
                setBulkBusy(true);
                try {
                  const r = await LeadAPI.bulkTransition({
                    ids: Array.from(selected),
                    to,
                  });
                  toast.success(
                    `${r.applied} moved · ${r.skipped} skipped · ${r.failed} failed`,
                  );
                  setSelected(new Set());
                  await fetchLeads();
                } catch (e: any) {
                  toast.error(
                    e?.response?.data?.message ||
                      'Bulk transition failed',
                  );
                } finally {
                  setBulkBusy(false);
                }
              }}
              onBulkDelete={async () => {
                if (
                  !window.confirm(
                    `Soft-delete ${selected.size} leads? They'll be hidden but recoverable.`,
                  )
                )
                  return;
                setBulkBusy(true);
                try {
                  const r = await LeadAPI.bulkDelete(Array.from(selected));
                  toast.success(
                    `${r.deleted} deleted · ${r.failed} failed`,
                  );
                  setSelected(new Set());
                  await fetchLeads();
                } catch (e: any) {
                  toast.error(
                    e?.response?.data?.message || 'Bulk delete failed',
                  );
                } finally {
                  setBulkBusy(false);
                }
              }}
            />
          )}
          {leads.map((lead) => {
            const isSelected = selected.has(lead.id);
            const toggle = () => {
              setSelected((prev) => {
                const next = new Set(prev);
                if (next.has(lead.id)) next.delete(lead.id);
                else next.add(lead.id);
                return next;
              });
            };
            return (
              <div
                key={lead.id}
                className="relative"
              >
                <label className="absolute top-3 left-3 z-10 flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={toggle}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 accent-bridal-gold-dark"
                  />
                </label>
                <div
                  className={
                    isSelected
                      ? 'ring-2 ring-bridal-gold/40 rounded-lg'
                      : ''
                  }
                >
                  <LeadCard
                    lead={lead}
                    busy={busy === lead.id}
                    onTransition={(to) => handleTransition(lead, to)}
                    onWhatsapp={() => {
                      setWhatsappLead(lead);
                      setWhatsappBody('');
                    }}
                    onDelete={() => setDeleteLead(lead)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual-entry dialog */}
      <AddLeadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        businesses={businesses}
        onCreated={async () => {
          setAddOpen(false);
          await fetchLeads();
        }}
      />

      {/* WhatsApp send dialog */}
      <Dialog
        open={!!whatsappLead}
        onOpenChange={(open) => !open && setWhatsappLead(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send WhatsApp</DialogTitle>
            <DialogDescription>
              Reply to{' '}
              <span className="font-medium">
                {whatsappLead?.contactName || whatsappLead?.contactWhatsapp || 'this lead'}
              </span>{' '}
              at{' '}
              <span className="font-mono">
                {whatsappLead?.contactWhatsapp || whatsappLead?.contactPhone || '—'}
              </span>
              .
              {provider === 'noop' && (
                <span className="mt-2 block text-amber-700">
                  No provider configured — the send will be logged as an
                  activity on this lead, but no message will leave the system.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            value={whatsappBody}
            onChange={(e) => setWhatsappBody(e.target.value)}
            placeholder="Assalam-o-alaikum! Thanks for your inquiry…"
          />
          {/* Phase 5 — AI draft assist. Hidden when ANTHROPIC_API_KEY
              isn't configured on the backend. */}
          {whatsappLead && (
            <div className="flex justify-start">
              <AiSuggestButton
                feature="leadReply"
                label="AI draft reply"
                run={() => AiAPI.draftLeadReply(whatsappLead.id)}
                onSuggestion={(r) => setWhatsappBody(r.suggestion)}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWhatsappLead(null)}
              disabled={whatsappSending}
            >
              Cancel
            </Button>
            <Button onClick={handleSendWhatsapp} disabled={whatsappSending}>
              {whatsappSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteLead}
        onOpenChange={(open) => !open && setDeleteLead(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              The lead is soft-deleted — it disappears from your inbox but the
              record stays in the database for audit. You can restore it later
              if needed.
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

// ─── Bulk-actions bar (Phase 4 polish) ────────────────────────────

function BulkActionsBar({
  count,
  totalShown,
  busy,
  onSelectAll,
  onClear,
  onBulkTransition,
  onBulkDelete,
}: {
  count: number;
  totalShown: number;
  busy: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onBulkTransition: (to: LeadStatus) => void;
  onBulkDelete: () => void;
}) {
  const [target, setTarget] = useState<LeadStatus | ''>('');
  const allSelected = count === totalShown && totalShown > 0;
  return (
    <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-bridal-gold/40 bg-bridal-gold/10 backdrop-blur p-2.5">
      <div className="text-xs font-semibold text-bridal-gold-dark">
        {count} selected
      </div>
      <button
        type="button"
        onClick={onSelectAll}
        className="text-[11px] underline-offset-2 hover:underline text-bridal-gold-dark"
      >
        {allSelected ? 'Clear selection' : `Select all (${totalShown})`}
      </button>
      <div className="flex-1" />
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value as LeadStatus | '')}
        disabled={busy}
        className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-xs"
      >
        <option value="">Move to…</option>
        {(
          [
            'new',
            'contacted',
            'qualified',
            'quoted',
            'booked',
            'lost',
            'archived',
          ] as LeadStatus[]
        ).map((s) => (
          <option key={s} value={s}>
            {LEAD_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!target || busy}
        onClick={() => target && onBulkTransition(target)}
        className="h-8 rounded-md bg-bridal-gold text-white px-3 text-xs font-semibold disabled:opacity-50"
      >
        Apply
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onBulkDelete}
        className="h-8 rounded-md border border-rose-200 bg-white text-rose-700 px-3 text-xs font-semibold hover:bg-rose-50 disabled:opacity-50"
      >
        Delete
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={busy}
        className="h-8 rounded-md text-neutral-500 px-2 text-xs hover:text-neutral-700 disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}

// ─── Lead row card ────────────────────────────────────────────────

function LeadCard({
  lead,
  busy,
  onTransition,
  onWhatsapp,
  onDelete,
}: {
  lead: Lead;
  busy: boolean;
  onTransition: (to: LeadStatus) => void;
  onWhatsapp: () => void;
  onDelete: () => void;
}) {
  const tone = LEAD_STATUS_TONES[lead.status];
  const nextOptions = NEXT_STATUS[lead.status] || [];

  const primaryContact =
    lead.contactWhatsapp || lead.contactPhone || lead.contactEmail;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">
                {lead.contactName || 'Unnamed lead'}
              </span>
              <Badge
                variant="outline"
                className={`${tone.bg} ${tone.text} ${tone.border}`}
              >
                {LEAD_STATUS_LABELS[lead.status]}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {LEAD_SOURCE_LABELS[lead.source]}
              </Badge>
              {lead.eventType && (
                <Badge variant="outline" className="text-[10px]">
                  {LEAD_EVENT_TYPE_LABELS[lead.eventType as LeadEventType]}
                </Badge>
              )}
            </div>
            {primaryContact && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {lead.contactWhatsapp && (
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {lead.contactWhatsapp}
                  </span>
                )}
                {lead.contactPhone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {lead.contactPhone}
                  </span>
                )}
                {lead.contactEmail && (
                  <span className="inline-flex items-center gap-1">
                    <MailOpen className="h-3 w-3" />
                    {lead.contactEmail}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <div>{fmtRelative(lead.createdAt)}</div>
            {lead.business?.name && (
              <div className="inline-flex items-center gap-1">
                <Building className="h-3 w-3" />
                {lead.business.name}
              </div>
            )}
          </div>
        </div>

        {lead.inquiry && (
          <p className="line-clamp-3 whitespace-pre-line text-sm text-neutral-700">
            {lead.inquiry}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {lead.eventDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {fmtDate(lead.eventDate)}
            </span>
          )}
          {lead.estimatedGuests != null && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {Number(lead.estimatedGuests).toLocaleString('en-PK')} guests
            </span>
          )}
          {lead.estimatedBudget != null && Number(lead.estimatedBudget) > 0 && (
            <span className="inline-flex items-center gap-1">
              {fmtPKR(lead.estimatedBudget)}
            </span>
          )}
          {lead.assignedTo?.fullName && (
            <span className="inline-flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              {lead.assignedTo.fullName}
            </span>
          )}
          {lead.respondedAt && (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              First reply {fmtRelative(lead.respondedAt)}
            </span>
          )}
        </div>

        {/* Conversion indicator — when lead is booked, surface the
            linked Function Sheet so vendor sees what the inquiry
            converted into (title + click-through to event command
            centre). */}
        {lead.bookingId && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/40 px-2 py-1">
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800">
              <CheckCircle2 className="h-3 w-3" />
              Converted to Booking #{lead.bookingId}
            </span>
            <LinkedFunctionSheetBadge
              bookingId={lead.bookingId}
              variant="inline"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {nextOptions.length > 0 ? (
            nextOptions.map((to) => {
              const targetTone = LEAD_STATUS_TONES[to];
              return (
                <Button
                  key={to}
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => onTransition(to)}
                  className={`${targetTone.border} ${targetTone.text}`}
                >
                  {busy ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-1 h-3 w-3" />
                  )}
                  {LEAD_STATUS_LABELS[to]}
                </Button>
              );
            })
          ) : (
            <span className="text-xs italic text-muted-foreground">
              Terminal — no further moves
            </span>
          )}
          {(lead.contactWhatsapp || lead.contactPhone) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onWhatsapp}
              disabled={busy}
            >
              <MessageSquare className="mr-1 h-3 w-3" />
              WhatsApp
            </Button>
          )}
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

// ─── Add lead dialog ──────────────────────────────────────────────

function AddLeadDialog({
  open,
  onOpenChange,
  businesses,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businesses: VendorBusinessOption[];
  onCreated: () => Promise<void> | void;
}) {
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      source: 'manual_phone',
      businessId: businesses[0]?.id,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        source: 'manual_phone',
        businessId: businesses[0]?.id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, businesses]);

  const onSubmit = async (values: CreateFormValues) => {
    try {
      const payload: CreateLeadInput = {
        businessId: Number(values.businessId),
        source: values.source as LeadSource,
        contactName: values.contactName || undefined,
        contactPhone: values.contactPhone || undefined,
        contactWhatsapp: values.contactWhatsapp || undefined,
        contactEmail: values.contactEmail || undefined,
        eventType: (values.eventType as LeadEventType) || undefined,
        eventDate: values.eventDate || undefined,
        estimatedGuests:
          values.estimatedGuests != null && Number.isFinite(Number(values.estimatedGuests))
            ? Number(values.estimatedGuests)
            : undefined,
        estimatedBudget:
          values.estimatedBudget != null && Number.isFinite(Number(values.estimatedBudget))
            ? Number(values.estimatedBudget)
            : undefined,
        inquiry: values.inquiry || undefined,
        notes: values.notes || undefined,
      };
      await LeadAPI.create(payload);
      toast.success('Lead logged');
      await onCreated();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not log lead');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log a lead</DialogTitle>
          <DialogDescription>
            Walk-in, phone call, WhatsApp message — log every inquiry so it
            doesn&apos;t slip through.
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
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manual_phone">Phone call</SelectItem>
                        <SelectItem value="manual_walkin">Walk-in</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="form_inquiry">Website form</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Ahmed Khan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="0300-1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactWhatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="+92 300 1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.pk" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event type</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={(v) => field.onChange(v || undefined)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(LEAD_EVENT_TYPE_LABELS).map(
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
                name="eventDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimatedGuests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Est. guests</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="e.g. 600"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="estimatedBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated budget (PKR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 1500000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Helps you prioritise — leave blank if unsure.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inquiry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inquiry</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="What did they ask about?"
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
                  <FormLabel>Internal notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Not visible to the customer."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
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
                Log lead
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

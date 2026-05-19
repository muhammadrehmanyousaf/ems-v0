'use client';

/**
 * Function Sheet activity dialog — chronological audit log for
 * compliance + dispute resolution.
 *
 * Pakistani contracts can become legal disputes (CPC 1908 §80 wage
 * claims, customer-vendor disagreement on agreed scope). "Auntie
 * Naseem says we agreed Rs. 800/plate not 1,500" is settled by
 * showing the audit log: "Vendor X (admin@…) updated grandTotal
 * from Rs. 480,000 to Rs. 900,000 on 2026-08-05 14:32. Auntie
 * Naseem signed via share token at 2026-08-06 09:14."
 *
 * Reads /api/v1/function-sheets/:id/audit-log. Shows:
 *   - Event icon per action type
 *   - Actor name + email (when known) OR "Public / customer" pill
 *   - Timestamp (full + relative)
 *   - Diff preview for create / update / state changes
 *   - Metadata for ancillary events (pdf bytes, whatsapp result,
 *     share-token expiry)
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Loader2,
  FilePlus,
  Pencil,
  ArrowRightLeft,
  FileText,
  MessageSquare,
  Share2,
  ShieldOff,
  PenLine,
  Trash2,
  User,
  Globe,
  Activity,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  FunctionSheetAPI,
  type FunctionSheet,
  type AuditEvent,
} from '@/lib/api/functionSheets';

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-PK');
  } catch {
    return iso;
  }
}
function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const t = new Date(iso).getTime();
    const diff = Math.round((Date.now() - t) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    if (diff < 86400 * 30) return `${Math.round(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString('en-PK');
  } catch {
    return '';
  }
}

const ACTION_LABELS: Record<string, string> = {
  created: 'Function sheet created',
  updated: 'Content edited',
  deleted: 'Soft-deleted',
  'pdf:generated': 'PDF generated',
  'whatsapp:sent': 'WhatsApp delivery attempted',
  'share-token:issued': 'Share link issued',
  'share-token:revoked': 'Share link revoked',
  'customer:signed-via-token': 'Customer signed (via share link)',
};

function actionMeta(action: string) {
  if (action === 'created')
    return { label: ACTION_LABELS.created, icon: FilePlus, tone: 'emerald' };
  if (action === 'updated')
    return { label: ACTION_LABELS.updated, icon: Pencil, tone: 'blue' };
  if (action === 'deleted')
    return { label: ACTION_LABELS.deleted, icon: Trash2, tone: 'rose' };
  if (action.startsWith('state:'))
    return {
      label: `State → ${action.slice(6).replace(/_/g, ' ')}`,
      icon: ArrowRightLeft,
      tone: 'violet',
    };
  if (action === 'pdf:generated')
    return { label: ACTION_LABELS['pdf:generated'], icon: FileText, tone: 'sky' };
  if (action === 'whatsapp:sent')
    return {
      label: ACTION_LABELS['whatsapp:sent'],
      icon: MessageSquare,
      tone: 'emerald',
    };
  if (action === 'share-token:issued')
    return {
      label: ACTION_LABELS['share-token:issued'],
      icon: Share2,
      tone: 'sky',
    };
  if (action === 'share-token:revoked')
    return {
      label: ACTION_LABELS['share-token:revoked'],
      icon: ShieldOff,
      tone: 'rose',
    };
  if (action === 'customer:signed-via-token')
    return {
      label: ACTION_LABELS['customer:signed-via-token'],
      icon: PenLine,
      tone: 'violet',
    };
  return { label: action, icon: Activity, tone: 'neutral' };
}

const TONE_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  blue: 'bg-blue-50 text-blue-800 border-blue-300',
  violet: 'bg-violet-50 text-violet-800 border-violet-300',
  sky: 'bg-sky-50 text-sky-800 border-sky-300',
  rose: 'bg-rose-50 text-rose-800 border-rose-300',
  amber: 'bg-amber-50 text-amber-800 border-amber-300',
  neutral: 'bg-neutral-100 text-neutral-700 border-neutral-300',
};

interface ActivityDialogProps {
  sheet: FunctionSheet | null;
  onOpenChange: (v: boolean) => void;
}

export function ActivityDialog({ sheet, onOpenChange }: ActivityDialogProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sheet) return;
    setLoading(true);
    FunctionSheetAPI.auditLog(sheet.id, 100)
      .then((res) => setEvents(res.events))
      .catch((e) =>
        toast.error(e?.response?.data?.message || 'Failed to load activity'),
      )
      .finally(() => setLoading(false));
  }, [sheet?.id]);

  if (!sheet) return null;

  return (
    <Dialog open={!!sheet} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity log — {sheet.title || `Function sheet #${sheet.id}`}
          </DialogTitle>
          <DialogDescription>
            Append-only audit trail. Captures every mutation: edits,
            state changes, signatures (in-app + share-token), PDF
            generation, WhatsApp deliveries, share-link issue/revoke.
            Useful for legal disputes and tax-audit defence.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No activity yet — this sheet was likely created before the
            audit-log feature shipped.
          </p>
        ) : (
          <ol className="relative space-y-3 pl-6">
            <div
              className="absolute left-2 top-0 h-full w-px bg-neutral-200"
              aria-hidden
            />
            {events.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EventRow({ event }: { event: AuditEvent }) {
  const meta = actionMeta(event.action);
  const Icon = meta.icon;

  const actorLabel = event.actor
    ? event.actor.fullName || event.actor.email || `User #${event.actorUserId}`
    : event.action === 'customer:signed-via-token'
      ? 'Customer (via share link)'
      : 'Public / system';
  const actorIcon = event.actor ? User : Globe;

  // Build a compact diff line for updated / state events.
  let diffLine: React.ReactNode = null;
  if (event.action === 'updated' && event.before && event.after) {
    const diffs = collectDiffs(event.before, event.after);
    if (diffs.length > 0) {
      diffLine = (
        <div className="mt-1 space-y-0.5 rounded-md bg-neutral-50 px-2 py-1 text-[11px]">
          {diffs.slice(0, 6).map((d, i) => (
            <div key={i} className="font-mono">
              <span className="text-muted-foreground">{d.path}: </span>
              <span className="text-rose-700 line-through">{d.before}</span>
              <span className="text-muted-foreground"> → </span>
              <span className="text-emerald-700">{d.after}</span>
            </div>
          ))}
          {diffs.length > 6 && (
            <div className="text-muted-foreground">
              + {diffs.length - 6} more field
              {diffs.length - 6 === 1 ? '' : 's'} changed
            </div>
          )}
        </div>
      );
    }
  } else if (event.action.startsWith('state:') && event.before && event.after) {
    diffLine = (
      <div className="mt-1 inline-flex items-center gap-2 rounded-md bg-violet-50 px-2 py-0.5 text-[11px] text-violet-800">
        <span>{event.before.state}</span>
        <ArrowRightLeft className="h-3 w-3" />
        <span className="font-semibold">{event.after.state}</span>
      </div>
    );
  } else if (event.after) {
    // Ancillary events — surface key facts.
    const a = event.after;
    if (event.action === 'pdf:generated') {
      diffLine = (
        <div className="mt-1 text-[11px] text-muted-foreground">
          {a.variant} · {Math.round((a.bytes || 0) / 1024)} KB
        </div>
      );
    } else if (event.action === 'whatsapp:sent') {
      diffLine = (
        <div className="mt-1 text-[11px]">
          <span className="text-muted-foreground">
            {a.variant} → {a.to} · {Math.round((a.bytes || 0) / 1024)} KB ·{' '}
          </span>
          <span
            className={
              a.result_ok ? 'text-emerald-700' : 'text-amber-700'
            }
          >
            {a.result_ok ? 'delivered' : `failed (${a.reason || 'unknown'})`}
          </span>
        </div>
      );
    } else if (event.action === 'share-token:issued') {
      diffLine = (
        <div className="mt-1 text-[11px] text-muted-foreground">
          Expires in {a.expiresInDays} days ({fmtDateTime(a.expiresAt)})
        </div>
      );
    } else if (event.action === 'customer:signed-via-token') {
      diffLine = (
        <div className="mt-1 text-[11px] text-muted-foreground">
          {a.name} · {a.mode} signature ·{' '}
          <Badge
            variant="outline"
            className="ml-1 border-violet-300 bg-violet-50 text-violet-800"
          >
            via share link
          </Badge>
        </div>
      );
    }
  }

  return (
    <li className="relative">
      <span
        className={`absolute -left-6 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border ${TONE_CLASSES[meta.tone] || TONE_CLASSES.neutral}`}
        aria-hidden
      >
        <Icon className="h-3 w-3" />
      </span>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-sm font-medium">{meta.label}</span>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          {React.createElement(actorIcon, { className: 'h-3 w-3' })}
          {actorLabel}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {fmtDateTime(event.at)} · {fmtRelative(event.at)}
        </span>
      </div>
      {diffLine}
    </li>
  );
}

// ─── Tiny diff helper ─────────────────────────────────────────────
// Walks objects 1 level deep + flat top-level keys; sufficient for
// the slim audit snapshot the controller writes.

interface DiffEntry {
  path: string;
  before: string;
  after: string;
}

function collectDiffs(before: any, after: any): DiffEntry[] {
  const out: DiffEntry[] = [];
  if (!before || !after) return out;
  const allKeys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);
  const skip = new Set([
    'updatedAt',
    'createdAt',
    'deletedAt',
    'pdfArchiveUrls',
    'id',
  ]);
  for (const k of allKeys) {
    if (skip.has(k)) continue;
    const bv = before?.[k];
    const av = after?.[k];
    if (deepEqual(bv, av)) continue;
    out.push({
      path: k,
      before: stringifyForDiff(bv),
      after: stringifyForDiff(av),
    });
  }
  return out;
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}

function stringifyForDiff(v: any): string {
  if (v == null) return '—';
  if (typeof v === 'string') return v.length > 60 ? `${v.slice(0, 60)}…` : v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return `[${v.length} item${v.length === 1 ? '' : 's'}]`;
  try {
    const j = JSON.stringify(v);
    return j.length > 80 ? `${j.slice(0, 80)}…` : j;
  } catch {
    return '[object]';
  }
}

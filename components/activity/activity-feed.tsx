"use client";

import * as React from "react";
import type { ActivityEvent } from "@/lib/api/activity";

/**
 * Activity & Audit Engine — reusable feed renderer (Phase 2). Presentational:
 * takes the humanized events and renders them grouped by day with severity
 * coding, actor + context, and expandable change/money detail. Used by the
 * customer feed and the superadmin console.
 */

const SEV: Record<string, { dot: string; label: string }> = {
  INFO: { dot: "bg-bridal-gold/50", label: "text-bridal-text-soft" },
  NOTICE: { dot: "bg-bridal-gold-dark", label: "text-bridal-charcoal" },
  WARNING: { dot: "bg-amber-500", label: "text-amber-700" },
  CRITICAL: { dot: "bg-bridal-coral", label: "text-bridal-coral" },
};

function dayKey(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" });
}

function EventRow({ e, showActor }: { e: ActivityEvent; showActor?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const sev = SEV[e.severity] || SEV.INFO;
  const hasDetail = (e.changes && Object.keys(e.changes).length > 0) || (e.money && !e.money.redacted) || e.context?.ipCountry;
  return (
    <li className="relative pl-6 pb-4 last:pb-0">
      <span className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${sev.dot}`} aria-hidden />
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`text-[14px] font-medium ${sev.label}`}>{e.humanized}</span>
        {e.outcome === "DENIED" && (
          <span className="text-[10px] font-bridal uppercase tracking-wide text-bridal-coral border border-bridal-coral/40 rounded px-1">denied</span>
        )}
        {e.money && !e.money.redacted && e.money.amount && (
          <span className="text-[12px] font-medium text-bridal-gold-dark tabular-nums">
            Rs {Number(e.money.amount).toLocaleString("en-PK")}
          </span>
        )}
        <span className="ml-auto text-[11px] text-bridal-text-soft tabular-nums">{timeOf(e.occurredAt)}</span>
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-bridal-text-soft">
        {showActor && e.actorDisplayName && (
          <span>
            {e.actorDisplayName}
            {e.actorRole ? ` · ${e.actorRole}` : ""}
            {e.onBehalfOfUserId ? " (acting for another user)" : ""}
          </span>
        )}
        {e.context?.ipCountry && <span>· {e.context.ipCountry}</span>}
        {hasDetail && (
          <button type="button" onClick={() => setOpen((v) => !v)} className="text-bridal-gold-dark hover:underline">
            {open ? "hide" : "details"}
          </button>
        )}
      </div>
      {open && (
        <div className="mt-1.5 rounded-md border border-bridal-beige bg-bridal-cream/50 p-2 text-[11px] text-bridal-charcoal font-mono space-y-0.5">
          {e.changes &&
            Object.entries(e.changes).map(([f, c]) => (
              <div key={f}>
                <b>{f}</b>: {String(c.from ?? "—")} → {String(c.to ?? "—")}
              </div>
            ))}
          {e.context?.correlationId && <div className="text-bridal-text-soft">trace: {e.context.correlationId}</div>}
          {e.context?.route && <div className="text-bridal-text-soft">{e.context.route}</div>}
        </div>
      )}
    </li>
  );
}

export function ActivityFeed({
  events,
  loading,
  showActor,
  emptyLabel = "No activity yet.",
  onLoadMore,
  hasMore,
}: {
  events: ActivityEvent[];
  loading?: boolean;
  showActor?: boolean;
  emptyLabel?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}) {
  if (!loading && events.length === 0) {
    return <p className="text-[13px] text-bridal-text-soft py-6 text-center">{emptyLabel}</p>;
  }
  // Group by day, preserving order.
  const groups: { day: string; items: ActivityEvent[] }[] = [];
  for (const e of events) {
    const day = dayKey(e.occurredAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(e);
    else groups.push({ day, items: [e] });
  }
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.day}>
          <h3 className="text-[10px] font-bridal uppercase tracking-[0.18em] text-bridal-text-label mb-2">{g.day}</h3>
          <ul className="relative border-l border-bridal-beige ml-1">
            {g.items.map((e) => (
              <EventRow key={e.id} e={e} showActor={showActor} />
            ))}
          </ul>
        </section>
      ))}
      {loading && <p className="text-[12px] text-bridal-text-soft text-center py-2">Loading…</p>}
      {hasMore && !loading && (
        <div className="text-center">
          <button
            type="button"
            onClick={onLoadMore}
            className="text-[12px] font-medium text-bridal-gold-dark hover:underline"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

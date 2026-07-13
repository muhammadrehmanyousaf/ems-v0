"use client";

import * as React from "react";
import { ActivityAPI, type ActivityEvent, type ActivityFilters } from "@/lib/api/activity";
import { ActivityFeed } from "@/components/activity/activity-feed";

/**
 * Superadmin oversight console (Activity & Audit Engine, Phase 2) — the control
 * tower: global RBAC-scoped search across every actor + a correlationId lookup
 * for developer forensics. Backed by GET /api/v1/activity (superadmin sees all).
 */
const CATEGORIES = ["", "MONEY", "AUTH", "BOOKING", "VENDOR", "QUOTE", "PLAN", "DISPUTE", "STAFF", "ADMIN", "DATA", "SYSTEM"];

export default function AdminActivityConsole() {
  const [filters, setFilters] = React.useState<ActivityFilters>({});
  const [events, setEvents] = React.useState<ActivityEvent[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [correlation, setCorrelation] = React.useState("");

  const run = React.useCallback(async (p: number, f: ActivityFilters) => {
    setLoading(true);
    try {
      const res = await ActivityAPI.query({ ...f, page: p, pageSize: 50 });
      setEvents((prev) => (p === 1 ? res.events : [...prev, ...res.events]));
      setTotal(res.total);
    } catch {
      setTotal(0);
      if (p === 1) setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    run(1, {});
  }, [run]);

  const apply = () => {
    setPage(1);
    run(1, filters);
  };

  const lookupTrace = async () => {
    if (!correlation.trim()) return;
    setLoading(true);
    try {
      const res = await ActivityAPI.byCorrelation(correlation.trim());
      setEvents(res.events);
      setTotal(res.total);
    } catch {
      setEvents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof ActivityFilters, v: string) =>
    setFilters((prev) => ({ ...prev, [k]: v === "" ? undefined : (k === "actorUserId" || k === "businessId" ? Number(v) : v) }));

  const inputCls =
    "h-9 rounded-md border border-bridal-beige bg-white px-2.5 text-[13px] text-bridal-charcoal focus:ring-1 focus:ring-bridal-gold outline-none";

  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <p className="text-[10px] font-bridal uppercase tracking-[0.28em] text-bridal-text-label">Superadmin</p>
        <h1 className="font-display italic text-[30px] text-bridal-charcoal leading-tight mt-1">Activity &amp; Audit</h1>
        <p className="text-[13px] text-bridal-text-soft mt-1">
          Every action, every actor — searchable. {total} event{total === 1 ? "" : "s"} matched.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-bridal-beige bg-white p-3 mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-bridal-text-label">Actor user id</span>
          <input className={inputCls} placeholder="e.g. 3278" onChange={(e) => set("actorUserId", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-bridal-text-label">Business id</span>
          <input className={inputCls} placeholder="e.g. 3275" onChange={(e) => set("businessId", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-bridal-text-label">Category</span>
          <select className={inputCls} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c || "any"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-bridal-text-label">Action</span>
          <input className={inputCls} placeholder="domain.resource.verb" onChange={(e) => set("action", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-bridal-text-label">From</span>
          <input type="date" className={inputCls} onChange={(e) => set("from", e.target.value)} />
        </label>
        <button
          type="button"
          onClick={apply}
          className="h-9 rounded-md bg-bridal-gold-dark px-4 text-[13px] font-medium text-white hover:opacity-90"
        >
          Search
        </button>
      </div>

      {/* Dev forensics — correlationId lookup */}
      <div className="rounded-xl border border-bridal-beige bg-bridal-cream/40 p-3 mb-4 flex items-end gap-2">
        <label className="flex-1 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-bridal-text-label">Trace a request (correlationId)</span>
          <input
            className={inputCls}
            placeholder="paste a correlationId to see every event for one request"
            value={correlation}
            onChange={(e) => setCorrelation(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={lookupTrace}
          className="h-9 rounded-md border border-bridal-gold-dark px-4 text-[13px] font-medium text-bridal-gold-dark hover:bg-bridal-cream"
        >
          Trace
        </button>
      </div>

      <ActivityFeed
        events={events}
        loading={loading}
        showActor
        emptyLabel="No matching events."
        hasMore={events.length < total}
        onLoadMore={() => {
          const next = page + 1;
          setPage(next);
          run(next, filters);
        }}
      />
    </div>
  );
}

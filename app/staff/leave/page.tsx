"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  StaffPortalAPI,
  getStaffToken,
  type LeaveRequest,
  type LeaveType,
} from "@/lib/api/staffPortal";

const TYPES: { value: LeaveType; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "sick", label: "Sick" },
  { value: "unpaid", label: "Unpaid" },
  { value: "other", label: "Other" },
];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

function fmt(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? ymd
    : d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

export default function StaffLeavePage() {
  const router = useRouter();
  const [leave, setLeave] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState<LeaveType>("casual");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setLeave(await StaffPortalAPI.getMyLeave());
    } catch (err: any) {
      if (err?.response?.status === 401) return;
      setError(err?.response?.data?.message || "Could not load your leave.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getStaffToken()) {
      router.replace("/staff/login");
      return;
    }
    load();
  }, [router, load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await StaffPortalAPI.requestLeave({ fromDate: from, toDate: to, type, reason: reason.trim() || undefined });
      setFrom("");
      setTo("");
      setType("casual");
      setReason("");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-bridal-gold-dark">Leave</h1>
        <Link href="/staff/today" className="text-xs text-muted-foreground underline">
          My shifts
        </Link>
      </header>

      <form onSubmit={submit} className="space-y-3 rounded-xl border bg-white p-4">
        <p className="text-sm font-medium">Request leave</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground" htmlFor="from">From</label>
            <Input id="from" type="date" required value={from} onChange={(e) => setFrom(e.target.value)} className="h-11" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground" htmlFor="to">To</label>
            <Input id="to" type="date" required value={to} onChange={(e) => setTo(e.target.value)} className="h-11" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground" htmlFor="type">Type</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as LeaveType)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground" htmlFor="reason">Reason (optional)</label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g. Family event"
          />
        </div>
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>
        )}
        <Button type="submit" disabled={submitting || !from || !to} className="h-11 w-full">
          {submitting ? "Sending…" : "Request leave"}
        </Button>
      </form>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">My requests</h2>
        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : leave.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No leave requests yet.</p>
        ) : (
          <ul className="space-y-3">
            {leave.map((l) => (
              <li key={l.id} className="rounded-xl border bg-white/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {fmt(l.fromDate)} – {fmt(l.toDate)}
                    </p>
                    <p className="text-sm capitalize text-muted-foreground">{l.type}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${STATUS_STYLE[l.status] || ""}`}>
                    {l.status}
                  </span>
                </div>
                {l.reason && <p className="mt-2 text-sm text-muted-foreground">{l.reason}</p>}
                {l.reviewNotes && (
                  <p className="mt-1 text-xs text-muted-foreground">Manager: {l.reviewNotes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

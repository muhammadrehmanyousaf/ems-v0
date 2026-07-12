"use client";

import * as React from "react";
import { ActivityAPI, type ActivityEvent } from "@/lib/api/activity";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { useActivityFlag } from "@/lib/activity-flag";

/**
 * Customer "Your activity" feed (Activity & Audit Engine, Phase 2) — the trust
 * layer: a humanized, browsable record of what happened on your account. Dark
 * until FEAT_ACTIVITY_ENGINE; the BE 404s when off, so this shows an empty state
 * rather than erroring.
 */
export default function UserActivityPage() {
  const enabled = useActivityFlag();
  const [events, setEvents] = React.useState<ActivityEvent[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await ActivityAPI.feed(p, 30);
      setEvents((prev) => (p === 1 ? res.events : [...prev, ...res.events]));
      setTotal(res.total);
    } catch {
      // BE dark / not enabled → empty state.
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load(1);
  }, [load]);

  const hasMore = events.length < total;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <p className="text-[10px] font-bridal uppercase tracking-[0.28em] text-bridal-text-label">Your account</p>
        <h1 className="font-display italic text-[30px] text-bridal-charcoal leading-tight mt-1">Activity</h1>
        <p className="text-[14px] text-bridal-text-soft mt-1 max-w-xl">
          A record of everything that happened on your account — bookings, payments, sign-ins and more. If anything looks
          unfamiliar, contact us.
        </p>
      </div>

      {!enabled && !loading && events.length === 0 ? (
        <p className="text-[13px] text-bridal-text-soft py-6">Activity history is not available yet.</p>
      ) : (
        <ActivityFeed
          events={events}
          loading={loading}
          emptyLabel="No activity yet — your bookings and account events will appear here."
          hasMore={hasMore}
          onLoadMore={() => {
            const next = page + 1;
            setPage(next);
            load(next);
          }}
        />
      )}
    </div>
  );
}

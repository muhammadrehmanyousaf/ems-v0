/**
 * Smart notification grouping — buckets a (already reverse-chronological)
 * notification list into human date sections: Today / Yesterday / This
 * week / Earlier. Shared by the vendor popover and the customer dropdown
 * so both read the same way.
 *
 * Pure + presentation-only: it never reorders within a bucket (the API
 * already sorts newest-first), so unread dots, load-more and delete all
 * keep working unchanged.
 */

import type { Notification } from "@/lib/api/notifications";

export type NotificationGroupKey = "today" | "yesterday" | "this_week" | "earlier";

export interface NotificationGroup {
  key: NotificationGroupKey;
  label: string;
  items: Notification[];
}

const LABELS: Record<NotificationGroupKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "Earlier this week",
  earlier: "Earlier",
};

function bucketFor(createdAt: string, now: Date): NotificationGroupKey {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "earlier";

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - 7 * 86400000);

  const t = d.getTime();
  if (t >= startOfToday.getTime()) return "today";
  if (t >= startOfYesterday.getTime()) return "yesterday";
  if (t >= startOfWeek.getTime()) return "this_week";
  return "earlier";
}

/**
 * Returns date-bucketed groups in display order, dropping empty buckets.
 * Order within each group is preserved from the input.
 */
export function groupNotificationsByDate(
  notifications: Notification[],
  now: Date = new Date(),
): NotificationGroup[] {
  const order: NotificationGroupKey[] = ["today", "yesterday", "this_week", "earlier"];
  const map = new Map<NotificationGroupKey, Notification[]>();
  for (const n of notifications) {
    const key = bucketFor(n.createdAt, now);
    const arr = map.get(key);
    if (arr) arr.push(n);
    else map.set(key, [n]);
  }
  return order
    .filter((k) => (map.get(k)?.length ?? 0) > 0)
    .map((k) => ({ key: k, label: LABELS[k], items: map.get(k) as Notification[] }));
}

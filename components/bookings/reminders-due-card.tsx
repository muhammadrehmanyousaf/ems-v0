"use client";

/**
 * Phase-2 EPIC 8 · 8.2 — "Aaj kis ko yaad dilana hai" (recovery reminders).
 *
 * Lists the bookings that owe money — most urgent first (soonest event, then
 * biggest baqaya) — each with a one-tap "Yaad dilao" that opens WhatsApp with a
 * gender-neutral Urdu message AND logs the nudge so "reminded on" survives a
 * refresh. Behind WHATSAPP_TIER1_ENABLED (self-hides on 404).
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle, Clock, CheckCircle2 } from "lucide-react";
import { getDueReminders, logReminder, type DueReminder } from "@/lib/api/bookingOrder";
import { Card, CardContent } from "@/components/ui/card";

const rs = (n: number) => "Rs " + Math.round(n || 0).toLocaleString("en-PK");
const whenLabel = (d: number | null) =>
  d == null ? "" : d === 0 ? "Aaj" : d === 1 ? "Kal" : d > 0 ? `${d} din mein` : "Guzar gaya";

export function RemindersDueCard() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["reminders-due"], queryFn: getDueReminders });
  const [justSent, setJustSent] = useState<Record<number, boolean>>({});

  const mut = useMutation({
    mutationFn: (r: DueReminder) => logReminder(r.bookingId, { trigger: r.trigger, channel: "whatsapp", body: r.message }),
    onSuccess: (_res, r) => {
      setJustSent((s) => ({ ...s, [r.bookingId]: true }));
      qc.invalidateQueries({ queryKey: ["reminders-due"] });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Reminders…
        </CardContent>
      </Card>
    );
  }
  if (!data) return null; // feature off (404)

  const remind = (r: DueReminder) => {
    // Open WhatsApp, then log the nudge (don't block the tab open on the network).
    window.open(r.waHref, "_blank", "noopener,noreferrer");
    mut.mutate(r);
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Aaj kis ko yaad dilana hai</h3>
          <span className="text-xs text-muted-foreground">{data.count} baqaya</span>
        </div>

        {data.reminders.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">Koi baqaya nahi — sab clear. 🎉</p>
        )}

        <div className="space-y-2">
          {data.reminders.slice(0, 12).map((r) => {
            const sent = justSent[r.bookingId] || r.lastRemindedAt;
            return (
              <div key={r.bookingId} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{r.customerName || `Booking #${r.bookingId}`}</p>
                    {r.trigger === "event_upcoming" && r.daysUntil != null && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 shrink-0">
                        {whenLabel(r.daysUntil)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.eventType || "Event"}{r.eventDate ? ` · ${r.eventDate}` : ""}
                  </p>
                  {r.lastRemindedAt && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="size-2.5" /> Yaad dilaya: {new Date(r.lastRemindedAt).toLocaleDateString("en-PK")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-sm font-bold tabular-nums text-amber-700 dark:text-amber-400">{rs(r.balance)}</span>
                  <button
                    onClick={() => remind(r)}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 transition-colors"
                  >
                    {sent ? <CheckCircle2 className="size-3.5" /> : <MessageCircle className="size-3.5" />}
                    {sent ? "Dubara" : "Yaad dilao"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default RemindersDueCard;

"use client";

/**
 * Two-way rating §26.4 — vendor rates the customer.
 * Modal triggered from CustomerTrustCard. Captures one rating event
 * (overall stars + subscores + flags + notes + would-book-again) and
 * appends it to the customer's vendorRatingsJson server-side.
 *
 * The "back-channel" doctrine: this is PRIVATE to the vendor — other
 * vendors will not see it (MVP). Used as a personal reminder + future
 * input to an aggregated trust score (out of scope here).
 */

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import {
  CustomerRatingsAPI,
  type CustomerRatingFlag,
  type CustomerRatingInput,
} from "@/lib/api/dashboard";

const FLAG_LABEL: Record<CustomerRatingFlag, string> = {
  advance_disputed: "Disputed the advance",
  last_minute_cancel: "Cancelled at the last minute",
  rude_to_staff: "Rude to staff",
  harassed_staff: "Harassed staff",
  cheque_bounced: "Cheque bounced",
  no_show: "Didn't show up",
  negotiated_at_event: "Negotiated at the event",
  scope_creep: "Demanded extras post-contract",
  ghosted: "Ghosted after deposit",
  great_to_work_with: "Great to work with",
  paid_on_time: "Paid on time",
  premium_customer: "Premium customer (worth chasing)",
};

const FLAG_TONE: Record<CustomerRatingFlag, "neg" | "pos"> = {
  advance_disputed: "neg",
  last_minute_cancel: "neg",
  rude_to_staff: "neg",
  harassed_staff: "neg",
  cheque_bounced: "neg",
  no_show: "neg",
  negotiated_at_event: "neg",
  scope_creep: "neg",
  ghosted: "neg",
  great_to_work_with: "pos",
  paid_on_time: "pos",
  premium_customer: "pos",
};

const SUBSCORE_LABEL: Record<keyof NonNullable<CustomerRatingInput["subscores"]>, string> = {
  paymentReliability: "Payment reliability",
  communication: "Communication",
  expectations: "Realistic expectations",
  dayOfBehavior: "Day-of behavior",
};

function StarRow({
  value, onChange, disabled, size = 22,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n === value ? 0 : n)}
          className={`transition-colors ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
        >
          <Star
            style={{ width: size, height: size }}
            className={n <= value
              ? "fill-bridal-gold-dark text-bridal-gold-dark"
              : "text-muted-foreground/30"}
          />
        </button>
      ))}
    </div>
  );
}

export default function RateCustomerDialog({
  open, onOpenChange, offlineCustomerId, allowedFlags, bookingId, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  offlineCustomerId: number;
  allowedFlags: CustomerRatingFlag[];
  bookingId?: number | null;
  onSaved?: () => void;
}) {
  const [stars, setStars] = useState(0);
  const [wouldBookAgain, setWouldBookAgain] = useState(true);
  const [flags, setFlags] = useState<Set<CustomerRatingFlag>>(new Set());
  const [paymentReliability, setPaymentReliability] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [expectations, setExpectations] = useState(0);
  const [dayOfBehavior, setDayOfBehavior] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStars(0);
      setWouldBookAgain(true);
      setFlags(new Set());
      setPaymentReliability(0);
      setCommunication(0);
      setExpectations(0);
      setDayOfBehavior(0);
      setNotes("");
    }
  }, [open]);

  // If the BE allowedFlags didn't load (offline mode), fall back to the
  // FE-known set — keeps the modal usable rather than empty.
  const flagOptions: CustomerRatingFlag[] = (allowedFlags && allowedFlags.length
    ? allowedFlags
    : (Object.keys(FLAG_LABEL) as CustomerRatingFlag[]));

  const toggleFlag = (f: CustomerRatingFlag) =>
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });

  const onSave = async () => {
    if (stars < 1) {
      toast.error("Pick an overall star rating first");
      return;
    }
    setSaving(true);
    try {
      const subscores: CustomerRatingInput["subscores"] = {};
      if (paymentReliability) subscores.paymentReliability = paymentReliability;
      if (communication) subscores.communication = communication;
      if (expectations) subscores.expectations = expectations;
      if (dayOfBehavior) subscores.dayOfBehavior = dayOfBehavior;

      const body: CustomerRatingInput = {
        overallStars: stars,
        wouldBookAgain,
        flags: Array.from(flags),
        notes: notes.trim() || undefined,
        bookingId: bookingId ?? undefined,
      };
      if (Object.keys(subscores).length) body.subscores = subscores;

      await CustomerRatingsAPI.add(offlineCustomerId, body);
      toast.success("Rating saved");
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save rating");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate this customer</DialogTitle>
          <DialogDescription>
            Private to you — other vendors don&apos;t see it. Use it to remember
            who&apos;s easy to work with vs. who isn&apos;t.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Overall */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Overall</Label>
            <StarRow value={stars} onChange={setStars} disabled={saving} />
          </div>

          {/* Subscores */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Breakdown (optional)
            </Label>
            {(["paymentReliability", "communication", "expectations", "dayOfBehavior"] as const).map((k) => {
              const value =
                k === "paymentReliability" ? paymentReliability :
                k === "communication" ? communication :
                k === "expectations" ? expectations : dayOfBehavior;
              const setter =
                k === "paymentReliability" ? setPaymentReliability :
                k === "communication" ? setCommunication :
                k === "expectations" ? setExpectations : setDayOfBehavior;
              return (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-xs">{SUBSCORE_LABEL[k]}</span>
                  <StarRow value={value} onChange={setter} disabled={saving} size={16} />
                </div>
              );
            })}
          </div>

          {/* Flags */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Flags (tap any that apply)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {flagOptions.map((f) => {
                const on = flags.has(f);
                const tone = FLAG_TONE[f] || "neg";
                const onClasses = tone === "pos"
                  ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                  : "bg-rose-100 border-rose-300 text-rose-800";
                return (
                  <button
                    key={f}
                    type="button"
                    disabled={saving}
                    onClick={() => toggleFlag(f)}
                    className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${
                      on
                        ? onClasses
                        : "bg-background border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground"
                    } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {FLAG_LABEL[f] || f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Would book again */}
          <div className="flex items-center justify-between rounded-md border p-2">
            <div>
              <p className="text-xs font-medium">Would book again</p>
              <p className="text-[11px] text-muted-foreground">
                Quick yes/no — easier to scan when this customer comes back.
              </p>
            </div>
            <Switch checked={wouldBookAgain} disabled={saving}
              onCheckedChange={setWouldBookAgain} />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Private notes
            </Label>
            <Textarea rows={3} value={notes} disabled={saving}
              placeholder="What happened (good or bad)? Anything to remember next time."
              onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Save rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

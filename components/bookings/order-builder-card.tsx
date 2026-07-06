"use client";

/**
 * Phase-1 SPINE — order-builder card (the vendor-facing surface).
 *
 * The editable booking document: add any line, override any price, give a
 * discount, bill guaranteed-or-served, and haggle to a final number — the
 * things the old catalog-locked booking made impossible (the core 3/100 fix).
 *
 * Self-fetches; if the backend returns 404 (feature dark) it renders nothing,
 * so it is safe to mount behind the NEXT_PUBLIC_ORDER_BUILDER build flag. Money
 * updates live via a local preview that MIRRORS the server pricing engine; the
 * server recomputes authoritatively on Save and its totals replace the preview.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Loader2, Save, Tag, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getBookingOrder,
  saveBookingOrder,
  type BookingOrder,
  type OrderLine,
  type LineBasis,
  type OrderStage,
} from "@/lib/api/bookingOrder";

const PKR = (n: number | null | undefined) =>
  "Rs " + Math.round(Number(n) || 0).toLocaleString("en-PK");

const BASIS_OPTIONS: { value: LineBasis; label: string }[] = [
  { value: "flat", label: "Fixed" },
  { value: "per_head", label: "Per head" },
  { value: "per_serving", label: "Per plate" },
  { value: "per_each", label: "Per item" },
];

const STAGE_OPTIONS: { value: OrderStage; label: string }[] = [
  { value: "tentative", label: "Tentative" },
  { value: "quotation", label: "Quotation" },
  { value: "confirmed", label: "Confirmed" },
];

type Preset = { label: string; line: Partial<OrderLine> };
const PRESETS: Preset[] = [
  { label: "Hall / Venue", line: { name: "Hall", kind: "hall", basis: "flat", qty: 1, rate: 0 } },
  { label: "Per-head menu", line: { name: "Dinner (per head)", kind: "menu-item", basis: "per_head", qty: 0, rate: 0 } },
  { label: "Extra charge", line: { name: "", kind: "charge", basis: "flat", qty: 1, rate: 0 } },
  { label: "Discount", line: { name: "Discount", kind: "discount", basis: "percent", discountValue: 0 } },
];

const num = (v: unknown, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
const isHead = (b?: string) => b === "per_head" || b === "per_serving";
const isCustomerLine = (l: OrderLine) => l.kind !== "cost" && l.moneyFlow !== "expense";

function effectiveQty(l: OrderLine) {
  if (isHead(l.basis) && (l.guaranteedQty != null || l.servedQty != null)) {
    return Math.max(num(l.guaranteedQty), num(l.servedQty));
  }
  return num(l.qty);
}
function lineAmount(l: OrderLine) {
  if (l.kind === "discount") return 0;
  const gross = effectiveQty(l) * num(l.rate);
  if (l.discountType === "comp" || l.discountType === "waive") return 0;
  if (l.discountType === "percent") return gross * (1 - num(l.discountValue) / 100);
  if (l.discountType === "flat") return Math.max(0, gross - num(l.discountValue));
  return gross;
}
/** Local mirror of bookingOrderService.computeOrderTotals (server authoritative on save). */
function preview(lines: OrderLine[], advance: number, finalOverride: number | null) {
  const subtotal = lines.filter(isCustomerLine).reduce((s, l) => s + lineAmount(l), 0);
  let discount = 0;
  for (const l of lines) {
    if (l.kind !== "discount") continue;
    const v = l.discountValue != null ? num(l.discountValue) : num(l.rate);
    discount += l.basis === "percent" ? subtotal * (v / 100) : v;
  }
  let grand = subtotal - discount;
  let negotiatedAdjustment = 0;
  if (finalOverride != null) {
    negotiatedAdjustment = finalOverride - grand;
    grand = finalOverride;
  }
  return { subtotal, discount, negotiatedAdjustment, grand, balance: grand - advance };
}

export function OrderBuilderCard({ bookingId }: { bookingId: number }) {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [advance, setAdvance] = useState(0);
  const [finalOverride, setFinalOverride] = useState<number | null>(null);
  const [eventType, setEventType] = useState<string>("");
  const [orderStage, setOrderStage] = useState<OrderStage>("tentative");

  const hydrate = useCallback((o: BookingOrder) => {
    setEnabled(true);
    setLines(o.lines ?? []);
    setAdvance(num(o.totals?.advance));
    setFinalOverride(o.totals?.finalOverride ?? null);
    setEventType(o.header?.eventType ?? "");
    setOrderStage((o.header?.orderStage as OrderStage) ?? "tentative");
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const o = await getBookingOrder(bookingId);
        if (live && o) hydrate(o);
      } catch {
        /* transient — leave hidden */
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [bookingId, hydrate]);

  const totals = useMemo(() => preview(lines, advance, finalOverride), [lines, advance, finalOverride]);

  const update = (i: number, patch: Partial<OrderLine>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const remove = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));
  const addPreset = (p: Preset) =>
    setLines((prev) => [
      ...prev,
      { name: "", kind: "service", basis: "flat", qty: 1, rate: 0, sortOrder: prev.length, ...p.line } as OrderLine,
    ]);

  const save = async () => {
    setSaving(true);
    try {
      const o = await saveBookingOrder(bookingId, {
        lines: lines.map((l, i) => ({ ...l, sortOrder: i })),
        advance,
        finalOverride,
        eventType: eventType || null,
        orderStage,
      });
      hydrate(o);
      toast.success("Order saved");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save the order");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null; // resolve silently
  if (!enabled) return null; // feature dark for this account

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Tag className="size-4 text-primary" />
            <h3 className="font-semibold">Order &amp; Price</h3>
            <span className="text-xs text-muted-foreground">Add anything · edit any price</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={orderStage}
              onChange={(e) => setOrderStage(e.target.value as OrderStage)}
              className="h-8 rounded-md border bg-background px-2 text-sm"
            >
              {STAGE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <Input
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          placeholder="Event (Barat, Walima, Mehndi…) — optional"
          className="h-9 max-w-xs"
        />

        {/* Lines */}
        <div className="space-y-2">
          {lines.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">
              No items yet. Add a hall, a per-head menu, or any custom charge below.
            </p>
          )}
          {lines.map((l, i) => {
            const isDiscount = l.kind === "discount";
            return (
              <div key={i} className="rounded-lg border p-2.5 space-y-2 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Input
                    value={l.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                    placeholder={isDiscount ? "Discount label" : "Item name"}
                    className="h-8 flex-1"
                  />
                  <button
                    onClick={() => remove(i)}
                    className="text-muted-foreground hover:text-destructive p-1 shrink-0"
                    aria-label="Remove line"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {isDiscount ? (
                  <div className="flex items-center gap-2 text-sm">
                    <select
                      value={l.basis}
                      onChange={(e) => update(i, { basis: e.target.value as LineBasis })}
                      className="h-8 rounded-md border bg-background px-2"
                    >
                      <option value="percent">% off</option>
                      <option value="flat">Rs off</option>
                    </select>
                    <Input
                      type="number"
                      value={l.discountValue ?? ""}
                      onChange={(e) => update(i, { discountValue: e.target.value === "" ? null : num(e.target.value) })}
                      placeholder="0"
                      className="h-8 w-28"
                    />
                    <span className="ml-auto text-xs text-muted-foreground italic">reduces total</span>
                  </div>
                ) : (
                  <div className="flex items-end gap-2 flex-wrap text-sm">
                    <label className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-muted-foreground">Type</span>
                      <select
                        value={l.basis}
                        onChange={(e) => update(i, { basis: e.target.value as LineBasis })}
                        className="h-8 rounded-md border bg-background px-2"
                      >
                        {BASIS_OPTIONS.map((b) => (
                          <option key={b.value} value={b.value}>{b.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-muted-foreground">{isHead(l.basis) ? "Guests" : "Qty"}</span>
                      <Input
                        type="number"
                        value={l.qty}
                        onChange={(e) => update(i, { qty: num(e.target.value) })}
                        className="h-8 w-20"
                      />
                    </label>
                    <span className="pb-2 text-muted-foreground">×</span>
                    <label className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-muted-foreground">Rate (Rs)</span>
                      <Input
                        type="number"
                        value={l.rate}
                        onChange={(e) => update(i, { rate: num(e.target.value) })}
                        className="h-8 w-28"
                      />
                    </label>
                    <span className="ml-auto pb-2 font-medium tabular-nums">{PKR(lineAmount(l))}</span>
                  </div>
                )}

                {/* Guaranteed vs served — the min-guarantee billing, only for head lines */}
                {isHead(l.basis) && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
                    <Users className="size-3.5" />
                    <span>Guarantee</span>
                    <Input
                      type="number"
                      value={l.guaranteedQty ?? ""}
                      onChange={(e) => update(i, { guaranteedQty: e.target.value === "" ? null : num(e.target.value) })}
                      placeholder="min"
                      className="h-7 w-20"
                    />
                    <span>Served</span>
                    <Input
                      type="number"
                      value={l.servedQty ?? ""}
                      onChange={(e) => update(i, { servedQty: e.target.value === "" ? null : num(e.target.value) })}
                      placeholder="actual"
                      className="h-7 w-20"
                    />
                    <span className="italic">bills the higher</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button key={p.label} size="sm" variant="outline" className="h-8" onClick={() => addPreset(p)}>
              <Plus className="size-3.5 mr-1" />
              {p.label}
            </Button>
          ))}
        </div>

        {/* Totals */}
        <div className="rounded-lg border p-3 space-y-1.5 text-sm bg-background">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{PKR(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Discount</span>
              <span className="tabular-nums">−{PKR(totals.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Final price (haggle)</span>
            <Input
              type="number"
              value={finalOverride ?? ""}
              onChange={(e) => setFinalOverride(e.target.value === "" ? null : num(e.target.value))}
              placeholder={String(Math.round(totals.subtotal - totals.discount))}
              className="h-8 w-32 text-right"
            />
          </div>
          {finalOverride != null && Math.abs(totals.negotiatedAdjustment) > 0.5 && (
            <div className="flex justify-between text-xs text-amber-600 dark:text-amber-500">
              <span>Negotiated adjustment</span>
              <span className="tabular-nums">
                {totals.negotiatedAdjustment > 0 ? "+" : "−"}{PKR(Math.abs(totals.negotiatedAdjustment))}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Advance received</span>
            <Input
              type="number"
              value={advance || ""}
              onChange={(e) => setAdvance(num(e.target.value))}
              placeholder="0"
              className="h-8 w-32 text-right"
            />
          </div>
          <div className="flex justify-between font-semibold pt-1 border-t">
            <span>Grand total</span>
            <span className="tabular-nums">{PKR(totals.grand)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Balance due</span>
            <Badge variant={totals.balance > 0 ? "secondary" : "default"} className="tabular-nums">
              {PKR(totals.balance)}
            </Badge>
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          Save order
        </Button>
      </CardContent>
    </Card>
  );
}

export default OrderBuilderCard;

"use client";

/**
 * Phase-2 EPIC 1 · 1.2/1.3/1.4 — BEO event sheet (customer + kitchen views).
 *
 * One booking, two sheets from the shared BEO read model: the CUSTOMER sheet
 * (priced, the signed-order artefact) and the KITCHEN sheet (pax + prep, no
 * prices — what the crew runs the night on). Print each on its own, and share
 * the summary to WhatsApp. Self-hides when BEO is dark (backend 404).
 */
import { useState } from "react";
import { Printer, MessageCircle, FileText, ChefHat, Image as ImageIcon, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useBusiness } from "@/context/BusinessContext";
import { getBeo, type BeoSheets } from "@/lib/api/bookingOrder";
import { waLink } from "@/lib/whatsapp";
import { shareCard, type ShareRow } from "@/lib/whatsappShare";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PKR = (n: number | null | undefined) => "Rs " + Math.round(Number(n) || 0).toLocaleString("en-PK");
const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export function BeoSheetCard({ bookingId }: { bookingId: number }) {
  const { business } = useBusiness();
  const vendor = business?.name ?? "Wedding Wala";
  const [tab, setTab] = useState<"customer" | "kitchen">("customer");
  const { data, isLoading } = useQuery({ queryKey: ["beo", bookingId], queryFn: () => getBeo(bookingId) });

  if (isLoading || !data) return null; // resolving / feature dark

  const printSheet = () => openPrint(tab === "customer" ? customerHtml(data, vendor) : kitchenHtml(data, vendor));
  const shareText = tab === "customer" ? customerShareText(data, vendor) : kitchenShareText(data);
  const phone = data.customerSheet.event.customerPhone;
  const waHref = phone ? waLink(phone, shareText) : "";

  // EPIC 8.4 — the customer order as a clean shareable image.
  const shareImage = () => {
    const { event, totals } = data.customerSheet;
    const rows: ShareRow[] = [
      { label: "Event", value: `${event.eventType || "—"} · ${fmtDate(event.date)}`, tone: "neutral" },
      { label: "Grand total", value: PKR(totals.grand), tone: "neutral" },
      { label: "Advance", value: PKR(totals.advance), tone: "good" },
      { label: "Balance due", value: PKR(totals.balance), tone: "warn" },
    ];
    void shareCard({ title: `${vendor} — Event Order`, subtitle: event.customerName || undefined, rows, footer: "Shukriya!", brand: "Wedding Wala" });
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h3 className="font-semibold">Event Sheet (BEO)</h3>
          </div>
          <div className="inline-flex rounded-md border p-0.5 text-sm">
            <button onClick={() => setTab("customer")} className={cn("px-3 py-1 rounded flex items-center gap-1", tab === "customer" && "bg-primary text-primary-foreground")}>
              <FileText className="size-3.5" /> Customer
            </button>
            <button onClick={() => setTab("kitchen")} className={cn("px-3 py-1 rounded flex items-center gap-1", tab === "kitchen" && "bg-primary text-primary-foreground")}>
              <ChefHat className="size-3.5" /> Kitchen
            </button>
          </div>
        </div>

        {tab === "customer" ? <CustomerView data={data} /> : <KitchenView data={data} />}

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={printSheet}>
            <Printer className="size-4 mr-1.5" /> Print {tab === "customer" ? "customer" : "kitchen"} sheet
          </Button>
          {tab === "customer" && waHref && (
            <Button asChild size="sm" variant="outline" className="text-emerald-700 border-emerald-300">
              <a href={waHref} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4 mr-1.5" /> WhatsApp</a>
            </Button>
          )}
          {tab === "customer" && (
            <Button size="sm" variant="outline" onClick={shareImage}>
              <ImageIcon className="size-4 mr-1.5" /> Image
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerView({ data }: { data: BeoSheets }) {
  const { event, lines, totals } = data.customerSheet;
  return (
    <div className="text-sm space-y-2">
      <EventHeader name={event.customerName} date={fmtDate(event.date)} time={event.time} type={event.eventType} pax={event.guaranteedPax ?? event.expectedPax} />
      <div className="rounded-lg border divide-y">
        {lines.map((l, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-1.5">
            <span className={cn(l.isDiscount && "text-emerald-700")}>{l.name}{l.basis === "per_head" ? ` · ${l.qty} × ${PKR(l.rate)}` : ""}</span>
            <span className="tabular-nums">{l.isDiscount ? "−" : ""}{PKR(l.lineTotal)}</span>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-muted/30 p-3 space-y-1">
        <Row label="Grand total" value={PKR(totals.grand)} bold />
        <Row label="Advance received" value={PKR(totals.advance)} />
        <Row label="Balance due" value={PKR(totals.balance)} amber />
      </div>
    </div>
  );
}

function KitchenView({ data }: { data: BeoSheets }) {
  const { event, items, crew } = data.kitchenSheet;
  return (
    <div className="text-sm space-y-2">
      <EventHeader name={event.customerName} date={fmtDate(event.date)} time={event.time} type={event.eventType} pax={event.pax} kitchen />
      <div className="rounded-lg border divide-y">
        {items.map((it, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-1.5">
            <span>{it.name}{it.spice ? ` · ${it.spice}` : ""}{it.allergen ? ` · ⚠ ${it.allergen}` : ""}</span>
            <span className="tabular-nums font-medium">{it.pax}{it.unit ? ` ${it.unit}` : it.kind === "menu-item" || it.kind === "catering" ? " pax" : ""}</span>
          </div>
        ))}
      </div>
      {crew.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Crew / costs (internal)</p>
          <div className="rounded-lg border border-dashed divide-y">
            {crew.map((c, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 text-muted-foreground">
                <span>{c.name}</span><span className="tabular-nums">{c.qty}{c.unit ? ` ${c.unit}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EventHeader({ name, date, time, type, pax, kitchen }: { name: string | null; date: string; time: string | null; type: string | null; pax: number | null; kitchen?: boolean }) {
  return (
    <div className="rounded-lg border p-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      <span><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{name || "—"}</span></span>
      <span><span className="text-muted-foreground">Event:</span> <span className="font-medium">{type || "—"}</span></span>
      <span><span className="text-muted-foreground">Date:</span> <span className="font-medium">{date}</span></span>
      <span><span className="text-muted-foreground">Time:</span> <span className="font-medium">{time || "—"}</span></span>
      {pax != null && <span className="col-span-2"><span className="text-muted-foreground">{kitchen ? "Cook for (pax):" : "Guests:"}</span> <span className="font-semibold">{pax}</span></span>}
    </div>
  );
}

const Row = ({ label, value, bold, amber }: { label: string; value: string; bold?: boolean; amber?: boolean }) => (
  <div className="flex justify-between"><span className={cn("text-muted-foreground", bold && "font-semibold text-foreground")}>{label}</span><span className={cn("tabular-nums", bold && "font-semibold", amber && "text-amber-600")}>{value}</span></div>
);

// ── print + share helpers ──────────────────────────────────────────────────
function openPrint(html: string) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  w.document.write(`<html><head><title>Event Sheet</title><style>body{font-family:system-ui,sans-serif;padding:24px;color:#222}h1{font-size:18px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:8px}td,th{border-bottom:1px solid #ddd;padding:6px 4px;text-align:left;font-size:13px}th{background:#faf7f2}.r{text-align:right}.muted{color:#777;font-size:12px}</style></head><body>${html}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}
function hdr(ev: { customerName: string | null; date: string | null; time: string | null; eventType: string | null }, vendor: string, pax: number | null, kitchen: boolean) {
  return `<h1>${vendor} — ${kitchen ? "Kitchen Sheet" : "Event Order"}</h1><div class="muted">${ev.customerName || "—"} · ${ev.eventType || "—"} · ${fmtDate(ev.date)} · ${ev.time || "—"}${pax != null ? ` · ${kitchen ? "Cook for" : "Guests"}: ${pax}` : ""}</div>`;
}
function customerHtml(d: BeoSheets, vendor: string) {
  const { event, lines, totals } = d.customerSheet;
  const rows = lines.map((l) => `<tr><td>${l.name}</td><td class="r">${l.isDiscount ? "−" : ""}${PKR(l.lineTotal)}</td></tr>`).join("");
  return `${hdr(event, vendor, event.guaranteedPax ?? event.expectedPax, false)}<table><tr><th>Item</th><th class="r">Amount</th></tr>${rows}<tr><th>Grand total</th><th class="r">${PKR(totals.grand)}</th></tr><tr><td>Advance</td><td class="r">${PKR(totals.advance)}</td></tr><tr><td>Balance due</td><td class="r">${PKR(totals.balance)}</td></tr></table>`;
}
function kitchenHtml(d: BeoSheets, vendor: string) {
  const { event, items, crew } = d.kitchenSheet;
  const rows = items.map((it) => `<tr><td>${it.name}${it.spice ? " · " + it.spice : ""}${it.allergen ? " · ⚠ " + it.allergen : ""}</td><td class="r">${it.pax}${it.kind === "menu-item" || it.kind === "catering" ? " pax" : it.unit ? " " + it.unit : ""}</td></tr>`).join("");
  const crewRows = crew.map((c) => `<tr><td>${c.name}</td><td class="r">${c.qty}${c.unit ? " " + c.unit : ""}</td></tr>`).join("");
  return `${hdr(event, vendor, event.pax, true)}<table><tr><th>Item</th><th class="r">Qty</th></tr>${rows}</table>${crew.length ? `<div class="muted" style="margin-top:12px">Crew / costs</div><table>${crewRows}</table>` : ""}`;
}
function customerShareText(d: BeoSheets, vendor: string) {
  const { event, totals } = d.customerSheet;
  return `${vendor} — Event Order\n${event.customerName || ""} · ${event.eventType || ""} · ${fmtDate(event.date)}\nGrand total: ${PKR(totals.grand)}\nAdvance: ${PKR(totals.advance)}\nBalance: ${PKR(totals.balance)}\nShukriya!`;
}
function kitchenShareText(d: BeoSheets) {
  const { event, items } = d.kitchenSheet;
  return `Kitchen — ${event.eventType || ""} ${fmtDate(event.date)} (cook for ${event.pax ?? "?"})\n${items.map((i) => `• ${i.name} — ${i.pax}`).join("\n")}`;
}

export default BeoSheetCard;

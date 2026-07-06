"use client";

/**
 * Phase-1 EPIC 6 · T6.4 — migration sprint ("switch on the booking shield").
 *
 * The only mandatory migration step: key your CONFIRMED future dates in one
 * sitting so the calendar starts blocking double-bookings immediately. Bulk
 * rows (date · naam · phone · rakam via the Urdu parser), a sparsity guard so
 * "sirf 6 dates?" doesn't quietly pass for a peak-season venue, and one Save-all
 * that creates each booking via the proven offline-create path. Money/menus are
 * refined later — this is value-first: get the wall up.
 */
import { useMemo, useState } from "react";
import { format, addDays } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { useActiveBusinessId } from "@/lib/store/active-business-store";
import { useBusiness } from "@/context/BusinessContext";
import { parseUrduAmount } from "@/lib/urdu-amount";
import { BookingsAPI } from "@/lib/api/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Row = { id: number; date: string; name: string; phone: string; rakam: string };

const PKR = (n: number) => "Rs " + Math.round(n).toLocaleString("en-PK");
const SPARSE_THRESHOLD = 5; // fewer confirmed future dates than this looks suspicious for a venue
let seq = 1;
const blankRow = (date = ""): Row => ({ id: seq++, date, name: "", phone: "", rakam: "" });

export function MigrationSprintView() {
  const businessId = useActiveBusinessId() ?? useBusiness().business?.id ?? null;
  const qc = useQueryClient();
  const [rows, setRows] = useState<Row[]>(() => [
    blankRow(format(addDays(new Date(), 14), "yyyy-MM-dd")),
    blankRow(),
    blankRow(),
  ]);
  const [saving, setSaving] = useState(false);
  const [ackSparse, setAckSparse] = useState(false);

  const ready = useMemo(() => rows.filter((r) => r.date && r.name.trim()), [rows]);
  const sparse = ready.length > 0 && ready.length < SPARSE_THRESHOLD;

  const patch = (id: number, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const addRow = () => setRows((rs) => [...rs, blankRow()]);
  const removeRow = (id: number) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));

  const saveAll = async () => {
    if (!businessId) { toast.error("No venue selected"); return; }
    if (ready.length === 0) { toast.error("Kam se kam ek date + naam likhein"); return; }
    if (sparse && !ackSparse) { setAckSparse(true); return; } // one-tap confirm on suspiciously few
    setSaving(true);
    let ok = 0;
    const failures: string[] = [];
    for (const r of ready) {
      try {
        await BookingsAPI.create({
          customerName: r.name.trim(),
          customerPhone: r.phone.trim() || "0000000000",
          bookingDate: r.date,
          bookingTime: "18:00",
          isOfflineBooking: true,
          vendors: [{ businessId, totalAmount: parseUrduAmount(r.rakam) ?? 0, downPayment: 0 }],
          notes: "MIGRATED — confirmed future date (booking shield)",
        } as any);
        ok += 1;
      } catch (e: any) {
        failures.push(`${format(new Date(r.date + "T00:00:00"), "d MMM")}: ${e?.response?.data?.message || "error"}`);
      }
    }
    setSaving(false);
    await qc.invalidateQueries();
    if (ok) toast.success(`${ok} date${ok === 1 ? "" : "s"} shield par aa gayi — double-booking se mehfooz`);
    if (failures.length) toast.error(`${failures.length} skip: ${failures[0]}`);
    if (!failures.length) setRows([blankRow(format(addDays(new Date(), 14), "yyyy-MM-dd")), blankRow(), blankRow()]);
    setAckSparse(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-primary" />
        <div>
          <h1 className="text-lg font-semibold">Booking Shield chaloo karein</h1>
          <p className="text-sm text-muted-foreground">
            Apni aane wali <span className="font-medium">confirmed</span> dates likhein — inpe koi doosri booking nahi ho paayegi.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-3 md:p-4 space-y-2">
          {/* header */}
          <div className="hidden sm:flex gap-2 text-[11px] uppercase text-muted-foreground px-1">
            <span className="w-36">Date</span>
            <span className="flex-1">Naam</span>
            <span className="w-32">Phone</span>
            <span className="w-28">Rakam</span>
            <span className="w-6" />
          </div>
          {rows.map((r) => {
            const parsed = r.rakam.trim() ? parseUrduAmount(r.rakam) : null;
            return (
              <div key={r.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <Input type="date" value={r.date} onChange={(e) => patch(r.id, { date: e.target.value })} className="h-9 w-36" />
                <Input value={r.name} onChange={(e) => patch(r.id, { name: e.target.value })} placeholder="Customer" className="h-9 flex-1 min-w-[120px]" />
                <Input value={r.phone} onChange={(e) => patch(r.id, { phone: e.target.value })} placeholder="03xx (optional)" inputMode="tel" className="h-9 w-full sm:w-32" />
                <div className="w-full sm:w-28">
                  <Input value={r.rakam} onChange={(e) => patch(r.id, { rakam: e.target.value })} placeholder="e.g. 2 lakh" className="h-9" />
                  {r.rakam.trim() && parsed != null && <p className="text-[10px] text-emerald-600 mt-0.5">{PKR(parsed)}</p>}
                </div>
                <button onClick={() => removeRow(r.id)} className="text-muted-foreground hover:text-destructive p-1" aria-label="Remove row">
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
          <Button size="sm" variant="outline" onClick={addRow} className="mt-1">
            <Plus className="size-4 mr-1" /> Aur date
          </Button>
        </CardContent>
      </Card>

      {sparse && (
        <div className={cn("rounded-lg border p-3 text-sm flex items-start gap-2", ackSparse ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30" : "border-muted")}>
          <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
          <span>
            Sirf <span className="font-medium">{ready.length}</span> date{ready.length === 1 ? "" : "s"}? Peak season (shaadi months) ke liye ye kam lag rahi hain — koi confirmed date reh to nahi gayi?
            {ackSparse && <span className="block text-xs text-amber-700 dark:text-amber-400 mt-1">Theek hai — dobara "Save" dabaayein to inhi ko shield par le aayein.</span>}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{ready.length} date{ready.length === 1 ? "" : "s"} ready</span>
        <Button onClick={saveAll} disabled={saving || ready.length === 0}>
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <ShieldCheck className="size-4 mr-2" />}
          Shield par laayein ({ready.length})
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">Menu, discount, baaqi tafseel baad mein — abhi sirf dates lock karni hain.</p>
    </div>
  );
}

export default MigrationSprintView;

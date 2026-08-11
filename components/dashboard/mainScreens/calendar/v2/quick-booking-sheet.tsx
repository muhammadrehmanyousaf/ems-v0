"use client";

/**
 * Phase-1 EPIC 6 · T6.3 — register-fast quick-add.
 *
 * The screen a venue owner touches every day: tap a free date → four fields
 * (Naam · Phone · Rakam · Function + day/night) → a booking on the calendar in
 * seconds. Rakam accepts Urdu shorthand ("2.5 lakh", "50 hazaar") via
 * parseUrduAmount. Everything else (full order, discounts) is refined later in
 * the order builder — this just gets the date on the wall, fast.
 */
import { useState } from "react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { SlotTemplatesAPI } from "@/lib/api/businessAvailability";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseUrduAmount } from "@/lib/urdu-amount";
import { BookingsAPI } from "@/lib/api/dashboard";
import { SpacePicker } from "@/components/dashboard/shared/space-picker";
import { LEGACY_PERIODS } from "@/lib/booking/slot-vocabulary";

const FUNCTIONS = ["Barat", "Walima", "Mehndi", "Milad", "Other"];

const PKR = (n: number) => "Rs " + Math.round(n).toLocaleString("en-PK");

export function QuickBookingSheet({
  open, onOpenChange, businessId, date,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  businessId: number;
  date: string; // YYYY-MM-DD
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rakam, setRakam] = useState("");
  const [fn, setFn] = useState("Barat");
  const [defTime, setDefTime] = useState("18:00"); // Shaam — matches the default allowed slots
  const [slotId, setSlotId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  // WWL-100 — which hall this booking is in. Without it a quick-add lands as
  // an unassigned booking, which is exactly what the grid then has to report
  // instead of showing one hall booked and the rest sellable.
  const [spaceId, setSpaceId] = useState<string>("");

  const parsed = parseUrduAmount(rakam);

  // Default allowed booking times when a vendor has no custom slot templates.
  //
  // SLOTS step 10 — the TIMES come from the one shared definition so this stops
  // being an eighth private copy of "which three slots exist". The LABELS stay
  // Roman Urdu and stay local: this is the vendor's own quick-entry sheet and
  // "Subah / Dopahar / Shaam" is a deliberate choice for it, not a drifted
  // translation of Morning / Afternoon / Evening.
  const URDU_LABEL: Record<string, string> = { "09:00": "Subah", "14:00": "Dopahar", "18:00": "Shaam" };
  const DEFAULT_TIMES: [string, string][] = LEGACY_PERIODS.map(
    (p) => [URDU_LABEL[p.value] ?? p.label, p.value] as [string, string],
  );

  // The vendor's real slot templates — a booking's time must match one when
  // slots exist (else the create rejects). No templates → free day/night.
  const { data: slots } = useQuery({
    queryKey: ["slot-templates", businessId],
    queryFn: () => SlotTemplatesAPI.list(businessId, { onlyActive: true }),
    enabled: open,
  });
  const hasSlots = (slots?.length ?? 0) > 0;
  // Resolve the slot ONCE and carry its id, not just its clock time. Sending
  // the time alone put the request on the legacy branch, where it is validated
  // against the hardcoded ALLOWED_BOOKING_SLOTS = 09:00/14:00/18:00 — so a
  // vendor whose own slots start at 10:58 / 12:00 / 19:00 got
  // "Invalid booking time. Allowed slots: 09:00, 14:00, 18:00" and could not
  // book their own venue from their own calendar. slotTemplateId is what
  // switches the server to the slot-template branch that knows those times.
  const chosenSlot = hasSlots ? (slots!.find((s) => s.id === slotId) ?? slots![0]) : null;
  const chosenTime = chosenSlot ? chosenSlot.startTime.slice(0, 5) : defTime;

  const reset = () => { setName(""); setPhone(""); setRakam(""); setFn("Barat"); setDefTime("18:00"); setSlotId(null); setSpaceId(""); };

  const submit = async () => {
    if (!name.trim() || !phone.trim()) { toast.error("Naam aur phone likhein"); return; }
    setSaving(true);
    try {
      await BookingsAPI.create({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        bookingDate: date,
        bookingTime: chosenTime,
        isOfflineBooking: true,
        vendors: [{
          businessId,
          totalAmount: parsed ?? 0,
          downPayment: 0,
          // WWL-050 / WWL-100 — record the hall when the venue has more than
          // one. A single-space venue needs no pick; the server assigns it.
          ...(spaceId ? { subVenueId: Number(spaceId) } : {}),
          // Without this the server cannot tell that 10:58 is a real slot at
          // this venue and falls back to the three-value whitelist.
          ...(chosenSlot ? { slotTemplateId: chosenSlot.id } : {}),
        }],
        eventType: fn,
        notes: `${fn} · ${chosenTime}`,
      } as any);
      await qc.invalidateQueries();
      toast.success(`Booking logged for ${format(new Date(date + "T00:00:00"), "d MMM")}`);
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Booking save nahi hui");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Nayi Booking · {format(new Date(date + "T00:00:00"), "EEE d MMM")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-3 mt-3">
          <div>
            <label className="text-xs text-muted-foreground">Naam</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer ka naam" autoFocus />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx-xxxxxxx" inputMode="tel" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Rakam (advance / deal)</label>
            <Input value={rakam} onChange={(e) => setRakam(e.target.value)} placeholder="e.g. 2.5 lakh, 50 hazaar" inputMode="text" />
            {rakam.trim() !== "" && (
              <p className={cn("text-xs mt-1", parsed != null ? "text-emerald-600" : "text-amber-600")}>
                {parsed != null ? `= ${PKR(parsed)}` : "samajh nahi aaya — number likhein"}
              </p>
            )}
          </div>

          {/* WWL-100 — the hall. Renders only when the venue has more than one;
              a single-hall venue has nothing to choose and the server assigns. */}
          <SpacePicker
            businessId={businessId}
            value={spaceId}
            onChange={setSpaceId}
            label="Hall / Space"
            hint="Kaunsa hall? Isi se calendar par ek hall booked aur baaki sellable dikhte hain."
          />

          <div>
            <label className="text-xs text-muted-foreground">Function</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {FUNCTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFn(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm border",
                    fn === f ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Timing</label>
            {hasSlots ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {slots!.map((s) => {
                  const active = (slotId ?? slots![0].id) === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSlotId(s.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border",
                        active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted",
                      )}
                    >
                      {s.label} <span className="opacity-70">{s.startTime.slice(0, 5)}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {DEFAULT_TIMES.map(([label, val]) => (
                  <button
                    key={val}
                    onClick={() => setDefTime(val)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm border",
                      defTime === val ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted",
                    )}
                  >
                    {label} <span className="opacity-70">{val}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button onClick={submit} disabled={saving} className="w-full mt-1">
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            Save booking
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">Baaqi tafseel (menu, discount) baad mein order builder mein.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default QuickBookingSheet;

"use client";

/**
 * Venue compliance card — Pakistani regulatory limits a venue/marquee must
 * operate under. Optional; the booking flow soft-warns (never hard-blocks)
 * when an event would breach them, protecting the owner from fines / sealing
 * / FIRs (one-dish raids, guest caps, closing-time enforcement). Blank = N/A.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBusiness } from "@/context/BusinessContext";
import { BusinessAvailabilityAPI } from "@/lib/api/businessAvailability";

export default function VenueComplianceCard() {
  const { business, refreshBusiness } = useBusiness();
  // New columns aren't in the ApiBusiness type yet — read defensively.
  const b = business as unknown as {
    id: number;
    legalGuestCap?: number | null;
    eventClosingTime?: string | null;
    oneDishPolicy?: boolean;
  } | null;

  const [legalGuestCap, setLegalGuestCap] = useState("");
  const [eventClosingTime, setEventClosingTime] = useState("");
  const [oneDishPolicy, setOneDishPolicy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!b) return;
    setLegalGuestCap(b.legalGuestCap != null ? String(b.legalGuestCap) : "");
    setEventClosingTime(b.eventClosingTime || "");
    setOneDishPolicy(!!b.oneDishPolicy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b?.id]);

  if (!business) return null;

  const onSave = async () => {
    setSaving(true);
    try {
      await BusinessAvailabilityAPI.setCompliance(business.id, {
        legalGuestCap:
          legalGuestCap.trim() === "" ? null : Math.max(0, parseInt(legalGuestCap, 10) || 0),
        eventClosingTime: eventClosingTime.trim() === "" ? null : eventClosingTime.trim(),
        oneDishPolicy,
      });
      await refreshBusiness(true);
      toast.success("Compliance limits saved");
    } catch {
      toast.error("Could not save compliance limits");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-amber-200 mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-amber-600" />
          Compliance limits (Pakistan)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Optional. We&apos;ll warn you at booking time if an event would breach these — so you
          avoid fines, sealing, or FIRs. Leave blank if not applicable.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="vc-cap" className="text-xs">Legal guest cap</Label>
            <Input
              id="vc-cap"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="e.g. 200"
              value={legalGuestCap}
              onChange={(e) => setLegalGuestCap(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Current city/province limit (e.g. Sindh 200).
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vc-close" className="text-xs">Event closing time</Label>
            <Input
              id="vc-close"
              type="time"
              value={eventClosingTime}
              onChange={(e) => setEventClosingTime(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">Legal end time (e.g. 23:30).</p>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="space-y-0.5 pr-3">
            <Label htmlFor="vc-onedish" className="text-sm">One-dish policy applies</Label>
            <p className="text-[11px] text-muted-foreground">
              Only 1 main + 1 dessert allowed in your city — we&apos;ll flag bookings to confirm.
            </p>
          </div>
          <Switch id="vc-onedish" checked={oneDishPolicy} onCheckedChange={setOneDishPolicy} />
        </div>
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving} size="sm">
            {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

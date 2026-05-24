"use client";

/**
 * Car-rental fleet + driver assignment sheet (§16.5) — the car-rental pillar.
 * Per-vehicle row: vehicle + driver (+ phone) + route + depart/return times +
 * km in/out + fuel L/cost + tolls + deposit + status + damage notes.
 * Live totals across the convoy (km, fuel L, fuel+tolls Rs, deposit) so the
 * vendor sees margin AND can hand the driver a printed run sheet.
 *
 * Saves into FunctionSheet.carRentalJson via the existing update endpoint.
 * Read-only on terminal sheets. Same proven pattern as the other pillars.
 */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Car, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  FunctionSheetAPI,
  type FunctionSheet,
  type VehicleAssignment,
  type VehicleStatus,
  type CarRentalData,
} from "@/lib/api/functionSheets";

const STATUS_LABEL: Record<VehicleStatus, string> = {
  planned: "Planned",
  dispatched: "Dispatched",
  returned: "Returned OK",
  returned_damaged: "Returned · damage",
};
const STATUS_TONE: Record<VehicleStatus, string> = {
  planned: "text-neutral-600",
  dispatched: "text-blue-700",
  returned: "text-emerald-700",
  returned_damaged: "text-amber-700",
};

const fmtPKR = (n: number) =>
  n > 0 ? `Rs ${Math.round(n).toLocaleString("en-PK")}` : "Rs 0";

const newId = () => Math.random().toString(36).slice(2, 10);
const emptyVehicle = (label = ""): VehicleAssignment => ({
  id: newId(), vehicle: label, driver: "", driverPhone: "", route: "",
  departAt: "", returnAt: "", startKm: null, endKm: null,
  fuelLitres: null, fuelCost: null, tollsCost: null, deposit: null,
  status: "planned", damageNotes: "", notes: "",
});
const numOrNull = (v: string) =>
  v === "" ? null : Math.max(0, parseFloat(v) || 0);

export default function CarRentalCard({
  sheet, onSaved, readOnly = false,
}: { sheet: FunctionSheet; onSaved?: () => void; readOnly?: boolean }) {
  const [vehicles, setVehicles] = useState<VehicleAssignment[]>([emptyVehicle()]);
  const [convoyNotes, setConvoyNotes] = useState("");
  const [totalDepositHeld, setTotalDepositHeld] = useState("");
  const [depositReturnedAt, setDepositReturnedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = sheet.carRentalJson || {};
    setVehicles(c.vehicles && c.vehicles.length ? c.vehicles : [emptyVehicle()]);
    setConvoyNotes(c.convoyNotes || "");
    setTotalDepositHeld(c.totalDepositHeld != null ? String(c.totalDepositHeld) : "");
    setDepositReturnedAt(c.depositReturnedAt || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.id, sheet.updatedAt]);

  const totals = useMemo(() => {
    let km = 0, fuelL = 0, money = 0, deposit = 0;
    for (const v of vehicles) {
      const d = (Number(v.endKm) || 0) - (Number(v.startKm) || 0);
      if (d > 0) km += d;
      fuelL += Number(v.fuelLitres) || 0;
      money += (Number(v.fuelCost) || 0) + (Number(v.tollsCost) || 0);
      deposit += Number(v.deposit) || 0;
    }
    return { km, fuelL, money, deposit };
  }, [vehicles]);

  const setVeh = (i: number, patch: Partial<VehicleAssignment>) =>
    setVehicles((xs) => xs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addVeh = () => setVehicles((xs) => [...xs, emptyVehicle()]);
  const removeVeh = (i: number) => setVehicles((xs) => xs.filter((_, idx) => idx !== i));

  const onSave = async () => {
    setSaving(true);
    try {
      const payload: CarRentalData = {
        vehicles: vehicles.filter((v) => v.vehicle.trim()).map((v) => ({
          ...v,
          vehicle: v.vehicle.trim(),
          driver: v.driver?.trim() || undefined,
          driverPhone: v.driverPhone?.trim() || undefined,
          route: v.route?.trim() || undefined,
          departAt: v.departAt || undefined,
          returnAt: v.returnAt || undefined,
          damageNotes: v.damageNotes?.trim() || undefined,
          notes: v.notes?.trim() || undefined,
        })),
        convoyNotes: convoyNotes.trim() || undefined,
        totalDepositHeld: totalDepositHeld.trim() === ""
          ? null
          : Math.max(0, parseInt(totalDepositHeld, 10) || 0),
        depositReturnedAt,
      };
      await FunctionSheetAPI.update(sheet.id, { carRentalJson: payload });
      toast.success("Fleet sheet saved");
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Car className="h-4 w-4 text-bridal-gold-dark" />
          Fleet &amp; drivers
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Per-vehicle assignment, fuel + km, deposit + damage. Hand the driver a
          printable run-sheet, and never lose a deposit dispute.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live totals strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-md bg-muted/40 p-2 text-xs">
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Total km</p>
            <p className="font-semibold tabular-nums">{totals.km.toLocaleString("en-PK")}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Fuel L</p>
            <p className="font-semibold tabular-nums">{totals.fuelL.toLocaleString("en-PK")}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Fuel + tolls</p>
            <p className="font-semibold tabular-nums">{fmtPKR(totals.money)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Deposits held</p>
            <p className="font-semibold tabular-nums">{fmtPKR(totals.deposit)}</p>
          </div>
        </div>

        {/* Vehicle rows */}
        <div className="space-y-2">
          {vehicles.map((v, i) => (
            <div key={v.id} className="rounded-md border p-2 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="Vehicle (e.g. Civic ABK-123 / Coaster)"
                  value={v.vehicle}
                  disabled={readOnly}
                  onChange={(e) => setVeh(i, { vehicle: e.target.value })}
                />
                <Select
                  value={v.status}
                  onValueChange={(s) => setVeh(i, { status: s as VehicleStatus })}
                  disabled={readOnly}
                >
                  <SelectTrigger className={`w-[170px] h-9 text-xs ${STATUS_TONE[v.status]}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as VehicleStatus[]).map((s) => (
                      <SelectItem key={s} value={s} className={`text-xs ${STATUS_TONE[s]}`}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!readOnly && (
                  <Button type="button" variant="ghost" size="icon" className="shrink-0"
                    onClick={() => removeVeh(i)} aria-label="Remove vehicle">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Driver</Label>
                  <Input value={v.driver || ""} disabled={readOnly}
                    onChange={(e) => setVeh(i, { driver: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Driver phone</Label>
                  <Input value={v.driverPhone || ""} disabled={readOnly} placeholder="03xx-xxxxxxx"
                    onChange={(e) => setVeh(i, { driverPhone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Depart</Label>
                  <Input type="time" value={v.departAt || ""} disabled={readOnly}
                    onChange={(e) => setVeh(i, { departAt: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Return</Label>
                  <Input type="time" value={v.returnAt || ""} disabled={readOnly}
                    onChange={(e) => setVeh(i, { returnAt: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Route</Label>
                <Input placeholder="e.g. Lahore → Murree → Lahore"
                  value={v.route || ""} disabled={readOnly}
                  onChange={(e) => setVeh(i, { route: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Start km</Label>
                  <Input type="number" min={0} value={v.startKm ?? ""} disabled={readOnly}
                    onChange={(e) => setVeh(i, { startKm: numOrNull(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">End km</Label>
                  <Input type="number" min={0} value={v.endKm ?? ""} disabled={readOnly}
                    onChange={(e) => setVeh(i, { endKm: numOrNull(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Fuel L</Label>
                  <Input type="number" min={0} step="0.1" value={v.fuelLitres ?? ""} disabled={readOnly}
                    onChange={(e) => setVeh(i, { fuelLitres: numOrNull(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Fuel Rs</Label>
                  <Input type="number" min={0} value={v.fuelCost ?? ""} disabled={readOnly}
                    onChange={(e) => setVeh(i, { fuelCost: numOrNull(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Tolls Rs</Label>
                  <Input type="number" min={0} value={v.tollsCost ?? ""} disabled={readOnly}
                    onChange={(e) => setVeh(i, { tollsCost: numOrNull(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Deposit Rs</Label>
                  <Input type="number" min={0} value={v.deposit ?? ""} disabled={readOnly}
                    onChange={(e) => setVeh(i, { deposit: numOrNull(e.target.value) })} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Damage notes</Label>
                  <Input placeholder="Scratches / bumper / lost remote / nothing"
                    value={v.damageNotes || ""} disabled={readOnly}
                    onChange={(e) => setVeh(i, { damageNotes: e.target.value })} />
                </div>
              </div>

              <Textarea
                rows={1}
                placeholder="Notes (parking, pilot car, late dispatch reason…)"
                value={v.notes || ""}
                disabled={readOnly}
                onChange={(e) => setVeh(i, { notes: e.target.value })}
              />
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addVeh}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add vehicle
            </Button>
          )}
        </div>

        {/* Convoy + deposit */}
        <div className="space-y-1">
          <Label className="text-xs">Convoy / coordination notes</Label>
          <Textarea rows={2} value={convoyNotes} disabled={readOnly}
            placeholder="Formation, pilot car, security clearance, meeting point…"
            onChange={(e) => setConvoyNotes(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Total deposit held Rs</Label>
            <Input type="number" min={0} value={totalDepositHeld} disabled={readOnly}
              onChange={(e) => setTotalDepositHeld(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Returned on</Label>
            <Input type="date" value={depositReturnedAt || ""} disabled={readOnly}
              onChange={(e) => setDepositReturnedAt(e.target.value || null)} />
          </div>
        </div>

        {!readOnly && (
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving} size="sm">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save fleet sheet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

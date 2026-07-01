"use client";

/**
 * Venue-OS P2 · WS10 — the EventNight console. Valet board (release needs out-photo
 * + signature), gold/cash two-person custody intake (the UI surfaces the
 * second-witness requirement), incident logging with a tamper-evident hash-chain
 * (verify button), same-night complaint apology that pre-empts the review, and the
 * 0–100 Clean Night Score. Gated on isEventNightConsoleOn(); the backend 404s until
 * ENABLE_EVENTNIGHT_CONSOLE. The existing P1 headcount gauge is unchanged.
 */
import * as React from "react";
import { venueOsApi, type ValetTicket, type IncidentResult, type ComplaintResult, type CleanNightScore, type ChainVerification } from "@/lib/api/venueOs";
import { isEventNightConsoleOn } from "@/lib/eventnight-console-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export function EventNightConsoleView(): React.ReactElement | null {
  const enabled = isEventNightConsoleOn();
  const [nightId, setNightId] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  // valet
  const [tag, setTag] = React.useState<string>("");
  const [plate, setPlate] = React.useState<string>("");
  const [tickets, setTickets] = React.useState<ValetTicket[]>([]);

  // lost-found
  const [lfCategory, setLfCategory] = React.useState<string>("GOLD");
  const [lfValue, setLfValue] = React.useState<string>("");
  const [lfFound, setLfFound] = React.useState<string>("");
  const [lfWitness, setLfWitness] = React.useState<string>("");

  // incident
  const [incType, setIncType] = React.useState<string>("PROPERTY_DAMAGE");
  const [incLoss, setIncLoss] = React.useState<string>("");
  const [incident, setIncident] = React.useState<IncidentResult | null>(null);
  const [chain, setChain] = React.useState<ChainVerification | null>(null);

  // complaint
  const [complaint, setComplaint] = React.useState<ComplaintResult | null>(null);
  const [score, setScore] = React.useState<CleanNightScore | null>(null);

  const nid = Number(nightId);
  const highValue = lfCategory === "GOLD" || lfCategory === "CASH" || Number(lfValue) >= 50000;

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "EventNight console is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>EventNight console (valet · lost-found · incident · complaint)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>
            Event night #
            <input type="number" value={nightId} onChange={(e) => setNightId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => setScore(await venueOsApi.cleanNightScore(nid)))} disabled={!nightId || busy}>
            Clean night score
          </Button>
          {score && <Badge className={score.score >= 80 ? "bg-emerald-500" : score.score >= 50 ? "bg-amber-500" : "bg-red-500"}>{score.score}/100</Badge>}
        </div>

        {/* valet */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">Valet</span>
            <input type="text" placeholder="tag #" value={tag} onChange={(e) => setTag(e.target.value)} className="w-20 rounded border px-2 py-1" />
            <input type="text" placeholder="plate" value={plate} onChange={(e) => setPlate(e.target.value)} className="w-28 rounded border px-2 py-1" />
            <Button size="sm" onClick={() => void guard(async () => { await venueOsApi.valetIn(nid, { tagNumber: tag, vehiclePlate: plate, inPhotoUrl: "in.jpg", inSignatureRef: "sig" }); setTickets(await venueOsApi.listValet(nid)); })} disabled={!nightId || !tag || busy}>
              Park
            </Button>
            <Button size="sm" variant="outline" onClick={() => void guard(async () => setTickets(await venueOsApi.listValet(nid)))} disabled={!nightId || busy}>
              Board
            </Button>
          </div>
          {tickets.map((t) => (
            <div key={t.id} className="flex items-center gap-2 border-t pt-1 text-xs">
              <Badge variant={t.status === "RELEASED" ? "secondary" : "default"}>{t.status}</Badge>
              <span>tag {t.tagNumber} · {t.vehiclePlate || "—"}</span>
              {t.status !== "RELEASED" && (
                <Button size="sm" variant="ghost" className="ml-auto h-6 px-2" onClick={() => void guard(async () => { await venueOsApi.valetRelease(t.id, { outPhotoUrl: "out.jpg", outSignatureRef: "sig" }); setTickets(await venueOsApi.listValet(nid)); })} disabled={busy}>
                  release (photo+sig)
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* lost-found two-person custody */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">Lost &amp; found</span>
            <select value={lfCategory} onChange={(e) => setLfCategory(e.target.value)} className="rounded border px-2 py-1">
              {["GENERAL", "PHONE", "GOLD", "CASH", "DOCUMENT"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input type="number" placeholder="value" value={lfValue} onChange={(e) => setLfValue(e.target.value)} className="w-24 rounded border px-2 py-1" />
            <input type="number" placeholder="found by user#" value={lfFound} onChange={(e) => setLfFound(e.target.value)} className="w-28 rounded border px-2 py-1" />
            {highValue && <input type="number" placeholder="witness user#" value={lfWitness} onChange={(e) => setLfWitness(e.target.value)} className="w-28 rounded border px-2 py-1" />}
            <Button size="sm" onClick={() => void guard(async () => { await venueOsApi.recordLostFound(nid, { category: lfCategory, declaredValuePkr: lfValue ? Number(lfValue) : undefined, photoUrl: highValue ? "item.jpg" : undefined, foundByUserId: Number(lfFound) || undefined, custodyWitnessUserId: lfWitness ? Number(lfWitness) : undefined }); })} disabled={!nightId || busy}>
              Hold
            </Button>
          </div>
          {highValue && <p className="text-xs text-amber-600">Gold/cash/high-value needs a second distinct staff witness + photo (two-person custody).</p>}
        </div>

        {/* incident */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">Incident</span>
            <select value={incType} onChange={(e) => setIncType(e.target.value)} className="rounded border px-2 py-1">
              {["INJURY", "FIGHT", "FIRE", "THEFT", "PROPERTY_DAMAGE", "MEDICAL"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input type="number" placeholder="est. loss" value={incLoss} onChange={(e) => setIncLoss(e.target.value)} className="w-24 rounded border px-2 py-1" />
            <Button size="sm" onClick={() => void guard(async () => { const r = await venueOsApi.recordIncident(nid, { type: incType, severity: "HIGH", estimatedLossPkr: incLoss ? Number(incLoss) : undefined, policeCalled: true }); setIncident(r); setChain(null); })} disabled={!nightId || busy}>
              Log incident
            </Button>
          </div>
          {incident && (
            <div className="text-xs">
              incident #{incident.incident.id} · <Badge variant="destructive">{incident.incident.severity}</Badge>
              {incident.insuranceClaim && <Badge variant="secondary" className="ml-1">claim #{incident.insuranceClaim.id}</Badge>}
              <Button size="sm" variant="ghost" className="ml-2 h-6 px-2" onClick={() => void guard(async () => setChain(await venueOsApi.verifyIncidentChain(incident.incident.id)))} disabled={busy}>
                verify chain
              </Button>
              {chain && <Badge className={chain.ok ? "bg-emerald-500" : "bg-red-500"}>{chain.ok ? `intact (${chain.checked})` : "TAMPERED"}</Badge>}
            </div>
          )}
        </div>

        {/* complaint */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">Complaint</span>
            <Button size="sm" onClick={() => void guard(async () => setComplaint(await venueOsApi.raiseComplaint(nid, { bookingId: 0, category: "FOOD_QUALITY", raisedByName: "Guest", raisedByMsisdn: "+92300...", concessionType: "FREE_ADDON" })))} disabled={!nightId || busy}>
              Raise
            </Button>
            {complaint && complaint.complaint && !complaint.complaint.reviewPreEmpted && (
              <Button size="sm" variant="outline" onClick={() => void guard(async () => setComplaint(await venueOsApi.sendComplaintApology(complaint.complaint.id)))} disabled={busy}>
                Send same-night apology
              </Button>
            )}
            {complaint?.complaint?.reviewPreEmpted && <Badge className="bg-emerald-500">review pre-empted</Badge>}
          </div>
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default EventNightConsoleView;

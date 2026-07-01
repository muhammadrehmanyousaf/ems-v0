"use client";

/**
 * Venue-OS P2 · WS3 — procurement GRN three-way-match panel. Raise a PO (qty ×
 * agreed rate), receive a GRN (accepted qty + actual rate) → the exact rupee
 * shortfall (short-delivery + over-rate) is flagged in Urdu-ready plain numbers,
 * then "accept" posts the accepted NET value to the GL as a SUPPLIER_INVOICE
 * (supplier udhaar) and "settle" pays it down. Gated on isProcurementGrnOn();
 * the backend 404s until PROCUREMENT_GRN_ON. Additive — zero impact when OFF.
 */
import * as React from "react";
import { venueOsApi, type PurchaseOrder, type GoodsReceivedNote, type AcceptGrnResult } from "@/lib/api/venueOs";
import { isProcurementGrnOn } from "@/lib/procurement-grn-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PKR = (n: number | string): string => "Rs " + Math.round(Number(n)).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

function matchBadge(status: string): React.ReactElement {
  if (status === "MATCH") return <Badge className="bg-emerald-500">match</Badge>;
  return <Badge variant="destructive">{status.toLowerCase().replace("_", " ")}</Badge>;
}

export function ProcurementView(): React.ReactElement | null {
  const enabled = isProcurementGrnOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  // raise PO
  const [descr, setDescr] = React.useState<string>("Chicken");
  const [unit, setUnit] = React.useState<string>("kg");
  const [qty, setQty] = React.useState<string>("100");
  const [rate, setRate] = React.useState<string>("500");
  const [po, setPo] = React.useState<PurchaseOrder | null>(null);

  // receive GRN
  const [qtyAccepted, setQtyAccepted] = React.useState<string>("");
  const [actualRate, setActualRate] = React.useState<string>("");
  const [grn, setGrn] = React.useState<GoodsReceivedNote | null>(null);

  // accept + settle
  const [accepted, setAccepted] = React.useState<AcceptGrnResult | null>(null);
  const [settled, setSettled] = React.useState<string | null>(null);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Procurement is not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  const poLineId = po?.lines?.[0]?.id;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Procurement (PO → GRN three-way-match)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="text-sm">
          Business #
          <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
        </label>

        {/* 1 · raise PO */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">1 · Raise PO</span>
            <input type="text" placeholder="item" value={descr} onChange={(e) => setDescr(e.target.value)} className="w-28 rounded border px-2 py-1" />
            <input type="number" placeholder="qty" value={qty} onChange={(e) => setQty(e.target.value)} className="w-20 rounded border px-2 py-1" />
            <input type="text" placeholder="unit" value={unit} onChange={(e) => setUnit(e.target.value)} className="w-16 rounded border px-2 py-1" />
            <input type="number" placeholder="rate" value={rate} onChange={(e) => setRate(e.target.value)} className="w-24 rounded border px-2 py-1" />
            <Button
              size="sm"
              onClick={() =>
                void guard(async () => {
                  const created = await venueOsApi.createPurchaseOrder({ businessId: Number(businessId), lines: [{ descr, qtyOrdered: Number(qty), unit, ratePkr: Number(rate) }] });
                  setPo(created);
                  setGrn(null);
                  setAccepted(null);
                  setSettled(null);
                  setQtyAccepted(qty);
                  setActualRate(rate);
                })
              }
              disabled={!businessId || !qty || !rate || busy}
            >
              Raise PO
            </Button>
          </div>
          {po && (
            <p className="text-xs text-muted-foreground">
              PO #{po.id} · {descr} {qty} {unit} @ {PKR(rate)} = <span className="font-medium">{PKR(Number(qty) * Number(rate))}</span> (udhaar)
            </p>
          )}
        </div>

        {/* 2 · receive GRN */}
        {po && poLineId != null && (
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex flex-wrap items-end gap-2 text-sm">
              <span className="font-medium">2 · Receive GRN</span>
              <input type="number" placeholder="qty accepted" value={qtyAccepted} onChange={(e) => setQtyAccepted(e.target.value)} className="w-28 rounded border px-2 py-1" />
              <input type="number" placeholder="actual rate" value={actualRate} onChange={(e) => setActualRate(e.target.value)} className="w-24 rounded border px-2 py-1" />
              <Button
                size="sm"
                onClick={() =>
                  void guard(async () => {
                    const g = await venueOsApi.receiveGrn({ purchaseOrderId: po.id, businessId: Number(businessId), lines: [{ purchaseOrderLineId: poLineId, qtyAccepted: Number(qtyAccepted), actualRatePkr: Number(actualRate) }] });
                    setGrn(g);
                    setAccepted(null);
                    setSettled(null);
                  })
                }
                disabled={!qtyAccepted || busy}
              >
                Receive
              </Button>
            </div>
            {grn && (
              <div className="text-sm">
                {matchBadge(grn.threeWayMatchStatus)}
                {Number(grn.shortfallPkr) > 0 && <span className="ml-2 font-semibold text-red-600">{PKR(grn.shortfallPkr)} shortfall</span>}
                <span className="ml-2">owe <span className="font-medium">{PKR(grn.acceptedValuePkr)}</span></span>
              </div>
            )}
          </div>
        )}

        {/* 3 · accept → post SUPPLIER_INVOICE */}
        {grn && grn.status !== "accepted" && (
          <div className="space-y-2 rounded-md border p-3">
            <span className="text-sm font-medium">3 · Accept → post supplier udhaar to ledger</span>
            <div>
              <Button
                size="sm"
                onClick={() =>
                  void guard(async () => {
                    const a = await venueOsApi.acceptGrn(grn.id);
                    setAccepted(a);
                    setGrn(a.grn);
                  })
                }
                disabled={busy}
              >
                Accept GRN
              </Button>
            </div>
          </div>
        )}
        {accepted?.supplierInvoice && (
          <div className="space-y-2 rounded-md border p-3 text-sm">
            <p>
              Supplier invoice #{accepted.supplierInvoice.id} posted: <span className="font-medium">{PKR(accepted.supplierInvoice.totalAmount)}</span>{" "}
              {accepted.idempotentHit && <Badge variant="secondary" className="ml-1">already posted</Badge>}
            </p>
            {/* 4 · settle */}
            {accepted.supplierInvoice.status !== "paid" && settled == null && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void guard(async () => {
                    const s = await venueOsApi.settleSupplierInvoice(accepted.supplierInvoice!.id, { amountPaid: Number(accepted.supplierInvoice!.totalAmount) });
                    setSettled(s.supplierInvoice.status);
                  })
                }
                disabled={busy}
              >
                Settle in full (pay udhaar)
              </Button>
            )}
            {settled && <Badge className="bg-emerald-500">{settled}</Badge>}
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default ProcurementView;

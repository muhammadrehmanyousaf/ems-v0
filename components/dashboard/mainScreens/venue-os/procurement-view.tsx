"use client";

/**
 * Venue-OS P2 · WS3 — procurement GRN three-way-match panel. Raise a PO (qty ×
 * agreed rate), receive a GRN (accepted qty + actual rate) → the exact rupee
 * shortfall (short-delivery + over-rate) is flagged in Urdu-ready plain numbers,
 * then "accept" posts the accepted NET value to the GL as a SUPPLIER_INVOICE
 * (supplier udhaar) and "settle" pays it down.
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 */
import * as React from "react";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueOsApi, type PurchaseOrder, type GoodsReceivedNote, type AcceptGrnResult } from "@/lib/api/venueOs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";

const PKR = (n: number | string): string => "Rs " + Math.round(Number(n)).toLocaleString("en-PK");

function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

function matchBadge(status: string): React.ReactElement {
  if (status === "MATCH") return <Badge className="bg-emerald-500">match</Badge>;
  return <Badge variant="destructive">{status.toLowerCase().replace("_", " ")}</Badge>;
}

export function ProcurementView(): React.ReactElement | null {
  const [businessId, setBusinessId] = useBusinessIdField();
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
      setErr(readErr(e, "Couldn't load procurement."));
    } finally {
      setBusy(false);
    }
  }


  const poLineId = po?.lines?.[0]?.id;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Procurement (PO → GRN three-way-match)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <BusinessScopeField value={businessId} onChange={setBusinessId} />

        {/* 1 · raise PO */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <span className="font-medium">1 · Raise PO</span>
            <input type="text" placeholder="item" value={descr} onChange={(e) => setDescr(e.target.value)} className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <input type="number" placeholder="qty" value={qty} onChange={(e) => setQty(e.target.value)} className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <input type="text" placeholder="unit" value={unit} onChange={(e) => setUnit(e.target.value)} className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <input type="number" placeholder="rate" value={rate} onChange={(e) => setRate(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
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
              <input type="number" placeholder="qty accepted" value={qtyAccepted} onChange={(e) => setQtyAccepted(e.target.value)} className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <input type="number" placeholder="actual rate" value={actualRate} onChange={(e) => setActualRate(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
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

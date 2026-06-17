"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StaffPortalAPI, getStaffToken, type MyShift } from "@/lib/api/staffPortal";

function fmtDate(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}
function fmtRs(v: string | number | null | undefined): string {
  return `Rs. ${Math.round(Number(v || 0)).toLocaleString("en-PK")}`;
}

export default function StaffPayslipsPage() {
  const router = useRouter();
  const [payslips, setPayslips] = useState<MyShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPayslips(await StaffPortalAPI.getMyPayslips());
    } catch (err: any) {
      if (err?.response?.status === 401) return;
      setError(err?.response?.data?.message || "Could not load your payslips.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getStaffToken()) {
      router.replace("/staff/login");
      return;
    }
    load();
  }, [router, load]);

  async function openPdf(id: number) {
    setOpeningId(id);
    setError(null);
    try {
      await StaffPortalAPI.openPayslipPdf(id);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not open the payslip.");
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-bridal-gold-dark">My payslips</h1>
        <Link href="/staff/today" className="text-xs text-muted-foreground underline">
          My shifts
        </Link>
      </header>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
      ) : payslips.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No paid shifts yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {payslips.map((p) => (
            <li key={p.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{fmtDate(p.shiftDate)}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.roleSnapshot || "Shift"} · {fmtRs(p.netPayable)}
                    {p.paidVia ? ` · ${p.paidVia}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-700">
                  Paid
                </span>
              </div>
              <Button
                variant="outline"
                className="mt-3 h-11 w-full"
                disabled={openingId === p.id}
                onClick={() => openPdf(p.id)}
              >
                {openingId === p.id ? "Opening…" : "View payslip"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

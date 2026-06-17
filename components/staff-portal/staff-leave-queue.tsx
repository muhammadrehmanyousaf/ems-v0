"use client";

// Staff Portal — Phase 4a. Vendor-side pending-leave queue. Self-contained;
// renders nothing unless NEXT_PUBLIC_STAFF_LOGINS_ENABLED === "true" and there
// are pending requests. Approve/reject call the flag-gated backend endpoints.
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StaffAPI, type StaffLeaveRequest } from "@/lib/api/staff";

const FLAG_ON = process.env.NEXT_PUBLIC_STAFF_LOGINS_ENABLED === "true";

export function StaffLeaveQueue() {
  const [rows, setRows] = useState<StaffLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await StaffAPI.listLeaveRequests({ status: "pending" }));
    } catch (e: any) {
      // Quietly ignore when the feature is off (404) or unauthorized.
      if (e?.response?.status !== 404) {
        toast.error(e?.response?.data?.message || "Could not load leave requests");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (FLAG_ON) load();
    else setLoading(false);
  }, [load]);

  if (!FLAG_ON || loading || rows.length === 0) return null;

  async function act(id: number, decision: "approve" | "reject") {
    setBusyId(id);
    try {
      if (decision === "approve") await StaffAPI.approveLeave(id);
      else await StaffAPI.rejectLeave(id);
      toast.success(`Leave ${decision === "approve" ? "approved" : "rejected"}`);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <p className="mb-2 text-sm font-medium">Pending leave requests ({rows.length})</p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-white p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {r.staffMember?.fullName || "Staff"} · <span className="capitalize">{r.type}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {r.fromDate} – {r.toDate}
                {r.reason ? ` · ${r.reason}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={busyId === r.id} onClick={() => act(r.id, "approve")}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === r.id}
                onClick={() => act(r.id, "reject")}
              >
                Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

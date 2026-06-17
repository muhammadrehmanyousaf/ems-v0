"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  StaffPortalAPI,
  getStaffToken,
  type StaffProfile,
  type MyShift,
} from "@/lib/api/staffPortal";

function fmtDate(ymd: string): string {
  // ymd is "YYYY-MM-DD"
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
function fmtRs(v: string | number | null): string {
  const n = Number(v || 0);
  return `Rs. ${Math.round(n).toLocaleString("en-PK")}`;
}
function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

const ATT_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  checked_in: "Checked in",
  completed: "Completed",
  absent: "Absent",
  excused: "Excused",
  replaced: "Replaced",
};

export default function StaffTodayPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [shifts, setShifts] = useState<MyShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [me, sh] = await Promise.all([
        StaffPortalAPI.getMe(),
        StaffPortalAPI.getMyShifts(),
      ]);
      setProfile(me);
      setShifts(sh);
    } catch (err: any) {
      if (err?.response?.status === 401) return; // interceptor redirects
      setError(err?.response?.data?.message || "Could not load your shifts.");
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

  async function act(shift: MyShift, kind: "in" | "out") {
    setBusyId(shift.id);
    setError(null);
    try {
      const updated =
        kind === "in"
          ? await StaffPortalAPI.checkIn(shift.id)
          : await StaffPortalAPI.checkOut(shift.id);
      setShifts((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
    } catch (err: any) {
      setError(err?.response?.data?.message || "That didn't work. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  function logout() {
    StaffPortalAPI.logout();
    router.replace("/staff/login");
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  const today = todayYmd();
  const todays = shifts.filter((s) => s.shiftDate === today);
  const upcoming = shifts.filter((s) => s.shiftDate > today);
  const past = shifts.filter((s) => s.shiftDate < today);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-bridal-gold-dark">
            {profile?.fullName || "My shifts"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {profile?.role}
            {profile?.businessName ? ` · ${profile.businessName}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Link href="/staff/payslips" className="text-xs text-bridal-gold-dark underline">
            My payslips
          </Link>
          <button onClick={logout} className="text-xs text-muted-foreground underline">
            Sign out
          </button>
        </div>
      </header>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <ShiftGroup title="Today" shifts={todays} busyId={busyId} onAct={act} emphasise />
      <ShiftGroup title="Upcoming" shifts={upcoming} busyId={busyId} onAct={act} />
      <ShiftGroup title="Past" shifts={past} busyId={busyId} onAct={act} muted />

      {shifts.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          You have no shifts in this window.
        </p>
      )}
    </div>
  );
}

function ShiftGroup({
  title,
  shifts,
  busyId,
  onAct,
  emphasise,
  muted,
}: {
  title: string;
  shifts: MyShift[];
  busyId: number | null;
  onAct: (s: MyShift, kind: "in" | "out") => void;
  emphasise?: boolean;
  muted?: boolean;
}) {
  if (shifts.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h2>
      <ul className="space-y-3">
        {shifts.map((s) => (
          <li
            key={s.id}
            className={`rounded-xl border p-4 ${
              emphasise ? "border-bridal-gold/50 bg-white shadow-sm" : "bg-white/70"
            } ${muted ? "opacity-70" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{fmtDate(s.shiftDate)}</p>
                <p className="text-sm text-muted-foreground">
                  {s.roleSnapshot || "Shift"} · {fmtRs(s.netPayable)}
                </p>
              </div>
              <span className="rounded-full bg-bridal-cream/60 px-2.5 py-1 text-xs text-bridal-gold-dark">
                {ATT_LABEL[s.attendanceStatus] || s.attendanceStatus}
                {s.paymentStatus === "paid" ? " · Paid" : ""}
              </span>
            </div>

            {s.attendanceStatus === "scheduled" && (
              <Button
                className="mt-3 h-12 w-full text-base"
                disabled={busyId === s.id}
                onClick={() => onAct(s, "in")}
              >
                {busyId === s.id ? "…" : "Check in"}
              </Button>
            )}
            {s.attendanceStatus === "checked_in" && (
              <Button
                variant="secondary"
                className="mt-3 h-12 w-full text-base"
                disabled={busyId === s.id}
                onClick={() => onAct(s, "out")}
              >
                {busyId === s.id ? "…" : "Check out"}
              </Button>
            )}
            {s.attendanceStatus === "completed" && (
              <p className="mt-3 text-center text-sm font-medium text-green-700">
                ✓ Completed
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

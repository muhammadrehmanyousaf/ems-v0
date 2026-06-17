"use client";

// Staff Portal — Phase 2 FE. Vendor-side control to provision a staff member's
// self-serve login. Self-contained (own dialog + state). Renders nothing unless
// NEXT_PUBLIC_STAFF_LOGINS_ENABLED === "true" (the backend also 404s when its
// own STAFF_LOGINS_ENABLED is off, so this is double-gated).
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { StaffAPI, type StaffMember } from "@/lib/api/staff";

const FLAG_ON = process.env.NEXT_PUBLIC_STAFF_LOGINS_ENABLED === "true";

export function StaffLoginControl({
  member,
  onChanged,
}: {
  member: StaffMember;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!FLAG_ON) return null;
  const hasLogin = !!member.userId;

  async function enable() {
    setBusy(true);
    try {
      await StaffAPI.enableLogin(member.id, {
        email: email.trim().toLowerCase(),
        password,
      });
      toast.success("Staff login enabled");
      setOpen(false);
      setEmail("");
      setPassword("");
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not enable login");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    try {
      await StaffAPI.resetLogin(member.id, password);
      toast.success("Password reset");
      setPassword("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not reset password");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      await StaffAPI.disableLogin(member.id);
      toast.success("Staff login disabled");
      setOpen(false);
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not disable login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {hasLogin ? "Manage login" : "Enable login"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {hasLogin ? "Manage staff login" : "Enable staff login"} — {member.fullName}
          </DialogTitle>
        </DialogHeader>

        {!hasLogin ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Give {member.fullName} a login for the staff portal (check-in/out, their
              shifts and payslips). Share the email + password with them.
            </p>
            <Input
              type="email"
              placeholder="Staff email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Temporary password (min 8 characters)"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <DialogFooter>
              <Button onClick={enable} disabled={busy || !email || password.length < 8}>
                {busy ? "…" : "Enable login"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {member.fullName} can sign in to the staff portal. Reset their password or
              disable their access.
            </p>
            <Input
              type="password"
              placeholder="New password (min 8 characters)"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={reset}
                disabled={busy || password.length < 8}
              >
                Reset password
              </Button>
              <Button variant="destructive" onClick={disable} disabled={busy}>
                Disable login
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

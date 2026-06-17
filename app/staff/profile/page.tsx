"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  StaffPortalAPI,
  getStaffToken,
  type StaffEditableProfile,
  type StaffProfilePatch,
} from "@/lib/api/staffPortal";
import { formatPkPhone } from "@/lib/format/pk";

type FormState = Record<keyof StaffProfilePatch, string>;

const EMPTY: FormState = {
  phoneNumber: "",
  whatsappNumber: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  cnicAddress: "",
  bankName: "",
  bankAccountNumber: "",
  jazzcashNumber: "",
  easypaisaNumber: "",
};

function fromProfile(p: StaffEditableProfile): FormState {
  return {
    phoneNumber: p.phoneNumber || "",
    whatsappNumber: p.whatsappNumber || "",
    emergencyContactName: p.emergencyContactName || "",
    emergencyContactPhone: p.emergencyContactPhone || "",
    cnicAddress: p.cnicAddress || "",
    bankName: p.bankName || "",
    bankAccountNumber: p.bankAccountNumber || "",
    jazzcashNumber: p.jazzcashNumber || "",
    easypaisaNumber: p.easypaisaNumber || "",
  };
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-11" {...rest} />
    </div>
  );
}

export default function StaffProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StaffEditableProfile | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const p = await StaffPortalAPI.getMyProfile();
      setProfile(p);
      setForm(fromProfile(p));
    } catch (err: any) {
      if (err?.response?.status === 401) return;
      setError(err?.response?.data?.message || "Could not load your profile.");
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

  const PHONE_KEYS = new Set<keyof FormState>([
    "phoneNumber",
    "whatsappNumber",
    "emergencyContactPhone",
    "jazzcashNumber",
    "easypaisaNumber",
  ]);
  function set(k: keyof FormState, v: string) {
    setForm((f) => ({ ...f, [k]: PHONE_KEYS.has(k) ? formatPkPhone(v) : v }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const updated = await StaffPortalAPI.updateMyProfile(form as StaffProfilePatch);
      setProfile(updated);
      setForm(fromProfile(updated));
      setSaved(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-bridal-gold-dark">My profile</h1>
        <Link href="/staff/today" className="text-xs text-muted-foreground underline">
          My shifts
        </Link>
      </header>

      {profile && (
        <p className="text-sm text-muted-foreground">
          {profile.fullName} · {profile.role}
          <span className="block text-xs">Your name and role are set by your manager.</span>
        </p>
      )}

      <form onSubmit={save} className="space-y-5">
        <section className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-sm font-medium">Contact</p>
          <Field label="Phone" value={form.phoneNumber} onChange={(v) => set("phoneNumber", v)} type="tel" inputMode="tel" />
          <Field label="WhatsApp" value={form.whatsappNumber} onChange={(v) => set("whatsappNumber", v)} type="tel" inputMode="tel" />
          <Field label="Emergency contact name" value={form.emergencyContactName} onChange={(v) => set("emergencyContactName", v)} />
          <Field label="Emergency contact phone" value={form.emergencyContactPhone} onChange={(v) => set("emergencyContactPhone", v)} type="tel" inputMode="tel" />
          <Field label="Address" value={form.cnicAddress} onChange={(v) => set("cnicAddress", v)} />
        </section>

        <section className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-sm font-medium">Payout details</p>
          <p className="text-xs text-muted-foreground">
            These are where you get paid. Changes are recorded for your manager.
          </p>
          <Field label="Bank name" value={form.bankName} onChange={(v) => set("bankName", v)} />
          <Field label="Bank account / IBAN" value={form.bankAccountNumber} onChange={(v) => set("bankAccountNumber", v)} />
          <Field label="JazzCash number" value={form.jazzcashNumber} onChange={(v) => set("jazzcashNumber", v)} type="tel" inputMode="tel" />
          <Field label="Easypaisa number" value={form.easypaisaNumber} onChange={(v) => set("easypaisaNumber", v)} type="tel" inputMode="tel" />
        </section>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>
        )}
        {saved && !error && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">✓ Saved</p>
        )}

        <Button type="submit" disabled={saving} className="h-12 w-full text-base">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}

"use client";

/**
 * Phase-1 EPIC 6 · T6.1 — 90-second cold open.
 *
 * Value before setup: one short screen (business + your name + phone + city +
 * email + password + type), and one "are you familiar?" question that sets the
 * nav register. On submit we create the vendor+business, log them in, seed
 * default time-slots so there's a writable calendar immediately, and land them
 * ON the calendar — no multi-step wizard, no empty portal.
 *
 * Reuses the existing (captcha-gated in prod, disabled in dev) signup endpoint.
 */
import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Loader2, ShieldCheck } from "lucide-react";
import { BACKEND_URL } from "@/lib/backend-url";
import axiosInstance from "@/lib/axiosConfig";
import { SlotTemplatesAPI } from "@/lib/api/businessAvailability";
import { useUser } from "@/context/UserContext";
import { useNavPersona } from "@/lib/nav/nav-persona";
import { VENDOR_TYPES } from "@/lib/vendor-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS = Object.values(VENDOR_TYPES) as string[];

export default function OnboardingPage() {
  const { login } = useUser();
  const { setFromFamiliarity } = useNavPersona();

  const [name, setName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vendorType, setVendorType] = useState(TYPE_OPTIONS[0] ?? "");
  const [familiar, setFamiliar] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !fullName.trim() || !phone.trim() || !email.trim() || password.length < 6) {
      toast.error("Sab khaane bharein (password kam se kam 6 characters)");
      return;
    }
    setBusy(true);
    try {
      // 1) create vendor + business
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("fullName", fullName.trim());
      fd.append("email", email.trim());
      fd.append("phoneNumber", phone.trim());
      fd.append("password", password);
      fd.append("vendorType", vendorType);
      fd.append("city", city.trim());
      fd.append("isVendor", "true");
      fd.append("roleIds", JSON.stringify([2]));
      const created = await axios.post(`${BACKEND_URL}api/v1/businesses/create-business-with-vendor`, fd);
      const businessId = created?.data?.data?.business?.id;

      // 2) log them in
      const li = await axiosInstance.post("/api/v1/auth/login", { email: email.trim(), password });
      const { user, token, jti, flags } = li?.data?.data || {};
      if (user && token) login(user, token, { jti, flags });

      // 3) writable calendar immediately — seed default time-slots
      if (businessId) {
        try { await SlotTemplatesAPI.seedDefaults(businessId); } catch { /* non-fatal */ }
      }

      // 4) set the nav register from the familiarity answer
      if (familiar !== null) setFromFamiliarity(familiar);

      toast.success("Ho gaya! Aap ka calendar tayyar hai.");
      // Full navigation (not router.push) so the just-set session hydrates fresh
      // on the dashboard — avoids the half-hydrated blank-render on first load.
      window.location.assign("/dashboard/calendar");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Signup nahi hua — dobara koshish karein");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">90 second mein shuru karein</h1>
          <p className="text-sm text-muted-foreground mt-1">Naam, phone, aur type — bas. Baaqi baad mein.</p>
        </div>

        <div className="space-y-3 rounded-xl border p-4">
          <Field label="Business ka naam"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Al-Habib Marquee" /></Field>
          <Field label="Aap ka naam"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Owner ka naam" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx-xxxxxxx" inputMode="tel" /></Field>
            <Field label="City"><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lahore" /></Field>
          </div>
          <Field label="Type">
            <select value={vendorType} onChange={(e) => setVendorType(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
              {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" inputMode="email" /></Field>
            <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6+ characters" /></Field>
          </div>

          {/* T6.2 — the one familiarity question, sets the nav register */}
          <div>
            <label className="text-xs text-muted-foreground">In systems se waqif hain?</label>
            <div className="flex gap-2 mt-1">
              {[["Naya hoon", false], ["Haan, use kiya hai", true]].map(([label, val]) => (
                <button
                  key={label as string}
                  type="button"
                  onClick={() => setFamiliar(val as boolean)}
                  className={cn("flex-1 rounded-md border px-3 py-1.5 text-sm", familiar === val ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={submit} disabled={busy} className="w-full mt-1">
            {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <ShieldCheck className="size-4 mr-2" />}
            Calendar kholein
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Pehle se account hai? <Link href="/login" className="text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

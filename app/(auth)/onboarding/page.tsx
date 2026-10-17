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
import "../../globals.css";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ShieldCheck } from "lucide-react";
import { BACKEND_URL } from "@/lib/backend-url";
import axiosInstance from "@/lib/axiosConfig";
import { SlotTemplatesAPI } from "@/lib/api/businessAvailability";
import { useUser } from "@/context/UserContext";
import { useNavPersona } from "@/lib/nav/nav-persona";
import { VENDOR_TYPES } from "@/lib/vendor-types";
import { quickSignupSubTypes } from "@/lib/quick-signup-subtypes";
import { BridalButton } from "@/components/bridal/bridal-button";
import { BridalField, BridalInput } from "@/components/bridal/bridal-input";
import { BridalTitle } from "@/components/bridal/bridal-card";
import { FloatingPetals } from "@/components/bridal/floating-petals";
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
      // WP36: the server refuses a registration with no business type; send the wizard's own value for this type
      fd.append("subBusinessType", JSON.stringify(quickSignupSubTypes(vendorType)));
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
    <div className="relative min-h-dvh bridal-surface overflow-hidden">
      {/* The same ivory + jaal + warm wash + petals frame the sign-in and register screens sit on. */}
      <div className="absolute inset-0 bg-bridal-hero" aria-hidden />
      <div className="absolute inset-0 bg-bridal-wash opacity-95" aria-hidden />
      <FloatingPetals className="z-0" />

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[520px] animate-stagger-fade-up">
          <div className="text-center">
            <BridalTitle size="h2" className="leading-tight">90 second mein shuru karein</BridalTitle>
            <p className="font-bridal mt-2 text-[13px] text-bridal-text-soft">Naam, phone, aur type — bas. Baaqi baad mein.</p>
          </div>

          <div className="mt-5 space-y-3.5 rounded-[6px] border border-bridal-beige bg-bridal-cream p-5 shadow-[0_24px_40px_-28px_rgba(176,125,84,0.4)] sm:p-6">
            <BridalField id="onb-name" label="Business ka naam">
              <BridalInput id="onb-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Al-Habib Marquee" />
            </BridalField>
            <BridalField id="onb-fullname" label="Aap ka naam">
              <BridalInput id="onb-fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Owner ka naam" />
            </BridalField>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <BridalField id="onb-phone" label="Phone">
                <BridalInput id="onb-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx-xxxxxxx" inputMode="tel" />
              </BridalField>
              <BridalField id="onb-city" label="City">
                <BridalInput id="onb-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lahore" />
              </BridalField>
            </div>
            <BridalField id="onb-type" label="Type">
              <select
                id="onb-type"
                value={vendorType}
                onChange={(e) => setVendorType(e.target.value)}
                className="bridal-input bridal-select h-12 w-full px-4 font-bridal text-[14px]"
              >
                {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </BridalField>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <BridalField id="onb-email" label="Email">
                <BridalInput id="onb-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" inputMode="email" />
              </BridalField>
              <BridalField id="onb-password" label="Password">
                <BridalInput id="onb-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6+ characters" />
              </BridalField>
            </div>

            {/* T6.2 — the one familiarity question, sets the nav register */}
            <div className="space-y-1.5">
              <span className="bridal-label block">In systems se waqif hain?</span>
              <div className="flex gap-2">
                {[["Naya hoon", false], ["Haan, use kiya hai", true]].map(([label, val]) => (
                  <button
                    key={label as string}
                    type="button"
                    aria-pressed={familiar === val}
                    onClick={() => setFamiliar(val as boolean)}
                    className={cn(
                      "h-11 flex-1 rounded-[4px] border px-3 font-bridal text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold/60",
                      familiar === val
                        ? "border-bridal-gold-dark bg-bridal-gold-dark text-white"
                        : "border-bridal-beige bg-bridal-cream text-bridal-charcoal hover:border-bridal-gold",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <BridalButton onClick={submit} disabled={busy} loading={busy} size="lg" block className="mt-1">
              {busy ? null : <ShieldCheck className="size-4" />}
              Calendar kholein
            </BridalButton>
          </div>

          <p className="font-bridal mt-4 text-center text-[13px] text-bridal-text-soft">
            Pehle se account hai?{" "}
            <Link href="/login" className="font-medium text-bridal-gold-dark underline-offset-4 hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

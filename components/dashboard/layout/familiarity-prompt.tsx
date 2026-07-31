"use client";

/**
 * Phase-1 NAV — the onboarding "are you familiar?" question.
 *
 * Chooses the vendor's vocabulary register the first time they land: a vendor
 * who has used management software gets the professional English labels; one
 * who hasn't gets the plain Roman-Urdu register (Ghar / Baqaya / Kharcha). This
 * is the piece that makes the persona nav system actually adapt — until now
 * setFromFamiliarity was never called, so everyone silently got the default.
 *
 * DORMANT as of 2026-07-29. The nav store now defaults to professional + full
 * with `asked: true` (see lib/nav/nav-persona.ts), on the assumption that
 * vendors reaching the dashboard already know the product — so this card no
 * longer renders for anyone. It is kept, not deleted, because the register is
 * still switchable in Settings and re-enabling the question is a one-line
 * change to that default.
 *
 * Gated on the persisted `asked` flag and on the store
 * having hydrated (so it never flashes then vanishes).
 */
import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavPersona } from "@/lib/nav/nav-persona";


export function FamiliarityPrompt() {
  const { asked, setFromFamiliarity, dismissAsk } = useNavPersona();
  const [hydrated, setHydrated] = useState(false);

  // Zustand-persist rehydrates on the client; wait for it so we read the real
  // `asked` value, not the default false (which would flash the card for
  // vendors who already answered).
  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated || asked) return null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h3 className="font-semibold">Let&apos;s set up your menu</h3>
          </div>
          <button
            onClick={dismissAsk}
            className="text-muted-foreground hover:text-foreground p-0.5"
            aria-label="Skip"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mt-1.5">
          Have you used a booking or business-management software before? We&apos;ll name the menu the way that suits you.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => setFromFamiliarity(false)}
            className="text-left rounded-lg border p-3 hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <p className="font-medium text-sm">Naya hoon — keep it simple</p>
            <p className="text-xs text-muted-foreground mt-1">
              Plain names: <span className="font-medium">Ghar · Baqaya · Kharcha · Naye Rabtay</span>
            </p>
          </button>
          <button
            onClick={() => setFromFamiliarity(true)}
            className="text-left rounded-lg border p-3 hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <p className="font-medium text-sm">Yes, I&apos;ve used software like this</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pro names: <span className="font-medium">Dashboard · Receivables · Expenses · Leads</span>
            </p>
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">You can switch anytime in Settings.</p>
      </CardContent>
    </Card>
  );
}

export default FamiliarityPrompt;

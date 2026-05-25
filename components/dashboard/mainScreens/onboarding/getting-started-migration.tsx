"use client";

/**
 * "Bring your business in" — the operational onboarding step the
 * completeness engine doesn't score: migrating a vendor's existing
 * Excel/register data into the platform.
 *
 * Surfaces the two bulk importers shipped earlier:
 *   - Customer CSV import   (flag NEXT_PUBLIC_IMPORT,        dir #20)
 *   - Booking CSV import    (flag NEXT_PUBLIC_BOOKING_IMPORT, dir #40)
 *
 * The importers are dialog-triggered on their own pages (no deep-link
 * auto-open), so each row links to the page + tells the vendor which
 * button to click. Flag-aware: if BOTH flags are off, the whole card
 * renders nothing (zero footprint for vendors who don't have the
 * feature). Dismissible — once a vendor has migrated, they tuck it
 * away; choice persists in localStorage.
 *
 * Purely additive: a new card above the existing completeness
 * checklist. The checklist itself is untouched.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileUp, Users, CalendarClock, ArrowRight, X, PackagePlus,
} from "lucide-react";

const DISMISS_KEY = "ww_migration_card_dismissed_v1";

interface MigrationAction {
  enabled: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
  cta: string;
}

export default function GettingStartedMigration() {
  const [dismissed, setDismissed] = useState(true); // assume dismissed until we read LS (avoids flash)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const actions: MigrationAction[] = [
    {
      enabled: process.env.NEXT_PUBLIC_IMPORT === "1",
      icon: <Users className="h-4 w-4 text-blue-600" />,
      title: "Import your customer list",
      desc: "Paste or upload your Excel/CSV — we map the columns and dedupe by phone. No more re-typing names one by one.",
      href: "/dashboard/customers",
      cta: "Go to Customers → Import",
    },
    {
      enabled: process.env.NEXT_PUBLIC_BOOKING_IMPORT === "1",
      icon: <CalendarClock className="h-4 w-4 text-emerald-600" />,
      title: "Backfill your booking history",
      desc: "Load past events so your revenue, repeat-customer, and A/R reports show the full picture from day one — not a blank slate.",
      href: "/dashboard/bookings",
      cta: "Go to Bookings → Import history",
    },
  ];

  const enabledActions = actions.filter((a) => a.enabled);

  // Nothing to migrate-toward, or vendor dismissed it → render nothing.
  if (dismissed || enabledActions.length === 0) return null;

  return (
    <Card className="border-bridal-gold-dark/30 bg-gradient-to-br from-bridal-gold-dark/[0.04] to-transparent">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-bridal-gold-dark/10 text-bridal-gold-dark shrink-0">
              <PackagePlus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Bring your business in</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Leave the register behind. Migrate your existing data once —
                then everything (revenue, khata, reports) just works.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            onClick={dismiss}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {enabledActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group rounded-md border bg-background p-3 hover:border-bridal-gold-dark/40 hover:bg-bridal-gold-dark/[0.03] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted/60 shrink-0">
                  {a.icon}
                </span>
                <p className="text-sm font-semibold">{a.title}</p>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                {a.desc}
              </p>
              <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-bridal-gold-dark">
                <FileUp className="h-3 w-3" />
                {a.cta}
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

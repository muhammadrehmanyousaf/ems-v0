"use client";

/**
 * "Can customers book you right now?" — the vendor-side pre-flight.
 *
 * Every rule here already existed inside `bookingCreateService`; the only
 * thing that changes is WHERE it runs. Those rules used to fire at the
 * customer's last step, after a card had been typed, on data the vendor had
 * saved months earlier. A vendor with a slot ending at 11 PM found out because
 * a stranger failed to pay.
 *
 * The rules themselves live in `lib/booking/preflight` — pure, so they can be
 * checked without a server and so the backend can eventually run the same
 * function against the same row without the two drifting.
 */

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueSpacesApi } from "@/lib/api/venueSpaces";
import { preflight, type PreflightResult, type PreflightSignals } from "@/lib/booking/preflight";

function flatten(
  nodes: { id: number; name?: string | null; capacity?: number | null; children?: any[] }[] | undefined,
  acc: { id: number; name?: string | null; capacity?: number | null }[] = [],
): { id: number; name?: string | null; capacity?: number | null }[] {
  for (const n of nodes || []) {
    acc.push({ id: n.id, name: n.name, capacity: n.capacity });
    flatten(n.children, acc);
  }
  return acc;
}

export function BookingPreflightPanel(): React.ReactElement | null {
  const [businessId] = useBusinessIdField();
  const [result, setResult] = React.useState<PreflightResult | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    const bid = Number(businessId);
    setLoaded(false);

    void (async () => {
      const signals: PreflightSignals = {};

      // Each source is independently optional. A failed fetch must leave its
      // signal undefined — "not known" — rather than defaulting to a value
      // that would invent a blocker the vendor cannot find.
      const [tree, slots] = await Promise.allSettled([
        venueSpacesApi.getTree(bid),
        venueSpacesApi.listSlots(bid, undefined, true),
      ]);

      if (tree.status === "fulfilled") signals.spaces = flatten(tree.value?.tree as any);
      if (slots.status === "fulfilled") {
        signals.slots = (slots.value?.slots || []).map((s: any) => ({
          label: s.label,
          startTime: s.startTime,
          endTime: s.endTime,
          capacity: s.capacity,
          isActive: s.isActive,
          subVenueId: s.subVenueId,
        }));
      }

      if (cancelled) return;
      setResult(preflight(signals));
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (!businessId) return null;

  // Never claim a verdict before one exists — the slot editor shipped with
  // exactly this bug and told vendors their venue was unbookable for two
  // seconds on every load.
  if (!loaded || !result) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Can customers book you?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground" role="status">
            Checking your booking setup…
          </p>
        </CardContent>
      </Card>
    );
  }

  const { bookable, headline, blocking, warnings, unknown } = result;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">Can customers book you?</CardTitle>
          {bookable === true && blocking.length === 0 && (
            <Badge variant="outline" className="gap-1 text-[11px]">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Yes
            </Badge>
          )}
          {bookable === false && (
            <Badge variant="destructive" className="gap-1 text-[11px]">
              <XCircle className="h-3 w-3" aria-hidden />
              Not right now
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <p className={bookable === false ? "font-medium text-destructive" : "text-muted-foreground"}>
          {headline}
        </p>

        {[...blocking, ...warnings].map((issue) => (
          <div
            key={issue.key}
            className="rounded-md border p-3"
            // Blocking issues carry the only colour on the card, so the eye
            // lands on what actually stops money arriving.
            data-severity={issue.severity}
          >
            <div className="flex items-start gap-2">
              {issue.severity === "blocking" ? (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{issue.title}</p>
                <p className="text-xs text-muted-foreground">{issue.consequence}</p>
                <Link
                  href={issue.href}
                  className="inline-flex items-center gap-0.5 text-xs font-medium underline underline-offset-2"
                >
                  {issue.action}
                  <ChevronRight className="h-3 w-3" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {unknown.length > 0 && (
          // Say what was not looked at. A green tick that quietly skipped half
          // the checks is the one outcome worse than a red one.
          <p className="text-[11px] text-muted-foreground">
            Not checked just now: {unknown.join(", ")}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

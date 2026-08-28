"use client";

/**
 * WW-REQUIREMENTS — the shared thread, rendered for whichever side is reading.
 *
 * One component, two roles, because the thing that settles a dispute is that
 * both parties saw the SAME rows. Two components would drift, and the first
 * time they disagreed would be the day it mattered.
 *
 * Vendor: can acknowledge, agree, decline (with a reason) or quote (with an
 * amount). Acknowledging takes one tap and no typing — demanding a paragraph
 * would only teach vendors to paste "ok".
 *
 * Customer: reads the answers, and sees plainly which requests are still
 * unanswered. An open requirement is an unresolved expectation, and that is
 * what becomes "we asked for a ladies section" against "nobody told us".
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RequirementsAPI,
  REQUIREMENT_TAG_LABELS,
  type BookingRequirement,
  type RequirementTag,
} from "@/lib/api/requirements";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, MessageSquare, Clock, Banknote } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/utils/api-error";
import { cn } from "@/lib/utils";

const fmtPkr = (n: number | string) =>
  `Rs ${Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const DIETARY_LABELS: Record<string, string> = {
  kidsUnder5: "children under 5",
  kids5to12: "children 5–12",
  staffMeals: "drivers / staff meals",
  vegetarianCount: "vegetarian",
};

function dietarySummary(d: BookingRequirement["dietaryJson"]): string[] {
  if (!d) return [];
  const out: string[] = [];
  for (const [k, label] of Object.entries(DIETARY_LABELS)) {
    const v = (d as any)[k];
    if (typeof v === "number" && v > 0) out.push(`${v} ${label}`);
  }
  if (d.noBeef) out.push("no beef");
  if (d.allergies?.length) out.push(`allergies: ${d.allergies.join(", ")}`);
  return out;
}

/**
 * WW-SETUP-COUNTS — the furniture and equipment the family asked for.
 *
 * These are what the venue's setup crew works from on the day, so unlike the
 * dietary line they are rendered as their own block rather than folded into a
 * dot-separated sentence: "40 round tables" buried between "12 children under
 * 5" and "no beef" is a number that gets missed.
 */
const SETUP_LABELS: Record<string, string> = {
  roundTables: "round tables",
  vipSofas: "VIP sofa sets",
  foodStalls: "food stalls",
  chairs: "chairs",
  rectTables: "long tables",
  stageSize: "ft stage",
  heaters: "patio heaters",
  acUnits: "extra cooling units",
  generators: "backup generators",
  parkingSlots: "reserved parking slots",
};

function setupSummary(sJson: BookingRequirement["setupJson"]): string[] {
  if (!sJson) return [];
  const out: string[] = [];
  for (const [k, label] of Object.entries(SETUP_LABELS)) {
    const v = (sJson as Record<string, unknown>)[k];
    if (typeof v === "number" && v > 0) out.push(`${v} ${label}`);
  }
  return out;
}

export function RequirementsCard({
  bookingId,
  role,
}: {
  bookingId: number;
  role: "vendor" | "customer";
}) {
  const qc = useQueryClient();
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState<"agreed" | "declined" | "quoted">("agreed");
  const [price, setPrice] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["requirements", bookingId],
    queryFn: () => RequirementsAPI.list(bookingId),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["requirements", bookingId] });

  const respondMut = useMutation({
    mutationFn: (body: {
      id: number;
      status: "acknowledged" | "agreed" | "declined" | "quoted";
      vendorResponse?: string;
      priceImpactPkr?: number;
    }) =>
      RequirementsAPI.respond(body.id, {
        status: body.status,
        vendorResponse: body.vendorResponse,
        priceImpactPkr: body.priceImpactPkr,
      }),
    onSuccess: () => {
      toast.success("Sent to the customer.");
      setReplyTo(null); setReplyText(""); setPrice(""); invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't save that reply")),
  });

  const withdrawMut = useMutation({
    mutationFn: (id: number) => RequirementsAPI.withdraw(id),
    onSuccess: () => { toast.success("Withdrawn."); invalidate() },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't withdraw that")),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading requirements…
      </div>
    );
  }

  const rows = data?.requirements ?? [];
  // Most bookings have none. Rendering nothing beats an empty panel competing
  // for attention on a sheet that already has plenty.
  if (rows.length === 0) return null;

  const openCount = data?.openCount ?? 0;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          {role === "vendor" ? "Customer requirements" : "What you asked for"}
        </h3>
        {openCount > 0 && (
          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {openCount} {role === "vendor" ? "to answer" : "awaiting a reply"}
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        {rows.map((r) => {
          const diet = dietarySummary(r.dietaryJson);
          const setup = setupSummary(r.setupJson);
          const isOpen = r.status === "open";
          return (
            <div
              key={r.id}
              className={cn(
                "rounded-lg border p-3",
                isOpen
                  ? "border-amber-300 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20"
                  : "border-border",
              )}
            >
              {r.tags?.length ? (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {r.tags.map((t) => (
                    <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {REQUIREMENT_TAG_LABELS[t as RequirementTag] ?? t}
                    </span>
                  ))}
                </div>
              ) : null}

              {diet.length > 0 && (
                <p className="mb-2 text-sm text-muted-foreground">{diet.join(" · ")}</p>
              )}

              {/* Given its own block, and chips rather than prose: this is the
                  list the setup crew reads off on the morning. */}
              {(setup.length > 0 || r.setupJson?.notes) && (
                <div className="mb-2 rounded-md border border-border/70 bg-muted/40 p-2">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Setup requested
                  </p>
                  {setup.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {setup.map((line) => (
                        <span
                          key={line}
                          className="rounded-full border border-border bg-background px-2 py-0.5 text-xs tabular-nums"
                        >
                          {line}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.setupJson?.notes && (
                    <p className="mt-1.5 text-sm leading-relaxed">{r.setupJson.notes}</p>
                  )}
                </div>
              )}

              {/* The customer's own words, exactly as typed. Never translated,
                  never trimmed to a preview — this is the part the vendor
                  actually needs to read. */}
              {r.freeText && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{r.freeText}</p>
              )}

              {/* Answers */}
              {r.status === "agreed" && (
                <p className="mt-2 inline-flex items-start gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{r.vendorResponse || "Agreed."}</span>
                </p>
              )}
              {r.status === "acknowledged" && (
                <p className="mt-2 inline-flex items-start gap-1.5 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{r.vendorResponse || "Noted by the venue."}</span>
                </p>
              )}
              {r.status === "declined" && (
                <p className="mt-2 inline-flex items-start gap-1.5 text-sm">
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                  <span>
                    <span className="font-medium text-destructive">Can&apos;t do this.</span>{" "}
                    {r.vendorResponse}
                  </span>
                </p>
              )}
              {r.status === "quoted" && (
                <p className="mt-2 inline-flex items-start gap-1.5 text-sm">
                  <Banknote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-400" />
                  <span>
                    <span className="font-medium">
                      Adds {fmtPkr(r.priceImpactPkr ?? 0)}.
                    </span>{" "}
                    {r.vendorResponse}
                  </span>
                </p>
              )}
              {isOpen && role === "customer" && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400">
                  <Clock className="h-3.5 w-3.5" /> Waiting for the venue to reply
                </p>
              )}

              {/* Vendor actions */}
              {isOpen && role === "vendor" && replyTo !== r.id && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={respondMut.isPending}
                    onClick={() => respondMut.mutate({ id: r.id, status: "acknowledged" })}
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" /> Noted
                  </Button>
                  <Button size="sm" onClick={() => { setReplyTo(r.id); setReplyStatus("agreed") }}>
                    Reply
                  </Button>
                </div>
              )}

              {replyTo === r.id && (
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(["agreed", "declined", "quoted"] as const).map((s) => (
                      <label key={s} className="flex items-center gap-1.5 text-sm">
                        <input
                          type="radio"
                          name={`reply-${r.id}`}
                          className="accent-primary"
                          checked={replyStatus === s}
                          onChange={() => setReplyStatus(s)}
                        />
                        {s === "agreed" ? "We'll do it" : s === "declined" ? "We can't" : "It costs extra"}
                      </label>
                    ))}
                  </div>

                  {replyStatus === "quoted" && (
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="How much does this add? (Rs)"
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
                    />
                  )}

                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                    maxLength={2000}
                    placeholder={
                      replyStatus === "declined"
                        ? "Why — so they can plan around it"
                        : "Anything the customer should know"
                    }
                    className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2"
                  />

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={
                        respondMut.isPending ||
                        (replyStatus === "declined" && replyText.trim().length < 3) ||
                        (replyStatus === "quoted" && !(Number(price) > 0))
                      }
                      onClick={() =>
                        respondMut.mutate({
                          id: r.id,
                          status: replyStatus,
                          vendorResponse: replyText.trim() || undefined,
                          priceImpactPkr: replyStatus === "quoted" ? Number(price) : undefined,
                        })
                      }
                    >
                      {respondMut.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Send
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Withdrawing is only offered while nobody has replied. Retracting
                  something the venue has already agreed and priced would leave
                  them holding a commitment against a row that no longer exists. */}
              {isOpen && role === "customer" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  disabled={withdrawMut.isPending}
                  onClick={() => withdrawMut.mutate(r.id)}
                >
                  Withdraw
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

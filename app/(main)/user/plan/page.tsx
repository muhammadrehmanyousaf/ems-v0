"use client";

/**
 * Shaadi Plan — hub (spec §9).
 *
 * Lists the customer's wedding plans and the "Plan my wedding" CTA. A plan
 * is a WeddingUmbrella that carries functions (events) + vendor lines; from
 * here the customer opens the builder to add functions, shortlist vendors,
 * and book the whole shaadi together.
 *
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  CalendarDays,
  MapPin,
  Wallet,
  Loader2,
  Sparkles,
  ChevronRight,
  HeartHandshake,
  TrendingDown,
  PackageCheck,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  PageContainer,
  PageHeader,
  SectionCard,
  EmptyState,
} from "@/components/user-dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/context/UserContext";
import { WeddingPlansAPI, type WeddingPlan } from "@/lib/api/weddingPlans";
import { fmtPlanDate, fmtPKR } from "@/lib/wedding-plan-events";
import { CreatePlanDialog } from "@/components/wedding-plan/create-plan-dialog";

const STATUS_TONE: Record<string, string> = {
  planning: "border-bridal-gold/45 bg-bridal-gold/12 text-bridal-gold-dark",
  active: "border-bridal-sage/45 bg-bridal-sage/15 text-[#3F6B43]",
  completed: "border-bridal-rose/45 bg-bridal-blush text-bridal-mauve",
  cancelled: "border-bridal-coral/35 bg-bridal-coral/12 text-bridal-coral",
};

function planDisplayTitle(p: WeddingPlan): string {
  if (p.title?.trim()) return p.title;
  if (p.brideName && p.groomName) return `${p.brideName} & ${p.groomName}`;
  if (p.brideName) return `${p.brideName}'s Wedding`;
  if (p.groomName) return `${p.groomName}'s Wedding`;
  return "Your Wedding";
}

export default function PlanHubPage() {
  const { user, isAuthenticated, isLoading } = useUser();
  const router = useRouter();  const [mounted, setMounted] = React.useState(false);
  const [plans, setPlans] = React.useState<WeddingPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login?redirect=/user/plan");
    }
  }, [isAuthenticated, isLoading, router]);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await WeddingPlansAPI.listMine();
      setPlans(rows);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't load your wedding plans";
      toast({ title: "Couldn't load", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (user) load();
  }, [user, load]);

  // Pre-mount (and SSR): render the neutral skeleton so nothing leaks and
  // hydration matches.
  if (!mounted) {
    return (
      <PageContainer>
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-40 w-full" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Your whole shaadi"
        title="My wedding plan"
        description="Plan every function — Mayoun, Mehndi, Baraat, Walima — in one place, with a running budget and a bundle discount when you book them together."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Plan my wedding
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="space-y-4">
          <SectionCard title="Start your Shaadi Plan">
            <EmptyState
              icon={<HeartHandshake className="h-6 w-6" />}
              title="One plan for the whole wedding"
              description="A broker charges to coordinate every vendor across every function. Do it yourself here — shortlist a hall, caterer, photographer and more per function, track your budget, and book them all together in one step."
              action={
                <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Plan my wedding
                </Button>
              }
            />
          </SectionCard>

          {/* Value sell — three reasons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ValueCard
              icon={<CalendarDays className="h-5 w-5" />}
              title="Every function, organised"
              body="Mayoun to Walima — each with its own date, city, guests and vendors."
            />
            <ValueCard
              icon={<TrendingDown className="h-5 w-5" />}
              title="A bundle discount"
              body="Book more functions together and unlock a whole-wedding discount — no matter the order."
            />
            <ValueCard
              icon={<PackageCheck className="h-5 w-5" />}
              title="One checkout"
              body="Book every vendor in one step. You see exactly what got booked and what to retry."
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((p) => (
            <Link
              key={p.id}
              href={`/user/plan/${p.id}`}
              className="block rounded-lg border border-border bg-bridal-cream hover:border-bridal-gold/55 transition-colors p-5 group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-display italic text-[20px] text-bridal-charcoal leading-tight truncate">
                    {planDisplayTitle(p)}
                  </h3>
                  {p.brideName && p.groomName && p.title && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.brideName} &amp; {p.groomName}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${STATUS_TONE[p.status] ?? ""}`}
                >
                  {p.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-bridal-text-soft">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  <span>{fmtPlanDate(p.weddingDate)}</span>
                </div>
                {p.primaryCity && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{p.primaryCity}</span>
                  </div>
                )}
                {p.budgetMax != null && (
                  <div className="flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5 shrink-0" />
                    <span>Budget up to {fmtPKR(p.budgetMax)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 text-xs">
                <span className="text-bridal-text-soft">
                  {typeof p.eventCount === "number"
                    ? `${p.eventCount} function${p.eventCount === 1 ? "" : "s"}`
                    : "Open to build"}
                  {typeof p.itemCount === "number" && p.itemCount > 0
                    ? ` · ${p.itemCount} vendor${p.itemCount === 1 ? "" : "s"}`
                    : ""}
                </span>
                <span className="inline-flex items-center text-bridal-gold-dark group-hover:text-bridal-charcoal transition-colors">
                  Open
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreatePlanDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(p) => {
          setCreateOpen(false);
          router.push(`/user/plan/${p.id}`);
        }}
      />
    </PageContainer>
  );
}

function ValueCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-bridal-beige bg-white p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bridal-gold/12 text-bridal-gold-dark mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-bridal-charcoal">{title}</p>
      <p className="text-xs text-bridal-text-soft mt-1 leading-relaxed">{body}</p>
    </div>
  );
}

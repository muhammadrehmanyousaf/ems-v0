"use client";

/**
 * BK-100.2 Layer 2a — Customer-facing umbrella list.
 *
 * Lists the customer's WeddingUmbrellas with quick actions. The
 * umbrella primitive (Layer 1) is now usable from the customer side:
 *   - Create a new umbrella
 *   - View / edit / delete each one
 *   - Jump into the detail page to link existing bookings
 *
 * Layer 2b will add umbrella-level cancellation cascade + bundle
 * discount + multi-event booking flow.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  CalendarDays,
  MapPin,
  Users,
  Loader2,
  Sparkles,
  ChevronRight,
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
import {
  WeddingUmbrellasAPI,
  type UmbrellaStatus,
  type WeddingUmbrella,
} from "@/lib/api/weddingUmbrellas";
import { CreateUmbrellaDialog } from "@/components/umbrellas/create-umbrella-dialog";

const STATUS_LABEL: Record<UmbrellaStatus, string> = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<UmbrellaStatus, string> = {
  planning: "border-bridal-gold/45 bg-bridal-gold/12 text-bridal-gold-dark",
  active: "border-bridal-sage/45 bg-bridal-sage/15 text-[#3F6B43]",
  completed: "border-bridal-rose/45 bg-bridal-blush text-bridal-mauve",
  cancelled: "border-bridal-coral/35 bg-bridal-coral/12 text-bridal-coral",
};

function fmtDate(s: string | null | undefined): string {
  if (!s) return "Date TBD";
  try {
    return new Date(s).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return s;
  }
}

function umbrellaDisplayTitle(u: WeddingUmbrella): string {
  if (u.title?.trim()) return u.title;
  if (u.brideName && u.groomName) return `${u.brideName} & ${u.groomName}`;
  if (u.brideName) return `${u.brideName}'s Wedding`;
  if (u.groomName) return `${u.groomName}'s Wedding`;
  return "Your Wedding";
}

export default function UmbrellasListPage() {
  const { user, isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const [umbrellas, setUmbrellas] = React.useState<WeddingUmbrella[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login?redirect=/user/umbrellas");
    }
  }, [isAuthenticated, isLoading, router]);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await WeddingUmbrellasAPI.listMine();
      setUmbrellas(rows);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Failed to load wedding umbrellas";
      toast({ title: "Couldn't load", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (user) load();
  }, [user, load]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Your wedding"
        title="Wedding umbrellas"
        description="A wedding-week umbrella groups all your events — Mehndi, Nikah, Baraat, Walima — into one container with shared timeline, discounts and coordination."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New umbrella
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : umbrellas.length === 0 ? (
        <SectionCard title="No wedding umbrellas yet">
          <EmptyState
            icon={<Sparkles className="h-6 w-6" />}
            title="Group your events into one wedding"
            description="Pakistani weddings span Dholki, Mehndi, Nikah, Baraat, Walima and more. Create an umbrella to organise them in one place — shared timeline, family contacts, and a single roster of every booked vendor."
            action={
              <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Create your first umbrella
              </Button>
            }
          />
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {umbrellas.map((u) => (
            <Link
              key={u.id}
              href={`/user/umbrellas/${u.id}`}
              className="block rounded-lg border border-border bg-bridal-cream hover:border-bridal-gold/55 transition-colors p-5 group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-display italic text-[20px] text-bridal-charcoal leading-tight truncate">
                    {umbrellaDisplayTitle(u)}
                  </h3>
                  {u.brideName && u.groomName && u.title && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {u.brideName} &amp; {u.groomName}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className={`text-[10px] shrink-0 ${STATUS_TONE[u.status]}`}>
                  {STATUS_LABEL[u.status]}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-bridal-text-soft">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  <span>{fmtDate(u.weddingDate)}</span>
                </div>
                {u.primaryCity && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{u.primaryCity}</span>
                  </div>
                )}
                {u.estimatedGuests ? (
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>~{u.estimatedGuests} guests</span>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end mt-4 text-xs text-bridal-gold-dark group-hover:text-bridal-charcoal transition-colors">
                Open
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateUmbrellaDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(u) => {
          setCreateOpen(false);
          // Navigate to the new umbrella's detail page so the customer
          // can immediately add bookings to it.
          router.push(`/user/umbrellas/${u.id}`);
        }}
      />
    </PageContainer>
  );
}

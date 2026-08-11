'use client';

/**
 * Vendor onboarding — a guided setup, not a scoreboard.
 *
 * WHAT WAS HERE
 * -------------
 * One long card per business: a big number, six progress bars, thirty-odd
 * checklist rows and a "highest-impact next moves" box. Everything a vendor
 * needed was on the screen and nothing told them where to start, so the screen
 * measured the problem instead of solving it. Three specific failures, all
 * reported from the live account:
 *
 *   - It fetched with a bare `axiosInstance.get` into `useState`, outside the
 *     query cache entirely. So saving a field in Settings could not refresh it:
 *     the vendor added their WhatsApp number, came back, and was still being
 *     told to add their WhatsApp number until they reloaded the browser. Now on
 *     TanStack Query under `my-completeness`, which every business mutation
 *     invalidates (lib/query/business-keys.ts).
 *
 *   - Its links landed on a TAB. Six of them landed on the WRONG tab — Profile,
 *     which cannot edit owner name, owner bio, years, weddings, languages or
 *     WhatsApp. Fixed at the source in vendorCompletenessScore.js; every item
 *     now carries `&field=`, and Settings scrolls to it, focuses it and rings
 *     it.
 *
 *   - There was no order and no end. Thirty items ranked by points is a list,
 *     not a flow. The six categories are steps now, they run in the order a
 *     listing actually gets built, the screen opens on the first unfinished one
 *     and it says what finishing this step is worth.
 *
 * The score itself is unchanged — re-weighting it would silently move the
 * ranking of every listing on a live marketplace, which is a product decision
 * and not this. What changed is that the vendor can act on it.
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Building2,
  Image as ImageIcon,
  Wallet,
  Award,
  Sliders,
  BadgeCheck,
} from 'lucide-react';
import {
  CompletenessAPI,
  remainingOf,
  type BusinessCompleteness,
  type CompletenessCategory,
  type CompletenessItem,
} from '@/lib/api/completeness';
import { errorMessage } from '@/lib/utils/api-error';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EmptyState } from "@/components/dashboard/primitives/empty-state";

/**
 * The order a listing is actually built in, which is not the order the API
 * returns. A vendor with nothing filled in should be asked for their name and
 * city before their NTN certificate; photographs come before press coverage.
 * Unknown category keys keep their API order and land at the end, so a category
 * added server-side appears rather than disappearing.
 */
const STEP_ORDER = ['core', 'visual', 'commercial', 'typeSpecific', 'trust', 'verification'];

const STEP_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  core: Building2,
  visual: ImageIcon,
  commercial: Wallet,
  typeSpecific: Sliders,
  trust: Award,
  verification: BadgeCheck,
};

/** Plain-language stakes per step — why a vendor should spend ten minutes here. */
const STEP_STAKES: Record<string, string> = {
  core: 'Nothing else matters until a family can tell who you are and where you are.',
  visual: 'Couples shortlist from photographs before they ever pick up the phone.',
  commercial: 'A listing with no price and no terms cannot be booked, only browsed.',
  typeSpecific: 'The numbers families compare you against the hall next door on.',
  trust: 'Why they should believe you rather than the listing above yours.',
  verification: 'Earns the verified badge. Most of this is our work, not yours.',
};

function tierFor(score: number): { label: string; tone: string; ring: string } {
  if (score >= 90) return { label: 'Polished', tone: 'bg-amber-50 text-amber-800 border-amber-200', ring: 'text-amber-500' };
  if (score >= 70) return { label: 'Well-rounded', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200', ring: 'text-emerald-500' };
  if (score >= 50) return { label: 'Solid start', tone: 'bg-blue-50 text-blue-800 border-blue-200', ring: 'text-blue-500' };
  if (score >= 25) return { label: 'Getting there', tone: 'bg-violet-50 text-violet-800 border-violet-200', ring: 'text-violet-500' };
  return { label: 'Just started', tone: 'bg-neutral-100 text-neutral-700 border-neutral-300', ring: 'text-neutral-400' };
}

const sortedSteps = (cats: CompletenessCategory[]): CompletenessCategory[] =>
  [...cats].sort((a, b) => {
    const ia = STEP_ORDER.indexOf(a.key);
    const ib = STEP_ORDER.indexOf(b.key);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

const isComplete = (c: CompletenessCategory) => c.items.every((i) => i.done);

export default function OnboardingChecklistView() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<BusinessCompleteness[]>({
    queryKey: ['my-completeness'],
    queryFn: () => CompletenessAPI.listMine(),
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const bizParam = Number(searchParams?.get('biz')) || null;

  const businesses = data ?? [];
  const biz =
    (bizParam ? businesses.find((b) => b.businessId === bizParam) : undefined) ?? businesses[0];

  const setBiz = React.useCallback(
    (id: number) => {
      const qs = new URLSearchParams(searchParams?.toString() ?? '');
      qs.set('biz', String(id));
      qs.delete('step');
      router.replace(`?${qs.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  /**
   * WWL-523 — a failed fetch left the list empty, which fell through to "No
   * businesses yet. Create one…". A vendor who owns three venues was told they
   * own none, and invited to create one they already have, because the network
   * hiccuped. Failure and emptiness are different answers and only one of them
   * has a retry.
   */
  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 p-5 text-sm">
          <p className="font-medium">Couldn&apos;t load your setup checklist.</p>
          <p className="text-muted-foreground">
            {errorMessage(error, 'This is a loading problem, not a change to your account — your businesses are safe.')}
          </p>
          <Button size="sm" variant="secondary" onClick={() => refetch()} disabled={isFetching}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!biz) {
    return (
      <Card>
        <CardContent className="p-5">
          <EmptyState
            title="No business yet"
            description="Create your business profile and this becomes a step-by-step setup for it."
            action={
              <Link href="/dashboard/business/new">
                <Button size="sm">Create a business</Button>
              </Link>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {businesses.length > 1 && (
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Setting up {businesses.length} businesses — choose one
          </div>
          <div className="flex flex-wrap gap-2">
            {businesses.map((b) => {
              const active = b.businessId === biz.businessId;
              return (
                <button
                  key={b.businessId}
                  type="button"
                  aria-current={active ? 'true' : undefined}
                  onClick={() => setBiz(b.businessId)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-left text-xs transition-colors',
                    active
                      ? 'border-primary bg-primary/10 font-medium text-primary'
                      : 'border-border hover:border-primary/40 hover:bg-muted',
                  )}
                >
                  <span className="block max-w-[220px] truncate">{b.name || `Business #${b.businessId}`}</span>
                  <span className="block text-[10px] text-muted-foreground tabular-nums">{b.score} / 100</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <BusinessSetup key={biz.businessId} biz={biz} />
    </div>
  );
}

function BusinessSetup({ biz }: { biz: BusinessCompleteness }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const steps = React.useMemo(() => sortedSteps(biz.categories ?? []), [biz.categories]);

  /**
   * Open on the first unfinished step, not on step one — a vendor who has done
   * Core identity should not have to click past it every visit. `?step=` in the
   * URL so the choice survives a reload and the browser Back button works
   * between steps, which is what people actually press.
   */
  const firstUnfinished = Math.max(0, steps.findIndex((s) => !isComplete(s)));
  const stepParam = searchParams?.get('step');
  const indexFromParam = stepParam ? steps.findIndex((s) => s.key === stepParam) : -1;
  const activeIndex = indexFromParam >= 0 ? indexFromParam : firstUnfinished;
  const step = steps[activeIndex];

  const goStep = React.useCallback(
    (i: number) => {
      const target = steps[Math.max(0, Math.min(steps.length - 1, i))];
      if (!target) return;
      const qs = new URLSearchParams(searchParams?.toString() ?? '');
      qs.set('step', target.key);
      router.replace(`?${qs.toString()}`, { scroll: false });
    },
    [router, searchParams, steps],
  );

  const t = tierFor(biz.score);
  const remaining = remainingOf(biz);
  const doneSteps = steps.filter(isComplete).length;

  // The single highest-impact outstanding item, across every step — the answer
  // to "I have ten minutes, what should I do?".
  const nextItem: (CompletenessItem & { categoryLabel: string }) | undefined = React.useMemo(
    () =>
      steps
        .flatMap((c) => c.items.map((i) => ({ ...i, categoryLabel: c.label })))
        .filter((i) => !i.done)
        .sort((a, b) => b.weight - a.weight)[0],
    [steps],
  );

  if (!step) return null;

  return (
    <div className="space-y-5">
      {/* ── Where you are, and the one thing to do next ───────────────────── */}
      <Card className="overflow-hidden">
        <CardContent className="grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <ScoreRing score={biz.score} toneClass={t.ring} />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold leading-tight">{biz.name}</h2>
              <Badge variant="outline" className={cn('text-xs', t.tone)}>{t.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {remaining.count === 0
                ? 'Every item is done. Your listing is as complete as this checklist can measure.'
                : `${doneSteps} of ${steps.length} steps finished · ${remaining.count} thing${remaining.count === 1 ? '' : 's'} left, worth ${remaining.points} points.`}
            </p>

            {nextItem && (
              <div className="rounded-lg border border-bridal-gold/40 bg-bridal-gold/5 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-bridal-gold-dark">
                  <Sparkles className="h-3.5 w-3.5" /> Do this next
                </div>
                <p className="text-sm font-medium leading-snug">{nextItem.label}</p>
                {nextItem.why && (
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{nextItem.why}</p>
                )}
                {nextItem.href && (
                  <Link href={nextItem.href} className="mt-2 inline-block">
                    <Button size="sm">
                      Do it now <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Steps ─────────────────────────────────────────────────────────── */}
      <nav aria-label="Setup steps" className="-mx-1 overflow-x-auto px-1 pb-1">
        <ol className="flex min-w-max items-stretch gap-2">
          {steps.map((s, i) => {
            const done = isComplete(s);
            const current = i === activeIndex;
            const StepIcon = STEP_ICON[s.key] ?? Circle;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => goStep(i)}
                  aria-current={current ? 'step' : undefined}
                  className={cn(
                    'flex h-full min-h-11 min-w-[150px] items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors',
                    current
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40 hover:bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-7 w-7 shrink-0 place-items-center rounded-lg',
                      done ? 'bg-emerald-100 text-emerald-700' : current ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block truncate text-xs font-medium', current && 'text-primary')}>
                      {s.label}
                    </span>
                    <span className="block text-[10px] tabular-nums text-muted-foreground">
                      {s.earned} / {s.max} pts
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* ── The current step ──────────────────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-semibold">
                Step {activeIndex + 1} of {steps.length} · {step.label}
              </h3>
              <span className="text-xs tabular-nums text-muted-foreground">
                {step.earned} / {step.max} points
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{STEP_STAKES[step.key] ?? step.blurb ?? ''}</p>
            <Progress
              value={step.max > 0 ? Math.round((step.earned / step.max) * 100) : 0}
              className="h-1.5"
              aria-label={`${step.label} progress`}
              aria-valuenow={step.earned}
              aria-valuemin={0}
              aria-valuemax={step.max}
              aria-valuetext={`${step.earned} of ${step.max} points`}
            />
          </div>

          <ul className="space-y-2">
            {/* Outstanding work first. A vendor opening a step wants the things
                still to do, not to scroll past nine ticks to find them. */}
            {[...step.items].sort((a, b) => Number(a.done) - Number(b.done) || b.weight - a.weight).map((it) => (
              <ItemRow key={it.key} item={it} />
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goStep(activeIndex - 1)}
              disabled={activeIndex === 0}
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
            </Button>
            {activeIndex < steps.length - 1 ? (
              <Button size="sm" onClick={() => goStep(activeIndex + 1)}>
                Next: {steps[activeIndex + 1].label} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Link href={`/dashboard/business/${biz.businessId}`}>
                <Button size="sm" variant="secondary">
                  View the finished listing <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {biz.activation && <ActivationPanel biz={biz} />}
    </div>
  );
}

/**
 * One checklist item.
 *
 * A done row is quiet and unlinked — there is nothing to act on. An outstanding
 * row is the whole row, clickable, carrying what it is worth and what it costs
 * to skip. `href` is optional so the screen still renders against a backend
 * deploy that predates the links.
 */
function ItemRow({ item }: { item: CompletenessItem }) {
  const body = (
    <>
      <span className="flex min-w-0 flex-1 items-start gap-2">
        {item.done ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        ) : (
          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300" />
        )}
        <span className="min-w-0">
          <span className={cn('block text-sm leading-snug', item.done && 'text-muted-foreground')}>
            {item.label}
          </span>
          {!item.done && item.why && (
            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{item.why}</span>
          )}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            'text-[10px]',
            item.done
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-neutral-200 bg-neutral-50 text-neutral-600',
          )}
        >
          {item.done ? 'Done' : `+${item.weight}`}
        </Badge>
        {!item.done && item.href && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
      </span>
    </>
  );

  const base = 'flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5';

  if (item.done || !item.href) {
    return (
      <li>
        <div className={cn(base, 'border-transparent bg-muted/30')}>{body}</div>
      </li>
    );
  }
  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          base,
          'border-border transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        {body}
      </Link>
    </li>
  );
}

/** A dial, because "44 / 100" as text is a fact and this is a target. */
function ScoreRing({ score, toneClass }: { score: number; toneClass: string }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="relative h-24 w-24 shrink-0" role="img" aria-label={`Profile completeness ${pct} out of 100`}>
      <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="8" className="stroke-muted" />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={cn('transition-[stroke-dashoffset] duration-700', toneClass)}
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-2xl font-bold tabular-nums leading-none">{pct}</span>
        <span className="mt-6 text-[10px] uppercase tracking-wide text-muted-foreground">of 100</span>
      </div>
    </div>
  );
}

/**
 * Phase-1 EPIC 6 · T6.5 — how much of the venue's real work is running through
 * the portal. Tracked and shown, but NOT part of the completeness score above
 * (WWL-520): the two answer different questions and used to imply they were the
 * same one.
 */
function ActivationPanel({ biz }: { biz: BusinessCompleteness }) {
  const a = biz.activation!;
  const extra = [
    { n: a.leadsTotal, label: 'leads received' },
    { n: a.leadsWorked, label: 'leads worked' },
    { n: a.receipts, label: 'receipts recorded' },
    { n: a.functionSheets, label: 'function sheets' },
  ].filter((s) => s.n != null);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          How much you&apos;re using it · counted separately from the score
        </div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
          <ShieldCheck className={cn('h-3.5 w-3.5', a.shieldOn ? 'text-emerald-600' : 'text-muted-foreground')} />
          {a.shieldOn ? 'Booking shield ON' : 'Booking shield off — add your future dates'}
        </div>

        {/**
          * WWL-519 — the API returns nine activation fields and this panel
          * rendered four. The one it dropped that matters most is
          * `leadsAwaitingReply`: on the live account that was 22 people across
          * three venues who had asked about a wedding and heard nothing back. A
          * block whose entire job is answering "what should I do next?" was
          * showing how many bookings had been LOGGED — bookkeeping — while the
          * actual next action sat unrendered on the same payload. It goes
          * first, and it is a link, because reading the number is not the
          * point; replying is.
          */}
        {(a.leadsAwaitingReply ?? 0) > 0 && (
          <Link
            href="/dashboard/leads"
            className="mb-2 flex items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-2 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          >
            <span className="text-xs font-semibold">
              {a.leadsAwaitingReply} {a.leadsAwaitingReply === 1 ? 'lead is' : 'leads are'} waiting on a reply
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium">
              Reply now <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        )}

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { n: a.bookings, label: 'bookings logged' },
            { n: a.futureConfirmed, label: 'future dates locked' },
            { n: a.baaqiTracked, label: 'baaqi tracked' },
          ].map((s) => (
            <div key={s.label} className="rounded-md bg-muted/40 py-2">
              <div className="text-lg font-bold tabular-nums">{s.n}</div>
              <div className="text-[10px] leading-tight text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {extra.length > 0 && (
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] sm:grid-cols-4">
            {extra.map((s) => (
              <div key={s.label} className="flex items-baseline justify-between gap-1 sm:flex-col sm:items-start sm:gap-0">
                <dt className="leading-tight text-muted-foreground">{s.label}</dt>
                <dd className="font-semibold tabular-nums">{s.n}</dd>
              </div>
            ))}
          </dl>
        )}

        {!a.shieldOn && (
          <Link
            href="/dashboard/migrate"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:underline"
          >
            Switch on the shield <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

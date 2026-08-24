import {
  Banknote, Users, CalendarCheck, UtensilsCrossed, ShieldCheck, Clock,
} from "lucide-react";
import { buildVenueAnswers, type AnswerIcon } from "@/lib/seo/venue-answers";

/**
 * WW-TEST-CASES 2.23 — the six answers, rendered.
 *
 * The logic lives in `lib/seo/venue-answers.ts` and is plain TypeScript on
 * purpose: `scripts/venue-answers-check.mts` drives it under plain node, which
 * cannot strip JSX. So this file is the drawing and nothing else — which also
 * means every decision about what a venue may and may not claim is testable
 * without rendering anything.
 */

const ICONS: Record<AnswerIcon, any> = {
  price: Banknote,
  capacity: Users,
  date: CalendarCheck,
  food: UtensilsCrossed,
  deposit: ShieldCheck,
  closing: Clock,
};

/**
 * Renders nothing at all when a venue can answer none of the six — an empty
 * bordered box would be worse than the space it saves.
 */
export function VenueAnswers({ raw }: { raw: any }) {
  const answers = buildVenueAnswers(raw);
  if (answers.length === 0) return null;

  return (
    <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
      {answers.map((a) => {
        const Icon = ICONS[a.iconKey];
        return (
          <div key={a.key} className="flex items-start gap-2.5">
            <Icon className="mt-[3px] h-4 w-4 shrink-0 text-bridal-gold" aria-hidden />
            <div className="min-w-0">
              <dt className="font-bridal text-[10px] uppercase tracking-[0.16em] text-bridal-text-soft">
                {a.label}
              </dt>
              <dd className="font-bridal text-[14px] leading-snug text-bridal-charcoal">
                {a.value}
                {a.note ? (
                  <span className="block text-[12px] leading-snug text-bridal-text-soft">{a.note}</span>
                ) : null}
              </dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}

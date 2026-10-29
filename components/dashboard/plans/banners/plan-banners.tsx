"use client"

/**
 * The plan banner and the quiet chip, for every console screen.
 *
 *   <PlanBanners />  one slim banner at the top of the content (sticky), chosen by lib/plans/banners.ts bannerFor().
 *   <PlanChip />     the small always-there chip ("Free trial - 18 days left"), in the sidebar footer.
 *
 * Both only DRAW what the access store says. Dismissals ("hide for today") live in localStorage, per banner kind, and are
 * read in an effect so the server render and the first client render agree.
 */

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AlertTriangle, CheckCircle2, Clock, Lock, Sparkles, X } from "lucide-react"
import { useAccess } from "@/hooks/use-access"
import { usePlan } from "@/context/plan-context"
import type { LimitKey } from "@/lib/plan-gate"
import { bannerFor, chipFor, type BannerSpec } from "@/lib/plans/banners"
import { firstFilled, say } from "@/lib/plans/copy"
import { useResolvedThemeMode } from "@/lib/store/theme-prefs"
import { PLAN_UI_CSS, WALL_TOKENS_CSS } from "../plan-ui-css"
import { useOne, useBi } from "../bilingual"

const ICON = { free_tier: Lock, unstarted: Sparkles, trial_welcome: Sparkles, trial_t7: Clock, trial_t3: Clock, trial_t1: AlertTriangle, trial_today: AlertTriangle, past_due: AlertTriangle, cancelling: Clock, comp_end: Clock, locked_here: Lock, reactivated: CheckCircle2, over_limit: AlertTriangle } as const

function store(): Storage | null { try { return window.localStorage } catch { return null } }
/** Pakistan calendar date, YYYY-MM-DD: "hide for today" ends at midnight Pakistan time. */
const pkToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date())

function useDismissals(spec: BannerSpec | null, trialKey: string | null) {
  const [hidden, setHidden] = React.useState(true) // hidden until we have read storage: no flash, no mismatch
  const key = spec ? `ww:plans:dismiss:${spec.kind}${spec.kind === "trial_welcome" ? `:${trialKey ?? ""}` : ""}` : null
  React.useEffect(() => {
    if (!spec || !key) { setHidden(true); return }
    const v = store()?.getItem(key)
    setHidden(spec.dismiss === "once" ? v === "1" : spec.dismiss === "day" ? v === pkToday() : false)
  }, [spec, key])
  const dismiss = React.useCallback(() => {
    if (!spec || !key) return
    store()?.setItem(key, spec.dismiss === "once" ? "1" : pkToday())
    setHidden(true)
  }, [spec, key])
  return { hidden, dismiss }
}

export function PlanBanners() {
  const { access, locked } = useAccess()
  const pathname = usePathname() || ""
  const one = useOne()
  const bi = useBi()
  const mode = useResolvedThemeMode()
  const plan = usePlan()
  // Over a plan limit (the server's numbers, from the one plan provider): the vendor is told, once a day, what to do.
  const overLimit = (["businesses", "staff", "halls", "spaces", "images", "slots", "packages"] as LimitKey[]).some((k) => { const l = plan.limit(k); return !!l && l.enforced && l.max !== null && l.used !== null && l.used > l.max })

  // "Welcome back" once after a lock ends: remember that the Wall was shown.
  const [wasLocked, setWasLocked] = React.useState(false)
  React.useEffect(() => {
    if (locked) { store()?.setItem("ww:plans:wasLocked", "1"); return }
    if (access && store()?.getItem("ww:plans:wasLocked") === "1") setWasLocked(true)
  }, [locked, access])

  const [welcomeSeen, setWelcomeSeen] = React.useState(true)
  const trialKey = access?.trialEndsAt ?? null
  React.useEffect(() => { setWelcomeSeen(store()?.getItem(`ww:plans:dismiss:trial_welcome:${trialKey ?? ""}`) === "1") }, [trialKey])

  const onPaymentPage = pathname.startsWith("/dashboard/billing")
  const spec = React.useMemo(() => bannerFor(access, new Date(), { welcomeSeen, onPaymentPage, wasLocked, overLimit }), [access, welcomeSeen, onPaymentPage, wasLocked, overLimit])
  const { hidden, dismiss } = useDismissals(spec, trialKey)

  if (!spec || hidden) return null
  const Icon = ICON[spec.kind]
  const tx = (lang: "en" | "ru") => firstFilled(spec.keys, lang, spec.vars(lang))
  const ctaKey = spec.cta === "add_business" ? "banner.cta.add" : spec.cta === "over" ? "banner.cta.over" : spec.cta === "pay" ? "banner.cta.pay" : spec.cta === "resume" ? "banner.cta.resume" : spec.cta === "renew" ? "banner.cta.renew" : "banner.cta.choose"
  const href = spec.cta === "pay" || spec.cta === "resume" || spec.cta === "renew"
    ? `/dashboard/billing?renew=1${access?.plan ? `&plan=${encodeURIComponent(access.plan)}` : ""}`
    : spec.cta === "over" ? "/dashboard/billing#over" : spec.cta === "add_business" ? "/dashboard/business/new" : "/dashboard/billing"
  const dismissLabel = say(spec.dismiss === "once" ? "banner.dismiss_welcome" : "banner.dismiss", one.lang)

  return (
    <div className="wwp-banners wwp-scope" data-theme={mode} data-testid="plan-banners">
      <style dangerouslySetInnerHTML={{ __html: WALL_TOKENS_CSS + PLAN_UI_CSS }} />
      <div className={`wwp-banner ${spec.tone}`} role={spec.tone === "bad" ? "alert" : "status"} data-kind={spec.kind}>
        <Icon aria-hidden />
        <div className="tx">
          {bi.show("en") && <div className="en">{tx("en")}</div>}
          {bi.show("ru") && <div className={bi.pref === "ru" ? "en" : "ru"}>{tx("ru")}</div>}
        </div>
        <div className="acts">
          {spec.cta && !onPaymentPage && (
            <Link className="wwp-btn primary sm" href={href}>{say(ctaKey, one.lang)}</Link>
          )}
          {spec.dismiss && (
            <button type="button" className="x" onClick={dismiss} aria-label={dismissLabel} title={dismissLabel}><X aria-hidden /></button>
          )}
        </div>
      </div>
    </div>
  )
}

/** The quiet chip: links to the billing page, shows nothing when there is nothing worth saying. */
export function PlanChip({ className }: { className?: string }) {
  const { access } = useAccess()
  const one = useOne()
  const mode = useResolvedThemeMode()
  const chip = React.useMemo(() => chipFor(access), [access])
  if (!chip) return null
  const label = say(chip.key, one.lang, chip.vars)
  return (
    <span className="wwp-scope" data-theme={mode} style={{ background: "transparent", display: "inline-block", maxWidth: "100%" }}>
      <style dangerouslySetInnerHTML={{ __html: WALL_TOKENS_CSS + PLAN_UI_CSS }} />
      <Link href="/dashboard/billing" className={`wwp-chip ${chip.tone === "ok" ? "" : chip.tone} ${className ?? ""}`} title={say("chip.title", one.lang)} data-testid="plan-chip">
        <i aria-hidden /><span>{label}</span>
      </Link>
    </span>
  )
}

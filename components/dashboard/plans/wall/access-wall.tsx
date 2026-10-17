"use client"

/**
 * THE WALL: the one full-page screen a vendor (or their staff) sees instead of the console when the server says the plan
 * is over. It replaces the old "Choose a plan" wall.
 *
 * What it must get right (PLANS-SPEC R2 / PLANS-RESEARCH B2, B4):
 *   - calm and specific: what happened, the exact dates, ONE primary action;
 *   - always says the data is safe, nothing is deleted, and until when it is kept;
 *   - "locked, not blind": the Obligations strip (counts, dates, one total), the money/tax CSV, missed-enquiry count;
 *   - links that always work: plan & billing, receipts, account, log out, and a human to talk to;
 *   - staff see no pay button and the owner's masked phone; a suspended account has no renew button.
 *
 * It draws what wallModel() (lib/plans/wall-model.ts) returns and decides nothing itself.
 */

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CreditCard, FileText, Loader2, Lock, LogOut, Mail, MessageCircle, Phone, ShieldCheck, UserRound } from "lucide-react"
import { useUser } from "@/context/UserContext"
import { useResolvedThemeMode } from "@/lib/store/theme-prefs"
import { useAccessStore } from "@/lib/plans/access-store"
import { internalPath, type Access } from "@/lib/plans/access"
import { wallModel, wallVars } from "@/lib/plans/wall-model"
import { fill, firstFilled, say, type CopyKey, type Lang } from "@/lib/plans/copy"
import { SubscriptionAPI } from "@/lib/api/subscription"
import { clearStaffToken } from "@/lib/api/staffPortal"
import { getObligations, isNotThere } from "@/lib/api/billing"
import { BILLING_STATUS_KEY } from "@/hooks/use-billing-status"
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL, SUPPORT_PHONE_WHATSAPP } from "@/lib/seo/constants"
import { PLAN_UI_CSS, WALL_TOKENS_CSS } from "../plan-ui-css"
import { useLangPref, type LangPref } from "../bilingual"
import { ObligationsStrip, OBLIGATIONS_KEY } from "./obligations-strip"

const LANGS: { k: LangPref; label: CopyKey }[] = [
  { k: "both", label: "wall.lang.both" },
  { k: "en", label: "wall.lang.en" },
  { k: "ru", label: "wall.lang.ru" },
]

export function AccessWall({ access }: { access: Access }) {
  const router = useRouter()
  const pathname = usePathname() || ""
  // The staff app and the floor app have their own sign-out (a separate staff token) and no account page that works while locked.
  const inStaffApp = pathname.startsWith("/staff") || pathname.startsWith("/floor")
  const accountHref = "/dashboard/profile"
  const qc = useQueryClient()
  const { logout } = useUser()
  const signOut = () => { if (pathname.startsWith("/staff")) { clearStaffToken(); window.location.href = "/staff/login" } else { void logout() } }
  const mode = useResolvedThemeMode()
  const [pref, setPref] = useLangPref()
  const model = React.useMemo(() => wallModel(access), [access])
  const vars = React.useMemo(() => wallVars(access), [access])
  const show = (l: Lang) => pref === "both" || pref === l
  const one: Lang = pref === "ru" ? "ru" : "en"
  const [busy, setBusy] = React.useState(false)

  // The missed-enquiries count shares the strip's query (one request).
  const obl = useQuery({ queryKey: OBLIGATIONS_KEY, queryFn: getObligations, enabled: model.owner, retry: (n, e) => !isNotThere(e) && n < 1, staleTime: 60_000 })
  const missed = obl.data?.enquiriesWhileLocked ?? null

  // The price of the plan being renewed, for the hint under the button (not needed to renew).
  const plans = useQuery({ queryKey: ["plan-wall-me"], queryFn: () => SubscriptionAPI.getMyPlan(), enabled: !access.staff && model.cta !== "none", staleTime: 5 * 60_000, retry: 0 })
  const price = access.plan ? plans.data?.plans.find((p) => p.tier === access.plan)?.pricePkrMonthly ?? null : null

  // The Wall replaces the whole shell, which is what normally hides the document's own scrollbar: hide it here too.
  React.useEffect(() => {
    const html = document.documentElement
    const prevOverflow = html.style.overflow
    const prevGutter = html.style.scrollbarGutter
    html.style.overflow = "hidden"
    html.style.scrollbarGutter = "auto"
    return () => { html.style.overflow = prevOverflow; html.style.scrollbarGutter = prevGutter }
  }, [])

  // The server's renew link is absolute; the router wants the path (and only ever one of our own console pages).
  const renewHref = internalPath(access.renewUrl) ?? "/dashboard/billing"

  const onPrimary = async () => {
    if (model.cta === "choose" || !access.plan) { router.push(renewHref); return }
    setBusy(true)
    try {
      const d = await SubscriptionAPI.startCheckout(access.plan)
      window.location.assign(d.checkoutUrl)
    } catch (e) {
      const code = (e as { response?: { data?: { data?: { code?: string } } } })?.response?.data?.data?.code
      if (code === "PAYMENTS_NOT_CONFIGURED") toast.error(say("wall.cta.manual", one) + ".")
      else if (code === "ACTIVE_SUBSCRIPTION") qc.invalidateQueries({ queryKey: BILLING_STATUS_KEY })
      else toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || say("wall.error", one))
      setBusy(false)
      if (code === "PAYMENTS_NOT_CONFIGURED") router.push("/dashboard/billing?pay=manual")
    }
  }

  const bodyEn = firstFilled(model.body, "en", vars)
  const bodyRu = firstFilled(model.body, "ru", vars)
  const safeKeys: CopyKey[] = ["wall.safe", "wall.safe_nodate"]
  const ctaKey: CopyKey = model.cta === "renew" ? "wall.cta.renew" : "wall.cta.choose"
  const primaryLabel = (l: Lang) => say(ctaKey, l, vars)

  return (
    <div className="wwp" data-theme={mode} data-testid="access-wall" data-variant={model.variant} role="main">
      <style dangerouslySetInnerHTML={{ __html: WALL_TOKENS_CSS + PLAN_UI_CSS + "@keyframes wwpspin{to{transform:rotate(360deg)}}" }} />
      <header className="wwp-bar">
        <div className="wwp-brand"><span className="wwp-logo" aria-hidden>W</span><span className="nm">WeddingWala</span></div>
        <nav className="wwp-links" aria-label="Always available">
          {!access.staff && (
            <>
              <Link className="wwp-link" href="/dashboard/billing"><CreditCard aria-hidden /><span className="t">{say("wall.link.billing", one)}</span></Link>
              <Link className="wwp-link" href="/dashboard/billing#history"><FileText aria-hidden /><span className="t">{say("wall.link.receipts", one)}</span></Link>
            </>
          )}
          {!inStaffApp && <Link className="wwp-link" href={accountHref}><UserRound aria-hidden /><span className="t">{say("wall.link.account", one)}</span></Link>}
          <button type="button" className="wwp-link" onClick={signOut} data-testid="wall-logout"><LogOut aria-hidden /><span className="t">{say("wall.link.logout", one)}</span></button>
        </nav>
      </header>

      <div className={"wwp-main" + (model.owner ? "" : " solo")}>
        <section className="wwp-card wwp-hero" aria-labelledby="wwp-title">
          <div className="wwp-top">
            <span className={"wwp-eyebrow" + (model.variant === "suspended" ? " bad" : "")}><Lock aria-hidden />{say(model.eyebrow, one)}</span>
            <div className="wwp-lang" role="group" aria-label="Language">
              {LANGS.map((l) => (
                <button key={l.k} type="button" aria-pressed={pref === l.k} onClick={() => setPref(l.k)}>{l.k === "both" ? "EN + RU" : l.k === "en" ? "EN" : "RU"}</button>
              ))}
            </div>
          </div>

          <h1 className="wwp-title" id="wwp-title">{show("en") ? say(model.title, "en", vars) : say(model.title, "ru", vars)}</h1>
          {pref === "both" && <div className="wwp-title-ru" lang="und">{say(model.title, "ru", vars)}</div>}

          <div className="wwp-body">
            {show("en") && <p className="en">{bodyEn}</p>}
            {show("ru") && <p className="ru">{bodyRu}</p>}
          </div>

          {model.safe && (
            <div className="wwp-safe" data-testid="wall-safe">
              <ShieldCheck aria-hidden />
              <div>
                {show("en") && <div className="en">{firstFilled(safeKeys, "en", vars)}</div>}
                {show("ru") && <div className="ru">{firstFilled(safeKeys, "ru", vars)}</div>}
              </div>
            </div>
          )}

          {access.staff && (
            <div className="wwp-owner" data-testid="wall-owner">
              <Phone aria-hidden />
              <div>
                {access.ownerMasked ? <b>{say("wall.staff.owner", one, { owner: access.ownerMasked })}</b> : null}
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: access.ownerMasked ? 2 : 0 }}>{say("wall.staff.recheck_hint", one)}</div>
              </div>
            </div>
          )}

          {model.cta !== "none" && (
            <>
              <div className="wwp-act">
                <button type="button" className="wwp-btn primary lg" onClick={onPrimary} disabled={busy} data-testid="wall-primary">
                  {busy ? <Loader2 style={{ animation: "wwpspin 1s linear infinite" }} aria-hidden /> : <CreditCard aria-hidden />}
                  {busy ? say("wall.cta.opening", one) : primaryLabel(one)}
                </button>
                {model.cta === "renew" && (
                  <Link className="wwp-textlink" href={renewHref} data-testid="wall-other-plan">{say("wall.cta.other", one)}</Link>
                )}
              </div>
              {price !== null && model.cta === "renew" && (
                <div className="wwp-hint">
                  {show("en") && <div>{fill("wall.cta.hint", "en", { amount: price.toLocaleString("en-PK") })}</div>}
                  {show("ru") && <div style={{ marginTop: show("en") ? 2 : 0 }}>{fill("wall.cta.hint", "ru", { amount: price.toLocaleString("en-PK") })}</div>}
                </div>
              )}
              {model.trial && (
                <div className="wwp-act-sub">
                  <Link className="wwp-textlink" href="/dashboard/billing#plans" data-testid="wall-trial">{say("wall.cta.trial", one)}</Link>
                  {pref === "both" && <span className="wwp-hint" style={{ marginTop: 0 }}>{say("wall.cta.trial", "ru")}</span>}
                </div>
              )}
              {model.manual && (
                <div className="wwp-act-sub">
                  <Link className="wwp-textlink" href="/dashboard/billing?pay=manual" data-testid="wall-manual">{say("wall.cta.manual", one)}</Link>
                  {pref === "both" && <span className="wwp-hint" style={{ marginTop: 0 }}>{say("wall.cta.manual", "ru")}</span>}
                </div>
              )}
            </>
          )}

          {model.supportFirst && (
            <div className="wwp-act">
              <a className="wwp-btn primary lg" href={SUPPORT_PHONE_WHATSAPP} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden />{say("wall.cta.contact", one)}</a>
            </div>
          )}

          {access.staff && (
            <div className="wwp-act">
              <button type="button" className="wwp-btn ghost" data-testid="wall-recheck" onClick={() => useAccessStore.getState().releaseLock()}>{say("wall.staff.recheck", one)}</button>
            </div>
          )}

          {model.missed && missed !== null && missed > 0 && (
            <div className="wwp-missed" data-testid="wall-missed">
              {show("en") && <div className="en">{missed === 1 ? say("wall.missed.one", "en") : say("wall.missed.n", "en", { n: missed })}</div>}
              {show("ru") && <div className="ru">{missed === 1 ? say("wall.missed.one", "ru") : say("wall.missed.n", "ru", { n: missed })}</div>}
            </div>
          )}
        </section>

        {model.owner && <ObligationsStrip onHold={model.onHold} />}

        <section className="wwp-card wwp-help" aria-label={say("wall.help", one)}>
          <span><b>{say("wall.help", one)}</b>{pref === "both" ? ` ${say("wall.help", "ru")}` : ""}</span>
          <span className="sp" />
          <a href={SUPPORT_PHONE_WHATSAPP} target="_blank" rel="noopener noreferrer"><MessageCircle style={{ width: 14, height: 14, display: "inline", verticalAlign: "-2px", marginRight: 5 }} aria-hidden />WhatsApp</a>
          <a href={SUPPORT_PHONE_TEL}><Phone style={{ width: 14, height: 14, display: "inline", verticalAlign: "-2px", marginRight: 5 }} aria-hidden />{SUPPORT_PHONE_DISPLAY}</a>
          <a href={`mailto:${SUPPORT_EMAIL}`}><Mail style={{ width: 14, height: 14, display: "inline", verticalAlign: "-2px", marginRight: 5 }} aria-hidden />{SUPPORT_EMAIL}</a>
        </section>
      </div>
    </div>
  )
}


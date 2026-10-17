"use client"

/**
 * Bilingual text for the plan screens: English and Roman Urdu together by default, because a vendor reads whichever is
 * easier and the Wall must be understood at a glance. The choice (both / English only / Roman Urdu only) is remembered
 * per browser and shared by the Wall and the banners.
 *
 * The server render always shows "both", and the saved choice is read in an effect, so the markup never differs between
 * server and client (see the hydration note in the repo memory: never seed state from localStorage in useState).
 */

import * as React from "react"
import { fill, say, type CopyKey, type CopyVars, type Lang } from "@/lib/plans/copy"

export type LangPref = "both" | "en" | "ru"
const KEY = "ww:plans-lang"
const listeners = new Set<() => void>()
let current: LangPref = "both"

function readSaved(): LangPref {
  try {
    const v = window.localStorage.getItem(KEY)
    return v === "en" || v === "ru" || v === "both" ? v : "both"
  } catch { return "both" }
}

export function useLangPref(): [LangPref, (p: LangPref) => void] {
  const [pref, setPref] = React.useState<LangPref>("both")
  React.useEffect(() => {
    current = readSaved()
    setPref(current)
    const l = () => setPref(current)
    listeners.add(l)
    return () => { listeners.delete(l) }
  }, [])
  const set = React.useCallback((p: LangPref) => {
    current = p
    try { window.localStorage.setItem(KEY, p) } catch { /* storage blocked: the choice lasts until reload */ }
    listeners.forEach((l) => l())
  }, [])
  return [pref, set]
}

/** The two renderings of one sentence, honouring the language choice. */
export function useBi() {
  const [pref] = useLangPref()
  return {
    pref,
    show: (lang: Lang) => pref === "both" || pref === lang,
  }
}

/** A sentence in both languages, as two stacked lines. `keys` is a ladder: the first whose placeholders are filled wins. */
export function Bi({ keys, vars, enClass = "en", ruClass = "ru", as: Tag = "div" }: {
  keys: CopyKey | CopyKey[]
  vars?: CopyVars
  enClass?: string
  ruClass?: string
  as?: React.ElementType
}) {
  const { show } = useBi()
  const ladder = Array.isArray(keys) ? keys : [keys]
  const pick = (lang: Lang): string => {
    for (const k of ladder) { const t = fill(k, lang, vars); if (t !== null) return t }
    return say(ladder[ladder.length - 1], lang, vars)
  }
  return (
    <>
      {show("en") && <Tag className={enClass}>{pick("en")}</Tag>}
      {show("ru") && <Tag className={ruClass}>{pick("ru")}</Tag>}
    </>
  )
}

/** One language only (used where the line is a button label: the label follows the choice, English when "both"). */
export function useOne() {
  const [pref] = useLangPref()
  const lang: Lang = pref === "ru" ? "ru" : "en"
  return {
    lang,
    t: (key: CopyKey, vars?: CopyVars) => say(key, lang, vars),
    // For a hover title or a second line of a two-line label.
    other: (key: CopyKey, vars?: CopyVars) => say(key, lang === "en" ? "ru" : "en", vars),
    both: pref === "both",
  }
}

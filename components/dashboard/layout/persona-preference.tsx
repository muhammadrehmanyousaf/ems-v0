"use client"

/**
 * Phase-1 nav — the persona switch (Aasaan ⇄ Professional).
 *
 * Lets a vendor change the label vocabulary the onboarding "familiarity"
 * question set. Always rendered, so it
 * doesn't appear until the redesigned navigation is active. Writes to the same
 * persisted store the sidebar / bottom-tabs read (useNavPersona).
 */

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useNavPersona, type NavPersona } from "@/lib/nav/nav-persona"


/**
 * The subtitles used to read "sirf zaroori cheezein" and "full features",
 * promising a smaller and a larger FEATURE SET. No such difference exists:
 * `navLabel()` "never renames a route, only the words shown", and the store's
 * `full` flag is written by onboarding and read by nothing — every consumer
 * (app-sidebar, mobile-bottom-nav, money-hub-view) destructures `persona`
 * alone.
 *
 * That copy is why this control gets reported as broken. A vendor flips it
 * expecting the product to change, sees the same screen, and files a bug —
 * externally reported as "upon changing from Asaan to professional and
 * professional to asaan nothing is changes", tested from this very page, where
 * nothing is persona-driven and nothing was ever going to change.
 *
 * So the copy now says what the control does: it renames the menu. Either fix
 * the words or build the feature — leaving a switch that advertises something
 * it does not do costs a bug report every time someone new looks at it.
 */
const OPTIONS: { value: NavPersona; title: string; sub: string }[] = [
  { value: "aasaan", title: "Aasaan · آسان", sub: "Menu ke naam Roman-Urdu mein" },
  { value: "professional", title: "Professional", sub: "Menu ke naam industry English mein" },
]

export function PersonaPreference() {
  const { persona, setPersona } = useNavPersona()

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-foreground">Naam kaise dikhayein? · Label style</h3>
          <p className="text-xs text-muted-foreground">
            Sirf left menu aur neeche ke tabs ke naam badalte hain — features wahi rehte hain.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Label style">
          {OPTIONS.map((o) => {
            const active = persona === o.value
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPersona(o.value)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                    : "border-sidebar-border hover:bg-accent"
                }`}
              >
                <div className={`text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}>
                  {o.title}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{o.sub}</div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

/**
 * 7.13 / A22 — where an indicative rate comes from.
 *
 * ── Why a person, and not a feed ──────────────────────────────────────────
 *
 * Deliberately a human act. A wedding is the largest purchase most of these
 * families make, and a number pulled from an FX API that silently starts
 * returning nonsense is worse than no number at all. Someone sets it, their
 * user id is recorded against it, and it EXPIRES ON ITS OWN after seven days.
 *
 * That expiry is what makes this safe to leave running: the failure mode of
 * forgetting is "customers see rupees", never "customers see a wrong number".
 * This screen's most important job is therefore not the input — it is the
 * `showingToCustomers` column, which is how anyone finds out a rate has aged
 * out and quietly stopped being shown.
 *
 * ── Why it exists at all ──────────────────────────────────────────────────
 *
 * The routes existed and nothing could reach them. A rule with no way to supply
 * its input is dead code with extra steps — the same failure this whole area
 * already had once, when `fxDisplay` was written, correct, unit-tested and
 * called by nothing.
 */

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Check, Loader2 } from "lucide-react"
import { fxApi, type FxRateRow } from "@/lib/api/fx"
import { Button } from "@/components/ui/button"

const today = () => new Date().toISOString().slice(0, 10)

function readErr(e: unknown, fallback: string): string {
  const r = e as { response?: { data?: { message?: string } }; message?: string }
  return r?.response?.data?.message || r?.message || fallback
}

export function FxRatesForm() {
  const [rows, setRows] = useState<FxRateRow[]>([])
  const [maxAge, setMaxAge] = useState(7)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fxApi.list()
      setRows(r.rates || [])
      setMaxAge(r.maxRateAgeDays ?? 7)
    } catch (e) {
      setError(readErr(e, "Couldn't load the current rates."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const save = async (currency: string) => {
    const raw = drafts[currency]
    const value = Number(raw)
    if (!Number.isFinite(value) || value <= 0) {
      setError(`${currency}: a rate must be a positive number of rupees per unit.`)
      return
    }
    setSaving(currency)
    setError(null)
    try {
      await fxApi.set(currency, value, today())
      setDrafts((d) => ({ ...d, [currency]: "" }))
      setSaved(currency)
      await reload()
      // Long enough to read, short enough not to linger as a stale claim.
      setTimeout(() => setSaved(null), 4000)
    } catch (e) {
      setError(readErr(e, `Couldn't set the ${currency} rate.`))
    } finally {
      setSaving(null)
    }
  }

  /** Set, but aged out — the state worth surfacing loudest. */
  const stale = rows.filter((r) => r.pkrPerUnit != null && !r.showingToCustomers)

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading rates…
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground space-y-1.5">
        <p>
          A rate is shown to customers as an <strong>approximate</strong> figure beside the rupee
          price, never instead of it. The venue is paid in rupees.
        </p>
        <p>
          Rates stop being shown <strong>{maxAge} days</strong> after the date they are for. Nothing
          needs to be switched off — an old rate simply stops appearing, and customers see rupees
          alone.
        </p>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </p>
      )}

      {stale.length > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {stale.map((r) => r.currency).join(", ")} {stale.length === 1 ? "has" : "have"} a rate on
            file that has aged out. Customers are seeing rupees only for{" "}
            {stale.length === 1 ? "it" : "them"} — set a fresh rate to bring{" "}
            {stale.length === 1 ? "it" : "them"} back.
          </span>
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Currency</th>
              <th className="py-2 pr-4 font-medium">Rupees per unit</th>
              <th className="py-2 pr-4 font-medium">Rate date</th>
              <th className="py-2 pr-4 font-medium">Customers see it</th>
              <th className="py-2 pr-4 font-medium">Set today&apos;s rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.currency} className="border-b border-border/60">
                <td className="py-2.5 pr-4 font-medium text-foreground">{r.currency}</td>
                <td className="py-2.5 pr-4 tabular-nums text-foreground">
                  {r.pkrPerUnit == null ? "—" : r.pkrPerUnit.toLocaleString("en-PK")}
                </td>
                <td className="py-2.5 pr-4 tabular-nums text-muted-foreground">{r.asOf || "—"}</td>
                <td className="py-2.5 pr-4">
                  {r.showingToCustomers ? (
                    <span className="inline-flex items-center gap-1 text-[#3F6B43]">
                      <Check className="w-3.5 h-3.5" /> Yes
                    </span>
                  ) : r.pkrPerUnit == null ? (
                    <span className="text-muted-foreground">Never set</span>
                  ) : (
                    // Set, and NOT being shown. The single most useful cell here.
                    <span className="text-amber-700">Aged out</span>
                  )}
                </td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      placeholder={r.pkrPerUnit != null ? String(r.pkrPerUnit) : "e.g. 355.20"}
                      value={drafts[r.currency] ?? ""}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [r.currency]: e.target.value }))
                      }
                      aria-label={`Rupees per ${r.currency}`}
                      className="w-32 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving === r.currency || !drafts[r.currency]}
                      onClick={() => void save(r.currency)}
                    >
                      {saving === r.currency ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : saved === r.currency ? (
                        "Set"
                      ) : (
                        "Set"
                      )}
                    </Button>
                    {saved === r.currency && (
                      <span className="text-xs text-[#3F6B43]">Saved</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Rates are dated today. Correcting a typo on the same day replaces the rate rather than
        leaving two on file. A rate cannot be dated in the future — that would make a stale one look
        fresh forever.
      </p>
    </div>
  )
}

export default FxRatesForm

"use client"

/**
 * Built-in reminders — redesigned section (Track C).
 *
 * Ported verbatim (same endpoints + same two-layer semantics) from the original
 * automation-status-view.tsx, re-skinned onto the redesign primitives and moved
 * onto react-query so it composes with the rest of the redesigned Automation
 * screen. The original file is left untouched.
 *
 * Two layers, unchanged from the original:
 *   - vendorEnabled  per-vendor opt-out (persisted to User.automationPrefs via
 *                    PATCH /api/v1/automation/prefs)
 *   - envDisabled    global ops kill-switch (env var, takes precedence) — surfaced
 *                    as a separate "Disabled by ops" pill so the vendor knows
 *                    their preference isn't the blocker.
 *
 * GET  /api/v1/automation/status   → { engine, rules }
 * PATCH /api/v1/automation/prefs   → { kind, enabled }
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axiosConfig"
import { toast } from "sonner"
import { showSuccessToast } from "@/lib/toast/undo"
import { Switch } from "@/components/ui/switch"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { Icon, Spinner, type IconName } from "@/components/dashboard/shared/icon"
import { cn } from "@/lib/utils"

interface Rule {
  kind: string
  label: string
  description: string
  enabled: boolean
  envFlag: string
  envDisabled: boolean
  vendorEnabled: boolean
  delegated: boolean
}

interface AutomationStatus {
  engine: { enabled: boolean; intervalMs: number }
  rules: Rule[]
}

// Same per-rule glyphs as the original, mapped onto the redesign <Icon> set.
const RULE_ICON: Record<string, IconName> = {
  t_minus_14: "Bell",
  t_minus_3: "Clock",
  t_minus_1: "Calendar",
  t_plus_1_review: "Sparkles",
  lead_48h_stale: "Inbox",
}

export const AUTOMATION_STATUS_KEY = ["automation-status-redesigned"] as const

async function fetchStatus(): Promise<AutomationStatus | null> {
  const res = await axiosInstance.get("/api/v1/automation/status")
  return res.data?.data ?? null
}

export function BuiltInRemindersSection() {
  const qc = useQueryClient()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: AUTOMATION_STATUS_KEY,
    queryFn: fetchStatus,
  })

  const toggleMut = useMutation({
    mutationFn: ({ kind, enabled }: { kind: string; enabled: boolean }) =>
      axiosInstance.patch("/api/v1/automation/prefs", { kind, enabled }),
    // Optimistic — avoids the full reload bounce (mirrors the original).
    onMutate: async ({ kind, enabled }) => {
      await qc.cancelQueries({ queryKey: AUTOMATION_STATUS_KEY })
      const prev = qc.getQueryData<AutomationStatus | null>(AUTOMATION_STATUS_KEY)
      qc.setQueryData<AutomationStatus | null>(AUTOMATION_STATUS_KEY, (d) =>
        d
          ? {
              ...d,
              rules: d.rules.map((r) =>
                r.kind === kind
                  ? { ...r, vendorEnabled: enabled, enabled: enabled && !r.envDisabled }
                  : r,
              ),
            }
          : d,
      )
      return { prev }
    },
    onSuccess: (_res, { enabled }) => {
      showSuccessToast(enabled ? "Reminder enabled" : "Reminder paused")
    },
    onError: (e: any, _vars, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(AUTOMATION_STATUS_KEY, ctx.prev)
      toast.error(e?.response?.data?.message || "Could not save preference")
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: AUTOMATION_STATUS_KEY })
    },
  })

  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Automation status unavailable.
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent"
        >
          <Icon name="RefreshCw" size={13} /> Retry
        </button>
      </div>
    )
  }

  const intervalMin = Math.round(data.engine.intervalMs / 60000)
  const busyKind = toggleMut.isPending ? toggleMut.variables?.kind : null

  return (
    <div className="space-y-4">
      {/* Engine status */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-card-foreground">Engine</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Runs every {intervalMin} minute{intervalMin === 1 ? "" : "s"}; sends are deduped by
            outbox + notification idempotency keys.
          </p>
        </div>
        <StatusPill tone={data.engine.enabled ? "success" : "error"} variant="icon">
          {data.engine.enabled ? "Running" : "Disabled"}
        </StatusPill>
      </div>

      {/* Built-in reminder toggles */}
      <div className="grid gap-3 md:grid-cols-2">
        {data.rules.map((r) => (
          <div key={r.kind} className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon name={RULE_ICON[r.kind] || "Bell"} size={15} />
                </span>
                <span className="truncate text-sm font-semibold text-card-foreground">{r.label}</span>
              </div>
              {busyKind === r.kind ? (
                <Spinner size={16} className="shrink-0 text-muted-foreground" />
              ) : (
                <Switch
                  checked={r.vendorEnabled}
                  onCheckedChange={(v) => toggleMut.mutate({ kind: r.kind, enabled: v })}
                  disabled={r.envDisabled || r.delegated}
                  aria-label={`Toggle ${r.label}`}
                />
              )}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{r.description}</p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <StatusPill tone={r.enabled ? "success" : "neutral"} variant="icon">
                {r.enabled ? "Active" : "Inactive"}
              </StatusPill>
              {r.envDisabled && <StatusPill tone="warning">Disabled by ops</StatusPill>}
              {r.delegated && <StatusPill tone="info">Delegated cron</StatusPill>}
            </div>
          </div>
        ))}
      </div>

      <p className={cn("text-[11px] italic text-muted-foreground")}>
        Toggles save instantly to your account. Reminders marked &ldquo;Disabled by ops&rdquo; are
        paused platform-wide via env var and can&apos;t be re-enabled here — please contact support.
      </p>
    </div>
  )
}

export default BuiltInRemindersSection

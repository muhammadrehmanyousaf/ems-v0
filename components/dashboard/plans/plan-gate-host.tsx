"use client"

/**
 * The global handler for plan refusals.
 *
 * Any request, from any screen, that the server refuses with 403 FEATURE_NOT_IN_PLAN or 403 LIMIT_REACHED ends up here
 * (lib/axiosConfig.js -> handlePlanRefusal -> onPlanGate) and becomes ONE friendly dialog: what is not in the plan, which
 * plan includes it, what the vendor has now, and a single way forward (See plans). No raw error toast, no per-screen
 * wording to drift.
 *
 * When it stays quiet
 *   - the screen shows the refusal itself and claimed it (claimGate), e.g. the Add a business page;
 *   - the request was a background read (a refused GET never interrupts: the screen is told through its entitlements
 *     instead, and the PlanProvider refetches them so it flips to its locked state);
 *   - the caller marked it silent (a fire-and-forget log).
 * While it is open it also drops any raw toast carrying the same sentence (every call site toasts the server's message),
 * so the vendor never sees the refusal twice.
 */

import * as React from "react"
import Link from "next/link"
import { toast as sonner } from "sonner"
import { Lock, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LIMIT_NOUNS, gateAdvice, gateHeadline, isPlanGateEcho, onPlanGate, type LimitKey, type PlanGate } from "@/lib/plan-gate"
import { BILLING_HREF } from "./plan-locked"

// sonner's toast.error is called from ~160 files. Wrap it ONCE so the sentence the dialog already shows is not toasted again.
let sonnerPatched = false
function patchSonnerOnce() {
  if (sonnerPatched) return
  sonnerPatched = true
  const original = sonner.error.bind(sonner)
  ;(sonner as unknown as { error: typeof sonner.error }).error = ((message: Parameters<typeof sonner.error>[0], data?: Parameters<typeof sonner.error>[1]) => {
    if (isPlanGateEcho(message)) return ""
    return original(message, data)
  }) as typeof sonner.error
}

export function PlanGateHost() {
  const [gate, setGate] = React.useState<PlanGate | null>(null)

  React.useEffect(() => {
    patchSonnerOnce()
    return onPlanGate((g, meta) => {
      if (meta.silent || !meta.prompt) return
      setGate(g)
    })
  }, [])

  const open = gate !== null
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setGate(null) }}>
      <DialogContent className="champagne-menu max-w-md" data-testid="plan-gate-dialog">
        {gate && (
          <>
            <DialogHeader>
              <div className="mb-1 grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary" aria-hidden="true"><Lock className="h-5 w-5" /></div>
              <DialogTitle>{gateHeadline(gate)}</DialogTitle>
              <DialogDescription>{gateAdvice(gate)}</DialogDescription>
            </DialogHeader>
            {gate.code === "LIMIT_REACHED" && gate.max != null && gate.used != null && (
              <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground" data-testid="plan-gate-usage">
                You have {gate.used} of {gate.max} {(gate.limit && LIMIT_NOUNS[gate.limit as LimitKey]?.[gate.max === 1 ? 0 : 1]) || gate.limitLabel || "allowed"}{gate.scope === "business" ? " in this business" : ""}.
              </p>
            )}
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="ghost" onClick={() => setGate(null)}>Not now</Button>
              <Button asChild onClick={() => setGate(null)}>
                <Link href={BILLING_HREF}><ArrowUpRight className="mr-1.5 h-4 w-4" /> See plans and upgrade</Link>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

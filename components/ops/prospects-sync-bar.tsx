"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Sparkles } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { Btn, Notice, useOpsToast } from "@/components/ops/ops-ui"
import { opsErrorMessage } from "@/lib/api/ops"
import { prospectsApi } from "@/lib/api/ops-prospects"

export function ProspectsSyncBanner() {
  const { can } = useOps()
  const qc = useQueryClient()
  const toast = useOpsToast()
  const [includeImported, setIncludeImported] = useState(false)

  const syncMut = useMutation({
    mutationFn: () => prospectsApi.syncDirectory({ includeImported, limit: 200 }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["ops", "prospects"] })
      qc.invalidateQueries({ queryKey: ["ops", "home-summary"] })
      toast({
        title: r.created ? `Added ${r.created} vendor${r.created === 1 ? "" : "s"} to call queue` : "Queue already up to date",
        body: r.skippedDup ? `${r.skippedDup} already in prospects by phone number.` : undefined,
      })
    },
    onError: (e) => toast({ title: "Could not sync directory", body: opsErrorMessage(e), tone: "bad" }),
  })

  if (!can(["ops_prospect_call", "ops_prospect_import", "ops_settings"])) return null

  return (
    <div style={{ marginBottom: 14 }}>
      <Notice tone="info">
        <div className="row between" style={{ width: "100%", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <b>Need vendors to call right now?</b> Pull active Wedding Wala businesses into this outreach queue without duplicating phone numbers.
          </div>
          <div className="row" style={{ gap: 10 }}>
            <label className="small muted row" style={{ gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={includeImported} onChange={(e) => setIncludeImported(e.target.checked)} />
              Include imported listings
            </label>
            <Btn size="sm" variant="primary" icon={<Sparkles aria-hidden />} loading={syncMut.isPending} onClick={() => syncMut.mutate()}>
              Pull marketplace vendors
            </Btn>
          </div>
        </div>
      </Notice>
    </div>
  )
}

"use client"

// 01-VR-ENHANCE-V1-FE — admin audit log viewer.

import { useEffect, useState } from "react"
import { Loader2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { listAuditLogs, type AuditLog } from "@/lib/api/adminQueue"

const TARGET_TYPES = ["", "user", "business", "bank", "document", "session", "twoFactor", "draft"] as const

export function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [targetType, setTargetType] = useState<string>("")
  const [action, setAction] = useState<string>("")

  const refresh = async () => {
    try {
      setLoading(true)
      const r = await listAuditLogs({
        targetType: targetType || undefined,
        action: action || undefined,
        limit: 100,
      })
      setLogs(r.logs)
      setCount(r.count)
    } catch (e: any) {
      toast({ title: "Failed to load logs", description: e?.response?.data?.message || "Try again." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [targetType, action])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs uppercase tracking-wider text-bridal-text-soft font-medium block mb-1">
            Target type
          </label>
          <Select
            value={targetType || "all"}
            onValueChange={(v) => setTargetType(v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              {TARGET_TYPES.map((t) => (
                <SelectItem key={t || "all"} value={t || "all"}>
                  {t || "All types"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs uppercase tracking-wider text-bridal-text-soft font-medium block mb-1">
            Action
          </label>
          <Input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="e.g. approved, rejected, verified"
          />
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <Filter className="w-3.5 h-3.5 mr-1.5" />
          Apply
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{count} log entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-bridal-text-soft py-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-bridal-text-soft py-6 text-center">No matching log entries.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-bridal-beige">
                    <th className="py-2 pr-3 font-medium">When</th>
                    <th className="py-2 pr-3 font-medium">Actor</th>
                    <th className="py-2 pr-3 font-medium">Action</th>
                    <th className="py-2 pr-3 font-medium">Target</th>
                    <th className="py-2 pl-3 font-medium">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-bridal-beige/50 align-top">
                      <td className="py-2 pr-3 whitespace-nowrap text-xs text-bridal-text-soft">
                        {new Date(l.at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3">
                        {l.actorUserId ? `user #${l.actorUserId}` : "system"}
                      </td>
                      <td className="py-2 pr-3 font-medium text-bridal-charcoal">{l.action}</td>
                      <td className="py-2 pr-3">
                        {l.targetType} #{l.targetId}
                      </td>
                      <td className="py-2 pl-3">
                        {(l.before || l.after) ? (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-bridal-mauve hover:text-bridal-gold">
                              View
                            </summary>
                            <pre className="mt-2 p-2 bg-bridal-cream/40 rounded text-[10px] overflow-x-auto max-w-md whitespace-pre-wrap">
{JSON.stringify({ before: l.before, after: l.after }, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-bridal-text-soft text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

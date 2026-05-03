"use client"

// 01-VR-ENHANCE-V1-FE — active session list with revoke + revoke-all.

import { useEffect, useState } from "react"
import { Laptop, Smartphone, LogOut, ShieldAlert, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import {
  listSessions, revokeSession, revokeAllSessions, type ActiveSession,
} from "@/lib/api/auth"
import { useUser } from "@/context/UserContext"

function relTime(iso: string): string {
  const d = new Date(iso)
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin} min ago`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH} h ago`
  const diffD = Math.round(diffH / 24)
  return `${diffD} d ago`
}

function deviceLabel(ua: string | null) {
  if (!ua) return "Unknown device"
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) return "Mobile device"
  if (/Mac|Windows|Linux/i.test(ua)) return "Desktop browser"
  return ua.slice(0, 40)
}

function deviceIcon(ua: string | null) {
  if (!ua) return <Laptop className="w-4 h-4" />
  return /Mobile|Android|iPhone|iPad/i.test(ua) ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />
}

export function SessionList() {
  const { logout } = useUser()
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const refresh = async () => {
    try {
      setLoading(true)
      const list = await listSessions()
      setSessions(list)
    } catch (e: any) {
      toast({ title: "Failed to load sessions", description: e?.response?.data?.message || "Try again." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const revokeOne = async (s: ActiveSession) => {
    setBusy(s.jti)
    try {
      await revokeSession(s.jti)
      toast({ title: "Session revoked" })
      if (s.current) {
        // Revoking our own session — log out cleanly.
        logout()
      } else {
        await refresh()
      }
    } catch (e: any) {
      toast({ title: "Could not revoke session", description: e?.response?.data?.message || "Try again." })
    } finally {
      setBusy(null)
    }
  }

  const revokeAll = async () => {
    setBusy("all")
    try {
      const r = await revokeAllSessions()
      toast({ title: "All sessions revoked", description: `${r.revoked} session(s) signed out.` })
      logout()
    } catch (e: any) {
      toast({ title: "Could not revoke all", description: e?.response?.data?.message || "Try again." })
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-bridal-text-soft text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading sessions…
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-bridal-text-soft">
          {sessions.length} active session{sessions.length === 1 ? "" : "s"}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={revokeAll}
          disabled={busy === "all" || sessions.length <= 1}
        >
          <ShieldAlert className="w-4 h-4 mr-1.5" />
          Sign out all devices
        </Button>
      </div>

      <ul className="space-y-2">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-bridal-beige bg-white p-3"
          >
            <div className="flex items-start gap-3 min-w-0">
              <span className="mt-0.5 text-bridal-charcoal">{deviceIcon(s.userAgent)}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-bridal-charcoal truncate">
                  {deviceLabel(s.userAgent)}
                  {s.current && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-bridal-gold">
                      this device
                    </span>
                  )}
                </p>
                <p className="text-xs text-bridal-text-soft truncate">
                  Last seen {relTime(s.lastSeenAt)}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => revokeOne(s)}
              disabled={busy === s.jti}
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Revoke
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

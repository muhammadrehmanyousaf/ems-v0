"use client"

// 01-VR-ENHANCE-V1-FE — One-time prompt offered at the top of the multi-step
// vendor registration form when the server has a saved draft for the current
// email. The user opts in to restore — never automatic.

import { useEffect, useState } from "react"
import { History, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { loadDraft, discardDraft, type DraftRecord } from "@/lib/api/businessDrafts"

interface DraftResumePromptProps {
  email: string
  /** Called when the user accepts — pass them the loaded draft for hydration. */
  onResume: (draft: DraftRecord) => void
}

export function DraftResumePrompt({ email, onResume }: DraftResumePromptProps) {
  const [draft, setDraft] = useState<DraftRecord | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!email || !email.includes("@")) return
    loadDraft(email).then((d) => {
      if (cancelled) return
      setDraft(d)
    }).catch(() => {/* silent */})
    return () => { cancelled = true }
  }, [email])

  if (!draft || dismissed) return null

  const updated = new Date(draft.updatedAt || draft.expiresAt).toLocaleString()

  return (
    <div className="rounded-xl border border-bridal-gold/40 bg-bridal-cream/60 px-4 py-3 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <History className="w-4 h-4 text-bridal-gold mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-bridal-charcoal">We saved your progress</p>
            <p className="text-bridal-text-soft text-xs mt-0.5">
              Resume from step {draft.currentStep + 1} • last saved {updated}.
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" onClick={() => { onResume(draft); setDismissed(true); }}>
            Resume
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              try { await discardDraft(email) } catch {/* ignore */}
              setDismissed(true)
            }}
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            Discard
          </Button>
        </div>
      </div>
    </div>
  )
}

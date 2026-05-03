"use client"

// 01-VR-ENHANCE-V1-FE — server-side draft sync for the multi-step business
// registration form.
//
// Strategy:
//  1. On mount, if an email is present in formData, call loadDraft(email).
//     If the server returns a draft and the local formData is "empty enough",
//     we hydrate via setFormData. We do NOT clobber a partially-typed form;
//     a "resume?" prompt is the caller's responsibility.
//  2. On every formData / currentStep / businessType change, debounced 2s,
//     call saveDraft. File / blob fields are stripped before serialisation
//     because the backend cap is 256 KB JSON.
//  3. Caller calls clearDraft() on successful submit.
//
// We intentionally avoid auto-restore — the user must opt in via the resume
// banner. This avoids surprise overwrites mid-edit.

import { useEffect, useRef, useState } from "react"
import { saveDraft, loadDraft, discardDraft, type DraftRecord } from "@/lib/api/businessDrafts"

const DEBOUNCE_MS = 2000

const STRIPPED_KEYS = new Set([
  "imageFiles",
  "packageImageFiles",
  "profileImageFile",
  "password",
  "re_enterPassword",
])

function sanitisePayload(formData: any) {
  if (!formData || typeof formData !== "object") return {}
  const out: any = {}
  for (const [k, v] of Object.entries(formData)) {
    if (STRIPPED_KEYS.has(k)) continue
    if (v instanceof File || v instanceof Blob) continue
    if (Array.isArray(v) && v.length > 0 && (v[0] instanceof File || v[0] instanceof Blob)) continue
    out[k] = v
  }
  return out
}

interface UseDraftSyncArgs {
  formData: any
  currentStep: number
  vendorType: string | null
  /** Set to false to disable saves entirely (e.g. after submit). */
  enabled?: boolean
}

interface UseDraftSyncResult {
  /** Last server save status, useful for a small "Saved 5s ago" indicator. */
  lastSavedAt: Date | null
  saving: boolean
  /** Returns the server's stored draft (or null) without hydrating it. */
  fetchDraft: (email: string) => Promise<DraftRecord | null>
  /** Discards the server draft after a successful submit. */
  clearDraft: (email: string) => Promise<void>
}

export function useDraftSync({
  formData,
  currentStep,
  vendorType,
  enabled = true,
}: UseDraftSyncArgs): UseDraftSyncResult {
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSig = useRef<string>("")

  useEffect(() => {
    if (!enabled) return
    const email = (formData?.email || "").trim().toLowerCase()
    if (!email || !email.includes("@")) return
    // Skip if nothing meaningful changed.
    const sig = JSON.stringify({ s: currentStep, v: vendorType, p: sanitisePayload(formData) })
    if (sig === lastSig.current) return
    lastSig.current = sig

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSaving(true)
      try {
        await saveDraft({
          ownerEmail: email,
          payload: sanitisePayload(formData),
          currentStep,
          vendorType: vendorType || null,
          merge: false,
        })
        setLastSavedAt(new Date())
      } catch (e: any) {
        // Non-fatal. The user's local state is unaffected.
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.warn("[useDraftSync] save failed:", e?.response?.data || e?.message)
        }
      } finally {
        setSaving(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, formData, currentStep, vendorType])

  return {
    lastSavedAt,
    saving,
    fetchDraft: (email: string) => loadDraft(email),
    clearDraft: async (email: string) => { await discardDraft(email) },
  }
}

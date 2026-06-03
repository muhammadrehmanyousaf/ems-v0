"use client";

// 02-VR-RESILIENCE-V1 — local-storage resume prompt.
//
// Pair this with DraftResumePrompt (server-side resume). They surface in
// different windows:
//
//   * DraftResumePrompt fires when a valid EMAIL is typed AND the server
//     has a saved draft for that email.
//   * LocalDraftResumePrompt fires immediately on page load when there's
//     a local draft on this device, regardless of email — so a vendor
//     who refreshes 30 seconds into typing their NAME still gets offered
//     "Resume from where you were?" without having to re-enter email first.
//
// Both prompts dismiss themselves once the user picks Resume or Discard
// so we never show two banners simultaneously.

import { useEffect, useState } from "react";
import { History, X } from "lucide-react";
import { BridalButton } from "@/components/bridal/bridal-button";
import { readLocalDraft, clearLocalDraft, type LocalDraft } from "@/lib/draftStorage/localDraftStore";
import { clearAllBlobs } from "@/lib/draftStorage/imageBlobStore";

interface LocalDraftResumePromptProps {
  /** Called when the user accepts — receives the loaded draft for hydration. */
  onResume: (draft: LocalDraft) => void;
  /**
   * True when the parent has already populated some form state (e.g. the
   * server-side resume just fired, or the vendor is mid-typing). When true
   * we stay hidden so we don't pop a second banner over the first.
   */
  suppress?: boolean;
}

function timeAgo(thenMs: number): string {
  const secs = Math.max(0, Math.floor((Date.now() - thenMs) / 1000));
  if (secs < 60) return "moments ago";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function LocalDraftResumePrompt({ onResume, suppress }: LocalDraftResumePromptProps) {
  const [draft, setDraft] = useState<LocalDraft | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Read once on mount. The store handles TTL + corrupt-record cases
    // internally, so anything we get back is safe to surface.
    const d = readLocalDraft();
    if (d) setDraft(d);
  }, []);

  if (!draft || dismissed || suppress) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-bridal-gold/40 bg-bridal-cream/70 px-4 py-3 mb-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <History className="w-4 h-4 text-bridal-gold mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-bridal-charcoal">We saved your progress on this device</p>
            <p className="text-bridal-text-soft text-xs mt-0.5">
              {draft.businessType ? <>{draft.businessType} · </> : null}
              Step {draft.currentStep + 1} · last edited {timeAgo(draft.updatedAt)}.
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <BridalButton
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              onResume(draft);
              setDismissed(true);
            }}
          >
            Resume
          </BridalButton>
          <BridalButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              clearLocalDraft();
              // Fire-and-forget — blobs are non-blocking cleanup.
              clearAllBlobs().catch(() => null);
              setDismissed(true);
            }}
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Start fresh
          </BridalButton>
        </div>
      </div>
    </div>
  );
}

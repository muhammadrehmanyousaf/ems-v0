"use client";

// 03-DRAFT-RESILIENCE — generic resume banner used by any form that wires
// up `useFormDraft`. Mirrors the visual language of the existing
// LocalDraftResumePrompt (which is specific to vendor registration) so the
// experience is consistent across the dashboard.

import { useState } from "react";
import { History, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DraftResumeBannerProps {
  /** Hide entirely when false (no draft, or already dismissed by parent). */
  visible: boolean;
  /** Free-form description line, e.g. "Last edited 5 min ago · 12 fields filled". */
  meta?: string;
  /** Headline; defaults to "We saved your unsaved changes". */
  title?: string;
  onResume: () => void;
  onDiscard: () => void;
  /**
   * Optional caveat — render a small lock-icon line under the meta. Used to
   * tell the user about fields that intentionally can't be restored
   * (passwords, payment tokens, etc.).
   */
  warning?: string;
}

export function DraftResumeBanner({
  visible,
  meta,
  title = "We saved your unsaved changes",
  onResume,
  onDiscard,
  warning,
}: DraftResumeBannerProps) {
  // Local "dismissed" flag so a single click hides the banner immediately
  // even if the parent's `visible` recomputes asynchronously.
  const [dismissed, setDismissed] = useState(false);
  if (!visible || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/40 px-4 py-3 mb-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <History className="w-4 h-4 text-amber-700 dark:text-amber-300 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">{title}</p>
            {meta && (
              <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>
            )}
            {warning && (
              <p className="text-[11px] mt-1.5 inline-flex items-center gap-1 text-muted-foreground">
                <Lock className="w-3 h-3" />
                {warning}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onResume();
              setDismissed(true);
            }}
          >
            Resume
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              onDiscard();
              setDismissed(true);
            }}
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper — turn a Date into a "5 min ago" string for the banner's `meta`
 * line. Pure; safe to call during render.
 */
export function relativeTimeAgo(then: Date | number): string {
  const ms = typeof then === "number" ? then : then.getTime();
  const secs = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (secs < 60) return "moments ago";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

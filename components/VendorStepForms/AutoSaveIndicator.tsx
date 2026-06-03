"use client";

// 02-VR-RESILIENCE-V1 — autosave status badge.
//
// Shown in the registration-form header so the vendor SEES that their work
// is being saved. The trust signal matters as much as the saving itself —
// without it, vendors retype things "just in case" and treat the form as
// hostile.
//
// States, in order of priority:
//   * "Saving…"               — a write is in flight (local or server).
//   * "You're offline"        — network is down; only local layer is alive.
//   * "Saved Xs ago"          — last successful write timestamp.
//   * "" (hidden)             — nothing's happened yet (fresh page).
//
// The component is purely presentational; the parent passes in the truth
// from useDraftSync + localDraftStore.

import { useEffect, useState } from "react";
import { Check, CloudOff, Loader2 } from "lucide-react";

interface AutoSaveIndicatorProps {
  /** Most recent save timestamp across local + server layers. */
  lastSavedAt: Date | null;
  /** A write is currently in flight (local or server). */
  saving: boolean;
}

function timeAgo(then: Date): string {
  const secs = Math.max(0, Math.floor((Date.now() - then.getTime()) / 1000));
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return then.toLocaleString();
}

export function AutoSaveIndicator({ lastSavedAt, saving }: AutoSaveIndicatorProps) {
  const [, force] = useState(0);
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  // Re-render every 15s so "Saved 2s ago" → "Saved 17s ago" stays honest
  // without burning a render per second.
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (saving) {
    return (
      <span className="inline-flex items-center gap-1.5 font-bridal text-[11px] tracking-wide text-bridal-text-soft">
        <Loader2 className="w-3 h-3 animate-spin text-bridal-gold" />
        Saving…
      </span>
    );
  }

  if (!online) {
    return (
      <span className="inline-flex items-center gap-1.5 font-bridal text-[11px] tracking-wide text-amber-700">
        <CloudOff className="w-3 h-3" />
        Offline — kept on this device
      </span>
    );
  }

  if (lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 font-bridal text-[11px] tracking-wide text-bridal-sage">
        <Check className="w-3 h-3" />
        Saved {timeAgo(lastSavedAt)}
      </span>
    );
  }

  return null;
}

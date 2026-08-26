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

  /* Start optimistic, and learn the truth in the effect below.

     This used to read `typeof navigator !== "undefined" ? navigator.onLine : true`,
     which looks like a correct SSR guard and is not one. Node has defined
     `navigator` as a GLOBAL since v21, so on the server `typeof navigator` is
     "object" — the guard passes — but Node's navigator has no `onLine`, so the
     expression evaluated to `undefined`. Falsy. The server therefore rendered
     the OFFLINE branch. Measured on production: the server HTML for
     /business-registration contains "Offline — kept on this device".

     Two separate things went wrong from that one line:

     1. Every vendor was told they had no network for the first paint of the
        page whose entire job is to promise their work is being saved. This
        component exists to stop vendors treating the form as hostile; it was
        doing the opposite.

     2. The browser hydrates with navigator.onLine === true, renders nothing,
        and React finds a <span> in the server HTML the client did not produce.
        It cannot reconcile that, so it throws away the whole root and
        re-renders client-side (React #418 then #423). A root re-render
        remounts the registration form and every useState goes back to its
        initial value — which is exactly how a vendor who had completed all 8
        steps landed back on a blank step 1 with their account already created.
        See the note at business-registration-form.tsx:140, which worked around
        the symptom; this is the cause.

     `true` is the only safe initial value because it is the one the server can
     also produce, and because a false "offline" is far more alarming than a
     briefly-missing badge. Someone genuinely offline at page load is corrected
     one tick later by the effect. */
  const [online, setOnline] = useState<boolean>(true);

  // Re-render every 15s so "Saved 2s ago" → "Saved 17s ago" stays honest
  // without burning a render per second.
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // `window` IS a real SSR guard — Node does not define it, unlike navigator.
    if (typeof window === "undefined") return;
    // Read the real value only now, after hydration has matched the server.
    // Someone who loaded the page with no connection sees the badge one tick
    // late; the alternative is telling everyone else they are offline.
    setOnline(window.navigator.onLine);
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

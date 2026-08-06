"use client";

/**
 * The night the Tonight tab is about.
 *
 * The gauge, the console (valet · lost-found · incident · complaint) and the
 * guest-list reconciliation all operate on ONE EventNight, and all three used to
 * ask for it as a bare "Event night #" — a database id created moments earlier
 * by the gauge and shown nowhere. There is no list endpoint to recover it from,
 * so in practice the console and the guest list were unreachable: the owner had
 * no number to type.
 *
 * The gauge already knows the id the instant it opens the night. This shares it
 * with its two siblings. Purely client-side — no API, no flag, no backend
 * change; the manual field stays for anyone who does know the number.
 */
import * as React from "react";

interface EventNightScope {
  nightId: number | null;
  setNightId: (id: number | null) => void;
  /** Label for the booking the night was opened against, for the panels' headers. */
  label: string | null;
  setLabel: (l: string | null) => void;
}

const Ctx = React.createContext<EventNightScope | null>(null);

export function EventNightProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [nightId, setNightId] = React.useState<number | null>(null);
  const [label, setLabel] = React.useState<string | null>(null);
  const value = React.useMemo(() => ({ nightId, setNightId, label, setLabel }), [nightId, label]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Safe outside the provider — these panels are also mounted standalone on other
 * screens, where they simply keep their manual field.
 */
export function useEventNightScope(): EventNightScope {
  const ctx = React.useContext(Ctx);
  const [nightId, setNightId] = React.useState<number | null>(null);
  const [label, setLabel] = React.useState<string | null>(null);
  const fallback = React.useMemo(() => ({ nightId, setNightId, label, setLabel }), [nightId, label]);
  return ctx ?? fallback;
}

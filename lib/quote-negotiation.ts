/**
 * FEAT_QUOTE_NEGOTIATION — customer↔vendor quote/haggle loop (pilot flag).
 *
 * Dark unless explicitly enabled for this deployment. Mirrors lib/outbox
 * isOutboxEnabled: env build flag OR a localStorage override (so a pilot can be
 * flipped on per-browser without a redeploy). The backend surface stays 404 until
 * FEAT_QUOTE_NEGOTIATION is on there too, so a stray true here just shows a hidden
 * button that no-ops — never a broken call path.
 */
export function isQuoteNegotiationEnabled(): boolean {
  if (typeof window === "undefined") {
    // On the server we can still honour the build-time env flag.
    return process.env.NEXT_PUBLIC_FEAT_QUOTE_NEGOTIATION === "true";
  }
  return (
    process.env.NEXT_PUBLIC_FEAT_QUOTE_NEGOTIATION === "true" ||
    window.localStorage?.getItem("FEAT_QUOTE_NEGOTIATION") === "true"
  );
}

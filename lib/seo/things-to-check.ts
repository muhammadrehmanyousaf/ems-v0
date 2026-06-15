/**
 * PURE DATA — "X things to check before you book" checklists per vendor type
 * (blueprint block B6). Concrete, scannable, snippet-shaped buyer-confidence
 * items — distinct from the "questions to ask" list (B7) in pricing-guide.ts.
 *
 * Honest + PK-specific. ZERO runtime deps, ZERO side effects. The getter
 * returns [] for any slug without a list, so the section simply doesn't
 * render until that type is authored (graceful, like event-notes).
 *
 * Slugs MUST match VENDOR_TYPES in ./constants.ts. Authored so far:
 *   wedding-photographers (flagship). Remaining types added at rollout.
 */

export const VENDOR_TYPE_CHECKLIST: Record<string, string[]> = {
  "wedding-photographers": [
    "Review a full wedding album end-to-end — not just highlight shots. Consistency across a whole function separates pros from hobbyists.",
    "Confirm exactly who shoots your wedding — the lead you met, or an assistant — and put their name in the contract.",
    "Get the delivery timeline in writing (the Pakistan average is 6–10 weeks for full edits) and the penalty if it slips.",
    "Clarify photo vs. cinematography — many packages price the film separately. Confirm what's bundled and what costs extra.",
    "Ask about a second shooter and backup gear. A single camera with no backup is a real risk on a once-in-a-lifetime day.",
    "Confirm you receive the high-resolution edited images for your archive, and ask whether RAW files are available.",
    "Agree the advance and the cancellation/reschedule terms before paying — peak Decemberistan dates book out months ahead.",
  ],
};

/** SAFE getter — never throws; returns [] for unknown/unauthored slugs. */
export function getVendorTypeChecklist(slug: string): string[] {
  return VENDOR_TYPE_CHECKLIST[slug] ?? [];
}

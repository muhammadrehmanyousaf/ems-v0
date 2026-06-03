"use client";

// 03-DRAFT-RESILIENCE companion — beforeunload guard for forms that
// CANNOT safely use the localStorage-based draft layer.
//
// Most forms in the system use `useFormDraft` (see
// lib/draftStorage/useFormDraft.ts) to silently auto-save into
// localStorage so a refresh restores everything. That's the right tool
// for the wide majority of vendor / couple flows.
//
// It is NOT the right tool when the form holds **sensitive PII**:
//   - Bank account numbers / IBAN / branch codes
//   - National identity numbers in flight (CNIC / NTN re-entries)
//   - Anything that, if leaked from a shared device or harvested by a
//     malicious browser extension, would be a regulatory or financial
//     incident.
//
// localStorage is plaintext. We could encrypt at rest with WebCrypto +
// a session-derived key but that adds complexity AND fails closed on
// session expiry (vendor logs out, loses the draft anyway). For these
// forms the pragmatic answer is:
//
//   1. Don't persist the draft anywhere on the device.
//   2. Make accidental loss harder: warn the vendor before they
//      refresh or close the tab with unsaved changes, and prompt for
//      confirmation if they click Cancel/X on the dialog.
//
// This hook covers point 2's first half. Point 2's second half is a
// straight `window.confirm()` or shadcn AlertDialog in the consumer.
//
// Caveat: modern browsers ignore the `returnValue` string and show a
// generic "Leave site?" prompt regardless. The PURPOSE is the prompt
// itself — it converts a one-click refresh into a deliberate two-click
// decision. That's enough to stop the accidental case.

import { useEffect } from "react";

interface UseBeforeUnloadGuardOpts {
  /** Set true when the form has unsaved changes that would be lost. */
  enabled: boolean;
  /**
   * Optional custom message. Ignored by modern browsers (they show a
   * generic prompt) but kept for legacy / accessibility tooling.
   */
  message?: string;
}

export function useBeforeUnloadGuard({
  enabled,
  message = "You have unsaved changes. Leave anyway?",
}: UseBeforeUnloadGuardOpts): void {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Setting returnValue triggers the prompt in legacy browsers.
      // Modern browsers ignore the string but still show their own.
      e.returnValue = message;
      return message;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled, message]);
}

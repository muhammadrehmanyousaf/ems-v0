/**
 * WP33 / PUBLIC-003 + PUBLIC-004 - when Google Analytics may run.
 *
 *  - Consent (PUBLIC-003): GA4 mounted unconditionally and set _ga cookies even after 'Essential only'; the banner's
 *    getConsent() was read by nothing. Analytics runs only when the visitor chose analytics.
 *  - Capability URLs (PUBLIC-004): a password-reset, set-password, signing, review or shared-plan link carries a one-time
 *    secret in the URL, and GA4 reports the full page URL to Google. Those routes never load / feed analytics.
 *
 * Pure functions, guarded by scripts/wp33-input-check.mts.
 */

/** Routes whose URL IS a credential (token in the path or the query). */
const SENSITIVE_PATH = /^\/(reset-password|claim|sign|review|wedding)(\/|$)/i

export function isSensitivePath(pathname: string | null | undefined): boolean {
  return SENSITIVE_PATH.test(String(pathname || ""))
}

export function analyticsAllowed(opts: { analyticsConsent: boolean; pathname: string | null | undefined }): boolean {
  return opts.analyticsConsent === true && !isSensitivePath(opts.pathname)
}

/** The event the banner dispatches when a choice is saved, so GA reacts without a reload. */
export const CONSENT_EVENT = "ww-consent-change"

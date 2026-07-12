import Script from "next/script"

/**
 * GA4 (gtag.js). Measurement ID `G-SGNECTNX2B` is the live default so analytics
 * works without any env config; NEXT_PUBLIC_GA_MEASUREMENT_ID can still override
 * it per-environment if needed.
 *
 * `lazyOnload` loads gtag after the page is idle — fully off the critical
 * render path (best for LCP/INP, since gtag.js is the largest single script
 * site-wide) while still emitting the same gtag pageview calls (identical to the
 * standard async snippet, just loaded later for the Core Web Vitals gain).
 * Trade-off: analytics fire after load, so very fast (<~1s) bounces may go
 * uncounted — an accepted exchange for the CWV win.
 */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-SGNECTNX2B"

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="lazyOnload"
      />
      <Script id="ga4-init" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
    </>
  )
}

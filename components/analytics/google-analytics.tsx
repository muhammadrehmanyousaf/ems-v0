import Script from "next/script"

/**
 * GA4 (gtag.js). Measurement ID `G-P2JVEP5KYX` is the live default so analytics
 * works without any env config; NEXT_PUBLIC_GA_MEASUREMENT_ID can still override
 * it per-environment if needed.
 *
 * `afterInteractive` keeps analytics off the critical render path (no LCP/INP
 * hit) while emitting the exact same gtag calls as the standard snippet.
 */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-P2JVEP5KYX"

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
    </>
  )
}

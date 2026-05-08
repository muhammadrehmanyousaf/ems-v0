"use client"

import { useEffect } from "react"
import Link from "next/link"
import { RefreshCw, Home, AlertTriangle, MessageCircle } from "lucide-react"

/**
 * Production error boundary. Renders for unhandled exceptions in any
 * route below the root layout. Logs to console (Sentry / Datadog
 * integration can be added here once installed — see SEO playbook §3 item 175).
 *
 * Reference: docs/seo/00-master-seo-playbook.md §1 item 59 + §26 item 721.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Application error:", error)

    // Forward to error reporter when configured. Both blocks are no-ops
    // until the corresponding package is installed — see
    // docs/seo/07-error-reporting-runbook.md and instrumentation.ts.
    try {
      // @ts-expect-error — global injected by @sentry/nextjs after install
      if (typeof window !== "undefined" && window.Sentry?.captureException) {
        // @ts-expect-error
        window.Sentry.captureException(error, {
          tags: { source: "app-error-boundary" },
          extra: { digest: error?.digest },
        })
      }
    } catch {
      /* reporter not configured — fall through */
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-bridal-cream via-white to-bridal-cream/30 px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 bg-bridal-gold/15 border border-bridal-gold/45 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-7 h-7 text-bridal-gold-dark" />
        </div>

        <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
          Something went wrong
        </p>
        <h1 className="font-display italic text-[36px] sm:text-[44px] leading-tight text-bridal-charcoal mb-4">
          We hit an unexpected error
        </h1>
        <p className="font-bridal text-[14.5px] text-bridal-text leading-relaxed max-w-xl mx-auto mb-2">
          This has been logged and our team will look into it. You can try again —
          most issues clear with a refresh.
        </p>
        {error?.digest && (
          <p className="font-bridal text-[11px] text-bridal-text-soft mb-6">
            Reference:{" "}
            <code className="font-mono text-[11px] text-bridal-charcoal">
              {error.digest}
            </code>
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center px-5 h-11 rounded-full bg-bridal-gold text-white font-bridal text-[13px] font-medium hover:bg-bridal-gold-dark transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 h-11 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[13px] text-bridal-charcoal transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to home
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-5 h-11 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[13px] text-bridal-charcoal transition-colors"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact us
          </Link>
        </div>

        <p className="font-bridal text-[12.5px] text-bridal-text-soft max-w-md mx-auto">
          If this keeps happening,{" "}
          <Link href="/contact" className="text-bridal-gold hover:underline">
            tell us what you were doing
          </Link>{" "}
          when it broke and quote the reference above. We respond within 24 hours.
        </p>
      </div>
    </div>
  )
}

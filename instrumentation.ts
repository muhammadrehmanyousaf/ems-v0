/**
 * Next.js instrumentation hook — runs once on server startup.
 *
 * Currently a placeholder for Sentry / Datadog initialisation. The
 * package is not installed yet (intentional — installing observability
 * tooling is a deploy decision, not an agent decision). Once installed,
 * uncomment the relevant block below and the hook activates automatically.
 *
 * Reference: docs/seo/00-master-seo-playbook.md §3 item 175 +
 *            docs/seo/07-error-reporting-runbook.md (this turn).
 *
 * To enable in Next.js 14, add to next.config.mjs:
 *   experimental: { instrumentationHook: true }
 * (Next.js 15+ enables it by default — currently we're on 14.2.x.)
 */

export async function register() {
  // ─── Sentry (recommended for Next.js error tracking) ───────────────────
  // Uncomment after running:
  //   npm i @sentry/nextjs
  //   npx @sentry/wizard@latest -i nextjs
  //
  // if (process.env.NEXT_RUNTIME === "nodejs") {
  //   await import("./sentry.server.config")
  // }
  // if (process.env.NEXT_RUNTIME === "edge") {
  //   await import("./sentry.edge.config")
  // }

  // ─── Datadog APM (alternative — heavier, better for full APM tracing) ──
  // Uncomment after running:
  //   npm i dd-trace
  //
  // if (process.env.NEXT_RUNTIME === "nodejs" && process.env.DD_API_KEY) {
  //   const tracer = (await import("dd-trace")).default
  //   tracer.init({
  //     service: "weddingwala-frontend",
  //     env: process.env.NODE_ENV,
  //     version: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
  //   })
  // }

  // No-op until either is installed. This hook is safe to ship empty.
  // eslint-disable-next-line no-console
  if (process.env.NODE_ENV !== "test") {
    console.info("[instrumentation] no error reporter configured")
  }
}

import "./commands";

/**
 * Global setup.
 *
 * Two things happen here that individual specs rely on:
 *
 *   1. Console errors are captured per page load, so "this screen logs no
 *      errors" is assertable. Console noise is how a broken data fetch hides
 *      behind a screen that still renders.
 *   2. Uncaught application exceptions do NOT silently fail the test. They are
 *      recorded and asserted deliberately, because Next.js hydration and third
 *      party scripts throw for reasons unrelated to the module under test, and
 *      a suite that dies on the first one never reaches the assertions worth
 *      making.
 */

declare global {
  interface Window {
    __cyConsoleErrors?: string[];
    __cyUncaught?: string[];
  }
}

// Noise that is not the product's fault and not worth failing a module on.
const IGNORED_CONSOLE = [
  /ResizeObserver loop/i,
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /hydrat(ion|ing)/i, // asserted separately, not as generic console noise
  /Failed to load resource.*(favicon|\.map)\b/i,
  // Third-party analytics and tag managers, which the product does not control.
  /googletagmanager|google-analytics|facebook|hotjar|clarity|posthog|tiktok/i,
];

const shouldIgnore = (text: string) => IGNORED_CONSOLE.some((re) => re.test(text));

Cypress.on("window:before:load", (win) => {
  win.__cyConsoleErrors = [];
  win.__cyUncaught = [];

  const original = win.console.error.bind(win.console);
  win.console.error = (...args: unknown[]) => {
    const text = args
      .map((a) => {
        if (a instanceof Error) return a.message;
        if (typeof a === "string") return a;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(" ");
    if (!shouldIgnore(text)) win.__cyConsoleErrors!.push(text.slice(0, 300));
    original(...(args as []));
  };
});

Cypress.on("uncaught:exception", (err, runnable) => {
  const win = (cy as any).state?.("window") as Window | undefined;
  win?.__cyUncaught?.push(err.message.slice(0, 300));
  // Recorded, not fatal — see the note at the top of this file.
  return false;
});

/**
 * The suite points at a deployed origin. Print it once so a report can never be
 * misread as "these results came from localhost".
 */
before(() => {
  cy.task(
    "log",
    `\n  target: ${Cypress.config("baseUrl")}` +
      `\n  mutations: ${Cypress.env("ALLOW_MUTATION") === true ? "ENABLED" : "blocked (read-only)"}\n`,
  );
});

import "axios"

/**
 * Two per-request switches for the portal's plan-refusal handler (lib/axiosConfig.js -> lib/plan-gate.ts).
 * A 403 FEATURE_NOT_IN_PLAN / LIMIT_REACHED on a write (POST/PUT/PATCH/DELETE) always opens the upgrade dialog.
 *   planPrompt      also open it for a refused READ the vendor asked for with a click (a PDF download)
 *   silentPlanGate  never open it (a fire-and-forget background log)
 */
declare module "axios" {
  export interface AxiosRequestConfig {
    planPrompt?: boolean
    silentPlanGate?: boolean
  }
}

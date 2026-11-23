// Ops Portal — the call-logging vocabulary the call screen offers.
//
// This MIRRORS the server rules in ems-v0-backend/src/services/opsProspectService.js (ALLOWED, NOT_INTERESTED_REASONS). The server is
// the authority and re-checks every call; this copy only decides which choices the screen offers. scripts/ops-call-rules-check.mts
// asserts the two never drift (run with the rest of `npm run guards`).
import type { CallOutcome } from "@/lib/api/ops-prospects"

/** Which results are valid for what happened on the line. */
export const CALL_ALLOWED: Record<CallOutcome, string[]> = {
  no_answer: ["no_answer"],
  busy: ["busy_callback"],
  switched_off: ["switched_off"],
  wrong_number: ["wrong_number", "not_a_vendor"],
  spoke: ["busy_callback", "thinking", "interested", "not_interested", "not_a_vendor", "do_not_contact"],
}

export const NOT_INTERESTED_REASONS = ["price", "not_now", "already_listed_elsewhere", "not_tech_savvy", "no_time", "does_not_trust", "other"] as const

export const REASON_LABEL: Record<string, string> = {
  price: "Price / commission",
  not_now: "Not now",
  already_listed_elsewhere: "Already listed elsewhere",
  not_tech_savvy: "Not comfortable with technology",
  no_time: "No time",
  does_not_trust: "Does not trust the platform",
  other: "Other",
}

export const OUTCOME_OPTIONS: { value: CallOutcome; label: string; hint: string }[] = [
  { value: "no_answer", label: "No answer", hint: "Rang, nobody picked up" },
  { value: "busy", label: "Busy", hint: "Picked up, asked to call later" },
  { value: "switched_off", label: "Switched off", hint: "Phone is off or unreachable" },
  { value: "wrong_number", label: "Wrong number", hint: "Not this business" },
  { value: "spoke", label: "Spoke to someone", hint: "A real conversation" },
]

/** Quick callback times, computed in the browser's clock. */
export function quickCallbackTimes(now = new Date()): { label: string; at: Date }[] {
  const at = (d: Date, h: number, m = 0) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x }
  const plus = (h: number) => new Date(now.getTime() + h * 3600 * 1000)
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000)
  const out = [{ label: "In 1 hour", at: plus(1) }, { label: "In 3 hours", at: plus(3) }]
  const tonight = at(now, 19)
  if (tonight.getTime() - now.getTime() > 45 * 60 * 1000) out.push({ label: "Tonight 7 pm", at: tonight })
  out.push({ label: "Tomorrow 11 am", at: at(tomorrow, 11) }, { label: "In 3 days", at: at(new Date(now.getTime() + 3 * 24 * 3600 * 1000), 11) })
  return out
}

/** `<input type="datetime-local">` wants "YYYY-MM-DDTHH:mm" in LOCAL time. */
export function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

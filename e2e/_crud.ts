import { expect, type Page } from "@playwright/test";
import { gotoWithRetry } from "./_helpers";

/**
 * Champagne CRUD helpers. Drives the shadow-DOM "Naya …" drawer/inline forms,
 * scopes every write to the QA venue #3377 ("safe to delete"), and provides an
 * API cleanup safety-net so a flaked UI delete never leaves residue in prod.
 *
 * Backend for cleanup: E2E_BACKEND_URL (defaults to the deployed Railway API).
 */
export const QA_VENUE = 3377;
const API = (process.env.E2E_BACKEND_URL || "https://ems-v0-backend-production.up.railway.app").replace(/\/$/, "");

/** Scope the session to the QA venue so writes land on #3377. */
export async function useQaVenue(page: Page) {
  await gotoWithRetry(page, "/dashboard");
  await page.evaluate((id) => {
    try { localStorage.setItem("ww-active-business", JSON.stringify({ state: { activeBusinessId: id }, version: 0 })); } catch { /* ignore */ }
  }, QA_VENUE);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
}

const token = (page: Page) => page.evaluate(() => localStorage.getItem("auth_token") || "");

async function apiJson(page: Page, method: string, path: string) {
  const t = await token(page);
  const r = await page.request.fetch(`${API}/api/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
  });
  const body = await r.json().catch(() => null);
  return { status: r.status(), body };
}

const rowsOf = (j: any): any[] => {
  if (!j) return [];
  const d = j.data ?? j;
  if (Array.isArray(d)) return d;
  for (const v of Object.values(d)) if (Array.isArray(v)) return v as any[];
  const out: any[] = [];
  const walk = (o: any) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === "object") { if (o.id !== undefined) out.push(o); Object.values(o).forEach(walk); } };
  walk(d); return out;
};

/** True if any record on `listPath` contains `mark` (reliable create/delete assertion). */
export async function apiHas(page: Page, listPath: string, mark: string): Promise<boolean> {
  const { body } = await apiJson(page, "GET", `${listPath}${listPath.includes("?") ? "&" : "?"}businessId=${QA_VENUE}`);
  return rowsOf(body).some((r) => JSON.stringify(r).includes(mark));
}

/** Delete every record on `listPath` whose JSON contains `mark` (idempotent, best-effort). */
export async function apiCleanup(page: Page, listPath: string, delPath: (id: number | string) => string, mark: string) {
  try {
    const { body } = await apiJson(page, "GET", `${listPath}${listPath.includes("?") ? "&" : "?"}businessId=${QA_VENUE}`);
    const mine = rowsOf(body).filter((r) => JSON.stringify(r).includes(mark));
    for (const r of mine) await apiJson(page, "DELETE", `${delPath(r.id)}?businessId=${QA_VENUE}`);
  } catch { /* cleanup is best-effort */ }
}

/** Click a "Naya …" add button (drawer or inline form trigger) in the content. */
export async function openAdd(page: Page, addRe: RegExp): Promise<boolean> {
  return page.evaluate(({ source, flags }) => {
    const re = new RegExp(source, flags);
    for (const el of document.querySelectorAll("*")) {
      const w = (el as HTMLElement).shadowRoot?.getElementById("wwc"); if (!w) continue;
      const root = w.getRootNode() as ShadowRoot;
      const vis = (e: Element) => { const r = e.getBoundingClientRect(); return r.width > 3 && r.height > 3; };
      const btn = [...root.querySelectorAll("button,a.btn,[role=button]")].filter(vis).find((b) => re.test((b as HTMLElement).innerText || ""));
      if (!btn) return false; (btn as HTMLElement).click(); return true;
    }
    return false;
  }, { source: addRe.source, flags: addRe.flags });
}

/** The active form: the open drawer, else the inline block that holds a Save button. */
function activeForm(root: ShadowRoot): HTMLElement | null {
  const vis = (e: Element) => { const r = e.getBoundingClientRect(); return r.width > 3 && r.height > 3; };
  const d = root.querySelector("[data-drawer]") as HTMLElement | null;
  if (d && d.getAttribute("aria-hidden") !== "true") return d;
  const saves = [...root.querySelectorAll("button")].filter((b) => vis(b) && /save|mehfooz|karein|shamil/i.test((b as HTMLElement).innerText || "") && !b.closest("[data-drawer]"));
  for (const s of saves) { let c: HTMLElement | null = s as HTMLElement; for (let i = 0; i < 6 && c; i++) { c = c.parentElement; if (c && c.querySelectorAll("input,select,textarea").length >= 2) return c; } }
  return null;
}

/** Wait for a form (drawer/inline) with fields to be present after clicking Add. */
export async function waitForm(page: Page) {
  await page.waitForFunction(() => {
    for (const el of document.querySelectorAll("*")) {
      const w = (el as HTMLElement).shadowRoot?.getElementById("wwc");
      if (w) {
        const root = w.getRootNode() as ShadowRoot;
        const d = root.querySelector("[data-drawer]") as HTMLElement | null;
        if (d && d.getAttribute("aria-hidden") !== "true" && d.querySelectorAll("input,select,textarea").length) return true;
        const inline = [...root.querySelectorAll("button")].some((b) => /save|karein|shamil/i.test((b as HTMLElement).innerText || "") && !b.closest("[data-drawer]"));
        if (inline) return true;
      }
    }
    return false;
  }, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(600);
}

/** Label-aware fill of every empty field in the active form with valid values. */
export async function fillForm(page: Page, marker: string): Promise<number> {
  return page.evaluate((marker) => {
    let root: ShadowRoot | null = null;
    for (const el of document.querySelectorAll("*")) { const w = (el as HTMLElement).shadowRoot?.getElementById("wwc"); if (w) { root = w.getRootNode() as ShadowRoot; break; } }
    if (!root) return -1;
    const vis = (e: Element) => { const r = e.getBoundingClientRect(); return r.width > 3 && r.height > 3; };
    const d = root.querySelector("[data-drawer]") as HTMLElement | null;
    let form: HTMLElement | null = (d && d.getAttribute("aria-hidden") !== "true") ? d : null;
    if (!form) { const s = [...root.querySelectorAll("button")].filter((b) => vis(b) && /save|karein|shamil/i.test((b as HTMLElement).innerText || "") && !b.closest("[data-drawer]")); for (const x of s) { let c: HTMLElement | null = x as HTMLElement; for (let i = 0; i < 6 && c; i++) { c = c.parentElement; if (c && c.querySelectorAll("input,select,textarea").length >= 2) { form = c; break; } } if (form) break; } }
    if (!form) return -2;
    const setV = (inp: any, v: string) => { const proto = inp.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : inp.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(inp, v); inp.dispatchEvent(new Event("input", { bubbles: true })); inp.dispatchEvent(new Event("change", { bubbles: true })); };
    const label = (inp: any) => { if (inp.getAttribute("aria-label")) return inp.getAttribute("aria-label"); let n = inp; for (let i = 0; i < 4 && n; i++) { n = n.parentElement; if (!n) break; const l = n.querySelector("label,.fld-label"); if (l && !l.contains(inp)) return (l as HTMLElement).innerText; } return inp.getAttribute("placeholder") || inp.name || ""; };
    let count = 0;
    for (const inp of Array.from(form.querySelectorAll("input,textarea,select")) as any[]) {
      if (!vis(inp) || inp.disabled || inp.readOnly) continue;
      const type = (inp.getAttribute("type") || inp.tagName).toLowerCase();
      if (["checkbox", "radio", "file", "hidden", "submit", "button"].includes(type)) continue;
      if (inp.tagName === "SELECT") { const o = [...inp.options].filter((x: any) => x.value && !/select|chunein|--/i.test(x.text)); if (o.length && !inp.value) { setV(inp, o[0].value); count++; } continue; }
      if (inp.value && inp.value.trim()) continue;
      const s = (label(inp) + " " + type).toLowerCase();
      let v = marker;
      if (/phone|whatsapp|mobile|rabta/.test(s)) v = "03001234567";
      else if (/email/.test(s)) v = "qa-e2e@example.com";
      else if (/cnic|nic\b/.test(s)) v = "3520112345671";
      else if (/cheque|account.*(no|num)|iban/.test(s)) v = "1234567890123";
      else if (type === "number" || /amount|price|rate|qeemat|cost|tankhwah|salary|litre|liter|stock|qty|quantity|tadaad|seat|guest|capacity|rent|commission|hours|budget/.test(s)) v = "5";
      else if (type === "date" || /date|tareekh|expiry|valid|issued/.test(s)) v = "2028-06-15";
      else if (type === "time") v = "18:00";
      setV(inp, v); count++;
    }
    return count;
  }, marker);
}

/** Click the form's Save button. */
export async function saveForm(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    for (const el of document.querySelectorAll("*")) {
      const w = (el as HTMLElement).shadowRoot?.getElementById("wwc"); if (!w) continue;
      const root = w.getRootNode() as ShadowRoot;
      const vis = (e: Element) => { const r = e.getBoundingClientRect(); return r.width > 3 && r.height > 3; };
      const d = root.querySelector("[data-drawer]") as HTMLElement | null;
      let form: HTMLElement | null = (d && d.getAttribute("aria-hidden") !== "true") ? d : null;
      if (!form) { const s = [...root.querySelectorAll("button")].filter((b) => vis(b) && /save|karein|shamil/i.test((b as HTMLElement).innerText || "") && !b.closest("[data-drawer]")); form = ((s[0] as any)?.closest("div") as HTMLElement) || (root as any); }
      const b = [...(form as any).querySelectorAll("button")].filter(vis).find((x: any) => /save|mehfooz|karein|shamil|banayein|create/i.test(x.innerText || ""));
      if (!b) return false; (b as HTMLElement).click(); return true;
    }
    return false;
  });
}

/** True when the content shadow text contains `marker`. */
export function rowHas(page: Page, marker: string): Promise<boolean> {
  return page.evaluate((m) => {
    for (const el of document.querySelectorAll("*")) { const w = (el as HTMLElement).shadowRoot?.getElementById("wwc"); if (w) return (w.getRootNode() as ShadowRoot).textContent!.includes(m); }
    return false;
  }, marker);
}

/** Wait until the write settles: marker present (or absent when wantGone), or the drawer closes. */
export async function waitSettled(page: Page, marker: string, wantGone = false) {
  await page.waitForFunction(({ m, wantGone }) => {
    for (const el of document.querySelectorAll("*")) {
      const w = (el as HTMLElement).shadowRoot?.getElementById("wwc");
      if (w) { const root = w.getRootNode() as ShadowRoot; const d = root.querySelector("[data-drawer]") as HTMLElement | null; const open = !!d && d.getAttribute("aria-hidden") !== "true"; const has = root.textContent!.includes(m); return wantGone ? !has : (has || !open); }
    }
    return false;
  }, { m: marker, wantGone }, { timeout: 9000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

/** Click the delete/trash on the row carrying `marker`, then confirm in the openConfirm dialog. */
export async function deleteRow(page: Page, marker: string): Promise<boolean> {
  const clicked = await page.evaluate((m) => {
    for (const el of document.querySelectorAll("*")) {
      const w = (el as HTMLElement).shadowRoot?.getElementById("wwc"); if (!w) continue;
      const root = w.getRootNode() as ShadowRoot;
      const tw = document.createTreeWalker(root as any, NodeFilter.SHOW_TEXT);
      let node: HTMLElement | null = null;
      while (tw.nextNode()) { if ((tw.currentNode.nodeValue || "").includes(m)) { node = tw.currentNode.parentElement; break; } }
      if (!node) return false;
      let row: HTMLElement | null = node.closest("tr,.card,li");
      for (let i = 0; i < 4 && row && row.querySelectorAll("button").length === 0; i++) row = row.parentElement;
      if (!row) return false;
      const btns = [...row.querySelectorAll("button")].filter((b) => (b as HTMLElement).offsetParent !== null);
      const del = btns.find((b) => /hata|delete|remove|trash|mita|band/i.test((b.getAttribute("aria-label") || "") + (b.getAttribute("title") || ""))) || btns[btns.length - 1];
      if (!del) return false; (del as HTMLElement).click(); return true;
    }
    return false;
  }, marker);
  if (!clicked) return false;
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("*")) { const w = (el as HTMLElement).shadowRoot?.getElementById("wwc"); if (w) { const c = (w.getRootNode() as ShadowRoot).querySelector(".ww-confirm"); if (c) { const b = [...c.querySelectorAll("button")].find((x) => /hata|delete|remove|confirm|haan|yes|ok|mita/i.test((x as HTMLElement).innerText || "")); (b as HTMLElement)?.click(); } } }
  });
  return true;
}

/** True if the active form shows a validation error toast/message. */
export function formError(page: Page): Promise<string> {
  return page.evaluate(() => {
    for (const el of document.querySelectorAll("*")) { const w = (el as HTMLElement).shadowRoot?.getElementById("wwc"); if (w) { const root = w.getRootNode() as ShadowRoot; const t = (root.querySelector("[data-drawer]") as HTMLElement)?.innerText || ""; const toast = [...root.querySelectorAll("[class*=toast],[role=alert],[class*=error]")].map((e) => (e as HTMLElement).innerText).join(" "); const m = (toast + " " + t).match(/invalid[^.\n]*|required[^.\n]*|zaroori[^.\n]*/i); return m ? m[0].slice(0, 60) : ""; } }
    return "";
  });
}

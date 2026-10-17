/**
 * Guard: WP38 (package P7) - Settings write-integrity, refresh, list caps and report labels.
 *
 * What this pins (each line names the audit finding it protects):
 *
 *   SETUP-021  a save re-bases the diff on what was saved, so editing a field BACK to its page-load value is sent
 *   SETUP-028  an unanswered yes/no stays null through load -> save; a one-field save sends one field
 *   SETUP-005/024  cleared optional fields go out as null (package drawer, staff drawer)
 *   SETUP-023  Undo of a package removal restores every column (per-head stays per-head)
 *   LOGIC-013 / SETUP-048  ladder rows read the engine's bands (daysToEvent is a MINIMUM) for every preset, 0..90 days
 *   BOOKINGS-089  history rows come back in whatever shape the server sends
 *   OPS-019  default sheet = newest created, not earliest event
 *   OPS-067  the run sheet no longer shares `timeline` with the BEO drawer
 *   CONCURRENCY-015/021  every page is read; live notifications map to the non-money query families
 *   SETUP-027  the unsaved-changes registry parks a navigation and never traps
 *   ... plus source-shape checks for the screens (a failing fetch is not an empty list, no window.confirm, ...).
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/settings-integrity-check.mts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { changedPatch, sameValue, triFrom, triLabel } from "../lib/settings/changed-patch.ts";
import { buildPackageBody, packageRestoreBody } from "../lib/settings/package-body.ts";
import { slabRangeLabel } from "../lib/cancellation-policy.ts";
import { historyRows } from "../lib/bookings/history-rows.ts";
import { approvalToast } from "../lib/bookings/approval-toast.ts";
import { pickDefaultSheet } from "../lib/function-sheets/default-sheet.ts";
import { TRADE_OPS, storedSectionRows } from "../lib/dashboard/trade-ops-config.ts";
import { liveKeysFor } from "../lib/query/live-keys.ts";
import { walkPages } from "../lib/query/walk-pages.ts";
import { useDirtyGuard } from "../lib/store/dirty-guard.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
let passed = 0;
const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => { if (ok) passed++; else failures.push(`${name}${detail ? "  (" + detail + ")" : ""}`); };
const src = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");

// ── SETUP-028: tri-state ─────────────────────────────────────────────────────
check("triFrom keeps null, true and false apart", triFrom(null) === null && triFrom(undefined) === null && triFrom(true) === true && triFrom(false) === false && triFrom("yes") === null);
check("triLabel: Yes / No / Not answered", triLabel(true) === "Yes" && triLabel(false) === "No" && triLabel(null) === "Not answered" && triLabel(undefined) === "Not answered");
check("false is not null", !sameValue(false, null) && !sameValue(null, false) && sameValue(null, undefined));
check("empty string, empty list and null all mean 'nothing here'", sameValue("", null) && sameValue([], null) && sameValue([], "") && !sameValue(0, null) && !sameValue(0, ""));
check("100 and '100' are the same entry (number inputs hand back strings)", sameValue(100, "100") && !sameValue(100, "101"));
{
  // the audit's repro: the listing has never answered cash / bank / tax invoice / insurance / outside vendors
  const loaded = { ownerName: "", acceptsCash: null, acceptsBankTransfer: null, providesTaxInvoice: null, hasInsurance: null, outsideVendorsAllowed: null, cityCovered: [] as string[] };
  const typed = { ...loaded, ownerName: "Mr Ali" };
  const patch = changedPatch(typed, loaded);
  check("saving only the owner name sends only the owner name", JSON.stringify(patch) === JSON.stringify({ ownerName: "Mr Ali" }), JSON.stringify(patch));
  check("an untouched listing sends nothing at all", Object.keys(changedPatch({ ...loaded }, loaded)).length === 0);
  const chose = changedPatch({ ...loaded, acceptsCash: true }, loaded);
  check("answering a question sends that answer", JSON.stringify(chose) === JSON.stringify({ acceptsCash: true }));
  check("clearing a text field sends null", JSON.stringify(changedPatch({ ownerName: null }, { ownerName: "Ali" })) === JSON.stringify({ ownerName: null }));
}

// ── SETUP-021: re-base after save ────────────────────────────────────────────
{
  let baseline: Record<string, unknown> = { minimumPrice: 150000 };
  const save = (form: Record<string, unknown>) => { const patch = changedPatch(form, baseline); if (Object.keys(patch).length) baseline = { ...form }; return patch; };
  const first = save({ minimumPrice: 160000 });
  check("first save sends the new price", first.minimumPrice === 160000);
  const back = save({ minimumPrice: 150000 });
  check("editing the price BACK to its page-load value is sent (diff is against the last SAVED value)", back.minimumPrice === 150000, JSON.stringify(back));
  const sameAgain = save({ minimumPrice: 150000 });
  check("a repeat save with nothing changed sends nothing", Object.keys(sameAgain).length === 0);
}
{
  const hub = src("components/dashboard/mainScreens/businessSettings/redesigned/business-settings-hub-view.tsx");
  const onSuccess = hub.slice(hub.indexOf("onSuccess: (res: any, vars)"), hub.indexOf("onError", hub.indexOf("onSuccess: (res: any, vars)")));
  check("hub: saveMut.onSuccess re-bases the baseline from the submit-time snapshot", /setBaseline\(\{ \.\.\.vars\.snapshot \}\)/.test(onSuccess));
  check("hub: the snapshot is taken when Save is pressed", /saveMut\.mutate\(\{ patch: buildPatch\(\), snapshot: \{ \.\.\.form \} \}\)/.test(hub));
  check("hub: the stored NTN is loaded into the form and the baseline (SETUP-004)", (hub.match(/ntnNumber: \(biz as any\)\.ntnNumber \?\? ""/g) || []).length === 2);
  check("hub: no native window.confirm (SETUP-027)", !hub.includes("window.confirm("));
  check("hub: registers its unsaved edits with the shell guard (SETUP-027)", /useDirtyRegistry\("settings-hub", dirty \|\| listingDirty\)/.test(hub));
  check("hub: pushes the public listing after a save (SETUP-026)", /invalidateBusinessData\(qc, biz!?\.id\)/.test(hub));
}

// ── SETUP-028 / 021 in the two self-saving managers ──────────────────────────
{
  const pc = src("components/dashboard/mainScreens/businessSettings/redesigned/profile-content-manager.tsx");
  check("listing content: yes/no questions load through triFrom, never Boolean()", !/Boolean\(b\.(acceptsCash|acceptsBankTransfer|providesTaxInvoice|hasInsurance|outsideVendorsAllowed|requiresPermit)\)/.test(pc) && /triFrom\(b\.acceptsCash\)/.test(pc));
  check("listing content: the save sends changedPatch against the last saved payload and re-bases on success", /changedPatch\(full as Record<string, unknown>, savedPayload\.current/.test(pc) && /savedPayload\.current = full/.test(pc));
  check("listing content: an unanswered switch says so", /Not answered yet/.test(pc));
  const ts = src("components/dashboard/mainScreens/businessSettings/redesigned/type-specific-manager.tsx");
  check("type-specific: booleans load as triFrom, not `false`", /field\.type === "boolean" \? triFrom\(raw\)/.test(ts) && !/field\.type === "boolean" \? false/.test(ts));
  check("type-specific: the save sends only changed fields and re-bases", /changedPatch\(full, savedBody\.current/.test(ts) && /savedBody\.current = full/.test(ts));
  check("type-specific: switch shows 'on' only for a real true", /checked=\{val === true\}/.test(ts));
}

// ── SETUP-005 / 023 / 024 ────────────────────────────────────────────────────
{
  const base = { editing: true, name: "Gold", price: 2500, businessId: 5, pricingUnit: "per_head", includesFood: false, description: "", guestRangeMin: "", guestRangeMax: "", serviceStyle: "", menuId: "", subVenueId: "", features: [] as string[], minGuarantee: "" };
  const edit = buildPackageBody(base);
  check("package edit: every cleared optional field is an explicit null / []", edit.guestRangeMin === null && edit.guestRangeMax === null && edit.minGuaranteeCount === null && edit.serviceStyle === null && edit.description === null && Array.isArray(edit.features) && (edit.features as unknown[]).length === 0 && edit.menuId === null && edit.subVenueId === null, JSON.stringify(edit));
  const create = buildPackageBody({ ...base, editing: false });
  check("package create keeps its old shape (no description / features keys when empty)", !("description" in create) && !("features" in create));
  const full = buildPackageBody({ ...base, guestRangeMin: "200", guestRangeMax: "800", minGuarantee: "300", serviceStyle: "buffet", description: "x", features: ["Stage"] });
  check("package edit: typed values go out as numbers", full.guestRangeMin === 200 && full.guestRangeMax === 800 && full.minGuaranteeCount === 300 && full.serviceStyle === "buffet");
  check("package: a minimum guarantee behind a FLAT unit is cleared", buildPackageBody({ ...base, pricingUnit: "per_event", minGuarantee: "300" }).minGuaranteeCount === null);
  const restored = packageRestoreBody({ name: "AUD Gold", price: "2500.00", description: "d", features: ["Stage", "Lights"], pricingUnit: "per_head", minGuaranteeCount: 300, includesFood: true, guestRangeMin: 100, guestRangeMax: 800, serviceStyle: "buffet", menuId: 9, subVenueId: 4, images: ["a.jpg"], extras: [{ label: "Generator", price: 1 }] }, 5);
  check("undo restores unit, guarantee, range, style, menu, hall, food flag, images and extras (SETUP-023)",
    restored.pricingUnit === "per_head" && restored.minGuaranteeCount === 300 && restored.guestRangeMin === 100 && restored.guestRangeMax === 800 && restored.serviceStyle === "buffet" && restored.menuId === 9 && restored.subVenueId === 4 && restored.includesFood === true && Array.isArray(restored.images) && Array.isArray(restored.extras) && restored.price === 2500, JSON.stringify(restored));
  const pa = src("components/dashboard/mainScreens/packages/artifact/packages-artifact.tsx");
  check("packages drawer builds its body with buildPackageBody", /buildPackageBody\(\{/.test(pa) && !/if \(gmin > 0\)/.test(pa));
  const pm = src("components/dashboard/mainScreens/businessSettings/redesigned/packages-manager.tsx");
  check("settings packages: undo uses packageRestoreBody; an emptied description is null on edit", /packageRestoreBody\(p, businessId\)/.test(pm) && /\(editingId \? null : undefined\)/.test(pm));
  const st = src("components/dashboard/mainScreens/staff/artifact/staff-artifact.tsx");
  check("staff drawer: an emptied phone / WhatsApp / salary / dihari is sent as null on edit (SETUP-024)", ["phoneNumber", "whatsappNumber", "monthlySalary", "defaultDihariRate"].every((k) => new RegExp(`optional\\.${k} = null`).test(st)));
}

// ── destructive confirms (SETUP-006) ─────────────────────────────────────────
{
  for (const f of ["menus-manager", "bank-accounts-manager"]) {
    const t = src(`components/dashboard/mainScreens/businessSettings/redesigned/${f}.tsx`);
    check(`${f}: Remove asks first (ConfirmRemove) and no onClick fires removeMut directly`, /<ConfirmRemove/.test(t) && !/onClick=\{\(\) => removeMut\.mutate\(/.test(t));
  }
}

// ── cache refresh (SETUP-009 / 026, OPS-001, FLAGGED-057, CONCURRENCY-021) ───
{
  const bk = src("lib/query/business-keys.ts");
  check("business keys include the Setup checklist's own key (SETUP-009)", /\["onboarding-completeness"\]/.test(bk));
  check("invalidateBusinessData can push the public listing (SETUP-026)", /void pushLive\(businessId\)/.test(bk));
  const ta = src("components/dashboard/mainScreens/today/artifact/today-artifact.tsx");
  check("today: no invalidate closes over the render-time venue id (OPS-001)", !/invalidateQueries\(\{ queryKey: \["today-art", activeBusinessId\] \}\)/.test(ta));
  const sv = src("components/quotes/site-visit-card.tsx");
  check("site-visit card refreshes the customer and vendor quote lists (FLAGGED-057)", /"my-quotes"/.test(sv) && /"quotes-art"/.test(sv));
  const nc = src("context/NotificationContext.tsx");
  check("socket handler refreshes non-money families and tells the customer pages (CONCURRENCY-021 / CUSTOMER-036)", /liveKeysFor\(notification\)/.test(nc) && /MONEY_NOTIFICATION_EVENT/.test(nc));
  const keys = (type: string) => liveKeysFor({ type }).map((k) => k[0]);
  check("new_lead / lead_* refresh the leads families", keys("new_lead").includes("leads-artifact") && keys("lead_followup_due").includes("leads-artifact") && keys("lead_stale_48h").includes("lead-detail"));
  check("new_review refreshes the reviews families", keys("new_review").includes("reviews-art"));
  check("a booking notification is not a live-key family (it is a money one)", keys("booking_created").length === 0 && liveKeysFor(null).length === 0);
  for (const f of ["app/(main)/user/bookings/page.tsx", "app/(main)/user/bookings/[id]/page.tsx"]) {
    const t = src(f);
    check(`${f}: follows the venue's payment (useLiveRefresh) and tells a failed load from an empty list (CUSTOMER-036/059)`, /useLiveRefresh\(/.test(t) && /loadFailed/.test(t) && /Try again/.test(t));
  }
  const detail = src("app/(main)/user/bookings/[id]/page.tsx");
  check("booking detail: a network failure never renders 'Booking not found'", detail.indexOf("We couldn't load this booking") > 0 && detail.indexOf("We couldn't load this booking") < detail.indexOf("Booking not found"));
}

// ── error honesty (OPS-003, OPS-007, SETUP-011, SETUP-012) ───────────────────
{
  const ov = src("components/dashboard/mainScreens/dashboard/artifact/overview-artifact.tsx");
  check("overview: the refund card has an 'unknown' state and the query no longer swallows errors (OPS-003)", /wapsiState === "unknown"|state === "unknown"/.test(ov) && !/listRefundObligations\([^)]*\)\.catch\(\(\) => null\)/.test(ov));
  const rp = src("components/dashboard/mainScreens/insights/artifact/reports-artifact.tsx");
  check("reports: a null analytics answer throws so the error banner can appear (OPS-007)", /const must = /.test(rp) && (rp.match(/must\(AnalyticsAPI\./g) || []).length === 4);
  check("reports: while loading it draws no zeros", /isLoadingCore/.test(rp));
  const cp = src("components/dashboard/mainScreens/cancellation-policy/artifact/cancellation-policy-artifact.tsx");
  check("cancellation policy: a 404 (null) is a 'not enabled' card, not the endless loader (SETUP-011)", /data === null/.test(cp) && /data-policy-disabled/.test(cp));
  check("cancellation policy: applying a preset confirms and sends its notice window (FLAGGED-070)", /openConfirm\(/.test(cp) && /minNoticeHours: tpl\.minNoticeHours/.test(cp));
  const bc = src("context/BusinessContext.tsx");
  const sb = src("components/dashboard/layout/champagne-sidebar.tsx");
  check("switcher: loading / failed are not 'no business' (SETUP-012)", /loadError/.test(bc) && /switcher-loading/.test(sb) && /switcher-error/.test(sb) && /!loading && !loadError/.test(sb));
}

// ── ladder labels vs the engine (LOGIC-013 / SETUP-048) ──────────────────────
{
  type Slab = { daysToEvent: number; pct: number };
  const engineTier = (slabs: Slab[], d: number) => { const t = [...slabs].sort((a, b) => b.daysToEvent - a.daysToEvent); return t.find((x) => d >= x.daysToEvent) ?? t[t.length - 1]; };
  const PRESETS: Record<string, Slab[]> = {
    "30/14/7/0 (the audit venue)": [{ daysToEvent: 30, pct: 0 }, { daysToEvent: 14, pct: 40 }, { daysToEvent: 7, pct: 70 }, { daysToEvent: 0, pct: 100 }],
    "flexible 30/14/7/0": [{ daysToEvent: 30, pct: 0 }, { daysToEvent: 14, pct: 30 }, { daysToEvent: 7, pct: 50 }, { daysToEvent: 0, pct: 75 }],
    "platform default 35/15/7": [{ daysToEvent: 35, pct: 50 }, { daysToEvent: 15, pct: 75 }, { daysToEvent: 7, pct: 100 }],
    "single flat band": [{ daysToEvent: 0, pct: 60 }],
    "two bands 10/0": [{ daysToEvent: 10, pct: 20 }, { daysToEvent: 0, pct: 100 }],
    "adjacent days 3/2/1": [{ daysToEvent: 3, pct: 10 }, { daysToEvent: 2, pct: 20 }, { daysToEvent: 1, pct: 30 }],
  };
  for (const [name, slabs] of Object.entries(PRESETS)) {
    const sorted = [...slabs].sort((a, b) => b.daysToEvent - a.daysToEvent);
    const labels = sorted.map((_, i) => slabRangeLabel(sorted, i));
    // parse each label back into [lo, hi]
    const ranges = labels.map((l, i) => {
      if (l === "Kisi bhi din") return [0, Infinity];
      let m = l.match(/^(\d+)\+ din pehle$/); if (m) return [Number(m[1]), Infinity];
      m = l.match(/^(\d+) din ya kam pehle$/); if (m) return [0, Number(m[1])];
      m = l.match(/^(\d+)[–-](\d+) din pehle$/); if (m) return [Number(m[1]), Number(m[2])];
      m = l.match(/^(\d+) din pehle$/); if (m) return [Number(m[1]), Number(m[1])];
      return [NaN, NaN, i];
    });
    let ok = true; let detail = "";
    for (let d = 0; d <= 90; d++) {
      const rows = ranges.map((r, i) => (d >= r[0] && d <= r[1] ? i : -1)).filter((i) => i >= 0);
      const want = sorted.indexOf(engineTier(sorted, d));
      if (rows.length !== 1 || rows[0] !== want) { ok = false; detail = `day ${d}: label rows ${rows.join(",")} engine row ${want} (${labels.join(" | ")})`; break; }
    }
    check(`ladder labels cover every day 0..90 exactly once and match the engine: ${name}`, ok, detail);
  }
  check("the audit's venue prints 30+, 14-29, 7-13, 0-6", (() => { const s = PRESETS["30/14/7/0 (the audit venue)"]; return [0, 1, 2, 3].map((i) => slabRangeLabel(s, i)).join("|") === "30+ din pehle|14–29 din pehle|7–13 din pehle|6 din ya kam pehle"; })());
}

// ── booking detail (BOOKINGS-029 / 089) ──────────────────────────────────────
{
  const rows = [{ fromStatus: "Confirmed", toStatus: "Completed", actorRole: "vendor" }];
  check("history rows: {rows}, {history}, {entries} and a bare array all read", historyRows({ rows }).length === 1 && historyRows({ history: rows }).length === 1 && historyRows({ entries: rows }).length === 1 && historyRows(rows).length === 1 && historyRows(null).length === 0 && historyRows({}).length === 0 && historyRows("x").length === 0);
  check("approval toast follows the status the server returned", approvalToast({ data: { status: "Awaiting Payment" } }).includes("advance") && approvalToast({ data: { status: "Confirmed" } }) === "Booking confirm ho gayi" && approvalToast(null) === "Booking confirm ho gayi");
  const bd = src("components/dashboard/mainScreens/bookings/artifact/booking-detail-artifact.tsx");
  check("detail: Confirm / Reject are gone once the vendor has approved an Awaiting-payment booking", /vendorApprovedAt/.test(bd.slice(bd.indexOf("const isPending"), bd.indexOf("const isPending") + 400)));
  check("detail: Activity reads rows / at / actorRole", /historyRows\(histQ\.data\)/.test(bd) && /h\.at \|\|/.test(bd) && /h\.actorRole/.test(bd));
}

// ── function sheets (OPS-019 / OPS-067) ──────────────────────────────────────
{
  const sheets = [{ id: 1, createdAt: "2026-01-01T00:00:00Z" }, { id: 2, createdAt: "2026-10-01T00:00:00Z" }, { id: 3, createdAt: "2026-05-01T00:00:00Z" }];
  check("default sheet is the newest CREATED one, not list[0]", pickDefaultSheet(sheets)?.id === 2 && pickDefaultSheet([])=== null && pickDefaultSheet(undefined) === null);
  for (const f of ["function-sheet-sign-view", "function-sheet-composer-view", "function-sheet-operations-view", "function-sheet-detail-redesigned-view", "trade-operations-hub-view"]) {
    check(`${f}: no list[0] fallback`, !/functionSheets\?\.\[0\]/.test(src(`components/dashboard/mainScreens/function-sheets/redesigned/${f}.tsx`)));
  }
  const to = src("components/dashboard/mainScreens/function-sheets/artifact/trade-ops-artifact.tsx");
  check("trade-ops honours ?id= and no longer takes list[0]", /sheetIdFromUrl\(\)/.test(to) && !/functionSheets\?\.\[0\]/.test(to));
  const run = TRADE_OPS.find((t) => t.trade === "beo")!.sections.find((s) => s.label === "Run of show")!;
  check("the run sheet's section no longer uses the BEO drawer's `timeline` key", run.key === "runOfShow" && run.legacyKey === "timeline");
  const legacy = { timeline: [{ cue: "Baraat", startTime: "8 PM" }, { time: "18:00", activity: "Arrival" }] };
  const read = storedSectionRows(legacy, run);
  check("old run-sheet rows are still read from `timeline`, the drawer's {time, activity} rows are not", read.length === 1 && (read[0] as { cue?: string }).cue === "Baraat");
  check("rows under the new key win", storedSectionRows({ runOfShow: [{ cue: "x" }], timeline: legacy.timeline }, run).length === 1);
}

// ── every page (BOOKINGS-008/010/011/012, CONCURRENCY-015, MONEY-038) ────────
{
  const make = (n: number, per: number) => async (page: number) => ({ items: Array.from({ length: Math.min(per, Math.max(0, n - (page - 1) * per)) }, (_, i) => (page - 1) * per + i), pagination: { totalPages: Math.ceil(n / per), total: n } });
  const all = await walkPages(make(457, 100));
  check("walkPages reads 457 customers across 5 pages", all.items.length === 457 && all.total === 457 && !all.truncated && new Set(all.items).size === 457);
  const capped = await walkPages(make(500, 100), 3);
  check("walkPages says so when it stops at maxPages", capped.items.length === 300 && capped.truncated === true);
  const one = await walkPages(make(0, 100));
  check("walkPages on an empty list", one.items.length === 0 && one.total === 0);
  const bk = src("components/dashboard/mainScreens/bookings/artifact/bookings-artifact.tsx");
  check("bookings: reads every page, not limit 100 (BOOKINGS-010)", /useFetchAllPages/.test(bk) && !/limit: 100/.test(bk));
  check("bookings: the header no longer hard-codes '50'", !/pehle 50 dikhaye/.test(bk));
  check("bookings: rows carry the phone for search (BOOKINGS-011)", /data-search="\$\{escHtml\(phone\)\}"/.test(bk));
  check("bookings: export is data-driven with named columns (BOOKINGS-012)", /registerTableExport\(s,/.test(bk) && /BOOKING_EXPORT_HEAD/.test(bk));
  const cal = src("components/dashboard/mainScreens/calendar/artifact/calendar-artifact.tsx");
  check("calendar: reads every page from the window start (BOOKINGS-008)", /useFetchAllPages/.test(cal) && /dateFrom: fromWindow/.test(cal) && !/limit: 100/.test(cal));
  const sh = src("components/dashboard/mainScreens/artifact/artifact-shell.tsx");
  check("shell export: all matching rows, not the visible page; money as numbers; Karachi day in the file name (MONEY-038)", /pagerMatched\(st\)/.test(sh) && /plainMoney/.test(sh) && /timeZone: "Asia\/Karachi"/.test(sh));
  check("shell search: a row's data-search text is searchable", /tr\.dataset\.search/.test(sh));
  for (const [f, probe] of [["customers/artifact/customers-artifact.tsx", "walkPages"], ["reviews/artifact/reviews-artifact.tsx", "walkPages"], ["leads/artifact/leads-artifact.tsx", "listAll"], ["insights/artifact/reports-artifact.tsx", "useFetchAllPages"], ["notifications/artifact/notifications-artifact.tsx", "getNotifications(page, 100"]] as const) {
    check(`${f.split("/")[0]}: reads every page`, src(`components/dashboard/mainScreens/${f}`).includes(probe));
  }
  const dp = src("components/dashboard/mainScreens/disputes/redesigned/disputes-redesigned-view.tsx");
  check("disputes: asks for status=all so Resolved / Total can be non-zero (FLAGGED-043)", /status: "all"/.test(dp));
  const al = src("components/dashboard/mainScreens/audit-logs/redesigned/audit-logs-redesigned-view.tsx");
  check("audit log: reads every page and uses the server's counts and names (PUBLIC-046)", /listAllAuditLogs/.test(al) && /data\?\.summary/.test(al) && /ACTOR_NAMES/.test(al));
}

// ── labels (MONEY-003 / 019 / 035) ───────────────────────────────────────────
{
  const kh = src("components/dashboard/mainScreens/money/artifact/khata-artifact.tsx");
  check("khata: a day-only receivedDate has no time (MONEY-003)", /isDayOnly/.test(kh) && /timeZone: "Asia\/Karachi"/.test(kh));
  const tx = src("components/dashboard/mainScreens/tax/artifact/tax-artifact.tsx");
  check("tax: names the basis, shows what was received, and does not offer a fiscal year that has not started (MONEY-035)", /booked, event ki tareekh se/.test(tx) && /bookingReceived/.test(tx) && /const latest = /.test(tx));
  check("payments / reports name the measure (MONEY-019)", /Received \(bookings par\)/.test(src("components/dashboard/mainScreens/payments/artifact/payments-artifact.tsx")) && /event ki tareekh se/.test(src("components/dashboard/mainScreens/insights/artifact/reports-artifact.tsx")));
}

// ── CONCURRENCY-009: the drawers carry the token ─────────────────────────────
{
  check("lead / staff / package drawers send expectedUpdatedAt", /expectedUpdatedAt: val\("ld-upd"\)/.test(src("components/dashboard/mainScreens/leads/artifact/leads-artifact.tsx")) && /expectedUpdatedAt = val\("m-upd"\)/.test(src("components/dashboard/mainScreens/staff/artifact/staff-artifact.tsx")) && /expectedUpdatedAt = val\("p-upd"\)/.test(src("components/dashboard/mainScreens/packages/artifact/packages-artifact.tsx")));
}

// ── SETUP-027: the registry ──────────────────────────────────────────────────
{
  const g = useDirtyGuard.getState();
  let ran = 0;
  check("clean: a navigation runs at once", g.guard(() => { ran++; }) === true && ran === 1);
  useDirtyGuard.getState().setDirty("settings-hub", true);
  check("dirty: a navigation is parked, not run", useDirtyGuard.getState().guard(() => { ran++; }) === false && ran === 1 && useDirtyGuard.getState().pending !== null);
  useDirtyGuard.getState().cancelPending();
  check("cancel keeps the screen dirty and drops the navigation", useDirtyGuard.getState().pending === null && Object.keys(useDirtyGuard.getState().sources).length === 1 && ran === 1);
  useDirtyGuard.getState().guard(() => { ran++; });
  useDirtyGuard.getState().confirmPending();
  check("confirm clears the registry and runs the navigation (it can never trap)", ran === 2 && Object.keys(useDirtyGuard.getState().sources).length === 0 && useDirtyGuard.getState().pending === null);
  useDirtyGuard.getState().setDirty("x", true); useDirtyGuard.getState().setDirty("x", false);
  check("saving (dirty=false) unregisters", useDirtyGuard.getState().guard(() => { ran++; }) === true && ran === 3);
  const sidebar = src("components/dashboard/layout/champagne-sidebar.tsx");
  check("sidebar navigation goes through the guard", /useDirtyGuard\.getState\(\)\.guard\(\(\) => router\.push\(url\)\)/.test(sidebar));
  check("the shell mounts the leave dialog once", /<LeaveGuardDialog \/>/.test(src("components/dashboard/layout/champagne-shell.tsx")));
}

if (failures.length) {
  console.error(`settings-integrity-check: ${failures.length} failed, ${passed} passed`);
  for (const f of failures) console.error("  FAIL  " + f);
  process.exit(1);
}
console.log(`settings-integrity-check: ${passed} checks passed`);

/**
 * Guard: WP39, the P8 leads / customers / quotes / notifications long tail (web side).
 *
 *   LEADS-010  one pipeline order (list + detail); "next" never proposes a move the server refuses
 *   LEADS-013  a WhatsApp-only lead has a number to ring / message
 *   LEADS-008  follow-up is Karachi wall time end to end
 *   LEADS-005  an edit sends only what changed
 *   LEADS-011  Khoya asks why; lost / archived leads can be re-opened
 *   LEADS-004  the duplicate-phone warning is shown
 *   LEADS-021/026/036, SETUP-043  customer book + notifications read every page, counts are the server's
 *   LEADS-040, FLAGGED-013/014/055, LEADS-042  one deliberate step before accept / decline / boost; the server's sentence is shown
 *   FLAGGED-074  Holds / Field queue a hold offline and report a network failure as one
 *   FLAGGED-050  the claim form offers the rails the venue really takes; no "we'll hold your date"
 *   LEADS-063  the chat room is re-joined on every connect
 *   PUBLIC-019 / -026 / -038  newsletter tells the truth, one rating scale, one money story
 *   ACCESS-020  list filters fold Urdu spellings like the server
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/wp39-tail-check.mts
 */
import { LEAD_FLOW, nextStageOf } from "../lib/lead-stage.ts";
import { callNumber, waNumber, followUpInputValue, followUpPayload, changedLeadFields, LOST_REASONS } from "../lib/lead-tail.ts";
import { ratingLabel } from "../lib/rating-label.ts";
import { foldText } from "../lib/text-normalise.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

let passed = 0;
const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => { if (ok) passed++; else failures.push(`${name}${detail ? "  (" + detail + ")" : ""}`); };
const eq = (name: string, got: unknown, want: unknown) => check(name, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
const has = (name: string, file: string, needle: string | RegExp) => {
  const s = src(file);
  check(name, typeof needle === "string" ? s.includes(needle) : needle.test(s), file);
};
const hasNot = (name: string, file: string, needle: string | RegExp) => {
  const s = src(file);
  check(name, typeof needle === "string" ? !s.includes(needle) : !needle.test(s), file);
};

// ── LEADS-010: pipeline order vs the server's transition map (mirror of backend VALID_TRANSITIONS) ──
const SERVER: Record<string, string[]> = {
  new: ["contacted", "qualified", "lost", "archived"],
  contacted: ["qualified", "quoted", "lost", "archived"],
  qualified: ["new", "contacted", "quoted", "lost", "archived"],
  quoted: ["contacted", "qualified", "booked", "lost", "archived"],
  booked: [],
  lost: ["new", "contacted", "qualified"],
  archived: ["new"],
};
eq("flow order", LEAD_FLOW, ["new", "contacted", "qualified", "quoted", "booked"]);
for (const s of LEAD_FLOW.slice(0, -1)) {
  const nx = nextStageOf(s);
  check(`next from ${s} is never booked`, nx !== "booked");
  if (nx) check(`next from ${s} (${nx}) is a legal server move`, SERVER[s].includes(nx));
}
eq("next from new", nextStageOf("new"), "contacted");
eq("next from contacted", nextStageOf("contacted"), "qualified");
eq("next from qualified", nextStageOf("qualified"), "quoted");
eq("quoted hands over to the booking flow", nextStageOf("quoted"), null);
eq("booked / lost / archived have no next", [nextStageOf("booked"), nextStageOf("lost"), nextStageOf("archived")], [null, null, null]);
{
  const d = src("components/dashboard/mainScreens/leads/artifact/lead-detail-artifact.tsx");
  const pipe = [...(d.match(/const PIPE[\s\S]*?\n\]/)?.[0] || "").matchAll(/key: "(\w+)"/g)].map((m) => m[1]);
  eq("detail PIPE order equals LEAD_FLOW", pipe, LEAD_FLOW);
  check("detail uses the shared nextStageOf", d.includes("nextStageOf(lead.status)"));
  check("detail offers the booking flow at Quote", /atQuote && !lead\.bookingId/.test(d));
}

// ── LEADS-013 ──
eq("callNumber: phone first", callNumber({ contactPhone: "0300 1", contactWhatsapp: "0321 2" }), "0300 1");
eq("callNumber: WhatsApp-only lead", callNumber({ contactPhone: null, contactWhatsapp: "0321 2" }), "0321 2");
eq("waNumber: WhatsApp first", waNumber({ contactPhone: "0300 1", contactWhatsapp: "0321 2" }), "0321 2");
eq("waNumber: phone-only lead", waNumber({ contactPhone: "0300 1", contactWhatsapp: "" }), "0300 1");
eq("no number at all", [callNumber({}), waNumber(null)], ["", ""]);
has("list row uses callNumber / waNumber", "components/dashboard/mainScreens/leads/artifact/leads-artifact.tsx", "const waPhone = waNumber(l)");
has("booking prefill uses callNumber", "components/dashboard/mainScreens/leads/artifact/leads-artifact.tsx", "customerPhone: callNumber(l)");
has("detail uses callNumber / waNumber", "components/dashboard/mainScreens/leads/artifact/lead-detail-artifact.tsx", "const waPhone = waNumber(lead)");

// ── LEADS-008 ──
eq("prefill: 05:00Z is 10:00 in Karachi", followUpInputValue("2026-12-12T05:00:00.000Z"), "2026-12-12T10:00");
eq("prefill: a late UTC evening crosses into the next Karachi day", followUpInputValue("2026-12-12T20:30:00Z"), "2026-12-13T01:30");
eq("prefill: empty / junk", [followUpInputValue(null), followUpInputValue("nope")], ["", ""]);
eq("payload keeps the typed wall time, no offset", followUpPayload(" 2026-12-12T10:00 "), "2026-12-12T10:00");
eq("payload: empty is null", followUpPayload(""), null);
has("drawer prefills in Karachi time", "components/dashboard/mainScreens/leads/artifact/leads-artifact.tsx", "followUpInputValue(lx.nextFollowUpAt)");
has("drawer sends the wall time", "components/dashboard/mainScreens/leads/artifact/leads-artifact.tsx", 'nextFollowUpAt: followUpPayload(val("ld-followup"))');

// ── LEADS-005 ──
{
  const stored = { contactName: "Ali", contactPhone: "03001119999", estimatedBudget: "500000.00", estimatedGuests: 300, eventDate: "2030-05-17", status: "lost", source: "referral", inquiry: null, notes: "n", nextFollowUpAt: "2026-12-12T05:00:00.000Z", subVenueId: null, assignedToUserId: null };
  const same = { contactName: "Ali", contactPhone: "0300-1119999", estimatedBudget: 500000, estimatedGuests: 300, eventDate: "2030-05-17", status: "lost", source: "referral", inquiry: "n", nextFollowUpAt: "2026-12-12T10:00", subVenueId: null, assignedToUserId: null };
  eq("an unchanged re-send changes nothing", changedLeadFields(same, stored), {});
  eq("only the changed fields are sent", Object.keys(changedLeadFields({ ...same, contactName: "Bilal", estimatedBudget: 1 }, stored)).sort(), ["contactName", "estimatedBudget"]);
  eq("the note box falls back to notes", changedLeadFields({ inquiry: "n" }, stored), {});
  eq("a follow-up moved by an hour is sent", changedLeadFields({ nextFollowUpAt: "2026-12-12T11:00" }, stored), { nextFollowUpAt: "2026-12-12T11:00" });
}
has("edit sends the diff, not the whole form", "components/dashboard/mainScreens/leads/artifact/leads-artifact.tsx", "changedLeadFields(");
has("an emptied field is sent as null", "components/dashboard/mainScreens/leads/artifact/leads-artifact.tsx", "=== undefined) (diff as Record<string, unknown>)[k] = null");

// ── LEADS-011 ──
check("lost reasons offered", LOST_REASONS.length >= 4);
has("Khoya opens the reason form (list)", "components/dashboard/mainScreens/leads/artifact/leads-artifact.tsx", 'if (to === "lost") { openDrawer(s, "Lead khoya mark karein", lostReasonFormHtml(id)); return }');
has("Khoya opens the reason form (detail)", "components/dashboard/mainScreens/leads/artifact/lead-detail-artifact.tsx", 'adv.dataset.advStatus === "lost"');
has("the reason is sent as the status reason", "components/dashboard/mainScreens/leads/artifact/leads-artifact.tsx", "statusReason: lostReasonText(");
has("a lost / archived lead can be re-opened (list)", "components/dashboard/mainScreens/leads/artifact/leads-artifact.tsx", "Dobara kholein");
has("a lost / archived lead can be re-opened (detail)", "components/dashboard/mainScreens/leads/artifact/lead-detail-artifact.tsx", "Dobara kholein");

// ── LEADS-004 ──
has("the duplicate warning is shown", "components/dashboard/mainScreens/leads/artifact/leads-artifact.tsx", "possibleDuplicates.length");
has("create goes through createWithMeta", "components/dashboard/mainScreens/leads/artifact/leads-artifact.tsx", "LeadAPI.createWithMeta(");

// ── LEADS-021 / 026 / 036, SETUP-043 ──
has("customer book reads every page of 100 (CONCURRENCY-015 walker, merged)", "components/dashboard/mainScreens/customers/artifact/customers-artifact.tsx", "CustomersAPI.getAll(page, 100)");
has("customer tile uses the server total", "components/dashboard/mainScreens/customers/artifact/customers-artifact.tsx", "buildContent(list, data.total)");
has("'new this month' is first_seen", "components/dashboard/mainScreens/customers/artifact/customers-artifact.tsx", "isThisMonthInKarachi(c.first_seen)");
has("API maps firstSeenAt", "lib/api/dashboard.ts", "first_seen: (c.firstSeenAt as string)");
has("an unknown customer is 'not found', not an error banner", "lib/api/dashboard.ts", "=== 404) return null");
has("notifications read every page and keep the server total (CONCURRENCY-015 walker, merged)", "components/dashboard/mainScreens/notifications/artifact/notifications-artifact.tsx", "serverTotal");

// ── LEADS-040 / FLAGGED-013/014/055 / LEADS-042 ──
{
  const q = src("components/dashboard/mainScreens/quotes/artifact/quotes-artifact.tsx");
  check("accept only for the customer's counter", /q\.lastCounterBy === "customer"/.test(q));
  check("accept is behind openConfirm", /openConfirm\(s, \{\s*title: "Ye rate accept karein\?"/.test(q));
  check("decline is behind openConfirm", /openConfirm\(s, \{\s*title: "Quote decline karein\?"/.test(q));
  check("decline is offered on a new request too", !q.includes('${q.status !== "inquiry" ? `<button class="iconbtn" data-decline'));
  check("the server's sentence is shown", (q.match(/errMsg\(err,/g) || []).length >= 4);
  check("a vendor revises its own rate through respond", q.includes('q?.status === "inquiry" || q?.status === "quoted"'));
  check("price has a ceiling", q.includes('max="500000000"'));
  check("the dark-feature state is explicit", q.includes("quotesOff"));
  check("the accept call is only reachable from onConfirm", !/data-accept[\s\S]{0,400}await QuotesAPI\.accept/.test(q.replace(/onConfirm: async \(\) => \{[\s\S]*?\n          \},/, "")));
  const pr = src("components/dashboard/mainScreens/promote/artifact/promote-artifact.tsx");
  check("boost create is only reachable from onConfirm", /onConfirm: async \(\) => \{[\s\S]*?PromotionsAPI\.create/.test(pr) && (pr.match(/PromotionsAPI\.create/g) || []).length === 1);
  check("boost buttons are locked while a request is pending", pr.includes("hasPending") && pr.includes('data-boost="${p.placement}"'));
  check("the unsourced '3x' claim is gone", !pr.includes("3×"));
  has("a refused review delete shows the server's reason", "components/dashboard/mainScreens/reviews/artifact/reviews-artifact.tsx", "response?.data?.message || \"Delete nahi hua\"");
}

// ── FLAGGED-074 ──
has("holds screen queues offline", "components/dashboard/mainScreens/holds/artifact/holds-artifact.tsx", "placeHold(");
has("field screen queues offline", "components/dashboard/mainScreens/field/artifact/field-artifact.tsx", "placeHold(");
hasNot("holds screen no longer calls place directly", "components/dashboard/mainScreens/holds/artifact/holds-artifact.tsx", "VendorHoldsAPI.place(");
hasNot("field screen no longer calls place directly", "components/dashboard/mainScreens/field/artifact/field-artifact.tsx", "VendorHoldsAPI.place(");
has("the shared helper uses the existing hold_date op", "lib/hold-place.ts", 'outboxEnqueue("hold_date"');
has("a network failure is not 'slot taken'", "lib/hold-place.ts", "Network nahi hai");

// ── FLAGGED-050 ──
has("claim form offers only the venue's rails", "components/booking/steps/bank-transfer-screen.tsx", "const offered = (() =>");
has("claim form lists `offered`", "components/booking/steps/bank-transfer-screen.tsx", "{offered.map((m) => (");
hasNot("no 'we'll hold your date' promise", "components/booking/steps/bank-transfer-screen.tsx", "hold your date while");
has("the venue's WhatsApp is a link", "components/booking/steps/bank-transfer-screen.tsx", "https://wa.me/${waDigitsOf(v.whatsappNumber)}");

// ── LEADS-063 ──
has("chat room re-joined on every connect", "context/ChatContext.tsx", 'socket.on("connect", () => {');

// ── PUBLIC-019 ──
has("newsletter: a backend that did not accept is a 503", "app/api/newsletter/subscribe/route.ts", "if (!upstream.ok)");
hasNot("newsletter no longer 200s whatever happened", "app/api/newsletter/subscribe/route.ts", "backend pending");

// ── PUBLIC-026 ──
eq("rating 4.8", ratingLabel(4.8), "Exceptional");
eq("rating 4.2", ratingLabel(4.2), "Excellent");
eq("rating 3.7", ratingLabel(3.7), "Very Good");
eq("rating 3.4", ratingLabel(3.4), "Good");
eq("rating 2.5", ratingLabel(2.5), "Fair");
eq("rating 2.0", ratingLabel(2.0), "Fair");
eq("rating 1.9", ratingLabel(1.9), "Poor");
eq("rating 0", ratingLabel(0), "Poor");
has("card uses the shared scale", "components/VendorCard.tsx", "ratingLabelOf");
has("page uses the shared scale", "components/VendorDetails/VendorDetailsMobile.tsx", "ratingLabelOf(rating)");

// ── PUBLIC-038 ──
for (const f of [
  "app/(main)/how-it-works/page.tsx", "app/(main)/pricing/page.tsx", "app/(main)/help/page.tsx", "app/(main)/list-your-business/page.tsx",
  "app/(main)/services/page.tsx", "app/(main)/about/page.tsx", "components/homepage/monetization-sections.tsx",
  "components/seo/best-vendor-listicle-page.tsx", "components/seo/vendor-type-city-page.tsx",
]) {
  const s = src(f);
  for (const bad of [/holds the deposit/i, /PayFast Pakistan/, /Money-Back/i, /deposits? (is |are )?held/i, /deposit held/i, /held by \{?SITE_NAME/i, /Wedding Wala holds/i]) {
    check(`${f} has no escrow-era sentence (${bad})`, !bad.test(s));
  }
}

// ── ACCESS-020: the same fold as the server (backend tests/http/textNormaliseWp39) ──
const ALI = "علی";
eq("fold: Arabic yeh", foldText("علي"), ALI);
eq("fold: harakat + Arabic yeh", foldText("عَلِي"), ALI);
eq("fold: alef maksura", foldText("على"), ALI);
eq("fold: Arabic kaf", foldText("كراچي"), "کراچی");
eq("fold: heh forms", [foldText("هال"), foldText("ھال")], ["ہال", "ہال"]);
eq("fold: digits", foldText("٠٣٠٠ ۱۲۳"), "0300 123");
eq("fold: tatweel / zero-width / bidi", foldText("عـل‌ی‏"), ALI);
eq("fold: Latin only lower-cased", foldText("  Ali KHAN "), "ali khan");
eq("fold: null", foldText(null), "");
has("shell search folds", "components/dashboard/mainScreens/artifact/artifact-shell.tsx", "foldText(el.textContent).includes(query)");
has("pager search folds", "components/dashboard/mainScreens/artifact/artifact-shell.tsx", "foldText((tr.textContent || \"\") + \" \" + (tr.dataset.search || \"\")).includes(q)");
has("customers search folds", "components/dashboard/mainScreens/customers/artifact/customers-artifact.tsx", "foldText(tr.dataset.key).includes(q)");

// ── CUSTOMER-062 ──
has("cancel dialog says nothing paid when nothing was", "app/(main)/user/bookings/[id]/page.tsx", "You have not paid anything on this booking.");

if (failures.length) {
  console.error(`wp39-tail-check: ${failures.length} failed, ${passed} passed`);
  for (const f of failures) console.error("  FAIL " + f);
  process.exit(1);
}
console.log(`wp39-tail-check: all ${passed} checks passed`);

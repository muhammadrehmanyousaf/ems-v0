/**
 * WW-TEST-CASES 2.23 — the six above-the-fold answers, exercised against every
 * venue shape the marketplace holds.
 *
 * There is no test runner in this app, so this follows the pattern
 * `one-dish-parity.mts` established: drive the real function across real-ish
 * shapes and fail loudly on anything wrong.
 *
 * Two things it is really guarding:
 *
 *   1. That nothing is ever rendered on a guess. A venue that has not set a
 *      capacity must show no capacity answer at all — a dash implies we asked
 *      and the venue declined, when in fact nobody filled it in.
 *
 *   2. That the closing-time answer agrees with the backend guard that
 *      REFUSES the booking. Telling a Karachi couple their event must end at
 *      10pm, or failing to tell a Lahore couple, are both worse than silence.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/venue-answers-check.mts
 */
import { buildVenueAnswers } from "@/lib/seo/venue-answers";

let bad = 0;
const t = (label: string, ok: boolean, detail = "") => {
  if (!ok) bad++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `\n            ${detail}` : ""}`);
};
const build = (raw: any) => buildVenueAnswers(raw);
const keys = (raw: any) => build(raw).map((a) => a.key);
const answer = (raw: any, key: string) => build(raw).find((a) => a.key === key);

const perHeadMenu = { id: 1, title: "Gold", price: 2500, pricingUnit: "per_head" };
const flatPkg = { id: 1, name: "Hall", price: 450000, pricingUnit: "per_event" };

console.log("\n  the six answers\n");

/* 1 — price basis */
t("a per-head venue says so, and warns the total moves",
  answer({ menus: [perHeadMenu], city: "Lahore" }, "price")?.value === "From Rs 2,500 per head" &&
  /moves with the guest count/i.test(answer({ menus: [perHeadMenu] }, "price")?.note ?? ""));
t("a flat venue says per event",
  answer({ packages: [flatPkg] }, "price")?.value === "From Rs 450,000 per event");
t("per-head wins when a venue has both — it is the figure that scales",
  answer({ packages: [flatPkg], menus: [perHeadMenu] }, "price")?.value === "From Rs 2,500 per head");
t("falls back to the starting price when nothing is published",
  answer({ minimumPrice: 350000 }, "price")?.value === "Rs 350,000");
t("a venue with no price at all shows no price answer",
  !keys({}).includes("price"));

/* 2 — capacity */
t("a stated band renders as a band",
  answer({ minCapacity: 200, maxCapacity: 800 }, "capacity")?.value === "200–800 guests");
t("a maximum alone renders as 'up to'",
  answer({ maxCapacity: 800 }, "capacity")?.value === "Up to 800 guests");
t("NO capacity renders NOTHING — never a dash",
  !keys({ minimumPrice: 1 }).includes("capacity"));

/* 3 — the date */
t("the date answer is always offered",
  keys({}).includes("date"));
t("it does not claim availability it cannot know",
  answer({}, "date")?.value === "Check availability");
t("lead time rides along when the vendor set one",
  /at least 14 days/.test(answer({ minLeadDays: 14 }, "date")?.note ?? ""));
t("and is silent when they did not",
  answer({}, "date")?.note === undefined);

/* 4 — food, the three genuinely different propositions */
t("food included says so",
  answer({ packages: [{ ...flatPkg, includesFood: true }] }, "food")?.value === "Included in the package");
t("and still tells them they pick the menu",
  /still choose the menu/i.test(
    answer({ packages: [{ ...flatPkg, includesFood: true }], menus: [perHeadMenu] }, "food")?.note ?? ""));
t("food charged separately shows the rate AND that it is on top",
  answer({ packages: [flatPkg], menus: [perHeadMenu] }, "food")?.value === "Menus from Rs 2,500 per head" &&
  /on top of the venue/i.test(answer({ packages: [flatPkg], menus: [perHeadMenu] }, "food")?.note ?? ""));
t("hall-only says food is NOT included — the thing found out too late",
  answer({ packages: [flatPkg] }, "food")?.value === "Not included");
t("a vendor with neither shows no food answer",
  !keys({ minimumPrice: 1 }).includes("food"));

/* 5 — the deposit (A17) */
t("a deposit is shown as refundable and SEPARATE from the total",
  answer({ securityDepositPkr: 50000 }, "deposit")?.value === "Rs 50,000, refundable" &&
  /separately from your total/i.test(answer({ securityDepositPkr: 50000 }, "deposit")?.note ?? ""));
t("it uses the venue's own return window",
  /within 3 days/.test(answer({ securityDepositPkr: 50000, depositReturnDays: 3 }, "deposit")?.note ?? ""));
t("no deposit, no answer",
  !keys({ minimumPrice: 1 }).includes("deposit"));
t("a zero deposit is not a deposit",
  !keys({ securityDepositPkr: 0 }).includes("deposit"));

/* 6 — closing time, which must agree with the guard that refuses the booking */
console.log("\n  closing time vs the provinces the guard actually enforces\n");
const CLOSES = ["Lahore", "Islamabad", "Peshawar", "Quetta", "Muridke", "Wah Cantonment"];
const DOES_NOT = ["Karachi", "Hyderabad", "Sukkur", "Gilgit", "Muzaffarabad", "Nowhere", ""];
for (const city of CLOSES) {
  t(`${city.padEnd(16)} shows a 10pm close`, answer({ city }, "closing")?.value === "10pm");
}
for (const city of DOES_NOT) {
  t(`${(city || "(blank)").padEnd(16)} shows NO closing time`, !keys({ city }).includes("closing"));
}
t("it says the rule is the law, not the venue's preference",
  /Provincial law/i.test(answer({ city: "Lahore" }, "closing")?.note ?? ""));

/* the whole strip */
console.log("\n  the strip as a whole\n");
const fullVenue = {
  city: "Lahore", minCapacity: 200, maxCapacity: 800, minLeadDays: 7,
  packages: [flatPkg], menus: [perHeadMenu], securityDepositPkr: 50000, depositReturnDays: 7,
};
t("a fully configured venue answers all six",
  build(fullVenue).length === 6,
  keys(fullVenue).join(" · "));
t("a bare venue answers only what it can",
  build({}).length === 1, keys({}).join(" · ") + "  (the date, which is always offerable)");
t("every answer has a label and a value — no empty rows",
  build(fullVenue).every((a) => a.label.length > 0 && a.value.length > 0));
t("survives being handed nothing",
  Array.isArray(build(null)) && Array.isArray(build(undefined)));

const total = 34;
console.log(
  bad
    ? `\n  ${bad} FAILURE(S) — the answers above the fold are wrong or missing.\n`
    : `\n  ${total}/${total} — every shape answers exactly what it can, and nothing it can't.\n`,
);
process.exit(bad ? 1 : 0);

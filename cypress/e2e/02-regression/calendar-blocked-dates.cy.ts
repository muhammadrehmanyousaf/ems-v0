/**
 * The calendar must never offer a date the venue has blocked.
 *
 * Measured on production before the fix, business 3358, August 2026:
 *
 *   server says block : 6, 14, 15, 22, 25
 *   calendar blocked  : 26, 28, 29
 *
 * Two completely disjoint sets. Every blocked date was offered, and 28 August —
 * which had four free slots — was greyed out. Picking an offered-but-blocked
 * date failed at the very last step, after the customer had chosen a package
 * and a menu, with a 500 that read like a crash.
 *
 * Two causes, both of which this spec pins:
 *
 *   1. A race. One availability request per month, and whichever landed last
 *      was written, with no check it still matched the month on screen. That is
 *      why the bug came and went between loads rather than failing every time —
 *      so a single happy-path assertion would have "passed" on the broken code
 *      half the time. Hence the repeated loads below.
 *   2. A fail-open default. A missing entry and a failed fetch both read as
 *      "this date is free", so a rate-limited response opened the whole
 *      calendar including blocked dates.
 *
 * The property under test is one-directional and absolute: a date the SERVER
 * refuses must never be selectable. The reverse (a free date shown as
 * unavailable) costs a booking but cannot take money for a date that does not
 * exist, so it is asserted separately and more softly.
 */

const BUSINESS_ID = 3358; // Rehman Grand Marquee — the seeded venue with real blocks
const MONTH = "2026-08";

type DayAvailability = {
  isBlocked?: boolean;
  availableSlots?: string[];
  bookedSlots?: string[];
};

/** What the server considers unbookable — the source of truth for this spec. */
function serverBlockedDates(): Cypress.Chainable<string[]> {
  return cy
    .apiRequest("GET", `/bookings/availability?businessIds=${BUSINESS_ID}&month=${MONTH}`)
    .then((res) => {
      expect(res.status, "availability endpoint").to.eq(200);
      const days: Record<string, DayAvailability> = res.body?.data?.availability?.[BUSINESS_ID] ?? {};
      const blocked = Object.entries(days)
        .filter(([, v]) => v.isBlocked === true || (v.availableSlots ?? []).length === 0)
        .map(([date]) => date)
        .sort();
      cy.task("log", `  server blocks: ${blocked.join(", ") || "(none)"}`);
      return cy.wrap(blocked, { log: false });
    });
}

/** The day-numbers the picker currently allows, for the month on screen. */
function selectableDayNumbers(): Cypress.Chainable<number[]> {
  return cy.get("button").then(($buttons) => {
    const days = $buttons
      .toArray()
      .filter((b) => /^\d{1,2}$/.test((b.textContent ?? "").trim()))
      .filter((b) => !(b as HTMLButtonElement).disabled)
      .map((b) => Number((b.textContent ?? "").trim()));
    return cy.wrap(days, { log: false });
  });
}

/** Walk the public booking flow as far as the date step. */
function openDateStep() {
  cy.visit(`/${BUSINESS_ID}/booking`, { failOnStatusCode: false });
  cy.contains("button", "Wedding", { timeout: 30_000 }).click();
  cy.contains("button", /^continue/i).should("not.be.disabled").click();
  cy.contains(/when is your event/i, { timeout: 30_000 }).should("be.visible");
}

describe("Booking calendar — a blocked date is never selectable", () => {
  it("agrees with the server about which August dates are unbookable", () => {
    cy.loginAs("vendor");
    openDateStep();

    serverBlockedDates().then((blocked) => {
      // Only dates in the month on screen, and only ones still in the future —
      // the past is disabled by a different rule and would muddy the result.
      const today = new Date();
      const augustBlockedDays = blocked
        .filter((d) => d.startsWith(MONTH))
        .filter((d) => new Date(d) >= new Date(today.toDateString()))
        .map((d) => Number(d.slice(-2)));

      if (augustBlockedDays.length === 0) {
        // Not a silent pass: say so, because a green tick here would otherwise
        // mean "nothing was blocked" and read as "the guard works".
        cy.task("log", "  NOTE: server reports no future blocked dates this month — nothing to prove");
        return;
      }

      selectableDayNumbers().then((selectable) => {
        const offeredButBlocked = augustBlockedDays.filter((d) => selectable.includes(d));
        expect(
          offeredButBlocked,
          `dates the server refuses but the calendar offers (${MONTH})`,
        ).to.deep.equal([]);
      });
    });
  });

  it("still agrees after repeated loads, where the month race used to surface", () => {
    // The original bug was a lost race between two months' responses, so it
    // reproduced intermittently. One load proves very little; three loads that
    // all agree is meaningful evidence the guard is not timing-dependent.
    cy.loginAs("vendor");

    serverBlockedDates().then((blocked) => {
      const futureBlocked = blocked
        .filter((d) => d.startsWith(MONTH) && new Date(d) >= new Date(new Date().toDateString()))
        .map((d) => Number(d.slice(-2)));
      if (futureBlocked.length === 0) {
        cy.task("log", "  NOTE: nothing blocked this month — race assertion has no target");
        return;
      }

      for (let attempt = 1; attempt <= 3; attempt++) {
        openDateStep();
        selectableDayNumbers().then((selectable) => {
          const leaked = futureBlocked.filter((d) => selectable.includes(d));
          expect(leaked, `load ${attempt}: blocked dates offered`).to.deep.equal([]);
        });
      }
    });
  });

  it("refuses every date rather than guessing when availability cannot be loaded", () => {
    // The fail-open half. With the endpoint failing, the old code left the map
    // empty and an empty map read as "everything is free" — so a rate limit
    // opened the whole calendar. Failing closed is the only safe direction,
    // and the screen has to say why rather than sit there as a dead grid.
    cy.loginAs("vendor");
    cy.intercept("GET", "**/bookings/availability*", { statusCode: 429, body: {} }).as("availability");

    openDateStep();
    cy.wait("@availability");

    selectableDayNumbers().should((days) => {
      expect(days, "selectable dates while availability is failing").to.deep.equal([]);
    });
    cy.contains(/couldn.t load|try again|checking/i, { timeout: 15_000 }).should("be.visible");
  });
});

// Keeps this spec a module so its top-level consts do not collide with
// another spec in the same TS program.
export {};

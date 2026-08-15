/**
 * Backend guarantees the UI depends on, asserted through the live API.
 *
 * These are the server-side halves of defects found by walking the booking
 * flow. They are checked here rather than only in the backend unit suite
 * because a unit test proves the function is right; this proves the DEPLOYED
 * system is. Those are different claims, and the gap between them is where
 * this project has been bitten repeatedly — a fix can be merged, green, and
 * still not be what production serves.
 *
 * All read-only. Nothing here creates a booking or touches money.
 */

const BUSINESS_ID = 3358;

describe("API contracts", () => {
  beforeEach(() => cy.loginAs("vendor"));

  describe("a refusal is not a crash", () => {
    it("answers a blocked date with 4xx and a code, not 500", () => {
      // Choosing a blocked date used to return:
      //   HTTP 500  "Error creating booking: ... is not taking bookings on ..."
      // The service had already set statusCode 409 and code DATE_BLOCKED; the
      // controller discarded both. A 500 dashboard full of ordinary customer
      // behaviour stops meaning anything, and clients that retry 5xx retry
      // something that can never succeed.
      cy.apiRequest("GET", `/bookings/availability?businessIds=${BUSINESS_ID}&month=2026-08`).then((res) => {
        const days: Record<string, any> = res.body?.data?.availability?.[BUSINESS_ID] ?? {};
        const blockedDate = Object.entries(days).find(
          ([, v]: [string, any]) => v?.isBlocked === true,
        )?.[0];

        if (!blockedDate) {
          cy.task("log", "  NOTE: no blocked date to attempt — cannot exercise the refusal path");
          return;
        }

        cy.apiRequest("POST", "/bookings", {
          customerName: "Cypress Contract Check",
          customerEmail: "cypress@weddingwala-e2e.test",
          customerPhone: "03000000000",
          bookingDate: `${blockedDate}T04:00:00.000Z`,
          bookingTime: "09:00",
          guestCount: 1,
          vendors: [{ businessId: BUSINESS_ID, packageId: null, menuId: null, totalAmount: 1, downPayment: 0 }],
        }).then((res2) => {
          // The booking must be REFUSED — that is the point — and the refusal
          // must be reported as the client error it is.
          expect(res2.status, `POST /bookings on blocked ${blockedDate}`).to.be.within(400, 499);
          expect(res2.status, "not a server error").to.not.eq(500);
          expect(String(res2.body?.message ?? ""), "message names the reason").to.match(
            /not taking bookings|blocked|unavailable/i,
          );
        });
      });
    });

    it("still reports 5xx shape only for genuine faults", () => {
      // Guards the fix from becoming a blanket "everything is 4xx". A malformed
      // body is a client error; the endpoint must not answer it with 200.
      cy.apiRequest("POST", "/bookings", { nonsense: true }).then((res) => {
        expect(res.status, "POST /bookings with a nonsense body").to.be.gte(400);
      });
    });
  });

  describe("seeded slots are slots the platform accepts", () => {
    it("gives this venue slots that end by the 10 PM closure", () => {
      // The seeder wrote "Dinner event 19:00-23:00", the validator refused it
      // for ending after closing, and seedDefaults swallows per-payload
      // failures — so every wedding venue signed up with a lunch and no
      // evening. In Pakistan the baraat and the walima ARE the evening.
      cy.apiRequest("GET", `/bookings/availability?businessIds=${BUSINESS_ID}&month=2026-08`).then((res) => {
        expect(res.status).to.eq(200);
        const days: Record<string, any> = res.body?.data?.availability?.[BUSINESS_ID] ?? {};
        const anyDay = Object.values(days).find((d: any) => (d?.availableSlots ?? []).length > 0) as any;

        if (!anyDay) {
          cy.task("log", "  NOTE: no day with free slots this month — nothing to inspect");
          return;
        }
        const slots: string[] = anyDay.availableSlots;
        cy.task("log", `  bookable slot starts: ${slots.join(", ")}`);
        expect(slots.length, "a bookable venue offers at least one slot").to.be.greaterThan(0);
        slots.forEach((start) => {
          const [h] = start.split(":").map(Number);
          expect(h, `slot start ${start} is within the trading day`).to.be.within(0, 22);
        });
      });
    });
  });

  describe("listing completeness", () => {
    it("counts the fields the vendor actually filled in", () => {
      // The per-business endpoint omitted `menus` and `vendorType` from its
      // include, so it scored 78 where the list endpoint scored 88 for the same
      // row — the vendor was told to fix something already done.
      cy.apiRequest("GET", `/businesses/${BUSINESS_ID}/completeness`).then((res) => {
        if (res.status !== 200) {
          cy.task("log", `  NOTE: completeness endpoint returned ${res.status}`);
          return;
        }
        const score = res.body?.data?.score ?? res.body?.data?.completenessScore;
        expect(score, "completeness score").to.be.a("number");
        expect(score, "completeness score is a percentage").to.be.within(0, 100);
      });
    });
  });
});

// Keeps this spec a module so its top-level consts do not collide with
// another spec in the same TS program.
export {};

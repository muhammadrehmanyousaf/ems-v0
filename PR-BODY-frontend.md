Frontend half. **Merge the backend PR and run migration `20260824170000` first** — this reads columns it adds.

## Packages and menus show everything

The detail page rendered a package as a name and a bare number, and menus not at all. `PKR 1,320,000` and `PKR 2,500` looked identical, so a per-head rate read as the whole wedding. Menus were returned by the API and never carried into `VendorDetail`.

Now: price with its unit and a worked example, the guest **band** the package is sold for (not the hall's capacity), the bundled menu named with its per-head value, extras **with prices**, per-look pricing, the full gallery, live-counter chips, per-head supplements, dish count and guarantee floor.

**A bug the test suite caught in my own work:** every live menu is the legacy flat shape with no classification, so every dish landed in `other` — whose label is *"Snack / live counter (not counted)"*. A venue's Rs 3,900/head Platinum menu was rendering to couples as snacks. An unclassified menu is now listed plainly; that label is used only where a vendor declared it.

## A screen for the final bill

The platform had the settlement arithmetic and no screen, so the bill was struck on WhatsApp at the gate. One component, two roles — what ends an argument is that both parties saw the same numbers. The `why` on every line is the point: a family reading *"280 attended. The guarantee was agreed when you booked, and the food was prepared for 400."* doesn't have the argument at all.

The count form mirrors the server's guard — children and drivers are counted **within** the total, not on top — rather than letting the server be the first to say so.

## A venue can cancel

`PATCH /:id/vendor-cancel` (BK-036) exists with a forced 100% refund, payout cancellation and claw-back, and **nothing ever called it**. So a venue that had to pull out could only ask the *customer* to cancel — which applies the customer's policy and forfeits their advance. The family paid for the venue's problem.

Deliberately heavy: a real reason is required and the customer reads it, the consequence is spelled out in money, and the confirm names the refund.

Third instance this session of the same defect shape — `/approve`, quote `accept`, now `vendor-cancel`. Each fully built server-side and unreachable.

## Verification

Typecheck ratchet **0 new errors** on every commit. Live suite against production: **48 pass, 0 fail** once the paired backend fixes deployed.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

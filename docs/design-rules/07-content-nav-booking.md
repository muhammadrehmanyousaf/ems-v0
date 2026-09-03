# 07 — Content, Navigation & the Booking Flow

Words and wayfinding are design material. And the booking/refund flow is where
WeddingWala earns or loses trust — it gets its own rules.

---

## A. UX writing / microcopy

1. **Write from the user's side of the screen.** Name things by what a person
   recognizes, not how the system is built. A family manages *bookings* and
   *refunds*, not "records" or "entities".
2. **Buttons name the outcome (first person of intent):** "Confirm booking",
   "Send request", "Delete 3 photos" — never "Submit", "OK", "Confirm".
   The label answers *"what happens when I tap this?"*
3. **Say it in seconds.** Microcopy is scanned, not read. Cut every word that
   isn't doing work.
4. **Errors: what happened, why, how to fix — no blame.** "Please enter a valid
   Pakistani number, e.g. 0300 1234567", not "Invalid input detected." A gentle
   tone on failure keeps people trying.
5. **A control says exactly what it does, then confirms it happened.** Button
   "Publish" → toast "Published". No vague "Success".
6. **Consistent voice.** WeddingWala mixes registers deliberately — Roman-Urdu
   where the audience lives (Khata, Wapsi, Baqaya, "Aap ko dena hai"), plain
   English elsewhere. Keep a term's register consistent wherever it appears.
7. **Empty states are copy, not decoration** — one guiding line + the next action
   (file 05 rule 22).
8. **Numbers and money are content:** format consistently (`Rs 175,000`),
   right-aligned tabular figures in tables (file 03 rule 16).

---

## B. Navigation & information architecture

9. **Navigation is the visible layer of IA** — fix the structure first, then the
   menu. Group by what users do, not by how the org is built.
10. **Plain-language labels beat clever ones**, on every usability metric. "Refunds
    owed", not "Reconciliation". "Bookings", not "Engagements".
11. **Always show where the user is:** highlight the current nav item, use
    breadcrumbs on deep pages (just below the header), and keep the rail's active
    icon matched to the panel shown. (This is exactly the WeddingWala nav trap —
    an `owns` mismatch lights the wrong module; see the multi-venue/nav notes.)
12. **Reduce & chunk nav items (Hick + Miller):** a handful of top-level
    destinations, grouped. Hide advanced/rare items behind progressive
    disclosure, not in the primary rail.
13. **Serial position:** put the most important destinations first and last in a
    list — they're remembered best.
14. **Consistency (Jakob's Law):** cart, search, login, date-picker, breadcrumbs
    behave the way they do everywhere else. Don't reinvent standard patterns.
15. **Mobile nav:** a hamburger hides options — fine for secondary items, but keep
    the 3–5 primary destinations visible (bottom bar/tabs) where space allows.

---

## C. The booking / checkout flow (Baymard — this is where money is won or lost)

16. **Fewest steps, fewest fields.** Ask only what's truly required to book. Every
    field past the essentials drops completion 4–6%. Defer or remove the rest.
17. **Total price transparency, early.** Show all costs — deposit, balance, any
    fees — before the final step. Hidden/surprise costs are the #1 cause of
    abandonment. (WeddingWala is direct-pay: make the deposit vs balance, and what
    the platform does/doesn't hold, unmistakable.)
18. **Don't force account creation to proceed.** Where a guest/low-friction path
    is possible, make it prominent — never bury it.
19. **Show progress in multi-step flows** (Zeigarnik + Goal-Gradient): "Step 2 of
    3", a progress bar, and a pre-filled checklist pull people to completion.
20. **Confirm the money state at every transition** — what's paid, what's due, by
    when — in plain words, so vendor and customer never disagree. (This is the
    WW-SETTLE principle: one shared, legible record.)
21. **Nail the peak and the end (Peak–End Rule):** the confirmation screen is the
    emotional peak of a wedding booking — make it warm and reassuring, with clear
    next steps, never a bare "Success" and a dead-end.
22. **Errors in the money path are trust-critical:** never show a raw provider
    error; explain in plain language and give a safe next action. A refund left
    "waiting on the customer" is stated as *status*, not as a failure.
23. **Respect the two-sided settlement:** where both parties must act (vendor pays
    → customer confirms), each side sees exactly what the other has done and what
    it's waiting on — no silent auto-resolution.

---

## Checklist

- [ ] Buttons name the outcome; errors say what/why/how without blame?
- [ ] Copy scannable; money formatted consistently (tabular in tables)?
- [ ] Register (Roman-Urdu / English) consistent per term?
- [ ] Nav labels plain-language; current location always shown?
- [ ] Primary destinations few, grouped, and visible on mobile?
- [ ] Booking: only essential fields, total price shown early?
- [ ] Multi-step flows show progress; money state stated at each transition?
- [ ] Confirmation screen is a warm peak with clear next steps?
- [ ] Money-path errors are plain-language with a safe next action?

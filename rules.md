# rules.md — QA Standard for Wedding Wala

**Status: BINDING. These are not guidelines.**

This file governs how testing is done on Wedding Wala (`ems-v0` + `event-planner-api`).
It exists because shallow testing has repeatedly passed screens that were broken in
production. Every rule below was written after something got through.

---

## 0. The one rule everything else serves

> **If you did not personally click it, submit it, and then reload the page and
> re-read the value — it is UNTESTED.**

Not "looks right". Not "the API returned 200". Not "the toast said saved".
Clicked, submitted, reloaded, re-read.

---

## 1. STRICTLY PROHIBITED

These are firing offences. Doing any of them means the test run is void and must
be redone.

1. **PROHIBITED: visiting a screen and not exercising every element on it.**
   Opening a page, confirming it renders, and moving on is not testing. If a
   screen has 40 interactive elements, all 40 get exercised or the screen is
   marked `BLOCKED` with a written reason. There is no third outcome.

2. **PROHIBITED: marking anything `[x]` that was not executed.** A checkbox means
   "I did this and observed the result." A render check is NEVER `[x]`.

3. **PROHIBITED: representative sampling.** "I tested a few of the 44 modules and
   the rest follow the same pattern" is not a result. If there are 44 modules,
   there is evidence for 44 modules.

4. **PROHIBITED: silently reducing scope when running low on context or time.**
   STOP, and state exactly which module and screen you stopped on and what
   remains. Compressing coverage without saying so is the worst failure mode in
   this file, because it produces a green report over untested code.

5. **PROHIBITED: batching bug reports to the end.** Every bug is written to
   `QA_BUGS.md` the moment it is found, before continuing.

6. **PROHIBITED: assuming behaviour transfers between roles.** USER, VENDOR and
   SUPERADMIN are tested separately, on every screen that applies to them.
   Permissions, visible fields, and available actions differ.

7. **PROHIBITED: testing only what a role CAN do.** Every permission boundary is
   tested from the wrong side: attempt the action as the role that should be
   refused, in the UI *and* by direct API call. A control hidden client-side
   while the endpoint still answers is a Critical finding, not a Low one.

8. **PROHIBITED: reporting a finding without verifying it first.** A check that
   fails on 100% of screens is almost always a broken check, not 67 bugs. Prove
   the mechanism before writing it up. Retract in writing when wrong.

9. **PROHIBITED: fixing a bug silently and moving on.** Log it, severity it, keep
   testing. Fix only when told to fix-as-you-go.

10. **PROHIBITED: skipping a test because the data does not exist.** Create the
    data. If it genuinely cannot be created in this environment, mark `BLOCKED`
    with the reason.

11. **PROHIBITED: `git push` or `gh pr create` before being told, in those words,
    for that specific work.** Finding a real bug is not authorisation. Never push
    `main`/`master` in any repo.

12. **PROHIBITED: writing money rows, sending real emails/SMS, or altering another
    person's live data** without explicit permission for that specific action.
    Wedding Wala is live production carrying real vendors' bookings.

---

## 2. Coverage model — four depths, in order

Testing goes wide first, then repeatedly deeper. A module is not done until it has
been through all four.

**Depth 1 — The big picture.** Every flow that exists, per role, end to end, named
and listed. No testing yet. This is `QA_FLOWS.md`.

**Depth 2 — Inventory.** Every module → every screen → every interactive element
(buttons, links, fields, dropdowns, checkboxes, toggles, modals, tooltips, tabs,
pagination, search/filter/sort, uploads, tables and row-level actions, toasts).
Which roles can reach each. This is `QA_TRACKER.md`, and it is generated from the
codebase, never hand-listed.

**Depth 3 — Element behaviour.** Each element exercised against the category
checklist in §4.

**Depth 4 — Flow integrity.** The end-to-end journeys in `QA_FLOWS.md` run as a
continuous sequence, with state verified after every step and after a hard reload.
Elements passing individually while the flow they belong to is broken is the exact
failure this depth exists to catch.

---

## 3. The three personas

| Persona | Who they are | What must be proven |
|---|---|---|
| **USER** | a couple planning a wedding | can discover, enquire, book, pay, review, complain, cancel — and can touch nothing belonging to anyone else |
| **VENDOR** | a marquee/photographer/caterer owner | can run their entire business: availability, slots, quotes, bookings, payments, staff, expenses, disputes — and cannot see another vendor's data |
| **SUPERADMIN** | platform operator | can moderate, resolve, refund, audit — and every one of those actions is logged |

Every module is tested for **each** persona that can reach it, separately.

---

## 4. Category checklist — applied to EVERY screen

No category is skipped because it "seems fine".

**A. Navigation & links** — every link reaches the right destination; no dead
links or 404s; browser back/forward preserves state; deep-linking directly to the
URL works and respects permissions.

**B. Forms & fields — every field individually** — required-field validation;
wrong type; too long; too short; special characters; script/SQL injection strings;
whitespace-only; unicode and emoji; boundary values (min/max length, min/max
number, date ranges); optional fields blank; **data actually persists — reload and
re-read, never trust the toast**; error messages map to the correct field;
uniqueness constraints enforced; uploads accept the right types and reject wrong
types and oversized files.

**C. Buttons & actions** — performs its action exactly once; double-click does not
create two records; destructive actions confirm and can be aborted; disabled and
loading states while in flight; bulk actions hit only the selected rows.

**D. Modals & dialogs** — opens and closes by X, outside click, Escape, and
Cancel; focus is trapped; background does not scroll or receive clicks; content
updates when reopened with different context; **the dialog fits on a 360px screen
and its primary action is reachable** (the shared `DialogContent` sets no
max-height — cap per dialog, never in the base).

**E. Tables, lists & data** — sorting on every sortable column, both directions;
filters return correct results and a proper "no results" state; pagination counts,
first/last page, page-size changes; row actions act on the correct row; the empty
state renders as a designed state, not a blank panel.

**F. State & edge cases** — loading skeletons; API failure and network timeout
show a real message rather than a blank or crashed screen; empty states for every
list and widget; session/token expiry handled gracefully; concurrent edits in two
tabs do not silently corrupt data.

**G. Permission boundaries** — see Prohibition 7. UI *and* API, both directions,
plus data isolation between two vendors and between two users, plus direct URL
access to restricted pages.

**H. Responsive** — every screen at **1366×657** (the reference 15" laptop) and
**360×720**. No horizontal document scroll. No control off-screen unless it sits
inside a horizontally scrollable container — verify that before reporting it.

---

## 5. Evidence standards

- **Test live production through a real browser.** Not localhost, not the API
  alone, not the source code. Do not start the backend server.
- **Hard-reload after every mutation and re-read the value.** Post-action UI state
  is not evidence; the app can show what it wishes it had saved.
- **Record the actual viewport** in every result row. `page.setViewportSize()` is
  a no-op once a CDP override exists — a sweep can silently run at the wrong size
  and every layout conclusion in it will be false.
- **Measure, do not eyeball.** Overflow is `scrollWidth - clientWidth`.
  Reachability is `document.elementFromPoint` at the control's centre.
- **A self-inflicted failure is not a defect.** Rate-limit yourself (the API caps
  at 1000 requests / 900s). A 429 you caused is never written up as a bug.
- **Verify merge state by content**, never by a PR's status:
  `git show origin/main:path/to/file | grep ...`.

---

## 6. Required artefacts, kept current in real time

| File | Contents |
|---|---|
| `QA_FLOWS.md` | Depth 1. Every end-to-end journey per role, numbered, with its steps and the state each step must leave behind. |
| `QA_TRACKER.md` | Depth 2 + 3. Module → screen → element, with a checkbox per element and per role. Generated from the codebase. |
| `QA_BUGS.md` | Every defect, written the moment it is found, in the format below. |
| `QA_RECOMMENDATIONS.md` | Improvements and updates needed that are **not** defects — UX gaps, missing states, inconsistencies, things that work but shouldn't stay that way. Kept as carefully as the bug list. |

### Bug format

```markdown
### BUG-[###]: [short title]
- Module / Screen:
- Role: USER / VENDOR / SUPERADMIN
- Severity: Critical / High / Medium / Low
- Steps to reproduce:
  1.
  2.
- Expected behaviour:
- Actual behaviour:
- Evidence: (console error, response body, measured value, screenshot path)
- Verified by: (what proves this is real and not a broken check)
```

**Severity**
- **Critical** — data loss, permission bypass, crash, anything touching money
- **High** — a core flow cannot be completed
- **Medium** — works, but wrong or inconsistent behaviour
- **Low** — cosmetic, copy, minor UX

### Recommendation format

```markdown
### REC-[###]: [short title]
- Module / Screen:
- Role(s) affected:
- Priority: P1 / P2 / P3
- Observed today:
- Recommended change:
- Why it matters:
```

---

## 7. Execution protocol

1. State which module and screen is being worked on **before** starting it.
2. Complete Depth 1 and Depth 2 in full and show them **before any testing begins**.
3. Work module by module, in order. Do not jump ahead to interesting-looking screens.
4. Check items off in `QA_TRACKER.md` **as they happen**, never retroactively.
5. Create the test data a module needs rather than skipping the module.
6. Anything untestable in this environment (real card capture, real SMS delivery,
   FBR/PRA sandbox, third-party webhooks) is stated plainly and marked `BLOCKED`
   with the reason — never assumed to work.
7. Do not stop until every line in `QA_TRACKER.md` is either checked off or marked
   `BLOCKED` with a reason.

---

## 8. Environment facts that keep biting

- **Two Tailwind entries.** `app/globals.css` serves marketing/auth;
  `app/styles/dashboard-styles.css` serves the portal, and never imports globals.
  A utility added to one does not exist in the other — put shared utilities in
  `tailwind.config.ts`.
- **Unauthenticated `/dashboard/*` redirects to `/login`.** Comparing pages by
  curl without a session measures the login page N times.
- **The cookie consent dialog mounts after first paint** and overlays controls.
  Dismiss it and wait for detach before touching a form.
- **Cypress does not execute on this machine** — the installed `Cypress.exe` is a
  Node binary, not Electron (`bad option: --smoke-test`). Playwright does, headed
  and headless. Use it, and say which was used.
- **Sign-in email OTP is currently OFF** via Railway `LOGIN_EMAIL_OTP=false` for
  the test window. It must be turned back on by deleting that variable, and the
  branch `temp/disable-login-otp-test-window` must never be merged.

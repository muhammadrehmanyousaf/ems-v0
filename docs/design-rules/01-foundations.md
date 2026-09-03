# 01 — Foundations: Heuristics & Laws of UX

The *why* behind every other file. Read before designing a flow. These decide
**what** a screen should do; the rest decide **how** it looks.

---

## A. Nielsen's 10 Usability Heuristics (the standard since 1994)

Rules of thumb, not laws — but every violation needs a reason.

1. **Visibility of system status.** Always tell the user what's happening.
   Loading states, progress, saved/unsaved, "sent", "3 of 5 done". Never a dead
   click. → *Every async action shows feedback within 400ms (see file 06).*
2. **Match between system and the real world.** Speak the user's language, not
   the system's. A person manages *bookings* and *refunds*, not "records" or
   "entities". WeddingWala: Roman-Urdu where the audience uses it (Khata, Wapsi,
   Baqaya), plain English elsewhere.
3. **User control & freedom.** Provide a clear exit / undo / cancel. No trap
   states. Every destructive action is reversible or confirmed.
4. **Consistency & standards.** Same thing looks and behaves the same
   everywhere. Follow platform conventions (Jakob's Law, below). One button
   style per role across the whole app.
5. **Error prevention.** Better than good error messages. Constrain inputs,
   confirm risky actions, disable what can't be done, use smart defaults.
6. **Recognition rather than recall.** Show options; don't make people remember.
   Visible actions, labelled icons, recently-used, autofill.
7. **Flexibility & efficiency of use.** Shortcuts for experts (keyboard, saved
   filters), guidance for novices — the same screen serves both.
8. **Aesthetic & minimalist design.** Every extra element competes with the
   essential ones. Remove before you add.
9. **Help users recognize, diagnose, recover from errors.** Plain language, say
   what went wrong and how to fix it, point at the field (see file 07).
10. **Help & documentation.** Ideally unneeded — but when present, searchable,
    task-focused, and close to where the question arises.

**How to check:** walk the screen and name which heuristic each control serves.
If a control serves none, it's a candidate for removal (#8).

---

## B. Laws of UX (design against how minds actually work)

| Law | What it means | The rule it forces |
|---|---|---|
| **Hick's Law** | More/complex choices = slower decisions | Reduce & chunk options; highlight the recommended default. A vendor nav shows a handful of rows, not fifteen. |
| **Fitts's Law** | Bigger + closer = faster to hit | Primary buttons large and near the hand/eye; destructive actions small and far. Mobile targets ≥ 44px (file 06). |
| **Miller's Law** | ~7±2 items in working memory | Chunk data (phone numbers, steps, menu groups). |
| **Jakob's Law** | Users expect your site to work like the others they use | Don't reinvent cart/search/login/date-picker. Standard patterns win. |
| **Law of Proximity** | Close things read as related | Group by spacing, not borders. Space *inside* a group < space *between* groups. |
| **Law of Similarity** | Similar-looking things read as a group | Consistent styling signals same kind. |
| **Law of Prägnanz** | The eye prefers the simplest reading | Clean, ordered layouts are literally easier to look at. |
| **Law of Common Region** | A shared boundary/background groups items | A card unifies its contents. |
| **Von Restorff (Isolation)** | The item that differs is remembered | Make the one CTA visually distinct. |
| **Serial Position** | First & last items remembered best | Put key nav items at the start and end. |
| **Peak–End Rule** | Judged by the most intense moment + the end | Nail the emotional peak (booking confirmed!) and the final step (a warm confirmation, never a dead-end). |
| **Zeigarnik Effect** | Unfinished tasks nag the memory | Progress bars, "2 of 3 steps" pull people to completion. |
| **Goal-Gradient** | Motivation rises near the goal | Show progress; a checklist pre-filled 20% gets finished more. |
| **Aesthetic–Usability** | Attractive = perceived as more usable | Polish buys goodwill — but never replaces real usability. |
| **Doherty Threshold** | Engagement holds if system responds <400ms | Optimistic UI, skeletons, instant feedback (file 06). |
| **Tesler's Law** | Complexity is conserved — someone absorbs it | The design absorbs it (smart defaults, autofill), not the user. |
| **Postel's Law** | Accept liberally, emit conservatively | Accept messy input (any phone format, spaces in card numbers); return clean output. |
| **Occam's Razor** | Simplest solution that works | Remove elements until removing one breaks function. |

> **Grounded in the source (read in full, Aug 2026):** *Psychology of UX Design*
> (Alok Kumar, BPB 2024) organizes these as **7 Laws** — Fitts, Hick, Miller,
> Jakob, Tesler, **Gestalt**, Doherty — and **6 Effects** (below). The full
> **Gestalt** set is Proximity, Similarity, **Continuity** (the eye follows
> lines/curves), **Closure** (we complete incomplete shapes), and **Focal Point**
> (the element that stands out draws the eye first). The persuasion side —
> gamification + biases — is its own file: [08-psychology-persuasion.md](08-psychology-persuasion.md).

### B2. Psychological Effects (memory & perception)

| Effect | What it means | The rule it forces |
|---|---|---|
| **Zeigarnik** | Unfinished tasks stay in memory | Progress bars, "2 of 3 done" — pull people to completion (file 05/07). |
| **Goal-Gradient** | Motivation rises near the goal | Show progress; a pre-filled checklist gets finished more. |
| **Von Restorff (Isolation)** | The distinct item is remembered | Make the ONE thing that matters (primary CTA, recommended tier) stand out. |
| **Storytelling** | People remember stories > facts | Frame the journey — "Emma & Liam's Wedding, 2 days left" beats "Booking #713". A wedding *is* a story. |
| **Halo** | A good impression in one area spills to others | A beautiful, polished listing makes the vendor *feel* more trustworthy (and vice-versa: one broken screen taints the whole app). Aesthetic quality is a trust signal. |
| **Picture Superiority** | People remember images > words | Lead venue cards/detail with strong photography; pair every important concept with an icon (file 07). |

---

## C. The design order (never skip, never reorder)

1. **Problem** → who is this for, what do they need, what's the ONE primary action.
2. **Flow & structure** → wireframe in grayscale. *Structure before visuals.*
3. **Hierarchy** → make important things prominent (file 02).
4. **Type & color** → apply the systems (files 03, 04).
5. **Depth & finish** → shadows, empty/loading/error states (file 05).
6. **Motion** → last, and sparing (file 06).
7. **Test → iterate** → real users reveal what we missed. *Great design is never finished.*

**Grayscale-first is a hard rule:** if it doesn't read clearly in black, white,
and grays — via spacing, size, weight, contrast — color won't save it. Color is
the last layer, not a crutch for missing hierarchy.

**Wireframe ≠ mockup ≠ prototype** *(from the UCD course, doc 1):*
- **Wireframe** — low-fidelity blueprint: structure, placement, navigation. No
  color, no polish. This is where we settle the flow.
- **Mockup** — higher-fidelity static visual: real type, color, spacing applied
  (files 02–05).
- **Prototype** — clickable/interactive: real transitions and states, testable
  with users.
Do them in that order. *"Design **with** the users, not just **for** the users."*

**UCD is a loop, not a line:** Identify user needs → Build (wireframe) → Test
with real users → Refine → repeat until it genuinely meets the need. Every test
that surfaces a problem sends you back a step — that's the process working, not
failing.

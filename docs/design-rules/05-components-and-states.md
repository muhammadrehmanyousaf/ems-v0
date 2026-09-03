# 05 — Components, Forms & States

Build on the shadcn/Radix components already in `components/ui/`. These rules
govern how they're composed and, critically, their **non-happy states**.

---

## A. Buttons & actions

1. **One primary per view** (solid, high-contrast). Secondary = outline/ghost;
   destructive = red, and never the default focus.
2. **Button label names the outcome** (file 07): "Confirm booking", not "Submit".
3. **Every button has all states:** default, hover, active/pressed, focus-visible,
   disabled, and **loading** (spinner + disabled, label like "Saving…").
4. **Disabled ≠ silent.** If a button is disabled, it must be obvious *why*
   (helper text, or don't disable — validate on submit instead).
5. **Icon-only buttons need an accessible label** (`aria-label`) and a tooltip.

---

## B. Cards & containers

6. **A card groups related content** (Law of Common Region). Consistent inner
   padding (`p-4`/`p-6`), consistent radius, one elevation tier (file 02).
7. **Accent borders for labelled cards:** a 3–4px top/left border in a semantic
   color turns a plain card into a typed one (e.g. a warning card).
8. **Don't nest cards in cards in cards.** One level of grouping; use spacing for
   the rest.

---

## C. Forms (Baymard + NN/g)

9. **Single column.** Users complete single-column forms ~15s faster and with
   less error. Multi-column disrupts the "one field at a time" focus. (Exception:
   genuinely paired fields like City/Postal.)
10. **Labels ABOVE the field.** Not beside, not inside. Readable before focus,
    visible while typing, scales to mobile.
11. **Placeholders are not labels.** A placeholder disappears on typing; use it
    only for a format hint ("03XX XXXXXXX"), never as the field's name.
12. **Ask only what's necessary.** Every field beyond the essentials costs
    completion. Baymard: the average checkout has ~15 fields; 6–8 is enough, and
    completion drops 4–6% per field past the eighth. Kill optional fields or defer
    them.
13. **Group related fields** with proximity + optional section headings; chunk
    long forms into steps (Miller's Law) with a progress indicator (Zeigarnik).
14. **Smart defaults & autofill.** Pre-fill what you know; use correct
    `type`/`inputmode`/`autocomplete` so mobile keyboards and browser autofill
    work (Tesler's Law — the system absorbs the effort).
15. **Match field width to expected input.** A postal-code field shouldn't be as
    wide as an address field — width is a hint.

---

## D. Validation & errors (NN/g, file 07)

16. **Validate inline, after the field, not only on submit.** Real-time feedback
    once a field is complete; don't scream while they're still typing.
17. **Error message sits at the field,** not only in a summary at the top.
18. **An error says: what happened, why, how to fix** — in plain language, no
    blame. "Please enter a valid Pakistani number, e.g. 0300 1234567" — not
    "Invalid input."
19. **Error state = red border + icon + message** (color is never alone, file 04).
20. **Accept messy input (Postel's Law):** strip spaces/dashes from card and phone
    numbers server-side; don't reject "0300 123 4567" for having spaces.
21. **Preserve the user's input** on a failed submit — never clear the form.

---

## E. The three states people forget (design them first, not last)

22. **Empty state** is the FIRST thing a new user sees. Design it: a short line of
    guidance, maybe an illustration, and the primary CTA. Never a blank box.
    (WeddingWala Wapsi already does this: "Koi refund baqaya nahi. Sab settle
    hain." — keep that pattern everywhere.)
23. **Loading state:** skeletons that mirror the final layout, not a centered
    spinner on a blank page (perceived speed; Doherty, file 06). Optimistic UI
    where safe.
24. **Error state (page/section level):** say what failed and offer a retry — never
    a raw stack trace or a silent blank. Distinguish "nothing here yet" (empty)
    from "something broke" (error).

---

## F. Feedback & micro-interactions

25. **Every action confirms itself.** A save shows a toast (`sonner`) or an inline
    "Saved". A destructive action confirms before and confirms after.
26. **Match the confirmation to the weight of the action.** A toggle needs a quiet
    state change; deleting needs a dialog.

---

## Checklist

- [ ] One primary action; all button states incl. loading + focus-visible?
- [ ] Forms single-column, labels above, placeholders only as hints?
- [ ] Only essential fields; correct input types + autocomplete?
- [ ] Inline validation at the field; errors say what/why/how, no blame?
- [ ] Error = color + icon + text; input preserved on failure?
- [ ] Empty, loading, and error states all explicitly designed?
- [ ] Every action gives feedback (toast/inline), sized to its weight?

# 05 — States, Forms & Responsive Patterns (Research Spec)

**Scope:** Best-in-class EMPTY / LOADING / ERROR / ONBOARDING states, FORM UX (inputs, validation
timing, wizards), and RESPONSIVE / MOBILE patterns for the EMS (Wedding Wala) SaaS dashboard, which
is a **money/finance-adjacent** app (bookings, payments, payroll, payslips). Goal: nothing missed.
Every screen built against this spec should be checkable against the **State Matrix** in §1.0.

This is a research/standards document. It defines *what every screen must do*, the *exact validation
timing rule*, and *copy guidelines*, with cited sources. Implementation tokens (colors, spacing) live
in the design-system doc; here we define behavior and rules.

---

## 0. TL;DR — The two things to memorize

### 0.1 The State Matrix (every data screen MUST implement all rows that apply)

| State | Trigger | Required treatment |
|---|---|---|
| **Empty — first run** | User has never created data | Positive title, "what belongs here" body, primary CTA, optional illustration. Never a bare blank box. |
| **Empty — filtered / zero-results** | Filters/search return 0 of N | Explain *why* (echo active filters), offer "Clear filters" / corrective suggestions. NOT the same as first-run. |
| **Empty — cleared / all-done** | User completed/archived everything | Affirming "all caught up" message; no error tone. |
| **Loading — skeleton** | Content-heavy view, >300ms, layout known | Skeleton matching final layout. |
| **Loading — spinner** | Short action (<~2s), unknown layout, in-button | Inline spinner; disable the triggering control only. |
| **Loading — progress bar** | Measurable / >10s (upload, export, payroll run) | Determinate %; staged steps if multi-phase. |
| **Error — inline field** | One field invalid | Message below/beside field, red + icon, after blur. |
| **Error — form-level** | Submit failed across fields | Summary banner at top of form **+** inline per-field markers (never summary alone). |
| **Error — page / boundary** | Render/data fetch crash | Full-page error boundary with retry + support path. |
| **Error — network / offline** | Request failed / no connection | Distinguish "offline" from "server error"; offer Retry; preserve user input. |
| **Error — 404 / 403** | Missing / forbidden resource | 404 = "not found, go home/search"; 403 = "no access, request access / switch account". |
| **Success — toast** | Reversible, non-blocking action | Transient toast (3–5s), optional Undo. |
| **Success — inline** | In-context confirmation (saved field) | Checkmark / "Saved" near the control. |
| **Success — full-page** | End of a flow (booking confirmed, payment done) | Confirmation screen w/ receipt, next steps, money summary. |
| **Partial / stale data** | Some data loaded, some failed/cached | Show what loaded; flag stale/failed region; never imply "no records" while loading. |

> **Rule of thumb for "no records":** never show an empty/"nothing here" message while data is still
> loading — it erodes trust. Resolve loading first, *then* show empty vs error. (NN/G empty states.)

### 0.2 The Validation-Timing Rule ("reward early, punish late")

> **Validate a field on `blur` (when the user leaves it). After an error is shown on that field,
> switch to validating on every `input`/keystroke so the error clears the instant it's fixed. A field
> that was already valid and is being re-edited stays on blur-validation (don't nag mid-typing).
> Required-but-empty fields are only flagged on submit. Format-fatal inputs (e.g. an IBAN/CNIC prefix
> that can only be digits) may error immediately.**

Optional debounce: when validating mid-typing, wait ~**500–1000ms** after the user stops typing before
showing the message (Smashing). Never block the submit button to "prevent" errors — see §2.9.

Sources: [NN/G — 10 Guidelines for Reporting Errors in Forms](https://www.nngroup.com/articles/errors-forms-design-guidelines/),
[Smashing — A Complete Guide to Live Validation UX](https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/).

---

## 1. STATES

### 1.1 EMPTY states (4 distinct kinds — do not collapse them)

A blank container is **not neutral**: it reduces confidence, hurts discoverability, and slows the
task. A designed empty state does three jobs at once — communicates system status, teaches what
belongs here, and gives a direct path to the next action. (NN/G.)

**Three NN/G guidelines:**
1. **Communicate system status** — say whether content is loading, missing, or genuinely empty.
   e.g. *"No bookings for the selected date range."*
2. **Provide learning cues** — "pull revelations" that teach: *"Star a vendor to pin it here."*
3. **Provide a direct path to the key task** — a real CTA (button/link), not just prose. Offer
   *"…or explore with demo data"* where a cold start is expensive.

**The 4 empty variants and how they differ:**

| Variant | When | Tone | Content |
|---|---|---|---|
| **First-run / onboarding** | No data ever | Encouraging, "this is intentional, you're fine" | Positive title (*"Add your first vendor"* not *"You have no vendors"*), 1-line value/why, primary CTA, optional friendly illustration. |
| **Filtered / no-results** | Filters or search exclude all rows | Neutral, diagnostic | Echo the active filters/query; *"No results for 'Lahore + Confirmed'."* + **Clear filters** + suggested broadenings. Do **not** show the first-run CTA here. |
| **Zero-results search** | Search term matches nothing | Helpful | Show the term, suggest spelling/synonyms/remove-a-word, link to browse-all. |
| **Cleared / all-done** | User emptied/finished a list (inbox zero, no pending payouts) | Affirming | *"You're all caught up."* No error styling, no guilt. |

**Empty-state copy guidelines:** short positive title; body explains the next action and *why it's
worth it*; one primary CTA; secondary path (import/demo) if cold start is hard; never blame; never
leave a bare box.

Sources: [NN/G — Designing Empty States](https://www.nngroup.com/articles/empty-state-interface-design/),
[NN/G — User Intent Affects Filter Design](https://www.nngroup.com/articles/applying-filters/),
[Carbon — Empty states pattern](https://carbondesignsystem.com/patterns/empty-states-pattern/).

### 1.2 LOADING states — choose by duration + measurability

| Pattern | Use when | Notes |
|---|---|---|
| **Skeleton screen** | Content-heavy view (dashboard, lists, tables, booking cards), layout known, wait <10s | Mirror the real layout (cards/rows/columns). Perceived ~30–50% faster than spinners; users perceive a 3s skeleton ≈ a 1.5s spinner. |
| **Spinner** | Short (<~2s), one action, layout unknown, in-button | Scope to the affected control; don't blank the whole screen. |
| **Progress bar (determinate)** | Measurable progress or any wait >10s — uploads, exports, **payroll runs**, bulk actions | Show % and, for multi-phase work, the current step. |
| **Indeterminate bar / staged** | Long but unmeasurable | Prefer staged messages ("Validating… Processing… Finalizing") over an endless spinner. |

**The 300ms floor:** if the operation will finish in **<300ms, show no loader at all** (a flash of
skeleton/spinner is worse than none). Delay showing any loader until you're confident it'll exceed
~300ms. Reserve layout space so loaders don't cause layout shift (CLS).

Sources: [NN/G — Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/),
[NN/G — Skeleton Screens vs. Progress Bars vs. Spinners](https://www.nngroup.com/videos/skeleton-screens-vs-progress-bars-vs-spinners/).

### 1.3 ERROR states — by altitude

| Altitude | Trigger | Treatment |
|---|---|---|
| **Inline field** | Single field invalid | Message **below/beside** the field, red + left-side icon, after blur (see §0.2). Keep message next to field to minimize working-memory load. |
| **Form-level** | Submit failed / cross-field | **Summary banner at top + inline per-field errors.** Summary alone is forbidden (forces users to hunt). Move focus to the summary; link each summary item to its field. |
| **Page / boundary** | Component or data crash | Full-page error boundary: plain explanation, **Retry**, link home, support/contact. Don't dump stack traces or error codes to users (codes only for diagnostics). |
| **Network / offline** | Fetch failed | **Distinguish** offline (you) vs server error (us). Offer Retry, **preserve all entered input**, auto-retry where safe. |
| **404 / 403** | Not found / forbidden | 404: "We couldn't find that. Search or go to dashboard." 403: "You don't have access — request access or switch account." Never identical generic page. |

**Do / Don't for errors:**
- **Don't** use tooltips as the only error indicator (easy to miss, hover/focus friction).
- **Don't** use modals/confirmation dialogs for routine validation errors (disruptive; reserve for
  destructive/critical decisions).
- **Don't** validate a field before the user finishes it.
- **Do** use color **plus** an icon (color-blind users) and `aria-describedby` / `aria-invalid` /
  `role="alert"` so screen readers announce it.
- **Do** add extra help when a user hits the **same error 3+ times** — that's a design flaw, not a
  user failure; surface guidance or a support contact.

Sources: [NN/G — 10 Guidelines for Reporting Errors in Forms](https://www.nngroup.com/articles/errors-forms-design-guidelines/),
[NN/G — Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/),
[Smashing — A Guide to Accessible Form Validation](https://www.smashingmagazine.com/2023/02/guide-accessible-form-validation/),
[W3C WAI — Validating Input](https://www.w3.org/WAI/tutorials/forms/validation/).

### 1.4 ERROR/MESSAGE COPY guidelines (helpful, specific, actionable, no blame)

1. **Specific, not generic** — never "An error occurred." Say what happened and to which field.
2. **Human-readable** — plain language, no jargon/codes (hide codes; show only for diagnostics).
3. **No blame** — avoid "invalid," "illegal," "incorrect." Positive, non-judgmental tone.
4. **Constructive** — tell them how to fix it. (e.g. out-of-stock → "Back on 5 May — notify me?")
5. **Polite & calm** — no sarcasm; avoid humor (goes stale on repeat). For catastrophic, no-recourse
   failures only, a touch of personality is acceptable.
6. **Close to the source** — inline > banner > modal. Toasts/banners for low-interaction issues;
   modals only for severe.

> Example rewrite: ❌ "Invalid phone." → ✅ "Enter a Pakistani mobile number, e.g. 0301 2345678."

Source: [NN/G — Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/),
[NN/G — Hostile Patterns in Error Messages](https://www.nngroup.com/articles/hostile-error-messages/).

### 1.5 SUCCESS states

| Pattern | Use when |
|---|---|
| **Toast** | Reversible, non-blocking action (saved filter, sent message). 3–5s; offer **Undo** for destructive-ish actions. |
| **Inline** | In-context save (autosaved field → "Saved" / ✓). |
| **Full-page confirmation** | End of a flow: **booking confirmed, payment received, payroll run complete**. Show receipt/summary, money figures, and explicit **next steps**. |

After fixing all errors, always let the user resubmit and confirm success — an error message says
"more to do," a success message says "you're done." (web.dev forms.)

### 1.6 PARTIAL / STALE data

- Render what successfully loaded; mark the failed/cached region with a small inline notice + Retry.
- Timestamp stale data ("Updated 3 min ago") — critical for **balances/payments**.
- Never show "no records" while any part is still loading.

---

## 2. FORMS

### 2.1 Field-type best practices

- **Text input** — correct `type`/`inputmode` (email/tel/url/number), correct `autocomplete` tokens
  (`name`, `email`, `tel`, `street-address`, `cc-number`…). Big win for cognitive load & mobile.
- **Select** — use only for a known, finite, mutually-exclusive set; ≤~5 options → prefer radios.
- **Combobox / autocomplete** — for large lists (cities, vendors). Filter as typed; allow free text
  where valid; keyboard-navigable; announce result counts.
- **Textarea** — auto-grow; show char counter only when a limit exists (validate live for limits).
- **Upload** — show accepted types/size up front; drag-drop **and** click; per-file progress;
  thumbnail/filename; removable; clear error if rejected.
- **Date** — native date input on mobile; for ranges, a range picker with min/max; never force a
  format the user must guess — show the expected format.
- **Checkbox** — independent multi-select / single boolean opt-in.
- **Radio** — one-of-many, all options visible (≤~5–7).
- **Switch/toggle** — immediate-effect settings (no save button); not for form fields needing submit.

Sizing: don't shrink targets below **48×48 CSS px** (Material) — applies to inputs, selects, toggles.

Sources: [web.dev — Forms learn path](https://web.dev/learn/forms/),
[web.dev — Autofill](https://web.dev/learn/forms/autofill),
[Material 3 — Text fields](https://m3.material.io/components/text-fields/guidelines),
[Apple HIG — Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields).

### 2.2 Labels & help text

- **Top-aligned labels** — fastest to scan/complete; works for narrow/mobile widths. Use as default.
- **Always-visible labels** — never use placeholder as the only label (vanishes on input → loss of
  context, recall burden).
- **Help text** — persistent hint **below** the label/field for format/constraints; wire with
  `aria-describedby` so SRs read label + description.
- **Visually group** label + field + help + error so the association is unambiguous.

Sources: [Smashing — Designing Efficient Web Forms](https://www.smashingmagazine.com/2017/06/designing-efficient-web-forms/),
[web.dev — Forms accessibility](https://web.dev/learn/accessibility/forms).

### 2.3 Inline validation timing — **the rule** (full detail)

See §0.2. Expanded:

- **On blur** = default first check per field.
- **Reward early:** once a field shows an error, re-validate on each keystroke and clear the error the
  moment it's valid (with ~500–1000ms debounce for "as-you-type" checks).
- **Punish late:** a field that's currently valid and being edited stays on blur-validation — don't
  flash errors mid-typing.
- **Required-empty:** flagged **only on submit**, not while tabbing through.
- **Format-fatal:** immediate error allowed (digit-only fields, fixed prefixes).
- **Confirm success** for complex fields (username availability ✓, password-strength meter, char
  count). Use real-time here deliberately.

### 2.4 Error message wording (forms)

Reuse §1.4. Field errors: specific + corrective + example. Place below the field. Combine color + icon
+ programmatic state (`aria-invalid="true"`, `role="alert"` on the message).

### 2.5 Required vs optional marking

- Choose **one** convention per form and be explicit:
  - **Mostly-optional form** → mark required fields with `*` (familiar, compact) + a legend
    "* required".
  - **Mostly-required form** → mark the few optional ones with the word **"(optional)"** — far less
    clutter than asterisking everything.
- **Money/checkout flows (this app):** Baymard found only 14% of checkouts mark both, and 32% of
  users hit a validation error when only *optional* fields were marked. → **Mark both required (`*`)
  and optional ("(optional)") explicitly** in booking/payment/payroll forms.
- Accessibility: the literal words "(required)"/"(optional)" beat a bare `*` for non-native speakers
  and cognitive accessibility; also set the `required` attribute.

Source: [NN/G — Marking Required Fields](https://www.nngroup.com/articles/required-fields/),
[Baymard — Mark both required and optional fields](https://baymard.com/blog/required-optional-form-fields).

### 2.6 Autosave + draft recovery

- Autosave long/important forms; show an unobtrusive **"Saved ✓ / Saving…"** indicator (this app
  already has `AutoSaveIndicator` + `useFormDraft` + `DraftResumeBanner` — apply that pattern).
- On return, offer **"Resume your draft?"** (CREATE-mode by default; don't silently overwrite edits).
- Never lose typed input on network error or navigation.

### 2.7 Keyboard, tab order & accessibility

- Logical DOM order = tab order; no positive `tabindex`. Visible focus ring on every control.
- Enter submits single-field/last-field; don't trap focus except in true modals (then trap + restore
  focus on close).
- Associate every input with a `<label for>`; group related controls with `<fieldset>/<legend>`
  (radios, address blocks).

### 2.8 Masked inputs (phone / money / IDs)

- **Phone (PK):** input mask / formatting for `03XX XXXXXXX`; `inputmode="tel"`; show example;
  validate the **fatal** rule (digits, length) immediately, niceties on blur.
- **Money:** right-aligned numeric, `inputmode="decimal"`, thousands separators on blur/format,
  currency prefix (Rs/PKR) shown as adornment not typed; never let masking eat the real value
  submitted.
- **CNIC / IDs:** show grouping mask + expected length; digit-only fatal validation.
- Keep the **submitted value un-masked/normalized**; mask is presentational only.

### 2.9 Disabled-submit anti-pattern & optimistic submit

- **Do not** disable the submit button until the form is valid — users get stuck with no feedback on
  *why*. Instead: keep submit enabled, and on click run validation, focus the first error, and show
  the summary + inline errors. (Disabled submit hides the path to recovery.)
- **Optimistic submit:** for low-risk, reversible actions, update UI immediately and reconcile with
  the server in the background; roll back + toast on failure. For **money actions (payments/payroll),
  do NOT be optimistic** — show explicit processing state and only confirm on server success.
- Prevent double-submit (disable *during* the in-flight request + idempotency).

### 2.10 Multi-step wizards & progressive disclosure

- Use a **wizard** only when the task splits into **independent, sequential** steps with little
  cross-step interaction; it's a poor fit when steps are interdependent and users must jump around.
- **Progress indicator:** show all steps up front (builds the mental model) + current position +
  what's done; the sense of progress motivates completion. A partially-filled checklist (40%) beats a
  blank slate.
- **Progressive disclosure:** show only what's relevant now; defer secondary/advanced options to a
  later step or "Advanced" section. Reduces overwhelm and error rate.
- Allow **Back** without data loss; save per-step (ties to autosave §2.6); let users review before
  final submit; recap money totals before the final confirm step.
- Reduce cognitive load: minimize fields, smart defaults, group logically, one primary action/step.

Sources: [NN/G — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/),
[NN/G — 4 Principles to Reduce Cognitive Load in Forms](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/).

---

## 3. RESPONSIVE / MOBILE

### 3.1 Breakpoint strategy

Design **content-out** (let layout break where content needs it) rather than to exact device widths,
but target these QA checkpoints:

| Width | Class | Layout intent |
|---|---|---|
| **1920** | Large desktop | Max content width capped (~1280–1440 container); don't stretch line lengths. |
| **1440** | Desktop | Full sidebar + multi-column dashboard. |
| **1280** | Small desktop / laptop | Sidebar persists; columns may reduce. |
| **1024** | Tablet landscape | Sidebar → **icon rail**; 2-col grids. |
| **768** | Tablet portrait | Rail → off-canvas/sheet nav; 1–2 col; tables start condensing. |
| **430 / 390 / 375** | Modern / mid / small phones | Single column; **bottom nav**; tables → cards; full-screen sheets. Verify 375 (smallest common) has **no horizontal scroll**. |

Use `min-width` (mobile-first) media queries; major layout shifts at ~600 / ~900 / ~1200 align with
common device classes. Don't over-fit to one device.

Source: [NN/G — Breakpoints in Responsive Design](https://www.nngroup.com/articles/breakpoints-in-responsive-design/).

### 3.2 Adaptive navigation (rail → icon → sheet / bottom-nav)

- **Desktop (≥1024):** persistent labeled **sidebar/nav rail**.
- **Laptop/tablet (768–1024):** collapse to **icon-only rail** (tooltip labels).
- **Phone (<768):** **bottom navigation** for 3–5 top destinations (thumb-reachable) **or** a
  hamburger → off-canvas/bottom-sheet for deeper trees. Keep primary actions in the bottom (green)
  thumb zone.
- Nav items ≥**44px** tall.

Source: [Android — Build responsive navigation](https://developer.android.com/develop/ui/views/layout/build-responsive-navigation).

### 3.3 Responsive tables → cards

- On narrow widths, convert each table row into a **card** with labelled key/value pairs (label +
  value stacked) — avoids horizontal scroll and tiny text.
- Alternatives: prioritize columns (hide/disclose secondary cols behind "more"), or a single
  horizontally-scrollable region **with a frozen first column** — but cards are preferred for
  booking/payment lists.
- Card grids: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` to reflow automatically.

### 3.4 Touch targets & thumb zones

- **Minimum target 44×44px (Apple HIG) / 48×48px (Material).** Use 48 as the comfortable default.
- **≥8px spacing** between adjacent targets to prevent mis-taps.
- **Thumb zones:** green (bottom-center) = easy → primary actions & nav; yellow (mid/sides) =
  reachable; red (top corners) = hard → avoid for frequent actions. Put destructive/rare actions in
  the red zone, frequent ones in green.

Sources: [Smashing — The Thumb Zone](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/),
[Material 3 — Accessibility / targets](https://m3.material.io/foundations/designing/structure).

### 3.5 No-horizontal-scroll rules

- Body must never scroll horizontally on phones. QA at **375px**. Use `max-width:100%`, fluid grids,
  `min-width:0` on flex/grid children to let them shrink, wrap long tokens, and confine intentional
  horizontal scroll to a single bounded region (e.g. a chip row), never the page.
- For sticky/overflow containers use `overflow-x: clip` (not `hidden`) so sticky positioning still
  works.

### 3.6 Mobile dialogs → full-screen sheets / bottom sheets

- **<600dp (phone):** dialogs become **full-screen** sheets; complex flows use full-screen.
- **Bottom sheets** for secondary content/options anchored to the bottom (thumb-friendly); they keep
  context partially visible and outperform center modals at natural pause points.
- **Center modal dialogs:** reserve for **critical decisions / destructive confirmations** (delete,
  irreversible payment) — they block and demand a choice; users dismiss them fast if they feel
  blocked. Use sparingly.
- Snackbars/toasts for low-priority confirmations.

Sources: [Material 3 — Bottom sheets](https://m3.material.io/components/bottom-sheets/guidelines),
[Material 3 — Dialogs](https://m3.material.io/components/dialogs/guidelines),
[NN/G — Bottom Sheets: UX Guidelines](https://www.nngroup.com/articles/bottom-sheet/).

### 3.7 Fluid type with `clamp()`

- Pattern: `font-size: clamp(MIN_rem, BASE_rem + FLUID_vw, MAX_rem)` — e.g.
  `h1 { font-size: clamp(2rem, 1.5rem + 2vw, 4rem); }`.
- **Always include a `rem` component** in the preferred value — pure `vw` breaks browser zoom
  (fails WCAG 1.4.4 resize-text). The `rem` keeps it zoomable.
- Set **realistic min/max** (don't shrink body below ~16px). Use clamp for headings/display; keep a
  conventional scale for body/UI. QA at **320px and 1920px+**.

Source: [Smashing — Modern Fluid Typography Using CSS clamp()](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/).

---

## 4. MICROCOPY & TRUST SIGNALS (money / finance app)

This is a payments/payroll product — **trust = retention**; one vague number or message can trigger
abandonment. Tone: **human, transparent, calm** — clarity without legalese, reassurance without
sugarcoating.

- **Reassurance microcopy at money moments:** "This transfer is encrypted." / "We'll never move your
  funds without your confirmation." / "Fraud check in progress." Empathetic copy raises retry/
  recovery success (~40% more likely to retry).
- **Visible (honest) security signals:** padlock, verified tick, confirmation banner — only when
  *true*. They're micro-contracts, not decoration.
- **Transparency on numbers:** show fee/commission breakdowns, totals, and **preview before commit**
  for payments, payouts, refunds, payroll runs. Plain-language wait times and next steps.
- **Confirmation screens** for every money action: amount, recipient/vendor, date, reference/receipt,
  reversibility status, and what happens next.
- **No optimistic UI for money** (see §2.9): explicit processing → server-confirmed success/failure.
- **Empty states in finance views** should reassure, not alarm ("No pending payouts — you're all
  caught up."), and never show "no balance/records" while loading.

Sources: [Eleken — Fintech design / trust patterns](https://www.eleken.co/blog-posts/modern-fintech-design-guide),
[Phenomenon — Fintech UX patterns that build trust](https://phenomenonstudio.com/article/fintech-ux-design-patterns-that-build-trust-and-credibility/).

---

## 5. Consolidated source list

**Empty/loading states:** NN/G [Empty States](https://www.nngroup.com/articles/empty-state-interface-design/),
[Filters](https://www.nngroup.com/articles/applying-filters/),
[Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/),
[Skeletons vs Bars vs Spinners](https://www.nngroup.com/videos/skeleton-screens-vs-progress-bars-vs-spinners/),
[Carbon empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/).
**Errors/copy:** NN/G [10 Form Error Guidelines](https://www.nngroup.com/articles/errors-forms-design-guidelines/),
[Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/),
[Hostile Error Messages](https://www.nngroup.com/articles/hostile-error-messages/);
[W3C WAI Validating Input](https://www.w3.org/WAI/tutorials/forms/validation/);
[Smashing Accessible Validation](https://www.smashingmagazine.com/2023/02/guide-accessible-form-validation/).
**Forms/validation timing:** [Smashing Live Validation UX](https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/),
[Smashing Efficient Web Forms](https://www.smashingmagazine.com/2017/06/designing-efficient-web-forms/),
[web.dev Forms](https://web.dev/learn/forms/) & [Autofill](https://web.dev/learn/forms/autofill) & [Accessibility](https://web.dev/learn/accessibility/forms);
[Material 3 Text fields](https://m3.material.io/components/text-fields/guidelines);
[Apple HIG Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields).
**Required/optional:** [NN/G Required Fields](https://www.nngroup.com/articles/required-fields/),
[Baymard Required/Optional](https://baymard.com/blog/required-optional-form-fields).
**Wizards/disclosure:** [NN/G Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/),
[NN/G Cognitive Load in Forms](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/).
**Responsive/mobile:** [NN/G Breakpoints](https://www.nngroup.com/articles/breakpoints-in-responsive-design/),
[Android Responsive Navigation](https://developer.android.com/develop/ui/views/layout/build-responsive-navigation),
[Material 3 Bottom sheets](https://m3.material.io/components/bottom-sheets/guidelines) & [Dialogs](https://m3.material.io/components/dialogs/guidelines),
[NN/G Bottom Sheets](https://www.nngroup.com/articles/bottom-sheet/),
[Smashing Thumb Zone](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/),
[Smashing Fluid Typography clamp()](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/).
**Fintech trust:** [Eleken](https://www.eleken.co/blog-posts/modern-fintech-design-guide),
[Phenomenon](https://phenomenonstudio.com/article/fintech-ux-design-patterns-that-build-trust-and-credibility/).

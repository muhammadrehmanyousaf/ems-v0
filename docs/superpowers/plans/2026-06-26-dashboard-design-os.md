# Wedding Wala — Dashboard as Operating System (Design-OS Specification)

> Companion to `2026-06-26-dashboard-redesign.md`. The redesign plan builds the
> SYSTEM (themes, primitives, bulk-IO). This doc defines the EXPERIENCE — the
> craft layer that makes it feel like an operating system you run a business
> from, not a dashboard you check. Rides entirely on the already-designed
> shadcn token engine + 6 AA-verified themes + Iconly wrapper.

---

## 1. Product Vision

**The operating system for the Pakistani wedding economy.**

A vendor opens the app at 9am and it tells them the truth about their day: which
bookings need a deposit chase, which function sheet is due before the mehndi,
which staff shift is still unconfirmed, which drone NOC or halal cert expires
this week, how much cash is owed and by whom. They act on it in keystrokes and
move on. They don't "use a dashboard" — they run their business from this surface.

**The feeling we are selling:** *calm control over money and time.* This is a
finance- and logistics-heavy tool for people under real pressure (a wedding
cannot be rescheduled). Every screen must lower the heart rate: fast, legible,
trustworthy with numbers, never ambiguous about money. Premium is not ornament —
premium is *the absence of doubt*.

**Anti-vision (what we refuse to build):** a generic everything-app. No parallel
"Files/Teams/Automations" abstractions. We achieve OS-grade depth on the jobs
vendors already have. Greatness through depth, not breadth.

**The three pillars** (every feature serves one):
1. **Know** — what needs me right now (Today, inbox, alerts, money owed).
2. **Do** — one keystroke from intent to done (command palette, quick-create, inline edit, optimistic writes).
3. **Trust** — money and dates are always right, always reversible (tabular numbers, audit trails, undo, confirmations only where stakes are real).

---

## 2. UX Principles (the 15, made specific to this product)

| Principle | What it means HERE |
|---|---|
| Visual hierarchy first | Money and dates are the loudest things on any screen. Status is a glance, not a read. |
| Ruthless spacing | The 4→96 scale, no exceptions. Density is earned with whitespace, not crammed. |
| Progressive disclosure | A booking row shows 6 fields; the drawer shows 40. Function-sheet complexity hides until opened. |
| Extreme readability | 14px body min, ≤75ch line length, tabular-nums for every Rs amount. |
| Density without clutter | Tables default to "comfortable", power users toggle "compact". |
| Consistency over creativity | One DataTable, one FormDrawer, one EmptyState — everywhere. A vendor learns the app once. |
| Accessibility by default | AA+ contrast (themes verified), full keyboard, reduced-motion honored. |
| Mobile-first | A vendor confirms a shift from a wedding hall on a phone. Tables → cards, dialogs → sheets. |
| Keyboard-first | ⌘K does anything. j/k/x/e/Enter on every list. Mouse optional. |
| One primary action / screen | Today → "Add booking". Leads → "Log lead". Never two equal CTAs. |
| Performance-first | Optimistic writes, skeletons, prefetch on hover. Perceived load <500ms. |
| Every click has purpose | If a control doesn't change state or reveal truth, it's deleted. |
| No decorative noise | No gradients-for-fun, no illustration filler, no shadow soup. |
| Delight through interaction | The satisfaction is the *speed* — the instant ✓ on a saved payment, the undo toast. |
| Zero ambiguity | "Deposit received" not "Update". "This logs out all staff" not "Are you sure?". |

---

## 3. Information Architecture

The ~40 domains collapse into **5 mental zones** + a home. This is the single
biggest UX win — today's flat 40-item sidebar becomes a 5-group map a vendor
can hold in their head.

```
TODAY            ← the home / launch surface (not a "dashboard tab")

OPERATE          ← run the events
  Bookings · Leads · Calendar · Function Sheets · Customers · Inventory · Suppliers · Staff

MONEY            ← the khata (ledger)
  Payments · Receivables · Expenses · PDCs · Receipts · Brokers · Tax · Billing

GROW             ← get more / look better
  Insights · Reviews · Promote · Automation · Onboarding

COMPLIANCE       ← Pakistan-specific obligations (vendor-type-gated)
  Drone NOC · Halal Certs · Generator Fuel · Collaborations · Reliability

ADMIN            ← platform (role-gated: admin/super only)
  Vendor Queue · Disputes · Audit Logs · Documents · Force Majeure ·
  Platform Pulse · Promotions · Subscriptions · Roles · Users · Businesses
```

**Rules:**
- The vendor-type config already gates which items appear; the 5 zones are the
  fixed scaffold, items flow into them. A photographer's OPERATE shows "Shoots".
- COMPLIANCE only appears if the vendor type needs it (caterer → halal; aerial → drone).
- ADMIN is a different surface entirely, not mixed into vendor nav.
- Depth cap: **2 levels.** Zone → screen. Anything deeper is a tab or a drawer, never a third nav level.

---

## 4. Navigation Map

```
┌─ TOPBAR ───────────────────────────────────────────────────────────────┐
│ [☰] [WorkspaceSwitch ▾]   [⌘K Search everything…]   [+ Create ▾] [🔔] [◐] [Avatar ▾] │
└────────────────────────────────────────────────────────────────────────┘
┌─ RAIL ─────────┐┌─ WORKSPACE ──────────────────────────────────────────┐
│ ◆ Wedding Wala ││ Breadcrumb ›  Page title              [primary action] │
│ ▸ Workspace ▾  ││ ┌── Tabs (if any) ─────────────────────────────────┐  │
│                ││ │                                                  │  │
│ TODAY          ││ │   FilterBar / Toolbar (search · chips · export)   │  │
│ ─ OPERATE      ││ │                                                  │  │
│   Bookings     ││ │   DataTable / Card grid / Detail                  │  │
│   Leads        ││ │                                                  │  │
│   Calendar     ││ │                                                  │  │
│   …            ││ └──────────────────────────────────────────────────┘  │
│ ─ MONEY        ││ StatusArea: autosave · sync · "3 selected" bulk bar    │
│ ─ GROW         │└───────────────────────────────────────────────────────┘
│ ─ COMPLIANCE   │
│ ─ ADMIN        │  Overlays: ⌘K Command Palette · Notifications panel ·
│ ······         │            FormDrawer (right) · Context menu (right-click)
│ ★ Pinned       │
│ ◷ Recent       │
│ [⟨ Collapse]   │
└────────────────┘
```

**Navigation should feel invisible:** you never "go look for" a screen — you ⌘K
to it, or it's one of the 5 zones, or it's pinned/recent. Hover-prefetch makes
every nav click feel instant.

---

## 5. Design System

### 5.1 Spacing (strict 4-based scale → Tailwind)
`4 8 12 16 24 32 48 64 96` → `1 2 3 4 6 8 12 16 24` in Tailwind units.
- Page padding: 24 (mobile 16). Card padding: 16/24. Section gap: 24/32.
- Control heights: 28 (compact) · 32 (default) · 36 (comfortable) · **44 (touch min)**.
- Grid gutters: 16/24. Everything snaps to the scale — no `13px`, no `gap-[18px]`.

### 5.2 Typography
Font: **Inter** (existing UI font; tabular numerals enabled). Urdu subtree keeps Nastaliq.

| Role | Size / line | Weight | Use |
|---|---|---|---|
| Display | 30/36 | 600 | Today greeting, big KPI numbers |
| H1 | 24/32 | 600 | Page titles |
| H2 | 20/28 | 600 | Section headers |
| H3 | 16/24 | 600 | Card titles, drawer headers |
| Body | 14/22 | 400 | Default text, table cells |
| Small | 13/20 | 400 | Secondary text, helper |
| Label | 12/16 | 500, +2% tracking, uppercase | Field labels, table headers, chips |
| Caption | 11/16 | 400 | Timestamps, metadata |

**Money & data rule:** all amounts, counts, dates in tables use
`font-variant-numeric: tabular-nums` so columns align to the digit. This is
non-negotiable for a finance tool — it's the difference between "spreadsheet"
and "professional ledger".

### 5.3 Color
Rides the **6-theme token engine** (Champagne default + Indigo/Violet/Emerald/Slate/Rose), light+dark, AA-verified (see redesign plan C-1).
- **Primary** = active theme accent (`--primary`). One per workspace, chosen by user.
- **Neutrals** = near-zero-chroma ramp tinted slightly toward the theme hue (background→foreground), carrying 90% of the UI. Calm.
- **Semantic (FIXED across all themes — trust requires stability):**
  - Success `142 70% 38%` (light) / `142 60% 50%` (dark) — paid, confirmed, active.
  - Warning `38 92% 45%` / `38 85% 58%` — due soon, expiring, pending.
  - Error `0 72% 48%` / `0 70% 58%` — bounced, overdue, failed, expired.
  - Info `214 80% 50%` / `214 75% 62%` — neutral system notices.
- **Elevation through contrast, not shadow:** base → `--card` is a 1–2% lightness lift + 1px border. Shadows are reserved for genuinely-floating layers (popover, dialog, drawer) — one soft token, never stacked.
- Status is always **color + icon + text** (never color alone — colorblind safety).

### 5.4 Icon system
**Iconly (react-iconly), `light` variant** — round, calm, matches the aesthetic.
- Sizes: 16 inline · **18 default** · 20 nav/topbar · 24 empty-states. One stroke weight.
- Meaning before beauty: a status icon is chosen for instant recognition (✓ paid, ! due, ✕ failed), never for prettiness.
- Every icon-only button carries an `aria-label` (enforced by the `<Icon label>` prop).
- The 15 weak-match glyphs (refresh, sort, external-link…) stay curated-lucide until clean Iconly equivalents exist (redesign plan C-2).

### 5.5 Elevation & radius
- Radius: 8 (controls/cards) · 12 (dialogs/drawers) · full (pills/avatars). From `--radius`.
- 3 elevation levels only: flat (content) · raised (card hover, dropdown) · floating (dialog/drawer). Each a single token.

---

## 6. Component Inventory (built on the redesign's primitives)

**Foundation (from redesign plan B3/B4):** AppShell · DataTable · PageHeader ·
StatCard · FilterBar · FormDrawer/FormDialog · EmptyState · Skeletons ·
ErrorBoundary · ExportMenu · BulkImportDialog · Icon/Spinner.

**Experience layer (NEW — this doc adds these as B5–B7):**
| Component | Role |
|---|---|
| **CommandPalette** (⌘K) | Navigate · create · act · search — the OS spine |
| **GlobalSearch** | Fuzzy search across bookings/customers/leads/vendors/function-sheets |
| **WorkspaceSwitcher** | Multi-business owners switch context (already partial: team-switcher) |
| **QuickCreate** (`+`) | Create any entity from anywhere (booking, lead, expense, payment…) |
| **NotificationPanel** | Real-time (socket) activity + alerts, grouped, actionable |
| **KeyboardLayer** | j/k navigate, x select, e edit, / search, ? shortcuts overlay |
| **UndoToast** | Every destructive/mutating action returns a 5s undo |
| **DensityToggle** | Comfortable ↔ compact for tables |
| **SavedViews** | Persisted filter+sort+columns per table per user |
| **InlineEdit** | Edit a cell/field in place, optimistic, Esc-cancel |
| **StatusPill** | The universal status atom (color+icon+text) |
| **MoneyCell** | Tabular Rs formatting + tone (owed=warning, paid=success) |
| **CommandMenu (right-click)** | Context actions on any row |
| **ShortcutsOverlay** (`?`) | The discoverability surface for keyboard power |

---

## 7. Wireframes (key surfaces, low-fi)

**TODAY (the home / launch surface)** — replaces "dashboard tab" as the default route:
```
Good morning, Imran.  ·  Thu 27 Jun  ·  3 events this week        [+ Add booking]
┌── Needs you now ────────────────────────────────────────────────┐
│ ● 2 deposits overdue  Rs 180,000     [Chase ▸]                   │
│ ● 1 function sheet due tomorrow (Khan mehndi)   [Open ▸]         │
│ ● 1 staff shift unconfirmed  (Ali, Sat)         [Confirm ▸]      │
│ ● Halal cert expires in 6 days                  [Renew ▸]        │
└─────────────────────────────────────────────────────────────────┘
┌ This week ──────────────┐┌ Money snapshot ────────────────────────┐
│ Fri  Ahmed walima  ✓ ready ││ Owed to you   Rs 540,000  ▲          │
│ Sat  Khan mehndi   ! sheet ││ This month    Rs 1.2M     ▲ 18%      │
│ Sun  —                     ││ PDCs clearing this week  Rs 95,000   │
└────────────────────────────┘└──────────────────────────────────────┘
```

**Operate list (e.g. Bookings)** — DataTable with toolbar:
```
Bookings                                                  [+ Add booking]
[Search…]  [All ▾][This month ▾][Status ▾]      [⤓ Export][⤒ Import][⚙]
┌───────────────────────────────────────────────────────────────────┐
│ ☐  Event        Customer     Date     Amount     Paid    Status    │
│ ☐  Walima       A. Ahmed     12 Jul   180,000    90,000  ● Partial │  ← MoneyCell, StatusPill
│ ☐  Mehndi       S. Khan      28 Jun   240,000   240,000  ● Paid    │
└───────────────────────────────────────────────────────────────────┘
3 selected → [Mark paid] [Export] [Delete]            ·  Autosaved ✓
```
Below `md`: each row becomes a **card** (event + customer + amount + status pill, tap → drawer).

**Detail = right FormDrawer**, never a full-page nav away (keeps context).

---

## 8. Responsive Layouts

| Breakpoint | Nav | Tables | Notes |
|---|---|---|---|
| 1920 / 1440 | Rail expanded (240px) | Full table, all columns, comfortable density | Max content width 1280–1440, centered |
| 1280 | Rail expanded | Full table | Default desktop |
| 1024 | Rail → icon-rail (64px), label on hover | Table, fewer columns; horizontal scroll only inside table, never page | Tablet landscape |
| 768 | Rail → off-canvas Sheet (☰) | Priority columns; rest in row-expand | Tablet portrait |
| 430 / 390 / 375 | Bottom-anchored ☰ Sheet; topbar = search + create + avatar | **Tables → stacked cards** (`renderCard`) | Touch ≥44px; dialogs → full-height sheets; FilterBar → filter sheet |

Hard rules: **no horizontal page scroll, ever**; no broken grid; no clipped money. Verified at all 8 widths per screen (redesign recipe step 6).

---

## 9. Motion Specs

**Tokens** (add to Tailwind/CSS):
- `--motion-fast: 120ms` · `--motion-base: 200ms` · `--motion-slow: 300ms`
- Easing: enter `cubic-bezier(0.16,1,0.3,1)` (ease-out-expo, decisive) · exit `cubic-bezier(0.4,0,1,1)` (ease-in) · interactive `spring(stiffness 300, damping 30)`.

| Interaction | Spec |
|---|---|
| Hover | bg/border tint, 120ms ease-out. No scale on rows. |
| Focus | ring appears instant (0ms) — accessibility, never animated away |
| Button press | 1–2px depress, 80ms |
| Dialog | fade + scale 0.97→1, 200ms ease-out; backdrop fade 150ms |
| Drawer (detail) | slide-in from right, 250ms ease-out-expo; content stagger 30ms |
| Expand/collapse | height auto, 200ms; chevron rotate 200ms |
| Nav / route | content cross-fade 150ms; rail items no motion (stability) |
| Skeleton | shimmer 1.2s linear loop |
| Optimistic success | inline ✓ scales in 180ms spring; row flashes success-tint 600ms then settles |
| Undo toast | slide up 200ms, auto-dismiss 5s with a thin countdown bar |
| Number change | KPI counts tween 400ms (respects reduce-motion → instant) |

**Rules:** 150–300ms for everything interactive. 60fps (transform/opacity only — never animate layout/width on the critical path). **`prefers-reduced-motion` → all of the above collapse to instant/opacity-only.** No bounce, no parallax, no gimmicks.

---

## 10. High-Fidelity Direction (the look)

- **Surface:** near-flat. Background is the calm canvas; cards lift 1–2% + hairline border. One soft shadow only on true overlays.
- **Borders:** 1px hairlines in `--border` do the structural work — Linear/Stripe-style, not heavy card shadows.
- **Color usage:** ~90% neutral, accent reserved for the ONE primary action + active nav + focus + key data. Semantic color only on status/money. The screen is mostly quiet; color means something every time it appears.
- **Numbers are the hero:** big tabular KPIs on Today, right-aligned tabular money in tables, deltas in success/error.
- **Empty states** are confident and useful: one icon, one line, one CTA, optional "import" shortcut — never a sad illustration.
- **The vibe:** if Stripe Dashboard and Linear ran a Pakistani wedding business. Editorial calm, financial precision, zero noise.

---

## 11. Accessibility Review (WCAG AA+)

- **Contrast:** all 6 themes × light/dark verified AA by computed ratio (redesign C-1 fixes applied). Body ≥4.5:1, large/UI ≥3:1, focus ring ≥3:1.
- **Keyboard:** every action reachable; visible focus ring always; ⌘K + `?` discoverable; no keyboard traps; logical tab order; Esc closes top layer.
- **Screen reader:** semantic landmarks (`<nav> <main>`), `aria-live="polite"` on autosave/notifications/async, labelled icon buttons, table headers associated, dialog focus-trap + return.
- **Motion:** `prefers-reduced-motion` fully honored.
- **Targets:** ≥44px on touch. **Color never the sole signal** (always +icon+text).
- **Forms:** label associations, inline errors announced, error summary region.

---

## 12. Frontend Architecture

- **Next.js 14 App Router.** Server Components for static shell/read-heavy lists where possible; Client Components for interactive surfaces. Route-group `(dashboard)`.
- **State:** TanStack Query (server cache, optimistic mutations, prefetch-on-hover) · Zustand (theme prefs, UI/layout, command-palette state) · nuqs (filters/sort/view in URL → shareable, back-button-correct).
- **Theming:** the `data-theme` token engine (zero per-component cost).
- **Realtime:** existing socket.io (`notification:*`, `chat:*`) feeds NotificationPanel + presence.
- **Command palette:** a single registry of "commands" (id, label, group, keywords, icon, run()) that nav + quick-create + row actions all register into — one source of truth for ⌘K and `?`.
- **Performance budget:** dynamic-import heavy libs (xlsx, charts, calendar); virtualize long tables (>100 rows) via tanstack-virtual; prefetch route + data on rail hover; skeletons everywhere so perceived load <500ms; optimistic writes so interactions feel <100ms.
- **Quality gates:** token-only grep (no hardcoded color), `tsc --noEmit` clean, AA contrast script, Lighthouse a11y ≥95.

---

## 13. Final UI Specification (the contract)

1. **One shell** (AppShell) — topbar + 5-zone rail + workspace area — wraps every screen.
2. **One home** (Today) — the default route; "Needs you now" + this-week + money snapshot.
3. **One table** (DataTable) — sort/filter/group/select/bulk/resize/hide/search/export/paginate/saved-views/density/inline-edit/keyboard; collapses to cards on mobile.
4. **One form pattern** (FormDrawer/Dialog) — RHF+zod, autosave (useFormDraft), inline validation, sticky footer, one primary action.
5. **One status atom** (StatusPill) + **one money atom** (MoneyCell) — used everywhere finance/state appears.
6. **One command spine** (⌘K palette + `/` search + `?` shortcuts) — navigate/create/act without the mouse.
7. **Six states per screen** — empty · loading (skeleton) · error (boundary+retry) · success · first-time · power-user (saved views/density/shortcuts).
8. **Every mutation** — optimistic + undo toast + autosave indicator. Confirmations only when stakes are real (delete, logout-all, irreversible money).
9. **Motion** — 150–300ms, transform/opacity only, reduced-motion honored.
10. **A11y AA+** — keyboard-complete, contrast-verified, color-never-alone.

**The test for "done":** a vendor who has never seen the app can find and act on
what matters in under 10 seconds; a power user can run their whole morning
without touching the mouse; and at no point does anyone wonder whether a number
is right.
```
```

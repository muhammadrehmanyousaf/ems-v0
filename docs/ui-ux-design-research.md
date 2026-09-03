# UI/UX Design Research — Brainstorming Reference

> **Purpose.** A single reference distilled for the design pass we're about to
> start. It consolidates five sources the team shared plus three infographic
> guides, into one working document we can design against.
>
> **On sourcing — read this honestly.** The five Scribd links are paywalled;
> only their titles/descriptions were machine-readable, not the page content. So
> this document is **compiled from established knowledge of those exact,
> canonical titles** (Refactoring UI, Laws of UX, User-Centered Design process,
> etc.) cross-checked against the three infographics that *were* fully readable.
> Where a specific number matters (spacing scale, line-height ratios) it comes
> from the infographics, which are quoted directly. If the team later pastes the
> real PDF text, we fold in anything these titles add beyond the canon.
>
> Sources mapped:
> 1. *Topic 3.1 — The Design Process in UI/UX* → **Part 2** (process, UCD)
> 2. *Introduction to UI/UX* → **Part 1** (fundamentals, UI vs UX)
> 3. *Refactoring UI* — Wathan & Schoger → **Part 3** (the practical core)
> 4. *Psychology of UX Design / Laws* — Alok Kumar → **Part 4** (Laws of UX)
> 5. *Comprehensive UI/UX Design Guide* → woven through Parts 1–2, 5
> + Infographics (8-step process, Omar UX 4-phase, Pixel Craft spacing) → **Parts 2 & 5**

---

## Part 0 — The one idea under all of it

> "People ignore design that ignores people." — Frank Chimero
> "Great design is not just what it looks like, but how it works."

Everything below serves **one** goal: reduce the effort a real person spends to
get what they came for. Beauty is a means, not the end. When a decision is
unclear, the tie-breaker is always: *does this make the user's next action more
obvious and less work?*

---

## Part 1 — Fundamentals: UX vs UI

**UX (User Experience)** = the whole felt journey. Is the thing useful, usable,
findable, credible, and does it solve the real problem? Lives in research,
flows, structure, and testing. You can't see it directly — you feel its absence.

**UI (User Interface)** = the surface a person actually touches. Color,
type, spacing, components, states, motion. UI is how the UX gets delivered.

| | UX | UI |
|---|---|---|
| Question | "Does it work for them?" | "Is it clear and pleasant to use?" |
| Artifacts | personas, journeys, flows, wireframes, test reports | design system, screens, components, prototypes |
| Fails as | confusing, useless, frustrating | ugly, inconsistent, hard to read |
| Order | comes **first** | delivers the UX |

**The trap to avoid:** jumping to UI (colors, polish) before the UX (problem,
flow, structure) is settled. *Structure comes before visuals.*

Related disciplines to keep straight: **Interaction Design** (what happens on
each action), **Information Architecture** (how content is organized/labelled),
**Visual Design** (the aesthetic layer), **Usability** (ease of use), and
**Accessibility** (works for everyone, including assistive tech).

---

## Part 2 — The Design Process (User-Centered Design)

Two framings of the same loop; use whichever fits the moment. Both are
**iterative**, not linear — you loop back the instant testing reveals a problem.

### The 8-step version (infographic 1)
1. **Discover** — understand the problem before designing. Business goals, user
   research, competitor analysis, pain points, interviews. *Don't design
   screens; solve problems.*
2. **Define** — know who you're designing for. Personas, empathy map, user
   journey, problem statement, user stories. *Design for real people, not
   assumptions.*
3. **Ideate** — generate multiple solutions. Brainstorm, Crazy 8s, information
   architecture, user flows, sketches. *Explore before choosing.*
4. **Wireframe** — structure, not colors. Low-fidelity wireframes, layout
   planning, navigation, content hierarchy. *Structure before visuals.*
5. **UI Design** — make it beautiful *and* usable. Color system, typography,
   spacing, components, design system. *Good UI is both attractive and
   functional.*
6. **Prototype** — bring it to life. Interactive prototype, micro-interactions,
   animations, transitions. *Let users experience the product.*
7. **Usability Testing** — test with real users. Observe, gather feedback,
   identify issues, measure success. *Users reveal what designers miss.*
8. **Iterate** — improve continuously. Fix, refine, update, repeat. *Great
   design is never finished.*

Flow: **Discover → Define → Ideate → Wireframe → UI → Prototype → Test → Iterate → Launch**

### The 4-phase version (Omar UX)
1. **Research** — users, needs, behavior → user research, personas, define
   goals, key insights (turn data into action).
2. **Wireframes** — layout & structure, user flow, iterate early, validate
   against user needs.
3. **Prototype** — build a working model, simulate interactions, test
   internally, refine on feedback.
4. **User Testing** — test with real users, gather feedback, analyze insights,
   iterate & improve; repeat if needed.

Loop mantra: **Empathy → Research → Iterate → Repeat.**

### Core UCD methods (worth knowing by name)
- **User research:** interviews, surveys, analytics, competitor analysis.
- **Personas:** fictional but evidence-based archetypes of the target user.
- **Empathy map:** what the user says / thinks / does / feels.
- **User journey map:** stages, actions, thoughts, emotions, pain points, and
  the **opportunities** each pain point opens.
- **Problem statement:** "[User] needs [need] because [insight]."
- **User stories:** "As a [role], I want [action] so that [benefit]."
- **Information architecture:** how content is grouped, labelled, and navigated.
- **User flows:** the decision/step path from entry to goal.
- **Task analysis:** break a goal into the exact sequence of sub-steps.
- **Usability testing:** watch real users attempt real tasks; measure success
  rate, time, errors, and satisfaction.
- **Micro-interactions:** the small feedback moments (a toggle, a like, a
  loading state) that make software feel alive and responsive.

---

## Part 3 — Refactoring UI (the practical core)

The most immediately useful source. Its thesis: **you don't need talent, you
need tactics.** Design in a defined order, and lean on systems over instinct.

### 3.1 Start with a feature, not a layout
- Don't design the shell (nav, sidebar) first — design the smallest real thing a
  user does, then let the layout grow around it.
- **Detail comes later.** Sketch in low fidelity (grayscale, rough) first;
  committing to color/polish too early makes you precious about bad ideas.
- **Work in cycles.** Design a little, build a little. Don't perfect a mockup
  the browser will contradict.
- **Don't over-invest in low-value features.** Give the primary action the most
  design energy; secondary things can be plain.
- **Choose a personality** deliberately — via typeface (elegant serif vs neutral
  sans), color (blue = safe/pro, gold = warm/premium), border-radius (sharp =
  formal, round = friendly), and language.

### 3.2 Hierarchy is everything
- **Not all elements are equal.** Deliberately make important things prominent
  and unimportant things recede. Most "flat/boring" UIs lack hierarchy, not
  color.
- **Size is not the only tool** — and often the worst one. Vary **font weight**
  and **color** before size.
  - Primary text: dark/high-contrast.
  - Secondary text: medium gray.
  - Tertiary text: light gray.
  - Use **two colors** (dark + gray) and **two weights** (normal + semibold) far
    more than five font sizes.
- **Don't use gray text on colored backgrounds.** Instead pick a
  same-hue-as-the-background color with adjusted lightness/saturation.
- **Emphasize by de-emphasizing.** To make one thing stand out, mute its
  neighbors rather than shouting the hero louder.
- **Labels are a last resort.** "Twitter: @user" → just "@user". Let format and
  position imply meaning; add a label only when the value is genuinely
  ambiguous. When you do need a label + value, emphasize whichever the user is
  actually scanning for (usually the value).
- **Semantics ≠ hierarchy.** An `<h1>` doesn't have to be the biggest thing on
  the page (e.g. an article title can be quiet; the content is the star).
- **Balance weight and contrast.** Bold icons look heavier than text at the same
  size — reduce their contrast (lighter color) to balance.
- **Actions:** primary action = solid, high-contrast button; secondary = outline
  or lower-contrast; tertiary/destructive = link-style until it matters. Never
  give three actions equal visual weight.

### 3.3 Layout & spacing
- **Start with too much white space, then remove.** Cramped is the default sin.
  Give elements room; whitespace is a feature, not wasted pixels.
- **Establish a spacing/sizing system** and only use values from it — never
  arbitrary numbers. A good scale (each step ~1.25–1.5× the last):
  `4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256…`
  (This matches the infographic's 4/8-point system — see Part 5.)
- **You don't have to fill the whole screen.** Give content a sensible
  `max-width` and let it breathe; a form does not need to be 1600px wide.
- **Grids are overrated for everything.** Not every element should be fluid.
  Some things have an ideal fixed size — set it, don't stretch it. Use
  percentage widths only where fluidity actually helps.
- **Relative sizing doesn't scale.** A heading that's 2× the body on desktop
  shouldn't stay 2× on mobile — large text shrinks faster than small text.
- **Avoid ambiguous spacing.** When items relate, the space *inside* a group must
  be clearly less than the space *between* groups (Law of Proximity). A label
  hugs its own field, not the field above.

### 3.4 Typography
- **Establish a type scale** — a fixed set of sizes (e.g. `12, 14, 16, 18, 20,
  24, 30, 36, 48, 60, 72`). Never eyeball "somewhere between 20 and 24."
- **Use good fonts; it's hard to go wrong with the popular ones.** Prefer a
  typeface with many weights. Neutral sans-serifs are the safe default for UI.
- **Keep line length ~45–75 characters** (~20–35em) for readable paragraphs.
- **Line-height is proportional to line length and inverse to font size:** wide
  or small text needs taller line-height; large headings need tighter.
  (Infographic numbers in Part 5.)
- **Baseline, not middle.** Align mixed-size text on the baseline.
- **Letter-spacing:** tighten large headings slightly (−1 to −2%); occasionally
  loosen all-caps labels. Body text: leave at 0.
- **Right-align numbers** in tables and use **tabular figures** so digits line
  up in columns.
- **Not every link needs a color.** In dense UIs, weight or a hover state can
  signal "clickable" without a sea of blue.

### 3.5 Color
- **Use HSL, not hex.** Hue/Saturation/Lightness lets you reason about color;
  hex doesn't.
- **You need more colors than you think.** A real palette:
  - **Greys:** 8–10 shades (dark text → light borders/backgrounds).
  - **Primary:** 5–10 shades of your brand color.
  - **Accents:** a few (success green, warning yellow, error red, info blue),
    each with 5–10 shades.
- **Define shades up front** by picking a base, then a darkest and lightest, then
  filling the middle — don't `lighten()/darken()` on the fly.
- **Lightness matters more than you think for perceived vividness.** To make a
  color "pop," don't just saturate — rotate the hue toward a brighter neighbor
  (e.g. toward yellow/cyan) and lighten.
- **Greys can have a hue.** Cool greys (blue tint) feel crisp/techy; warm greys
  (yellow/red tint) feel soft/human. Pick one on purpose. For WeddingWala's
  warm/premium feel, warm greys pair naturally with a gold accent.
- **Don't rely on color alone** to convey meaning (accessibility + Part 4). Pair
  it with an icon, label, or shape.
- **Accessible contrast:** flip the pattern — light text on a *saturated,
  slightly-darkened* background reads better than dark text; or rotate hue to
  keep contrast while staying vivid. Target WCAG AA (4.5:1 body, 3:1 large).

### 3.6 Creating depth
- **Light comes from above** — the mental model for every shadow. Top edges
  catch light (subtle light inner highlight), bottoms cast shadow.
- **Two shadows per elevation:** a tight dark one (the contact shadow) + a large
  soft one (the ambient cast). This reads far more real than one blurry blob.
- **Elevation = layers of a system,** not random blurs. Define tiers: flat →
  raised (card) → overlay (dropdown) → modal → toast, each with a set shadow.
- **Use shadow to convey elevation intent:** small shadow = "slightly raised,
  interactive"; large shadow = "floating above everything, temporary."
- **Flat design still has depth** — via color/contrast layers (a lighter card on
  a slightly darker page) instead of shadows.
- **Overlap elements** to create depth and tie sections together (an image
  crossing a section boundary, an avatar straddling a card edge).

### 3.7 Working with images
- **Text on images needs guaranteed contrast:** add a scrim (semi-transparent
  overlay), lower the image contrast, or blur behind the text. Never trust the
  raw photo.
- **Everything has a max resolution** — don't scale icons/logos up past their
  native size; they get blurry. Use SVG for anything that must scale.
- **Respect the intended size of things** — a screenshot shrunk into a phone
  frame becomes an illegible smudge; show a cropped detail instead.
- **Beware user-generated content** breaking your beautiful layout: constrain
  aspect ratios, define fallbacks for missing/oversized images, cap text length.
- **Consistent icon style/weight** — don't mix filled and outline sets.

### 3.8 Finishing touches
- **Supercharge the defaults:** replace bullet points with icons, style
  quotes/links/tables, add accent borders to cards/alerts.
- **Add color with accent borders** — a 3–4px top or left border in a semantic
  color turns a plain card into a labelled one.
- **Decorate backgrounds** subtly — a gentle gradient, a repeating pattern at
  low opacity, an angled section divider.
- **Empty states are not edge cases** — they're the *first* thing a new user
  sees. Design them: an illustration, one line of guidance, and the primary CTA.
- **Use fewer borders.** To separate things, prefer (a) more spacing, (b) a
  subtle background-color difference, or (c) a soft shadow — before reaching for
  a hard line. Too many borders = visual noise.
- **Think outside the box:** dropdowns can have sections/icons/multiple columns;
  tables can carry avatars and badges; a "radio group" can be styled cards.

---

## Part 4 — Psychology / Laws of UX

Design against how minds actually work, not how we wish they did.

- **Hick's Law** — decision time grows with the number and complexity of
  choices. → Reduce options, chunk them, use progressive disclosure, highlight
  the recommended default. (WeddingWala: don't show a vendor 15 nav rows.)
- **Fitts's Law** — time to hit a target depends on its size and distance. →
  Make primary buttons big and close to where the hand/eye already is; put
  destructive actions far and small; mobile tap targets ≥ 44×44px.
- **Miller's Law** — people hold ~7 (±2) items in working memory. → Chunk
  information (phone numbers, steps, menus) into small groups.
- **Jakob's Law** — users spend most of their time on *other* sites, so they
  expect yours to work like those. → Don't reinvent standard patterns (cart,
  search, login) without a strong reason.
- **Law of Proximity** — things placed close together are perceived as related.
  → Grouping via spacing beats grouping via borders.
- **Law of Similarity** — visually similar elements are seen as a group. →
  Consistent styling signals "these are the same kind of thing."
- **Law of Prägnanz (Simplicity)** — the eye prefers the simplest
  interpretation. → Clean, ordered layouts are literally *easier to look at.*
- **Law of Common Region** — a shared boundary/background groups elements. → A
  card unifies its contents.
- **Von Restorff (Isolation) Effect** — the item that differs is remembered. →
  Make the one thing you want noticed (primary CTA) visually distinct.
- **Serial Position Effect** — people best remember the first and last items. →
  Put the most important nav/menu items at the start and end.
- **Peak–End Rule** — an experience is judged by its most intense moment and its
  end. → Nail the emotional peak (booking confirmed!) and the final step
  (a warm confirmation, not a dead-end).
- **Zeigarnik Effect** — unfinished tasks nag at memory. → Progress bars and
  "2 of 3 steps done" pull people to completion.
- **Goal-Gradient Effect** — motivation rises as the goal nears. → Show
  progress; a checklist that's already 20% filled gets finished more often.
- **Aesthetic–Usability Effect** — people perceive attractive things as more
  usable (and forgive their flaws). → Polish buys goodwill — but never as a
  substitute for real usability.
- **Doherty Threshold** — engagement stays high when the system responds in
  <400ms. → Optimistic UI, skeletons, instant feedback; never a frozen click.
- **Tesler's Law (Conservation of Complexity)** — every system has irreducible
  complexity; the only question is who absorbs it. → The design should absorb
  complexity so the user doesn't (smart defaults, auto-fill).
- **Postel's Law** — be liberal in what you accept, conservative in what you
  emit. → Accept messy input (spaces in card numbers, any phone format);
  return clean, predictable output.
- **Occam's Razor** — remove elements until you can't without breaking function.

---

## Part 5 — Spacing & Type System (Pixel Craft infographic — exact numbers)

The concrete numeric backbone for the UI layer. **These are quoted from the
infographic and are the rules to implement literally.**

### Spatial consistency — build spacing in increments (4/8-point system)
- **Small spacing** (inner padding, tiny elements): **4, 8, 12**
- **Medium spacing** (large elements, related components): **16, 24, 32, 48**
- **Large spacing** (sections): **64, 96**

> Rule: every margin/padding/gap is a value from this scale — never `13px`,
> never `27px`. This is what makes an interface feel "designed" vs "assembled."

### Type spacing — don't ignore line-height ("most design is text, make it legible")
| Setting | Value |
|---|---|
| **Body line-height** | 1.3–1.6 × font size |
| **Headline line-height** | 0.9–1.2 × font size |
| **Tiny-text line-height** | 1.4–1.7 × font size |
| **Paragraph spacing** | 0.3–0.7 × line-height |
| **Body letter-spacing** | 0% for most typefaces |
| **Headline letter-spacing** | −2% for most typefaces |

### Grids
Use a column grid to align UI elements based on a sequence of columns/rows —
alignment is a system, not per-element eyeballing.

### Spacing terms (shared vocabulary)
- **Padding** — inner spacing, the space between elements *within* a component.
- **Margin** — space *outside* the content, defining boundaries.
- **Columns** — vertical guidelines in a grid allocated to content.
- **Gutters** — the spaces *between* columns, serving as separators.

---

## Part 6 — Working checklist (how we'll actually apply this)

A pre-flight list for every screen we touch in the design pass.

**Before pixels (UX):**
- [ ] What problem does this screen solve, and for whom (which persona)?
- [ ] What is the ONE primary action here? Is it unmistakable?
- [ ] What's the user's flow *into* and *out of* this screen?
- [ ] Sketched in low-fi/grayscale before any color?

**Hierarchy:**
- [ ] Primary / secondary / tertiary text distinguished by weight + color (not just size)?
- [ ] Exactly one visually dominant action; others de-emphasized?
- [ ] Labels removed where format implies meaning?

**Layout & spacing:**
- [ ] Every space is a value from the 4/8 scale (Part 5)?
- [ ] Space *within* a group < space *between* groups (no ambiguous spacing)?
- [ ] Generous whitespace; content has a sane `max-width`?

**Typography:**
- [ ] Sizes only from the type scale?
- [ ] Line-height per Part 5 (body 1.3–1.6×, headings tighter)?
- [ ] Line length ~45–75 chars; tabular figures where numbers align?

**Color:**
- [ ] Palette from defined shades (greys + primary + semantic accents), HSL-reasoned?
- [ ] Warm-grey neutrals paired with the gold/brand accent (WeddingWala tone)?
- [ ] Meaning never carried by color alone; WCAG AA contrast met?

**Depth & finish:**
- [ ] Elevation from a defined tier system (light-from-above shadows)?
- [ ] Empty, loading, and error states designed — not afterthoughts?
- [ ] Borders minimized in favor of spacing / background / shadow?

**Psychology:**
- [ ] Choices reduced/chunked (Hick, Miller)?
- [ ] Tap targets ≥ 44px, primary actions big & reachable (Fitts)?
- [ ] Progress shown for multi-step flows (Zeigarnik, Goal-Gradient)?
- [ ] Feedback under 400ms / optimistic (Doherty)?
- [ ] Standard patterns respected (Jakob)?

**After (validate):**
- [ ] Would a first-time user know what to do without being told?
- [ ] Tested with a real user / walked the flow end-to-end?
- [ ] Iterated on what testing revealed?

---

*Status: research artifact — compiled and held pending the team's real spec.
No design work has started. When "start" is given, we begin at Part 2 step 1
(Discover) and design against Parts 3–6.*

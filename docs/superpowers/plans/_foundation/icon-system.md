# Iconly Icon System (react-iconly) — Foundation Spec

Status: PROPOSED / ready to implement
Owner: Dashboard foundation
Scope: `ems-v0/components/dashboard/**` (the ~166 files currently importing `lucide-react`)
Author note: Live production system. Migration is **additive and mechanical** — the wrapper ships first, screens migrate one at a time, lucide stays installed until the last screen is migrated.

---

## 0. Why & census

The dashboard currently imports `lucide-react` directly in ~166 files. A full census of
`components/dashboard/**` (`import {...} from 'lucide-react'`) found **190 distinct icon names**
plus the `LucideIcon` type (191 identifiers total). The goal is to funnel **every** icon through
**one typed wrapper** so the entire set's stroke weight, default size, and color behaviour is
tunable from a single file, and so we can swap the underlying icon library (lucide → Iconly)
once, centrally, instead of in 166 files.

The full censused set (190 icons) is the source of truth for the `IconName` union and the map in
§2. The high-frequency subset named in the task brief is a strict subset of this list.

---

## 1. Install & style variant

```bash
npm i react-iconly
# (peer: react >=17, react-dom >=17 — already satisfied)
```

`react-iconly` exposes the Iconly icon family. Each icon component accepts:

```ts
<IconlyIcon set="bulk" | "broken" | "bold" | "light" | "two-tone" | "curved"
            size={number | "small" | "medium" | "large" | "xlarge"}
            primaryColor="currentColor"
            secondaryColor="..."   // bulk / two-tone only
            stroke="light" | "regular" | "bold"
            filled  // bulk look
/>
```

### Standardize on `set="light"` (primary), with `bulk` reserved for emphasis

**Decision: the default variant is `light`.** Justification:

- **Matches lucide visually.** lucide is a 1.5–2px **stroke / outline** set. `light` is Iconly's
  thin single-color outline variant — it is the closest drop-in, so 166 screens keep their current
  feel and nothing looks suddenly "heavier". A `bulk` default would two-tone-fill every icon in the
  app and visually break dozens of dense tables/toolbars at once — unacceptable for a live system.
- **Single-color = `currentColor` works.** `light` honours `primaryColor="currentColor"`, so every
  existing `className="text-muted-foreground"` / `text-rose-600` etc. keeps tinting the icon exactly
  as it does with lucide. `bulk`/`two-tone` need a *secondary* color and don't degrade cleanly to
  `currentColor`.
- **`bulk` is opt-in for hero/marketing emphasis only** (empty-states, upgrade nudges, the
  notifications hero). The wrapper exposes `variant` so a caller can request `variant="bulk"` per
  instance; the global default stays `light`.

Centralized in the wrapper: `DEFAULT_VARIANT = 'light'`, `DEFAULT_SIZE = 18`, `DEFAULT_STROKE = 'regular'`.
Changing the look of the **entire** dashboard is a one-line edit there.

> Iconly's set is **smaller and rounder** than lucide. Many lucide names have no 1:1 Iconly icon.
> Those are handled by the **fallback layer** (§3): a tiny curated lucide subset re-exported through
> the same `<Icon>` API, plus inline SVGs / the `<Spinner/>` for spinner & a few brand glyphs. The
> caller never imports lucide again — only `<Icon name="...">` / `<Spinner/>`.

---

## 2. The wrapper — `components/dashboard/shared/icon.tsx`

Design:

- `IconName` is a **string-literal union of all 190 censused names** (the old lucide PascalCase
  names are preserved as the public `name` so migration is a pure find-replace — `Trash2` →
  `name="Trash2"`).
- `ICONLY_MAP` maps each name to the Iconly component **and** an optional per-icon variant/filled
  override (e.g. status icons render `filled` for a solid dot look).
- `FALLBACK_MAP` maps names with **no clean Iconly equivalent** to a renderer (curated lucide icon
  or inline SVG). Marked `// FALLBACK` so they're auditable.
- Resolution order: `ICONLY_MAP` → `FALLBACK_MAP` → dev guard (§4).
- `<Spinner/>` is a first-class export (Iconly has no spinner; never map `Loader2` to a static icon).

```tsx
// components/dashboard/shared/icon.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// ── Iconly source set ────────────────────────────────────────────────────────
// react-iconly ships one component per glyph. We import only the ones we map.
import {
  // navigation / chevrons / arrows
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowRight, ArrowLeft,
  ArrowUp, ArrowDown, ArrowUpSquare, ArrowDownSquare, Swap,
  // people
  User, People, AddUser, TwoUsers, Profile,
  // money / commerce
  Wallet, Buy, Bag, Bag2, Discount, Ticket, TicketStar,
  // comms
  Message, Chat, Send, Notification, Call, Calling, Voice,
  // files / data
  Document, Paper, PaperPlus, PaperUpload, PaperDownload, PaperFail, PaperNegative,
  Folder, Category, Filter, Filter2, Search, Edit, EditSquare, Delete, Plus,
  // status / shields / locks
  Shield, ShieldDone, ShieldFail, Lock, Unlock, InfoSquare, InfoCircle, Danger,
  TickSquare, CloseSquare, Hide, Show, Activity,
  // time / calendar
  Calendar, TimeCircle, TimeSquare,
  // misc objects
  Star, Heart, Image, Image2, Camera, Location, Home, Setting, Work, Bookmark,
  Download, Upload, Login, Logout, Graph, Chart, Wallet as WalletIcon, Scan,
  Game, Discovery, MoreCircle, MoreSquare, PlusSquare, Star as StarIcon,
} from 'react-iconly';

// ── Public types & central defaults ──────────────────────────────────────────
export type IconVariant =
  | 'light' | 'bulk' | 'broken' | 'bold' | 'two-tone' | 'curved';

export const DEFAULT_VARIANT: IconVariant = 'light';
export const DEFAULT_SIZE = 18;            // px — global lever for the whole app
export const DEFAULT_STROKE: 'light' | 'regular' | 'bold' = 'regular';

export interface IconProps {
  name: IconName;
  size?: number;
  /** Per-instance override of the global variant (e.g. emphasis = "bulk"). */
  variant?: IconVariant;
  className?: string;
  /** Accessible label; when omitted icon is aria-hidden (decorative). */
  label?: string;
  strokeWidth?: number; // forwarded to lucide fallbacks only
}

// react-iconly component signature (subset we use)
type IconlyComp = React.ComponentType<{
  set?: IconVariant;
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  stroke?: 'light' | 'regular' | 'bold';
  filled?: boolean;
  label?: string;
  className?: string;
}>;

interface IconlyEntry {
  Comp: IconlyComp;
  variant?: IconVariant;  // per-icon variant override
  filled?: boolean;       // solid look for status dots
}

// =============================================================================
// 2a. ICONLY_MAP — every censused lucide name → closest Iconly glyph
// 190 censused names. Names with NO clean Iconly equivalent live in FALLBACK_MAP
// (§3) instead and are intentionally ABSENT here.
// =============================================================================
const ICONLY_MAP: Partial<Record<IconName, IconlyEntry>> = {
  // ── chevrons / arrows ──
  ChevronDown:    { Comp: ChevronDown },
  ChevronUp:      { Comp: ChevronUp },
  ChevronLeft:    { Comp: ChevronLeft },
  ChevronRight:   { Comp: ChevronRight },
  ChevronsLeft:   { Comp: ChevronLeft },   // double-chevron → single (Iconly has no double)
  ChevronsRight:  { Comp: ChevronRight },
  ChevronsUpDown: { Comp: Swap },          // up/down sort handle ≈ Swap
  ArrowRight:     { Comp: ArrowRight },
  ArrowLeft:      { Comp: ArrowLeft },
  ArrowUpRight:   { Comp: ArrowUpSquare },
  ArrowDownRight: { Comp: ArrowDownSquare },
  ArrowUpFromLine:{ Comp: ArrowUp },
  ArrowDownToLine:{ Comp: ArrowDown },
  ArrowLeftRight: { Comp: Swap },
  ArrowRightLeft: { Comp: Swap },
  CornerDownRight:{ Comp: ArrowDownSquare },
  Undo2:          { Comp: ArrowLeft },
  RotateCw:       { Comp: Activity },       // weak; see note — acceptable for "refresh"
  RefreshCw:      { Comp: Activity },
  RefreshCcw:     { Comp: Activity },
  Repeat:         { Comp: Activity },

  // ── people ──
  User:        { Comp: User },
  User2:       { Comp: User },
  Users:       { Comp: People },
  Users2:      { Comp: TwoUsers },
  UserCircle:  { Comp: Profile },
  UserCheck:   { Comp: AddUser },          // closest "verified user" → AddUser
  UserMinus:   { Comp: People },           // no remove-user glyph; FALLBACK preferred (§3)
  UserX:       { Comp: People },           // see FALLBACK
  SquareUser:  { Comp: Profile },
  AddUser:     { Comp: AddUser },

  // ── money / commerce ──
  Wallet:           { Comp: Wallet },
  CreditCard:       { Comp: Wallet },
  DollarSign:       { Comp: Wallet },      // no $ glyph; Wallet is the money cue (or FALLBACK SVG)
  CircleDollarSign: { Comp: Buy },
  HandCoins:        { Comp: Buy },
  Banknote:         { Comp: Wallet },
  Receipt:          { Comp: Document },
  ReceiptText:      { Comp: Document },
  ShoppingBag:      { Comp: Bag },
  Percent:          { Comp: Discount },
  Tag:              { Comp: Ticket },

  // ── comms ──
  MessageCircle:       { Comp: Chat },
  MessageSquare:       { Comp: Message },
  MessageSquareText:   { Comp: Message },
  MessageSquareReply:  { Comp: Chat },
  Reply:               { Comp: Chat },
  Mail:                { Comp: Message },
  MailOpen:            { Comp: Message },
  Send:                { Comp: Send },
  Bell:                { Comp: Notification },
  BellRing:            { Comp: Notification, variant: 'bulk' },
  Phone:               { Comp: Call },
  Smartphone:          { Comp: Calling },

  // ── files / data ──
  FileText:      { Comp: Document },
  FileUp:        { Comp: PaperUpload },
  FileCheck:     { Comp: PaperPlus },
  FilePlus:      { Comp: PaperPlus },
  FileBadge:     { Comp: Paper },
  FileWarning:   { Comp: PaperFail },
  ScrollText:    { Comp: Paper },
  ClipboardList: { Comp: Document },
  ClipboardCheck:{ Comp: PaperPlus },
  ListChecks:    { Comp: Document },
  Quote:         { Comp: Paper },
  Table:         { Comp: Category },
  Filter:        { Comp: Filter },
  Search:        { Comp: Search },
  Copy:          { Comp: Document },
  Save:          { Comp: PaperDownload },
  Download:      { Comp: Download },
  Upload:        { Comp: Upload },
  ScanLine:      { Comp: Scan },
  Pin:           { Comp: Bookmark },
  PinOff:        { Comp: Bookmark },
  Link:          { Comp: Discovery },
  Link2:         { Comp: Discovery },
  Share2:        { Comp: Send },
  ExternalLink:  { Comp: ArrowUpSquare },

  // ── edit / crud ──
  Edit:        { Comp: Edit },
  Pencil:      { Comp: Edit },
  PencilLine:  { Comp: EditSquare },
  PenLine:     { Comp: EditSquare },
  Brush:       { Comp: Edit },
  Eraser:      { Comp: Delete },
  Trash2:      { Comp: Delete },
  Plus:        { Comp: Plus },
  Minus:       { Comp: Plus },             // visually Plus rotated; FALLBACK SVG preferred for "−"
  X:           { Comp: CloseSquare },
  Check:       { Comp: TickSquare },
  CheckCheck:  { Comp: TickSquare },
  CheckCircle2:{ Comp: TickSquare, filled: true },
  XCircle:     { Comp: CloseSquare, filled: true },
  Circle:      { Comp: MoreCircle },
  CircleDashed:{ Comp: MoreCircle },
  MoreHorizontal:{ Comp: MoreSquare },
  PlusSquare:  { Comp: PlusSquare },

  // ── status / security ──
  Shield:      { Comp: Shield },
  ShieldCheck: { Comp: ShieldDone },
  ShieldAlert: { Comp: ShieldFail },
  ShieldOff:   { Comp: ShieldFail },
  BadgeCheck:  { Comp: ShieldDone },
  Lock:        { Comp: Lock },
  Unlock:      { Comp: Unlock },
  Fingerprint: { Comp: Scan },
  Info:        { Comp: InfoSquare },
  AlertCircle: { Comp: Danger },
  AlertTriangle:{ Comp: Danger },
  Eye:         { Comp: Show },
  EyeOff:      { Comp: Hide },
  Ban:         { Comp: CloseSquare },
  BanIcon:     { Comp: CloseSquare },

  // ── time / calendar ──
  Calendar:      { Comp: Calendar },
  CalendarDays:  { Comp: Calendar },
  CalendarCheck: { Comp: Calendar },
  CalendarCheck2:{ Comp: Calendar },
  CalendarClock: { Comp: Calendar },
  CalendarHeart: { Comp: Calendar },
  CalendarPlus:  { Comp: Calendar },
  CalendarRange: { Comp: Calendar },
  CalendarOff:   { Comp: Calendar },
  CalendarX:     { Comp: Calendar },
  CalendarIcon:  { Comp: Calendar },
  Clock:         { Comp: TimeCircle },
  TimeCircle:    { Comp: TimeCircle },
  Hourglass:     { Comp: TimeSquare },
  History:       { Comp: TimeSquare },

  // ── analytics ──
  TrendingUp:   { Comp: Graph },
  TrendingDown: { Comp: Graph },
  BarChart3:    { Comp: Chart },
  PieChart:     { Comp: Chart },
  Gauge:        { Comp: Activity },
  Activity:     { Comp: Activity },
  Target:       { Comp: Discovery },

  // ── objects / nav ──
  Star:            { Comp: Star },
  LayoutDashboard: { Comp: Category },
  LayoutGrid:      { Comp: Category },
  Boxes:           { Comp: Category },
  Layers:          { Comp: Category },
  Settings:        { Comp: Setting },
  Settings2:       { Comp: Setting },
  MapPin:          { Comp: Location },
  Building:        { Comp: Work },
  Building2:       { Comp: Work },
  Store:           { Comp: Bag2 },
  BriefcaseBusiness:{ Comp: Work },
  Globe:           { Comp: Discovery },
  Camera:          { Comp: Camera },
  ImageIcon:       { Comp: Image },
  ImagePlus:       { Comp: Image2 },
  Images:          { Comp: Image2 },
  Palette:         { Comp: Image },
  Package:         { Comp: Bag2 },
  PackageCheck:    { Comp: Bag2 },
  PackagePlus:     { Comp: Bag2 },
  PackageMinus:    { Comp: Bag2 },
  PackageX:        { Comp: Bag2 },
  LogOut:          { Comp: Logout },
  Login:           { Comp: Login },
  Smile:           { Comp: Game },
  Bookmark:        { Comp: Bookmark },
  Home:            { Comp: Home },
  Discovery:       { Comp: Discovery },
  Zap:             { Comp: Activity },     // "energy/instant" → Activity (or FALLBACK bolt SVG)
};

// =============================================================================
// 2b. The component
// =============================================================================
export function Icon({
  name,
  size = DEFAULT_SIZE,
  variant,
  className,
  label,
  strokeWidth,
}: IconProps) {
  const a11y = label ? { 'aria-label': label } : { 'aria-hidden': true as const };

  // 1) Iconly mapping
  const entry = ICONLY_MAP[name];
  if (entry) {
    const { Comp, variant: perIconVariant, filled } = entry;
    return (
      <span className={cn('inline-flex shrink-0', className)} {...a11y}>
        <Comp
          set={variant ?? perIconVariant ?? DEFAULT_VARIANT}
          size={size}
          stroke={DEFAULT_STROKE}
          primaryColor="currentColor"
          filled={filled}
        />
      </span>
    );
  }

  // 2) Fallback layer (curated lucide / inline SVG / spinner) — see §3
  const Fallback = FALLBACK_MAP[name];
  if (Fallback) {
    return <Fallback size={size} className={className} label={label} strokeWidth={strokeWidth} />;
  }

  // 3) Dev guard — unknown name (§4)
  return <UnknownIcon name={name as string} size={size} className={className} />;
}
```

---

## 3. Fallback layer — names with NO clean Iconly equivalent

Iconly is rounder/smaller than lucide and **lacks** several glyphs the dashboard depends on. For
these we keep a **tiny curated lucide subset** (still rendered through `<Icon>`, so callers never
import lucide) plus inline SVGs and the spinner. This is the explicit, auditable list.

### Spinner — `Loader2` (Iconly has no spinner)

`Loader2` is a continuously-rotating loading spinner. **Never** map it to a static icon. The wrapper
exports a real `<Spinner/>` and routes `name="Loader2"` to it.

```tsx
// --- Spinner (replaces lucide Loader2) -------------------------------------
export function Spinner({
  size = DEFAULT_SIZE,
  className,
  label = 'Loading',
}: { size?: number; className?: string; label?: string }) {
  return (
    <svg
      role="status" aria-label={label}
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={cn('animate-spin', className)}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
```

### Curated lucide fallback subset + inline-SVG fallbacks

These names render via a **renderer** keyed in `FALLBACK_MAP`. The lucide-backed ones import from a
single `lucide-react` entry point **inside `icon.tsx` only** — the rest of the app stays lucide-free.

```tsx
import {
  Loader2 as _LoaderUnused,        // (not used directly — Spinner replaces it; kept for clarity)
  Sparkles as LSparkles,
  Wand2 as LWand2,
  Crown as LCrown,
  ThumbsUp as LThumbsUp,
  ThumbsDown as LThumbsDown,
  Megaphone as LMegaphone,
  PartyPopper as LPartyPopper,
  Trophy as LTrophy,
  Award as LAward,
  Gavel as LGavel,
  Scale as LScale,
  Handshake as LHandshake,
  HardHat as LHardHat,
  ChefHat as LChefHat,
  Utensils as LUtensils,
  UtensilsCrossed as LUtensilsCrossed,
  Flower2 as LFlower2,
  Car as LCar,
  Truck as LTruck,
  Plane as LPlane,
  Fuel as LFuel,
  Wind as LWind,
  CloudRain as LCloudRain,
  CloudSun as LCloudSun,
  Sun as LSun,
  Moon as LMoon,
  Calculator as LCalculator,
  ScanLine as LScanLine,
  Scissors as LScissors,
  Wrench as LWrench,
  Type as LType,
  Inbox as LInbox,
  GalleryVerticalEnd as LGalleryVerticalEnd,
  UserMinus as LUserMinus,
  UserX as LUserX,
  Minus as LMinus,
  DollarSign as LDollarSign,
  type LucideIcon as _LucideIcon,
} from 'lucide-react';

type FallbackRenderer = React.ComponentType<{
  size?: number; className?: string; label?: string; strokeWidth?: number;
}>;

// helper that wraps a lucide icon into our <Icon>-compatible renderer
function lucideFallback(L: _LucideIcon): FallbackRenderer {
  return function LucideFallback({ size = DEFAULT_SIZE, className, label, strokeWidth = 1.75 }) {
    const a11y = label ? { 'aria-label': label } : { 'aria-hidden': true as const };
    return <L size={size} className={cn('inline-block shrink-0', className)} strokeWidth={strokeWidth} {...a11y} />;
  };
}

const FALLBACK_MAP: Partial<Record<IconName, FallbackRenderer>> = {
  // ─ spinner ─
  Loader2: ({ size, className, label }) => <Spinner size={size} className={className} label={label} />,

  // ─ FALLBACK: no Iconly equivalent → curated lucide ─
  Sparkles:        lucideFallback(LSparkles),     // FALLBACK
  Wand2:           lucideFallback(LWand2),         // FALLBACK
  Crown:           lucideFallback(LCrown),         // FALLBACK
  ThumbsUp:        lucideFallback(LThumbsUp),      // FALLBACK
  ThumbsDown:      lucideFallback(LThumbsDown),    // FALLBACK
  Megaphone:       lucideFallback(LMegaphone),     // FALLBACK
  PartyPopper:     lucideFallback(LPartyPopper),   // FALLBACK
  Trophy:          lucideFallback(LTrophy),        // FALLBACK
  Award:           lucideFallback(LAward),         // FALLBACK
  Gavel:           lucideFallback(LGavel),         // FALLBACK
  Scale:           lucideFallback(LScale),         // FALLBACK
  Handshake:       lucideFallback(LHandshake),     // FALLBACK
  HardHat:         lucideFallback(LHardHat),       // FALLBACK
  ChefHat:         lucideFallback(LChefHat),       // FALLBACK
  Utensils:        lucideFallback(LUtensils),      // FALLBACK
  UtensilsCrossed: lucideFallback(LUtensilsCrossed), // FALLBACK
  Flower2:         lucideFallback(LFlower2),       // FALLBACK
  Car:             lucideFallback(LCar),           // FALLBACK
  Truck:           lucideFallback(LTruck),         // FALLBACK
  Plane:           lucideFallback(LPlane),         // FALLBACK
  Fuel:            lucideFallback(LFuel),          // FALLBACK
  Wind:            lucideFallback(LWind),          // FALLBACK
  CloudRain:       lucideFallback(LCloudRain),     // FALLBACK
  CloudSun:        lucideFallback(LCloudSun),      // FALLBACK
  Sun:             lucideFallback(LSun),           // FALLBACK
  Moon:            lucideFallback(LMoon),          // FALLBACK
  Calculator:      lucideFallback(LCalculator),    // FALLBACK
  ScanLine:        lucideFallback(LScanLine),      // FALLBACK (overrides Scan in §2 if needed)
  Scissors:        lucideFallback(LScissors),      // FALLBACK
  Wrench:          lucideFallback(LWrench),         // FALLBACK
  Type:            lucideFallback(LType),          // FALLBACK
  Inbox:           lucideFallback(LInbox),         // FALLBACK
  GalleryVerticalEnd: lucideFallback(LGalleryVerticalEnd), // FALLBACK (team-switcher brand mark)
  UserMinus:       lucideFallback(LUserMinus),     // FALLBACK (retire-staff action)
  UserX:           lucideFallback(LUserX),         // FALLBACK

  // ─ FALLBACK: inline SVG (cleaner than lucide for these primitives) ─
  Minus: ({ size = DEFAULT_SIZE, className, label }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         aria-hidden={!label} aria-label={label}
         className={cn('inline-block shrink-0', className)}>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  DollarSign: lucideFallback(LDollarSign), // FALLBACK — Iconly has no "$" glyph; keep literal $
};
```

> Anything still rendered through lucide is a **deliberate, listed fallback**. If the design team
> later approves an Iconly substitution for one of these, delete its `FALLBACK_MAP` row and add an
> `ICONLY_MAP` row — one line each, no screen touched.

---

## 4. Dev-mode guard (unknown name)

```tsx
function UnknownIcon({
  name, size = DEFAULT_SIZE, className,
}: { name: string; size?: number; className?: string }) {
  if (process.env.NODE_ENV !== 'production') {
    // Loud in dev: console + visible magenta box so it can't be missed in review.
    // eslint-disable-next-line no-console
    console.error(
      `[Icon] Unknown icon name "${name}". Add it to ICONLY_MAP or FALLBACK_MAP in components/dashboard/shared/icon.tsx`,
    );
    return (
      <span
        title={`Unknown icon: ${name}`}
        style={{ width: size, height: size, outline: '2px solid magenta', display: 'inline-block' }}
        className={className}
        aria-hidden
      />
    );
  }
  // Production: fail safe — render a neutral empty box, never crash a live screen.
  return <span style={{ width: size, height: size, display: 'inline-block' }} className={className} aria-hidden />;
}
```

Because `IconName` is a string-literal union, a typo like `name="Trash3"` is **also** a *compile-time*
TypeScript error — the runtime guard is the second net for dynamic (`name={someVar as IconName}`) cases.

---

## 5. The `IconName` union (top of `icon.tsx`)

Paste the full censused list (190 names) so every old lucide name is a valid `name`:

```ts
export type IconName =
  | 'Activity' | 'AlertCircle' | 'AlertTriangle' | 'ArrowDownRight' | 'ArrowDownToLine'
  | 'ArrowLeft' | 'ArrowLeftRight' | 'ArrowRight' | 'ArrowRightLeft' | 'ArrowUpFromLine'
  | 'ArrowUpRight' | 'Award' | 'BadgeCheck' | 'Ban' | 'BanIcon' | 'Banknote' | 'BarChart3'
  | 'Bell' | 'BellRing' | 'Boxes' | 'BriefcaseBusiness' | 'Brush' | 'Building' | 'Building2'
  | 'Calculator' | 'Calendar' | 'CalendarCheck' | 'CalendarCheck2' | 'CalendarClock'
  | 'CalendarDays' | 'CalendarHeart' | 'CalendarIcon' | 'CalendarOff' | 'CalendarPlus'
  | 'CalendarRange' | 'CalendarX' | 'Camera' | 'Car' | 'Check' | 'CheckCheck' | 'CheckCircle2'
  | 'ChefHat' | 'ChevronDown' | 'ChevronLeft' | 'ChevronRight' | 'ChevronUp' | 'ChevronsLeft'
  | 'ChevronsRight' | 'ChevronsUpDown' | 'Circle' | 'CircleDashed' | 'CircleDollarSign'
  | 'ClipboardCheck' | 'ClipboardList' | 'Clock' | 'CloudRain' | 'CloudSun' | 'Copy'
  | 'CornerDownRight' | 'CreditCard' | 'Crown' | 'DollarSign' | 'Download' | 'Edit' | 'Eraser'
  | 'ExternalLink' | 'Eye' | 'EyeOff' | 'FileBadge' | 'FileCheck' | 'FilePlus' | 'FileText'
  | 'FileUp' | 'FileWarning' | 'Filter' | 'Fingerprint' | 'Flower2' | 'Fuel'
  | 'GalleryVerticalEnd' | 'Gauge' | 'Gavel' | 'Globe' | 'HandCoins' | 'Handshake' | 'HardHat'
  | 'History' | 'Hourglass' | 'ImageIcon' | 'ImagePlus' | 'Images' | 'Inbox' | 'Info' | 'Layers'
  | 'LayoutDashboard' | 'LayoutGrid' | 'Link' | 'Link2' | 'ListChecks' | 'Loader2' | 'Lock'
  | 'LogOut' | 'Mail' | 'MailOpen' | 'MapPin' | 'Megaphone' | 'MessageCircle' | 'MessageSquare'
  | 'MessageSquareReply' | 'MessageSquareText' | 'Minus' | 'Moon' | 'MoreHorizontal' | 'Package'
  | 'PackageCheck' | 'PackageMinus' | 'PackagePlus' | 'PackageX' | 'Palette' | 'PartyPopper'
  | 'PenLine' | 'Pencil' | 'PencilLine' | 'Percent' | 'Phone' | 'PieChart' | 'Pin' | 'PinOff'
  | 'Plane' | 'Plus' | 'Quote' | 'Receipt' | 'ReceiptText' | 'RefreshCcw' | 'RefreshCw' | 'Repeat'
  | 'Reply' | 'RotateCw' | 'Save' | 'Scale' | 'ScanLine' | 'Scissors' | 'ScrollText' | 'Search'
  | 'Send' | 'Settings' | 'Settings2' | 'Share2' | 'Shield' | 'ShieldAlert' | 'ShieldCheck'
  | 'ShieldOff' | 'ShoppingBag' | 'Smartphone' | 'Smile' | 'Sparkles' | 'SquareUser' | 'Star'
  | 'Store' | 'Sun' | 'Table' | 'Tag' | 'Target' | 'ThumbsDown' | 'ThumbsUp' | 'Trash2'
  | 'TrendingDown' | 'TrendingUp' | 'Trophy' | 'Truck' | 'Type' | 'Undo2' | 'Unlock' | 'Upload'
  | 'User' | 'User2' | 'UserCheck' | 'UserCircle' | 'UserMinus' | 'UserX' | 'Users' | 'Users2'
  | 'Utensils' | 'UtensilsCrossed' | 'Wallet' | 'Wand2' | 'Wind' | 'Wrench' | 'X' | 'XCircle'
  | 'Zap';
```

> `LucideIcon` (the **type**, 191st identifier) is intentionally NOT an `IconName` — it's replaced by
> `IconName` itself in nav-data typing (§6).

---

## 6. Migration recipe (per screen, mechanical)

**A screen swap (e.g. `calendar-feed-card.tsx`):**

1. Delete the `import { Calendar, Copy, Trash2, Loader2, ... } from 'lucide-react';` block.
2. Add `import { Icon } from '@/components/dashboard/shared/icon';` (and `Spinner` if it used `Loader2`).
3. Replace usages:
   - `<Trash2 className="h-4 w-4 text-rose-600" />` → `<Icon name="Trash2" size={16} className="text-rose-600" />`
   - `<Loader2 className="h-4 w-4 animate-spin" />` → `<Spinner size={16} />` (drop the `animate-spin` — built in)
   - Size: lucide `h-4 w-4` = 16, `h-5 w-5` = 20, `h-3.5 w-3.5` = 14. Pass via `size`; keep color/margin classes in `className`.
4. Codemod assist (find/replace regex per icon): `<Trash2(\s) ` → `<Icon name="Trash2"$1`, then drop the matching close-tag rename — review the diff.

**Handling the `LucideIcon` type** (used in `nav-main.tsx`, `nav-projects.tsx`):

- `import { type LucideIcon, ChevronRight } from 'lucide-react'` → remove.
- Anywhere a prop was typed `icon: LucideIcon`, retype it as `icon: IconName` (a string) and render
  with `<Icon name={item.icon} />` instead of `<item.icon />`.

```ts
// before
import { type LucideIcon } from 'lucide-react'
type NavItem = { title: string; url: string; icon?: LucideIcon }
// after
import type { IconName } from '@/components/dashboard/shared/icon'
type NavItem = { title: string; url: string; icon?: IconName }
```

**Nav-data icon refs** (`layout/nav-data.ts`, `layout.tsx`): these currently import icon
*components* and store them as values (`icon: Users`). Convert each to its **string name**:

```ts
// before (nav-data.ts)
import { Users, Wallet, ShieldAlert, Sparkles, AlertCircle, ... } from 'lucide-react'
const items = [{ title: 'Customers', icon: Users }, ...]
// after — drop the lucide import entirely
import type { IconName } from '@/components/dashboard/shared/icon'
const items: { title: string; icon: IconName }[] = [{ title: 'Customers', icon: 'Users' }, ...]
```

The renderer (`nav-main.tsx`) then does `<Icon name={item.icon} size={18} />`. Because `icon` is
`IconName`, an unmapped name is a compile error.

**Order of migration:** leaf components first (dialogs, tables, cards), then nav/layout last (it's
the shared chrome). lucide stays installed until the final screen migrates; then remove the curated
fallback imports only if every fallback name has been retired (most will remain — they're the
no-Iconly-equivalent set, so `lucide-react` stays a dependency but is imported in exactly one file).

---

## 7. Acceptance / guardrails

- ESLint rule (add later): ban `from 'lucide-react'` everywhere **except** `components/dashboard/shared/icon.tsx`.
- A grep gate in CI: `grep -rl "from 'lucide-react'" components/dashboard --include=*.tsx | grep -v shared/icon.tsx` must return empty once migration completes.
- Visual QA: render an `<IconGallery>` story listing all 190 names at `size=18` to eyeball every Iconly substitution and every fallback in one screen before rollout.
- Central levers verified: changing `DEFAULT_SIZE`/`DEFAULT_VARIANT`/`DEFAULT_STROKE` reflows the whole dashboard.

/**
 * WW-MENU-READ — read a menu's dishes, whatever shape they were written in.
 *
 * ── The bug this exists to fix ────────────────────────────────────────────
 *
 * The customer's Menu step showed a menu's TITLE and PRICE and nothing else —
 * no dishes at all — so "choose your menu" asked a family to pick between
 * names. It looked like missing data. It was a shape mismatch.
 *
 * `Menus.data` is a free-form JSON column and has held three shapes:
 *
 *   { items: ["Chicken Karahi", ...] }                       portal, flat
 *   { items: [{ name, countsAs }, ...] }                      portal, classified
 *   { mainCourse: { items: [...] }, desserts: { items: [] } } booking-flow sections
 *
 * The step read ONLY the third, hardcoded to four section names
 * (starters / mainCourse / drinks / desserts), and dropped anything empty. So
 * every menu the vendor wrote in the PORTAL — the flat `data.items` array —
 * rendered zero categories, and even a sectioned menu lost any section outside
 * those four (rice, salad, bread, which the server's own SECTION_DEFAULTS map
 * clearly anticipates).
 *
 * ── Why this mirrors the server rather than inventing a rule ──────────────
 *
 * `flattenMenuItems` in event-planner-api/src/utils/oneDishRule.js already
 * handles all three shapes, because the one-dish compliance checker has to read
 * every menu ever saved. This is that traversal, ported — so the dishes a
 * customer is shown are exactly the dishes the compliance rule counts, and the
 * two cannot disagree about what is on a menu.
 *
 * An unreadable blob yields an empty list rather than throwing: a menu with
 * malformed `data` must still be selectable, and a booking flow that crashes on
 * one bad row is worse than one that shows a title on its own.
 */

/** A dish, normalised out of whichever shape it was stored in. */
export interface MenuDish {
  name: string;
  /** The section it was filed under, or null for a flat list. */
  section: string | null;
  /** Live counter / made-to-order station. */
  isLive: boolean;
  /** Per-head supplement, 0 when the dish is included. */
  supplementPerHead: number;
  /** "Pick N of these" group, or null when the dish is always served. */
  group: string | null;
}

/** A section of a menu, in the order the vendor wrote it. */
export interface MenuSection {
  key: string;
  label: string;
  dishes: MenuDish[];
}

/**
 * Display names for the sections we know about. Mirrors the server's
 * SECTION_DEFAULTS keys so a section the compliance rule understands is a
 * section the customer sees a proper heading for. Anything else falls back to
 * a title-cased version of the key rather than being hidden.
 */
const SECTION_LABELS: Record<string, string> = {
  starters: "Starters",
  chaat: "Chaat",
  maincourse: "Main course",
  main_course: "Main course",
  mains: "Main course",
  salan: "Salan",
  curry: "Curry",
  rice: "Rice",
  biryani: "Biryani",
  salad: "Salad",
  saladbar: "Salad bar",
  bread: "Bread",
  roti: "Roti",
  naan: "Naan",
  drinks: "Beverages",
  beverages: "Beverages",
  desserts: "Desserts",
  sweets: "Sweets",
  sweet: "Sweets",
  live: "Live counters",
  extras: "Extras",
};

const normaliseKey = (k: string) => String(k || "").toLowerCase().replace(/[\s_-]/g, "");

function labelFor(key: string): string {
  const direct = SECTION_LABELS[key.toLowerCase()] || SECTION_LABELS[normaliseKey(key)];
  if (direct) return direct;
  // A vendor's own section name is better shown than swallowed.
  const spaced = String(key).replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : "Other";
}

function toDish(raw: unknown, section: string | null): MenuDish | null {
  if (raw == null) return null;

  if (typeof raw === "string") {
    const name = raw.trim();
    return name ? { name, section, isLive: false, supplementPerHead: 0, group: null } : null;
  }

  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    // `title` as well as `name`: the portal has written both.
    const name = String(o.name ?? o.title ?? "").trim();
    if (!name) return null;
    const supplement = Number(o.supplementPerHead);
    return {
      name,
      section: section ?? (o.section ? String(o.section) : null),
      isLive: o.isLive === true,
      supplementPerHead: Number.isFinite(supplement) && supplement > 0 ? supplement : 0,
      group: o.group ? String(o.group) : null,
    };
  }

  return null;
}

/**
 * Every dish on a menu, flat, in the order they appear.
 *
 * Direct port of `flattenMenuItems` — flat `data.items` first, then every
 * `data.<section>.items`.
 */
export function menuDishes(data: unknown): MenuDish[] {
  const out: MenuDish[] = [];
  if (!data || typeof data !== "object") return out;
  const obj = data as Record<string, unknown>;

  const flat = obj.items;
  if (Array.isArray(flat)) {
    for (const it of flat) {
      const d = toDish(it, null);
      if (d) out.push(d);
    }
  }

  for (const [key, val] of Object.entries(obj)) {
    if (key === "items") continue;
    if (val && typeof val === "object" && Array.isArray((val as { items?: unknown }).items)) {
      for (const it of (val as { items: unknown[] }).items) {
        const d = toDish(it, key);
        if (d) out.push(d);
      }
    }
  }

  return out;
}

/**
 * The dishes grouped for display.
 *
 * Sections keep the order the vendor wrote them in — not a hardcoded
 * starters/main/drinks/dessert order, which is what silently dropped every
 * other section. A flat menu comes back as one unnamed group so it renders as
 * a plain dish list rather than under a heading it never had.
 */
export function menuSections(data: unknown): MenuSection[] {
  const dishes = menuDishes(data);
  if (dishes.length === 0) return [];

  const order: string[] = [];
  const bucket = new Map<string, MenuDish[]>();

  for (const d of dishes) {
    const key = d.section ?? "";
    if (!bucket.has(key)) {
      bucket.set(key, []);
      order.push(key);
    }
    bucket.get(key)!.push(d);
  }

  return order.map((key) => ({
    key: key || "items",
    label: key ? labelFor(key) : "",
    dishes: bucket.get(key)!,
  }));
}

/** How many dishes a menu lists. Used to say so before the customer opens it. */
export function menuDishCount(data: unknown): number {
  return menuDishes(data).length;
}

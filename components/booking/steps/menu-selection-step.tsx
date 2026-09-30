"use client"

import { useState } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { BookingFormData, EventVenue } from "@/lib/types"
import { Check, ChevronDown } from "lucide-react"
import { menuChargeFor, menuIsPerHead } from "@/lib/pricing/menu"
// WW-MENU-READ — reads every shape `Menus.data` has been written in. The step
// used to read only the sectioned one, so portal-written menus showed a title
// and no dishes at all.
import { menuSections } from "@/lib/menu/menu-items"
import { useBookingShell } from "@/components/booking/shell/booking-shell-context"

interface MenuSelectionStepProps {
  formData: BookingFormData
  updateFormData: React.Dispatch<React.SetStateAction<BookingFormData>>
  venue: EventVenue | null
  /**
   * WW-PKG-UNIT — TRUE when the chosen package already covers catering, so this
   * step is a CHOICE rather than a CHARGE. Prices are hidden and the running
   * total does not move; the customer still picks their dishes, because the
   * kitchen needs the selection either way and a package that hides its menu is
   * worse than one that shows it. Defaults false = the legacy priced step.
   */
  includedInPackage?: boolean
  /** Name of the package covering the food, for the explanatory copy. */
  packageName?: string
}

/*
 * Layout (spec §7.4). The shell renders the heading; this step is the included
 * note, the menu rows and the footnote — nothing else.
 *
 *   row 72 (density 64): radio 20 · title 22/28 + preview 12/16 · price / Included · "See dishes"
 *   selected row expands by default: dish panel, 2 columns at xl, max-height
 *   168 (density 132) with its own scroll on the desk tiers so three rows stay
 *   inside the fold. "See dishes" opens a panel WITHOUT selecting the menu.
 *
 * Entrance is CSS (`animate-stagger-fade-up`, keyframe ends at opacity 1). The
 * old framer container/item variants mounted every row at opacity 0.
 */

export default function MenuSelectionStep({
  formData,
  updateFormData,
  venue,
  includedInPackage = false,
  packageName,
}: MenuSelectionStepProps) {
  const { tier, announce } = useBookingShell()

  /**
   * Which dish panels the customer opened or closed by hand. Absent = follow
   * the selection (the chosen menu shows its dishes, the others do not).
   * Cleared on every selection so the new choice is the one that is open.
   */
  const [panelOverride, setPanelOverride] = useState<Record<string, boolean>>({})

  const handleMenuSelect = (menuId: string) => {
    const selectedMenu = venue?.menus.find((m) => m.id === menuId)
    // WW-PRICING-OVERHAUL — per-head menus bill price × max(guests, min-pax);
    // flat menus are their price. menuChargeFor is the shared server-mirrored helper.
    // WW-PKG-UNIT — but when the package covers food, BOTH the old and the new
    // menu contribute 0, so the running total must not move by a single rupee
    // as the customer flicks between dish options.
    const menuPrice = includedInPackage ? 0 : menuChargeFor(selectedMenu, formData.guestCount)

    // Recalculate: remove old menu price, add new
    const oldMenu = venue?.menus.find((m) => m.id === formData.selectedMenu)
    const oldMenuPrice = includedInPackage ? 0 : menuChargeFor(oldMenu, formData.guestCount)
    const currentTotal = Number(formData.totalPrice) || 0

    updateFormData({
      ...formData,
      selectedMenu: menuId,
      totalPrice: currentTotal - oldMenuPrice + menuPrice,
    })
  }

  const onValueChange = (menuId: string) => {
    setPanelOverride({})
    handleMenuSelect(menuId)
    const picked = venue?.menus.find((m) => m.id === menuId)
    if (picked?.title) announce(`${picked.title} selected`)
  }

  /**
   * Only the menus served in the space the customer picked.
   *
   * A menu now records which hall serves it (`subVenueId`, NULL = venue-wide),
   * the same column packages already had. Without this filter a couple booking
   * the Terrace Lawn was offered — and could buy — the Main Hall kitchen's
   * menu, which is not food the venue can put on the table in the room they
   * are paying for.
   *
   * Venue-wide menus are always shown, so nothing disappears for a venue that
   * has not split its menus up. And if narrowing would leave the customer with
   * NOTHING, the full list stands: an empty menu step is a dead end, and a
   * slightly wide list beats no list at all on a live booking flow. Identical
   * rule to package-step, deliberately.
   */
  const allMenus = venue?.menus
  const chosenSpaceId = Number((formData as any).selectedSubVenueId) || null
  const scopedMenus = chosenSpaceId
    ? (allMenus || []).filter(
        (m: any) => m?.subVenueId == null || Number(m.subVenueId) === chosenSpaceId,
      )
    : allMenus
  const menus = scopedMenus && scopedMenus.length > 0 ? scopedMenus : allMenus

  // The desk body is the scroller on the desk tiers, so the dish panel caps
  // itself and scrolls inside. On a phone the document scrolls; a nested
  // scroller there would trap the thumb, so the panel simply grows.
  const panelCap = tier === "desk"

  return (
    <div>
      {/* WW-PKG-UNIT — say it plainly, once, at the top. A customer who has just
          agreed to a per-head package and then meets a screen full of per-head
          menu prices reasonably assumes they are being charged again. */}
      {includedInPackage && (
        <div
          className="mb-3 flex min-h-[44px] items-center gap-2 rounded-[4px] border border-bridal-beige bg-bridal-sand/50 px-4 py-2 motion-safe:animate-stagger-fade-up"
          style={{ animationDelay: "0ms" }}
        >
          <Check className="h-3.5 w-3.5 shrink-0 text-[#3F6B43]" strokeWidth={2.5} aria-hidden="true" />
          <p className="font-bridal text-[13px] leading-[18px] text-bridal-text">
            Food is included in
            <strong className="font-medium not-italic text-bridal-charcoal"> {packageName || "your package"}</strong>.
            Choosing a menu here tells the kitchen what to cook — it does not add to your total.
          </p>
        </div>
      )}

      <RadioGroup value={formData.selectedMenu} onValueChange={onValueChange} className="gap-2">
        {menus?.map((menu, i) => {
          const isSelected = formData.selectedMenu === menu.id

          /* WW-MENU-READ — was four hardcoded section lookups
             (`items.starters?.items` …), which returned nothing for a menu
             written in the portal's flat `{ items: [...] }` shape and dropped
             any section outside those four even in the sectioned shape. The
             vendor's own section order is preserved. */
          const sections = menuSections(menu.data)
          const dishCount = sections.reduce((n, sec) => n + sec.dishes.length, 0)
          const dishNames = sections.flatMap((sec) => sec.dishes.map((d) => d.name))
          const preview =
            dishCount > 0
              ? `${dishCount} ${dishCount === 1 ? "dish" : "dishes"} · ${dishNames.slice(0, 3).join(", ")}${
                  dishNames.length > 3 ? ` +${dishNames.length - 3}` : ""
                }`
              : "Dishes not listed yet"

          const panelOpen = panelOverride[menu.id] ?? isSelected
          const panelId = `menu-dishes-${menu.id}`

          return (
            <div
              key={menu.id}
              // `min-w-0`: this is a grid item (RadioGroup is `grid`), and a
              // grid item's minimum width is its content's — on a 358px phone
              // column the row ran to 582px before the title could truncate.
              className={`relative min-w-0 rounded-[4px] border transition-colors duration-200 motion-safe:animate-stagger-fade-up ${
                isSelected
                  ? "border-bridal-gold-dark bg-bridal-cream"
                  : "border-bridal-beige bg-white hover:bg-bridal-blush/45"
              }`}
              style={{ animationDelay: `${Math.min(i + (includedInPackage ? 1 : 0), 8) * 30}ms` }}
              data-selected={isSelected ? "true" : undefined}
            >
              {/* 4px gold rule, drawn top-down on select (§8 card select). */}
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute bottom-0 left-0 top-0 w-1 origin-top rounded-l-[3px] bg-bridal-gold transition-transform duration-200 ease-out ${
                  isSelected ? "scale-y-100" : "scale-y-0"
                }`}
              />

              <div className="flex min-h-[72px] items-center gap-3 py-2 pl-4 pr-3 xl:[@media(max-height:820px)]:min-h-[64px]">
                {/* The whole left region is the label, so a tap anywhere on the
                    title or preview picks the menu; the radio is inside it. */}
                <Label
                  htmlFor={menu.id}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 self-stretch font-normal leading-normal"
                >
                  <RadioGroupItem
                    value={menu.id}
                    id={menu.id}
                    className="h-5 w-5 shrink-0 border-bridal-beige bg-white text-bridal-charcoal transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 data-[state=checked]:border-bridal-gold-dark data-[state=checked]:bg-bridal-gold data-[state=checked]:text-bridal-charcoal"
                  />
                  <span className="block min-w-0 flex-1">
                    <span className="block truncate font-display text-[22px] italic leading-[28px] text-bridal-charcoal">
                      {menu.title}
                    </span>
                    {/* How much food this actually is, stated before the list.
                        A customer comparing three menus needs the shape of each
                        at a glance, and it also makes an EMPTY menu obviously
                        empty rather than looking like a broken card. */}
                    <span className="block truncate font-bridal text-[12px] leading-[16px] text-bridal-text-soft">
                      {preview}
                    </span>
                  </span>
                </Label>

                <div className="flex shrink-0 items-center gap-2">
                  {/* WW-PKG-UNIT — when the package covers food, the menu's
                      own rate is not what the customer pays, so showing it
                      here would be quoting a number that never appears on
                      their bill. "Included" is both true and reassuring. */}
                  {includedInPackage ? (
                    <span className="font-bridal text-[11px] uppercase leading-[14px] tracking-[0.18em] text-[#3F6B43]">
                      Included
                    </span>
                  ) : (
                    <span className="whitespace-nowrap font-display text-[22px] italic leading-[26px] text-bridal-gold-dark tabular-nums">
                      Rs {Number(menu.price)?.toLocaleString()}
                      {menuIsPerHead(menu) && (
                        <span className="font-bridal text-[12px] not-italic leading-[16px] text-bridal-text-soft"> /plate</span>
                      )}
                    </span>
                  )}

                  {/* Opens the dish list without choosing the menu. */}
                  <button
                    type="button"
                    onClick={() => setPanelOverride((prev) => ({ ...prev, [menu.id]: !panelOpen }))}
                    aria-expanded={panelOpen}
                    aria-controls={panelId}
                    className="inline-flex h-11 shrink-0 items-center gap-1 rounded-full px-2 font-bridal text-[12px] leading-[16px] text-bridal-text-label transition-colors duration-150 hover:text-bridal-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2"
                  >
                    <span className="whitespace-nowrap">{panelOpen ? "Hide dishes" : "See dishes"}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${panelOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              {panelOpen && (
                <div id={panelId} className="border-t border-bridal-beige pb-3 pl-4 pr-3 pt-2">
                  {sections.length > 0 ? (
                    <div
                      className={`grid grid-cols-1 gap-x-6 gap-y-3 xl:grid-cols-2 ${
                        panelCap
                          ? "bridal-scroll max-h-[168px] overflow-y-auto overscroll-contain pr-2 xl:[@media(max-height:820px)]:max-h-[132px]"
                          : ""
                      }`}
                    >
                      {sections.map((sec) => (
                        <div key={sec.key} className="min-w-0">
                          {/* A flat menu has no section name; showing an
                              invented one ("Other") would be worse than
                              showing the dishes plainly. */}
                          {sec.label && (
                            <h4 className="mb-1 font-bridal text-[10px] uppercase leading-[12px] tracking-[0.18em] text-bridal-gold-dark">
                              {sec.label}
                            </h4>
                          )}
                          <ul className="space-y-0.5">
                            {sec.dishes.map((dish, j) => (
                              <li
                                key={`${dish.name}-${j}`}
                                className="flex items-start gap-2 font-bridal text-[12.5px] leading-[18px] text-bridal-charcoal/85"
                              >
                                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-bridal-gold" aria-hidden="true" />
                                <span className="min-w-0">
                                  {dish.name}
                                  {/* Both of these change what the family
                                      gets or pays, so they belong next to the
                                      dish and not in a footnote. */}
                                  {dish.isLive && (
                                    <span className="ml-1.5 font-bridal text-[10px] uppercase tracking-[0.16em] text-[#3F6B43]">
                                      live
                                    </span>
                                  )}
                                  {dish.supplementPerHead > 0 && !includedInPackage && (
                                    <span className="ml-1.5 font-bridal text-[11px] text-bridal-gold-dark tabular-nums">
                                      +Rs {dish.supplementPerHead.toLocaleString()}/plate
                                    </span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Said plainly instead of rendering an empty card. The
                       venue has priced this menu but not listed its dishes;
                       the customer can still choose it and ask. */
                    <p className="font-bridal text-[12.5px] italic leading-[18px] text-bridal-text-soft">
                      This menu&apos;s dishes aren&apos;t listed yet — choose it and the venue
                      will confirm what&apos;s served.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </RadioGroup>

      <p className="mt-4 font-bridal text-[12px] italic leading-[16px] text-bridal-text-soft">
        Menus can be customized for dietary needs. Add notes in the final step.
      </p>
    </div>
  )
}

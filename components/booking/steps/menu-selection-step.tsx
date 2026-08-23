"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { BookingFormData, EventVenue } from "@/lib/types"
import { Check } from "lucide-react"
import { motion } from "framer-motion"
import { menuChargeFor, menuIsPerHead } from "@/lib/pricing/menu"

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

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function MenuSelectionStep({
  formData,
  updateFormData,
  venue,
  includedInPackage = false,
  packageName,
}: MenuSelectionStepProps) {
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

  const menus = venue?.menus

  const categoryLabels: Record<string, string> = {
    starters: "Starters",
    mainCourse: "Main Course",
    drinks: "Beverages",
    desserts: "Desserts",
  }

  return (
    <motion.div className="space-y-7" variants={container} initial="hidden" animate="visible">
      <motion.div variants={item}>
        <p className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-gold-dark mb-2">
          {includedInPackage ? "Step · Customise your menu" : "Step · Menu"}
        </p>
        <h2 className="font-display italic text-[28px] sm:text-[32px] text-bridal-charcoal leading-tight">Choose your menu</h2>
        <p className="mt-2 font-bridal text-[14px] text-bridal-text-soft">
          {includedInPackage
            ? "Pick the dishes you'd like. Your food is already covered — this won't change your price."
            : "Select a menu package for your event"}
        </p>
      </motion.div>

      {/* WW-PKG-UNIT — say it plainly, once, at the top. A customer who has just
          agreed to a per-head package and then meets a screen full of per-head
          menu prices reasonably assumes they are being charged again. */}
      {includedInPackage && (
        <motion.div
          variants={item}
          className="rounded-sm border border-bridal-beige bg-bridal-sand/50 px-4 py-3"
        >
          <p className="font-bridal text-[13px] text-bridal-text">
            <Check className="inline-block w-3.5 h-3.5 mr-1.5 -mt-0.5 text-bridal-sage" aria-hidden="true" />
            Food is included in
            <strong className="not-italic text-bridal-charcoal"> {packageName || "your package"}</strong>.
            Choosing a menu here tells the kitchen what to cook — it does not add to your total.
          </p>
        </motion.div>
      )}

      <div className="space-y-3">
        <RadioGroup value={formData.selectedMenu} onValueChange={handleMenuSelect}>
          {menus?.map((menu) => {
            const items = menu.data
            const isSelected = formData.selectedMenu === menu.id

            const categories = [
              { key: "starters", data: items.starters?.items || [] },
              { key: "mainCourse", data: items.mainCourse?.items || [] },
              { key: "drinks", data: items.drinks?.items || [] },
              { key: "desserts", data: items.desserts?.items || [] },
            ].filter(c => c.data.length > 0)

            return (
              <motion.div
                key={menu.id}
                variants={item}
                className={`relative rounded-md border overflow-hidden transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'border-bridal-gold-dark bg-bridal-cream shadow-[0_14px_32px_-18px_rgba(176,125,84,0.5)]'
                    : 'border-bridal-beige bg-bridal-ivory hover:border-bridal-gold/55 hover:bg-bridal-cream'
                }`}
              >
                {isSelected && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-bridal-gold border border-bridal-gold-dark flex items-center justify-center z-10 shadow-[0_4px_12px_-6px_rgba(176,125,84,0.55)]">
                    <Check className="w-3.5 h-3.5 text-bridal-charcoal" strokeWidth={3} />
                  </motion.div>
                )}

                <div className="flex items-start gap-4 p-5 sm:p-6">
                  <RadioGroupItem value={menu.id} id={menu.id} className="mt-2 border-bridal-beige data-[state=checked]:bg-bridal-gold data-[state=checked]:text-bridal-charcoal data-[state=checked]:border-bridal-gold-dark" />
                  <div className="flex-1">
                    <div className="flex items-end justify-between gap-3 pr-10">
                      <Label htmlFor={menu.id} className="font-display italic text-[22px] cursor-pointer text-bridal-charcoal leading-tight">
                        {menu.title}
                      </Label>
                      {/* WW-PKG-UNIT — when the package covers food, the menu's
                          own rate is not what the customer pays, so showing it
                          here would be quoting a number that never appears on
                          their bill. "Included" is both true and reassuring. */}
                      {includedInPackage ? (
                        <span className="font-bridal text-[12px] uppercase tracking-[0.18em] font-medium text-bridal-sage leading-none shrink-0">
                          Included
                        </span>
                      ) : (
                        <span className="font-display italic text-[22px] text-bridal-gold-dark leading-none shrink-0">
                          Rs. {Number(menu.price)?.toLocaleString()}
                          {menuIsPerHead(menu) && (
                            <span className="font-bridal not-italic text-[12px] text-bridal-text-soft"> /plate</span>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {categories.map(({ key, data }) => (
                        <div key={key} className="rounded-md bg-bridal-ivory border border-bridal-beige/70 p-4">
                          <h4 className="font-bridal text-[10px] uppercase tracking-[0.3em] font-medium text-bridal-gold-dark mb-2">
                            {categoryLabels[key] || key}
                          </h4>
                          <ul className="space-y-1">
                            {data.map((menuItem: string, j: number) => (
                              <li key={j} className="font-bridal text-[12.5px] text-bridal-charcoal/85 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-bridal-gold flex-shrink-0" />
                                {menuItem}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </RadioGroup>
      </div>

      <p className="font-bridal text-[12px] text-bridal-text-soft italic">
        Menus can be customized for dietary needs. Add notes in the final step.
      </p>
    </motion.div>
  )
}

"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { BookingFormData, EventVenue } from "@/lib/types"
import { Check } from "lucide-react"
import { motion } from "framer-motion"

interface MenuSelectionStepProps {
  formData: BookingFormData
  updateFormData: React.Dispatch<React.SetStateAction<BookingFormData>>
  venue: EventVenue | null
}

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function MenuSelectionStep({ formData, updateFormData, venue }: MenuSelectionStepProps) {
  const handleMenuSelect = (menuId: string) => {
    const selectedMenu = venue?.menus.find((m) => m.id === menuId)
    const menuPrice = selectedMenu ? Number(selectedMenu.price) || 0 : 0

    // Recalculate: remove old menu price, add new
    const oldMenu = venue?.menus.find((m) => m.id === formData.selectedMenu)
    const oldMenuPrice = oldMenu ? Number(oldMenu.price) || 0 : 0
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
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="visible">
      <motion.div variants={item}>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">Choose Your Menu</h2>
        <p className="mt-1 text-sm text-neutral-500">Select a menu package for your event</p>
      </motion.div>

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
                className={`relative rounded-xl border-2 overflow-hidden transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50/30'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                {isSelected && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 right-4 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center z-10">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                )}

                <div className="flex items-start gap-3 p-5">
                  <RadioGroupItem value={menu.id} id={menu.id} className="mt-1 border-purple-400 text-purple-600" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between pr-8">
                      <Label htmlFor={menu.id} className="text-lg font-bold cursor-pointer text-neutral-900">
                        {menu.title}
                      </Label>
                      <span className="text-xl font-bold text-purple-600">Rs. {Number(menu.price)?.toLocaleString()}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {categories.map(({ key, data }) => (
                        <div key={key} className="rounded-lg bg-neutral-50 p-3">
                          <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1.5">
                            {categoryLabels[key] || key}
                          </h4>
                          <ul className="space-y-0.5">
                            {data.map((menuItem: string, j: number) => (
                              <li key={j} className="text-xs text-neutral-600 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-purple-300 flex-shrink-0" />
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

      <p className="text-xs text-neutral-400">
        Menus can be customized for dietary needs. Add notes in the final step.
      </p>
    </motion.div>
  )
}

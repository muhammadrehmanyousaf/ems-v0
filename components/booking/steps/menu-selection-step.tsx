"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { BookingFormData, EventVenue } from "@/lib/types"
import { bookingMenus, menuAddons } from "@/lib/data"
import { Utensils, Plus, Check } from "lucide-react"
import { motion } from "framer-motion"

interface MenuSelectionStepProps {
  formData: BookingFormData
  updateFormData: React.Dispatch<React.SetStateAction<BookingFormData>>
    venue: EventVenue | null;
}

export default function MenuSelectionStep({ formData, updateFormData, venue }: MenuSelectionStepProps) {
  const handleMenuSelect = (menuId: string) => {
    const selectedMenu = venue?.menus.find((menu) => menu.id === menuId)
    const price = selectedMenu ? selectedMenu.price : 0
    updateFormData({ ...formData, selectedMenu: menuId, totalPrice: formData.totalPrice + price })
  }

  const menue = venue?.menus
  console.log('menue', menue);
  
  // const handleAddonToggle = (addonId: string) => {
  //   const currentAddons = [...formData.menuAddons]

  //   if (currentAddons.includes(addonId)) {
  //     updateFormData({
  //       menuAddons: currentAddons.filter((id) => id !== addonId),
  //     })
  //   } else {
  //     updateFormData({
  //       menuAddons: [...currentAddons, addonId],
  //     })
  //   }
  // }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-pink-600">
          Select Menu
        </h2>
        <p className="text-neutral-600">Choose your preferred menu and additional food options</p>
      </div>

      <div className="space-y-8">
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center">
            <Utensils className="mr-2 h-5 w-5 text-rose-600" />
            <h3 className="text-lg font-medium text-neutral-700">Menu Options</h3>
          </div>

          <RadioGroup value={formData.selectedMenu} onValueChange={handleMenuSelect} className="space-y-5">
            {menue?.map((menu) => {
              const items = menu.data 
              const deserts = items.desserts.items
              const drinks = items.drinks.items
              const mainCourse = items.mainCourse.items
              const starters = items.starters.items

              return (
                <motion.div
                key={menu.id}
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ duration: 0.2 }}
                className={`relative overflow-hidden rounded-xl border p-5 shadow-md transition-all ${
                  formData.selectedMenu === menu.id
                    ? "border-rose-600 bg-gradient-to-br from-rose-50 to-pink-50 ring-1 ring-rose-600"
                    : "border-neutral-200 bg-white hover:border-rose-300"
                }`}
              >
                {/* {formData.selectedMenu === menu.id && (
                  <div className="absolute right-4 top-4 rounded-full bg-rose-600 p-1 text-white shadow-md">
                    <Check className="h-4 w-4" />
                  </div>
                )} */}
                <div className="flex items-start">
                  <RadioGroupItem value={menu.id} id={menu.id} className="mt-1 border-rose-600 text-rose-600" />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={menu.id} className="text-xl font-semibold cursor-pointer text-neutral-800">
                        {menu.title}
                      </Label>
                      <span className="text-xl font-bold text-rose-600">${menu.price}</span>
                    </div>
                    {/* <p className="mt-1 text-neutral-600">{menu.description}</p> */}
                    <div className="mt-4 rounded-xl bg-gradient-to-br from-neutral-50 to-rose-50 p-4 shadow-sm">
                      <h4 className="mb-3 text-sm font-medium text-neutral-700">Menu Items:</h4>
                      <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                        {/* {(() => {
                          const selectedMenu = bookingMenus.find((menu) => menu.id === formData.selectedMenu)
                          if (selectedMenu && selectedMenu.items.length > 0) {
                            return selectedMenu.items.map((item: string, index: number) => (
                              <li key={index} className="flex items-center text-neutral-700">
                                <span className="mr-2 text-rose-600">•</span> {item}
                              </li>
                            ))
                          } else {
                            return <li className="text-neutral-500">No items available</li>
                          }
                        })()} */}
                        <span>
                        {starters.length > 0 && (
                          <>
                            <p className="text-base font-medium">Starters</p>
                            {starters.map((item: string, j: number) => (
                              <li key={j} className="flex items-center text-neutral-700 text-sm">
                                <span className="mr-2 text-rose-600">•</span> {item}
                              </li>
                            ))}
                          </>
                        )}
                        </span>
                        <span>
                        {mainCourse.length > 0 && (
                          <>
                            <p className="text-base font-medium">Main Course</p>
                            {mainCourse.map((item: string, l: number) => (
                              <li key={l} className="flex items-center text-neutral-700 text-sm">
                                <span className="mr-2 text-rose-600">•</span> {item}
                              </li>
                            ))}
                          </>
                        )}
                        </span>
                        <span>
                        {drinks.length > 0 && (
                          <>
                            <p className="text-base font-medium">Drinks</p>
                            {drinks.map((item: string, m: number) => (
                              <li key={m} className="flex items-center text-neutral-700 text-sm">
                                <span className="mr-2 text-rose-600">•</span> {item}
                              </li>
                            ))}
                          </>
                        )}
                        </span>
                        <span>
                        {deserts.length > 0 && (
                          <>
                            <p className="text-base font-medium">Deserts</p>
                            {deserts.map((item: string, n: number) => (
                              <li key={n} className="flex items-center text-neutral-700 text-sm">
                                <span className="mr-2 text-rose-600">•</span> {item}
                              </li>
                            ))}
                          </>
                        )}
                        </span>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
              )
            })}
          </RadioGroup>
        </motion.div>

        {/* <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center">
            <Plus className="mr-2 h-5 w-5 text-rose-600" />
            <h3 className="text-lg font-medium text-neutral-700">Additional Options</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {menuAddons.map((addon) => (
              <motion.div
                key={addon.id}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start space-x-3 rounded-xl border p-4 shadow-sm transition-all ${
                  formData.menuAddons.includes(addon.id)
                    ? "border-rose-600 bg-gradient-to-br from-rose-50 to-pink-50"
                    : "border-neutral-200 bg-white hover:border-rose-300"
                }`}
              >
                <Checkbox
                  id={addon.id}
                  checked={formData.menuAddons.includes(addon.id)}
                  onCheckedChange={() => handleAddonToggle(addon.id)}
                  className="mt-1 border-rose-600 text-rose-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={addon.id} className="font-medium cursor-pointer text-neutral-800">
                      {addon.name}
                    </Label>
                    <span className="font-medium text-rose-600">+${addon.price}</span>
                  </div>
                  <p className="text-sm text-neutral-600">{addon.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div> */}
      </div>

      <motion.div
        variants={itemVariants}
        className="rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 p-4 shadow-sm border border-rose-200"
      >
        <p className="text-sm text-rose-800 text-center">
          All menu options can be customized for dietary restrictions. Please mention any special requirements in the
          final step.
        </p>
      </motion.div>
    </motion.div>
  )
}

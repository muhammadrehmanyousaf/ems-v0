"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { BookingFormData } from "@/lib/types"
import { bookingMenus, menuAddons } from "@/lib/data"
import { Utensils, Plus, Check } from "lucide-react"
import { motion } from "framer-motion"

interface MenuSelectionStepProps {
  formData: BookingFormData
  updateFormData: (data: Partial<BookingFormData>) => void
}

export default function MenuSelectionStep({ formData, updateFormData }: MenuSelectionStepProps) {
  const handleMenuSelect = (menuId: string) => {
    updateFormData({ selectedMenu: menuId })
  }

  const handleAddonToggle = (addonId: string) => {
    const currentAddons = [...formData.menuAddons]

    if (currentAddons.includes(addonId)) {
      updateFormData({
        menuAddons: currentAddons.filter((id) => id !== addonId),
      })
    } else {
      updateFormData({
        menuAddons: [...currentAddons, addonId],
      })
    }
  }

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
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          Select Menu
        </h2>
        <p className="text-gray-600">Choose your preferred menu and additional food options</p>
      </div>

      <div className="space-y-8">
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center">
            <Utensils className="mr-2 h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-medium text-gray-700">Menu Options</h3>
          </div>

          <RadioGroup value={formData.selectedMenu} onValueChange={handleMenuSelect} className="space-y-5">
            {bookingMenus.map((menu) => (
              <motion.div
                key={menu.id}
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ duration: 0.2 }}
                className={`relative overflow-hidden rounded-xl border p-5 shadow-md transition-all ${
                  formData.selectedMenu === menu.id
                    ? "border-indigo-600 bg-gradient-to-br from-indigo-50 to-purple-50 ring-1 ring-indigo-600"
                    : "border-gray-200 bg-white hover:border-indigo-300"
                }`}
              >
                {formData.selectedMenu === menu.id && (
                  <div className="absolute right-4 top-4 rounded-full bg-indigo-600 p-1 text-white shadow-md">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                <div className="flex items-start">
                  <RadioGroupItem value={menu.id} id={menu.id} className="mt-1 border-indigo-600 text-indigo-600" />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={menu.id} className="text-xl font-semibold cursor-pointer text-gray-800">
                        {menu.name}
                      </Label>
                      <span className="text-xl font-bold text-indigo-600">${menu.price}</span>
                    </div>
                    <p className="mt-1 text-gray-600">{menu.description}</p>
                    <div className="mt-4 rounded-lg bg-gradient-to-br from-gray-50 to-indigo-50 p-4 shadow-sm">
                      <h4 className="mb-3 text-sm font-medium text-gray-700">Menu Items:</h4>
                      <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                        {(() => {
                          const selectedMenu = bookingMenus.find((menu) => menu.id === formData.selectedMenu)
                          if (selectedMenu && selectedMenu.items.length > 0) {
                            return selectedMenu.items.map((item: string, index: number) => (
                              <li key={index} className="flex items-center text-gray-700">
                                <span className="mr-2 text-indigo-600">•</span> {item}
                              </li>
                            ))
                          } else {
                            return <li className="text-gray-500">No items available</li>
                          }
                        })()}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </RadioGroup>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center">
            <Plus className="mr-2 h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-medium text-gray-700">Additional Options</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {menuAddons.map((addon) => (
              <motion.div
                key={addon.id}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start space-x-3 rounded-xl border p-4 shadow-sm transition-all ${
                  formData.menuAddons.includes(addon.id)
                    ? "border-indigo-600 bg-gradient-to-br from-indigo-50 to-purple-50"
                    : "border-gray-200 bg-white hover:border-indigo-300"
                }`}
              >
                <Checkbox
                  id={addon.id}
                  checked={formData.menuAddons.includes(addon.id)}
                  onCheckedChange={() => handleAddonToggle(addon.id)}
                  className="mt-1 border-indigo-600 text-indigo-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={addon.id} className="font-medium cursor-pointer text-gray-800">
                      {addon.name}
                    </Label>
                    <span className="font-medium text-indigo-600">+${addon.price}</span>
                  </div>
                  <p className="text-sm text-gray-600">{addon.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        variants={itemVariants}
        className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-4 shadow-sm"
      >
        <p className="text-sm text-indigo-800 text-center">
          All menu options can be customized for dietary restrictions. Please mention any special requirements in the
          final step.
        </p>
      </motion.div>
    </motion.div>
  )
}

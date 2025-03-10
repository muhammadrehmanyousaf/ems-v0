"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { BookingFormData } from "@/lib/types"
import { menus, menuAddons } from "@/lib/data"

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

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Select Menu</h2>
        <p className="text-muted-foreground">Choose your preferred menu and additional food options</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Menu Options</h3>
          <RadioGroup value={formData.selectedMenu} onValueChange={handleMenuSelect} className="space-y-4">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className={`relative rounded-lg border p-4 transition-all hover:border-primary ${
                  formData.selectedMenu === menu.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start">
                  <RadioGroupItem value={menu.id} id={menu.id} className="mt-1" />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={menu.id} className="text-lg font-medium cursor-pointer">
                        {menu.name}
                      </Label>
                      <span className="font-bold">${menu.price}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{menu.description}</p>
                    <ul className="mt-2 grid grid-cols-1 gap-1 text-sm md:grid-cols-2">
                      {menu.items.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Additional Options</h3>
          <div className="space-y-3">
            {menuAddons.map((addon) => (
              <div key={addon.id} className="flex items-start space-x-3 rounded-md border p-4">
                <Checkbox
                  id={addon.id}
                  checked={formData.menuAddons.includes(addon.id)}
                  onCheckedChange={() => handleAddonToggle(addon.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={addon.id} className="font-medium cursor-pointer">
                      {addon.name}
                    </Label>
                    <span className="font-medium">+${addon.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{addon.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


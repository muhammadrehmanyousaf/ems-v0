"use client"

import { useFormContext } from "@/lib/context/form-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash } from "lucide-react"

export function PackagesStep() {
  const { formData, updateFormData } = useFormContext()

  const addPackage = () => {
    updateFormData({
      packages: [...formData.packages, { name: "", price: 0, services: [] }],
    })
  }

  const updatePackage = (index: number, field: keyof (typeof formData.packages)[0], value: any) => {
    const updatedPackages = formData.packages.map((pkg, i) => (i === index ? { ...pkg, [field]: value } : pkg))
    updateFormData({ packages: updatedPackages })
  }

  const removePackage = (index: number) => {
    const updatedPackages = formData.packages.filter((_, i) => i !== index)
    updateFormData({ packages: updatedPackages })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Packages</h2>
        <Button onClick={addPackage} variant="outline" className="text-rose-600 border-rose-600">
          <Plus className="w-4 h-4 mr-2" />
          Create new package
        </Button>
      </div>

      {formData.packages.map((pkg, index) => (
        <div key={index} className="space-y-4 p-4 border rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Package {index + 1}</h3>
            {index > 0 && (
              <Button onClick={() => removePackage(index)} variant="ghost" size="sm">
                <Trash className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`packageName-${index}`}>Package Name*</Label>
            <Input
              id={`packageName-${index}`}
              value={pkg.name}
              onChange={(e) => updatePackage(index, "name", e.target.value)}
              placeholder="Enter package name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`packagePrice-${index}`}>Price*</Label>
            <Input
              id={`packagePrice-${index}`}
              type="number"
              value={pkg.price}
              onChange={(e) => updatePackage(index, "price", Number.parseInt(e.target.value))}
              placeholder="Enter package price"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`packageServices-${index}`}>Services*</Label>
            <Input
              id={`packageServices-${index}`}
              value={pkg.services.join(", ")}
              onChange={(e) =>
                updatePackage(
                  index,
                  "services",
                  e.target.value.split(",").map((s) => s.trim()),
                )
              }
              placeholder="Enter services (comma-separated)"
            />
          </div>
        </div>
      ))}
    </div>
  )
}


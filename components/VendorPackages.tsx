"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Package {
  id?: string | number
  name: string
  price: number | string
  features?: any
  description?: string
}

interface VendorPackagesProps {
  packages?: Package[]
}

export default function VendorPackages({ packages = [] }: VendorPackagesProps) {
  if (!packages || packages.length === 0) {
    return <div className="text-center py-8 text-neutral-500">No packages available.</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {packages.map((pkg, i) => (
        <Card key={i} className="flex flex-col h-full border-purple-100 hover:border-purple-300 transition-colors shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">{pkg.name}</CardTitle>
            <CardDescription className="text-2xl font-bold text-purple-700 mt-2">
              Rs {Number(pkg.price).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-neutral-600 mb-4">{pkg.description}</p>
            <div className="space-y-2">
              <p className="text-xs text-neutral-500">This package details may vary depending on the event scope.</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
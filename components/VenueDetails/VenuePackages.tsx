import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Info } from "lucide-react"
import type { Package } from "@/lib/types"

interface VenuePackagesProps {
  packages: Package[]
}

export default function VenuePackages({ packages }: VenuePackagesProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="relative overflow-hidden">
            {pkg.id === 2 && (
              <div className="absolute top-4 right-4">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded">
                  Popular
                </span>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">{pkg.name}</CardTitle>
              <p className="text-3xl sm:text-4xl font-bold mt-2">
                PKR {pkg.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-600">/person</span>
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">{pkg.description}</p>
              <ul className="space-y-4 mb-6">
                {pkg.items.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-primary shrink-0 mr-3" />
                    <span className="text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" size="lg">
                Select Package
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            Additional Services
            <Info className="w-4 h-4 text-gray-400" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm sm:text-base">Air Conditioning</h3>
              <p className="text-xl sm:text-2xl font-bold">PKR 75,000</p>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm sm:text-base">Heating</h3>
              <p className="text-xl sm:text-2xl font-bold">PKR 50,000</p>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm sm:text-base">Real Flower Decor</h3>
              <p className="text-xl sm:text-2xl font-bold">PKR 75,000</p>
              <p className="text-xs sm:text-sm text-gray-600">Starting from</p>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm sm:text-base">Minimum Guests</h3>
              <p className="text-xl sm:text-2xl font-bold">350</p>
              <p className="text-xs sm:text-sm text-gray-600">To waive hall charges</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


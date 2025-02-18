import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, ChevronRight } from "lucide-react"
import type { Venue } from "@/lib/types"

interface VenueMenusProps {
  venue: Venue
}

const dummyMenus = [
  {
    id: 1,
    name: "Imperial Feast",
    price: 4100,
    items: {
      starters: ["Cream of Mushroom Soup", "Blue Lagoon"],
      mainCourse: [
        "Sesame Chicken Finger",
        "Veal Cheese Kabob",
        "Chicken Shish Taouk",
        "Panko Crumb Fried Fish",
        "Mutton Karahi",
        "Chicken Reshmi Handi",
        "Mutton Bukhara Pulao",
        "Palak Paneer",
      ],
      salads: ["Salad Platter (5 Types)"],
      breads: ["Assorted Naan (4 Types)"],
      desserts: ["Dessert Platter (5 Types)"],
      drinks: ["Black Tea", "Lemon Grass Green Tea"],
    },
  },
  {
    id: 2,
    name: "Very Ceremonial",
    price: 3600,
    locked: true,
  },
  {
    id: 3,
    name: "Festive Dining",
    price: 3400,
    locked: true,
  },
]

export default function VenueMenus({ venue }: VenueMenusProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyMenus.map((menu) => (
          <Card key={menu.id} className={menu.locked ? "bg-gray-50" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-xl sm:text-2xl">
                {menu.name}
                {menu.locked && <Lock className="w-4 h-4" />}
              </CardTitle>
              <p className="text-2xl sm:text-3xl font-bold mt-2">
                PKR {menu.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-600">/person</span>
              </p>
            </CardHeader>
            <CardContent>
              {!menu.locked ? (
                <div className="space-y-6">
                  {Object.entries(menu.items).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="font-semibold mb-2 uppercase text-sm text-gray-600">{category}</h3>
                      <ul className="space-y-2">
                        {items.map((item, index) => (
                          <li key={index} className="flex items-center text-sm sm:text-base">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <Button className="w-full" size="lg">
                    Select Menu
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-gray-600 text-sm sm:text-base">
                    Unlock this menu to see all items and get the best prices.
                  </p>
                  <Button variant="outline" className="w-full" size="lg">
                    View Menu
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Price Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600 text-sm sm:text-base">These are per head prices for Imperial Feast</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm sm:text-base">200 Guests</span>
                  <span className="text-gray-600 text-xs sm:text-sm">PKR 4,100/person</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">PKR 820,000</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm sm:text-base">300 Guests</span>
                  <span className="text-gray-600 text-xs sm:text-sm">PKR 4,000/person</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">PKR 1,200,000</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm sm:text-base">500 Guests</span>
                  <span className="text-gray-600 text-xs sm:text-sm">PKR 3,800/person</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold">PKR 1,900,000</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


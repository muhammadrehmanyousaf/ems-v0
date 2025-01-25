import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const packages = [
  {
    id: "1",
    name: "Basic Wedding Package",
    description: "Perfect for small, intimate weddings",
    price: "$2,500",
    features: ["Ceremony venue", "Basic decorations", "Photography (4 hours)", "Small cake"],
  },
  {
    id: "2",
    name: "Premium Wedding Package",
    description: "Ideal for medium-sized weddings",
    price: "$5,000",
    features: [
      "Ceremony & reception venues",
      "Elegant decorations",
      "Photography & videography (8 hours)",
      "Three-tier cake",
      "DJ services",
    ],
  },
  {
    id: "3",
    name: "Deluxe Wedding Package",
    description: "The ultimate wedding experience",
    price: "$10,000",
    features: [
      "Premium venues",
      "Luxury decorations",
      "Full-day photography & videography",
      "Custom cake",
      "Live band",
      "Gourmet catering",
    ],
  },
]

export default function PackagesPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Packages</h1>
        <Button>Create New Package</Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <CardHeader>
              <CardTitle>{pkg.name}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold mb-4">{pkg.price}</p>
              <ul className="list-disc pl-5">
                {pkg.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Edit</Button>
              <Button variant="destructive">Delete</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  )
}


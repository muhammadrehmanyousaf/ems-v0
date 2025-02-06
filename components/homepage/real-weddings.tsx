import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const weddings = [
  {
    id: 1,
    couple: "Priya & Rahul",
    location: "The Grand Hyatt, Mumbai",
    image:
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    date: "March 15, 2024",
    story: "A beautiful destination wedding with a perfect blend of traditional and modern elements",
  },
  {
    id: 2,
    couple: "Sarah & Ahmed",
    location: "Taj Palace, Delhi",
    image:
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    date: "February 28, 2024",
    story: "An elegant wedding celebration featuring stunning decor and memorable moments",
  },
  {
    id: 3,
    couple: "Meera & Arun",
    location: "ITC Grand Chola, Chennai",
    image:
      "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    date: "January 20, 2024",
    story: "A royal South Indian wedding with spectacular ceremonies and celebrations",
  },
]

export function RealWeddings() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Real Wedding Stories</h2>
          <p className="text-gray-600">Get inspired by these beautiful wedding celebrations</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {weddings.map((wedding) => (
            <Card key={wedding.id} className="group overflow-hidden">
              <CardHeader className="p-0">
                <div className="relative aspect-[3/2]">
                  <img
                    src={wedding.image || "/placeholder.svg"}
                    alt={wedding.couple}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-semibold mb-1">{wedding.couple}</h3>
                    <p className="text-sm opacity-90">{wedding.location}</p>
                  </div>
                  <Badge className="absolute top-4 right-4">{wedding.date}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-gray-600 line-clamp-2">{wedding.story}</p>
                <a
                  href={`/real-weddings/${wedding.id}`}
                  className="text-primary text-sm hover:underline mt-2 inline-block"
                >
                  Read their story →
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <a href="/real-weddings" className="text-primary hover:underline">
            View more wedding stories →
          </a>
        </div>
      </div>
    </section>
  )
}


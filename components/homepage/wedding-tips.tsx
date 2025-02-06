import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Calendar, Clock, Users, Camera } from "lucide-react"

const tips = [
  {
    icon: Calendar,
    title: "When to Start Planning",
    description: "Ideal timeline for wedding planning and important milestones",
  },
  {
    icon: Clock,
    title: "Wedding Day Timeline",
    description: "How to create the perfect schedule for your big day",
  },
  {
    icon: Users,
    title: "Guest List Tips",
    description: "Managing your guest list and seating arrangements",
  },
  {
    icon: Camera,
    title: "Photography Guide",
    description: "Essential shots and styles for your wedding album",
  },
]

export function WeddingTips() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Wedding Planning Tips</h2>
          <p className="text-gray-600">Expert advice to help you plan your perfect day</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tips.map((tip) => (
            <Card key={tip.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pt-6 px-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <tip.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{tip.title}</h3>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <p className="text-gray-600">{tip.description}</p>
                <a
                  href={`/tips/${tip.title.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-primary text-sm hover:underline mt-4 inline-block"
                >
                  Read more →
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <a href="/wedding-tips" className="text-primary hover:underline">
            View all planning tips →
          </a>
        </div>
      </div>
    </section>
  )
}


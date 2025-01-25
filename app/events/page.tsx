import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

// Dummy data for events
const events = [
  {
    id: 1,
    title: "Engagement Party",
    date: "2023-08-15",
    description: "Celebrate our engagement with family and friends",
    location: "The Grand Hotel, City Center",
  },
  {
    id: 2,
    title: "Wedding Ceremony",
    date: "2023-12-31",
    description: "Join us for our wedding ceremony",
    location: "St. Mary's Church",
  },
  {
    id: 3,
    title: "Reception",
    date: "2024-01-01",
    description: "Celebrate our new beginning with a grand reception",
    location: "Sunset Beach Resort",
  },
]

export default function EventsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Events</h1>
        <Button asChild>
          <Link href="/events/new">Create New Event</Link>
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
              <CardDescription>{new Date(event.date).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{event.description}</p>
              <p className="text-sm font-semibold mt-2">{event.location}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href={`/events/${event.id}`}>View Details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}


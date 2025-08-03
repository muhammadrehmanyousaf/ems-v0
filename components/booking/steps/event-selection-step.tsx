"use client"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { eventTypes } from "@/lib/data"
import { BookingFormData, EventVenue } from "@/lib/types"
import { Palette, Music, Heart, Mic, Cake, Gift, Briefcase, GraduationCap, Calendar } from "lucide-react"

interface EventSelectionStepProps {
  selectedEvents?: string[]
  onEventToggle?: (eventId: string) => void
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>
  formData: BookingFormData;
  venue: EventVenue | null;
}

export default function EventSelectionStep({ selectedEvents, onEventToggle, setFormData, formData, venue }: EventSelectionStepProps) {
  // Function to get the appropriate icon component
  const getIconComponent = (event: string) => {
    switch (event) {
      case "Engagement":
        return <Gift className="h-5 w-5" />
      case "Wedding":
        return <Heart className="h-5 w-5" />
      case "Parties":
        return <Music className="h-5 w-5" />
      case "Fashion Show":
        return <Palette className="h-5 w-5" />
      case "Dinner":
        return <Cake className="h-5 w-5" />
      default:
        return <Calendar className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">Select Your Events</h2>
        <p className="text-gray-600">Choose the events you want to book for your celebration</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {venue && venue.expertise.map((event) => {
          // const isSelected = selectedEvents.includes(event.id)

          return (
            <div
              key={event}
              className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
                formData.eventType === event ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={()=> setFormData({
                ...formData,
                eventType: event,
              })}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`mb-3 rounded-full p-3 ${
                    formData.eventType === event ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {getIconComponent(event)}
                </div>
                <h3 className="mb-1 text-base font-medium text-gray-800">{event}</h3>
                {/* <p className="mb-3 text-xs text-gray-500">{event.description}</p> */}

                {/* <div className="mt-auto">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`event-${event.id}`}
                      checked={formData.eventType === event.id}
                      onCheckedChange={() => onEventToggle(event.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-500"
                    />
                    <Label htmlFor={`event-${event.id}`} className="cursor-pointer text-xs font-medium">
                      Select this event
                    </Label>
                  </div>
                </div> */}
              </div>
            </div>
          )
        })}
      </div>

      {/* {for.length > 0 && (
        <div className="rounded-lg bg-blue-50 p-4 text-center">
          <p className="font-medium text-blue-700">
            You've selected {selectedEvents.length} event{selectedEvents.length > 1 ? "s" : ""}
          </p>
          <p className="mt-1 text-sm text-blue-600">Click Next to continue with your booking</p>
        </div>
      )} */}
    </div>
  )
}

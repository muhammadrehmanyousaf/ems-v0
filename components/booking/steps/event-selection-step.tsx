"use client"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { eventTypes } from "@/lib/data"
import { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import { Palette, Music, Heart, Mic, Cake, Gift, Briefcase, GraduationCap, Calendar } from "lucide-react"

interface EventSelectionStepProps {
  selectedEvents?: string[]
  onEventToggle?: (eventId: string) => void
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>
  formData: BookingFormData;
  venue: EventVenue | Vendor | null;
}

export default function EventSelectionStep({ selectedEvents = [], onEventToggle, setFormData, formData, venue }: EventSelectionStepProps) {
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

  // Get available events - handle both EventVenue and Vendor types
  const getAvailableEvents = () => {
    if (!venue) return []
    
    // Check if venue has expertise (EventVenue type)
    if ('expertise' in venue && venue.expertise && Array.isArray(venue.expertise)) {
      return venue.expertise
    }
    
    // Check if venue has serviceProvided (EventVenue type)
    if ('serviceProvided' in venue && venue.serviceProvided && Array.isArray(venue.serviceProvided)) {
      return venue.serviceProvided
    }
    
    // Check if venue has services (Vendor type)
    if ('services' in venue && venue.services) {
      // If services is a string, split it into array
      if (typeof venue.services === 'string') {
        return venue.services.split(',').map(s => s.trim())
      }
      return venue.services
    }
    
    // Fallback to default event types
    return ["Wedding", "Engagement", "Parties", "Fashion Show", "Dinner"]
  }

  const availableEvents = getAvailableEvents()

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-neutral-900">Select Your Events</h2>
        <p className="text-neutral-600">Choose the events you want to book for your celebration</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {availableEvents.map((event) => {
          return (
            <div
              key={event}
              className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${
                selectedEvents?.includes(event) 
                  ? "border-rose-500 bg-gradient-to-r from-rose-50 to-pink-50 shadow-md" 
                  : "border-neutral-200 hover:border-rose-300 hover:bg-rose-50/50"
              }`}
              onClick={()=> onEventToggle && onEventToggle(event)}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`mb-3 rounded-full p-3 transition-all duration-200 ${
                    formData.eventType === event 
                      ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg" 
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {getIconComponent(event)}
                </div>
                <h3 className="mb-1 text-base font-medium text-neutral-800">{event}</h3>
              </div>
            </div>
          )
        })}
      </div>

      {/* {for.length > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 p-4 text-center border border-rose-200">
          <p className="font-medium text-rose-700">
            You've selected {selectedEvents.length} event{selectedEvents.length > 1 ? "s" : ""}
          </p>
          <p className="mt-1 text-sm text-rose-600">Click Next to continue with your booking</p>
        </div>
      )} */}
    </div>
  )
}

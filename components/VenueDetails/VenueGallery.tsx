"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react"
import { cn } from "@/lib/utils"

interface VenueGalleryProps {
  images: string[]
  video?: string | null
}

export default function VenueGallery({ images, video }: VenueGalleryProps) {
  const [showGallery, setShowGallery] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [images.length])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <>
      <div className="relative h-[60vh] min-h-[500px] max-h-[600px] w-full overflow-hidden bg-gray-100">
        {/* Main Slider */}
        <div className="relative h-full w-full">
          {images.map((image, index) => (
            <div
              key={index}
              className={cn(
                "absolute inset-0 transform transition-transform duration-500 ease-out",
                index === slideIndex ? "translate-x-0" : "translate-x-full",
              )}
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`Venue image ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Navigation Buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
          onClick={() => setSlideIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
          onClick={() => setSlideIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        {/* Thumbnails */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {images.slice(0, 5).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSlideIndex(index)}
                    className={cn(
                      "relative h-16 w-24 overflow-hidden rounded-md border-2 transition-all",
                      slideIndex === index ? "border-white" : "border-transparent opacity-70",
                    )}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
                {images.length > 5 && (
                  <button
                    onClick={() => setShowGallery(true)}
                    className="relative h-16 w-24 overflow-hidden rounded-md border-2 border-transparent opacity-70 hover:opacity-100"
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                      <span>+{images.length - 5}</span>
                    </div>
                    <Image src={images[5] || "/placeholder.svg"} alt="More images" fill className="object-cover" />
                  </button>
                )}
              </div>
              <Button variant="ghost" onClick={() => setShowGallery(true)} className="bg-white/80 hover:bg-white">
                <Expand className="mr-2 h-4 w-4" />
                View All Photos
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Gallery */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent className="max-w-7xl h-[90vh] p-0">
          <div className="relative h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-10 bg-white/80 hover:bg-white"
              onClick={() => setShowGallery(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <Image
                src={images[currentIndex] || "/placeholder.svg"}
                alt={`Venue image ${currentIndex + 1}`}
                fill
                className="object-contain"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex justify-center gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "h-1.5 w-12 rounded-full transition-all",
                      index === currentIndex ? "bg-white" : "bg-white/50",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


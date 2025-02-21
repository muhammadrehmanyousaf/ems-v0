import { Carousel } from "@/components/ui/carousel"
import Image from "next/image"

interface VenueImagesProps {
  images: string[]
  video?: string
}

export default function VenueImages({ images, video }: VenueImagesProps) {
  return (
    <div className="mb-8">
      <Carousel>
        {images.map((image, index) => (
          <Image
            key={index}
            src={image || "/placeholder.svg"}
            alt={`Venue image ${index + 1}`}
            width={800}
            height={400}
            className="w-full h-[400px] object-cover"
          />
        ))}
        {video && <video src={video} controls className="w-full h-[400px] object-cover" />}
      </Carousel>
    </div>
  )
}


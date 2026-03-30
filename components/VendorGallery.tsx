"use client"

import Image from "next/image"
import { useState } from "react"
import { getFirstImage } from "@/lib/utils/image-utils"

interface VendorGalleryProps {
  images?: string[]
  video?: string
}

export default function VendorGallery({ images = [], video }: VendorGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(images?.[0] || null)

  if (!images || images.length === 0) return null

  return (
    <div className="space-y-4 mb-8">
      <div className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full rounded-xl overflow-hidden bg-neutral-100 shadow-md">
        {selectedImage ? (
          <Image src={getFirstImage([selectedImage])} alt="Vendor Gallery" fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-400">No Image Available</div>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelectedImage(img)}
            className={`relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedImage === img ? "border-purple-500 scale-95 opacity-100" : "border-transparent opacity-70 hover:opacity-100"}`}
          >
            <Image src={getFirstImage([img])} alt={`Gallery thumbnail ${i + 1}`} fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
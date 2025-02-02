"use client"

import { useFormContext } from "@/context/form-context"
import { Button } from "@/components/ui/button"
import { useDropzone } from "react-dropzone"
import Image from "next/image"

export function ImagesStep() {
  const { formData, updateFormData } = useFormContext()

  const onDrop = (acceptedFiles: File[]) => {
    updateFormData({ images: [...formData.images, ...acceptedFiles] })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg"],
    },
    maxFiles: 10,
  })

  const removeImage = (index: number) => {
    const updatedImages = formData.images.filter((_, i) => i !== index)
    updateFormData({ images: updatedImages })
  }

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer ${
          isDragActive ? "border-rose-600 bg-rose-50" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">Drag and drop images here, or click to select files</p>
        <p className="text-sm text-gray-500 mt-2">You can upload up to 10 images</p>
      </div>

      {formData.images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {formData.images.map((file, index) => (
            <div key={index} className="relative">
              <Image
                src={URL.createObjectURL(file) || "/placeholder.svg"}
                alt={`Uploaded image ${index + 1}`}
                width={200}
                height={200}
                className="rounded-lg object-cover w-full h-40"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => removeImage(index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


"use client"

import { useFormContext } from "@/lib/context/form-context"
import { Button } from "@/components/ui/button"

export function ReviewStep() {
  const { formData } = useFormContext()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Review Your Information</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Personal Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Full Name</p>
            <p>{formData.fullName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p>{formData.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contact Number</p>
            <p>{formData.contactNumber}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Business Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Business Type</p>
            <p>{formData.businessType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Brand Name</p>
            <p>{formData.brandName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cities Covered</p>
            <p>{formData.citiesCovered.join(", ")}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Staff</p>
            <p>{formData.staffGender.join(", ")}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Additional Information</h3>
        <div>
          <p className="text-sm text-gray-500">Description</p>
          <p>{formData.description}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Minimum Price</p>
          <p>{formData.minimumPrice}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Payment Type</p>
          <p>{formData.paymentType}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Covid Compliant</p>
          <p>{formData.covidCompliant ? "Yes" : "No"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Cancellation Policy</p>
          <p>{formData.cancellationPolicy}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Packages</h3>
        {formData.packages.map((pkg, index) => (
          <div key={index} className="border p-4 rounded-lg">
            <h4 className="font-medium">{pkg.name}</h4>
            <p className="text-rose-600">Price: {pkg.price}</p>
            <p>Services: {pkg.services.join(", ")}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Secondary Contact</p>
            <p>{formData.secondaryContact}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Website</p>
            <p>{formData.websiteUrl}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Instagram</p>
            <p>{formData.instagramUrl}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Facebook</p>
            <p>{formData.facebookUrl}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Booking Email</p>
            <p>{formData.bookingEmail}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Office Address</p>
            <p>{formData.officeAddress}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Images</h3>
        <div className="grid grid-cols-3 gap-4">
          {formData.images.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file) || "/placeholder.svg"}
                alt={`Uploaded image ${index + 1}`}
                className="rounded-lg object-cover w-full h-40"
              />
            </div>
          ))}
        </div>
      </div>

      <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white">Submit Registration</Button>
    </div>
  )
}


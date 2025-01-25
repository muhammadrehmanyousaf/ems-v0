"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  vendorId: string
  vendorName: string
}

const steps = ["Personal Info", "Event Details", "Package Selection", "Additional Info", "Review"]

export function BookingModal({ isOpen, onClose, vendorId, vendorName }: BookingModalProps) {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    eventDate: "",
    package: "",
    additionalInfo: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePackageSelection = (value: string) => {
    setFormData((prev) => ({ ...prev, package: value }))
  }

  const handleSubmit = () => {
    // Here you would typically send the booking data to your backend
    console.log("Booking submitted:", { vendorId, ...formData })
    onClose()
  }

  const nextStep = () => setStep((prev) => Math.min(prev + 1, steps.length - 1))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book {vendorName}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="flex justify-between mb-4">
            {steps.map((s, i) => (
              <div key={s} className={`text-sm ${i === step ? "text-primary font-bold" : "text-gray-500"}`}>
                {s}
              </div>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
                  </div>
                </div>
              )}
              {step === 1 && (
                <div>
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    name="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}
              {step === 2 && (
                <div>
                  <Label>Select Package</Label>
                  <RadioGroup value={formData.package} onValueChange={handlePackageSelection}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="basic" id="basic" />
                      <Label htmlFor="basic">Basic Package</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="standard" id="standard" />
                      <Label htmlFor="standard">Standard Package</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="premium" id="premium" />
                      <Label htmlFor="premium">Premium Package</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
              {step === 3 && (
                <div>
                  <Label htmlFor="additionalInfo">Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>
              )}
              {step === 4 && (
                <div className="space-y-2">
                  <h3 className="font-bold">Booking Summary</h3>
                  <p>
                    <strong>Name:</strong> {formData.name}
                  </p>
                  <p>
                    <strong>Phone:</strong> {formData.phone}
                  </p>
                  <p>
                    <strong>Event Date:</strong> {formData.eventDate}
                  </p>
                  <p>
                    <strong>Package:</strong> {formData.package}
                  </p>
                  <p>
                    <strong>Additional Info:</strong> {formData.additionalInfo || "N/A"}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-4 flex justify-between">
          {step > 0 && (
            <Button onClick={prevStep} variant="outline">
              Previous
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button onClick={nextStep}>Next</Button>
          ) : (
            <Button onClick={handleSubmit}>Submit Booking</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


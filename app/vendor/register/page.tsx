"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Stepper, Step } from "@/components/ui/stepper"
import { toast } from "@/components/ui/use-toast"

const vendorTypes = [
  "Photographer",
  "Videographer",
  "Wedding Planner",
  "Caterer",
  "Florist",
  "DJ/Band",
  "Venue",
  "Cake Designer",
  "Decorator",
]

export default function VendorRegister() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    vendorType: "",
    location: "",
    description: "",
    initialPackage: "",
    packageDetails: "",
    amenities: "",
  })
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prevData) => ({ ...prevData, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Save vendor data to localStorage
    const vendors = JSON.parse(localStorage.getItem('vendors') || '[]')
    vendors.push({
      ...formData,
      id: Date.now(),
      registeredAt: new Date().toISOString()
    })
    
    localStorage.setItem('vendors', JSON.stringify(vendors))
    
    toast({
      title: "Registration successful",
      description: "Please login with your credentials",
    })

    // Redirect to login page instead of dashboard
    router.push("/vendor/login")
  }

  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Register as a Vendor</CardTitle>
          <CardDescription>Join our platform and grow your business</CardDescription>
        </CardHeader>
        <CardContent>
          <Stepper currentStep={step} className="mb-8">
            <Step title="Account">Account</Step>
            <Step title="Business Info">Business Info</Step>
            <Step title="Services">Services</Step>
          </Stepper>
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vendorType">Vendor Type</Label>
                  <Select
                    name="vendorType"
                    value={formData.vendorType}
                    onValueChange={(value) => handleSelectChange("vendorType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" value={formData.location} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="initialPackage">Initial Package Name</Label>
                  <Input
                    id="initialPackage"
                    name="initialPackage"
                    value={formData.initialPackage}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="packageDetails">Package Details</Label>
                  <Textarea
                    id="packageDetails"
                    name="packageDetails"
                    value={formData.packageDetails}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amenities">Amenities</Label>
                  <Textarea
                    id="amenities"
                    name="amenities"
                    value={formData.amenities}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 && (
            <Button onClick={prevStep} variant="outline">
              Previous
            </Button>
          )}
          {step < 3 ? <Button onClick={nextStep}>Next</Button> : <Button onClick={handleSubmit}>Submit</Button>}
        </CardFooter>
      </Card>
    </div>
  )
}


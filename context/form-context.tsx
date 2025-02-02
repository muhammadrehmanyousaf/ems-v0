"use client"

import { createContext, useContext, useState } from "react"

type BusinessType =
  | "PHOTOGRAPHER"
  | "MAKEUP_ARTIST"
  | "WEDDING_VENUE"
  | "HENNA_ARTIST"
  | "DECOR"
  | "CATERING"
  | "CAR_RENTAL"
  | "BRIDAL_WEAR"
  | "WEDDING_INVITATIONS"

type Package = {
  name: string
  price: number
  services: string[]
}

type FormData = {
  // Step 1 - Business Type
  businessType: BusinessType | null

  // Step 2 - Personal Details
  fullName: string
  email: string
  contactNumber: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean

  // Step 3 - Business Details
  citiesCovered: string[]
  staffGender: ("MALE" | "FEMALE" | "TRANSGENDER")[]
  minimumPrice: number
  description: string
  additionalInfo: string
  paymentType: string
  covidCompliant: boolean
  cancellationPolicy: "REFUNDABLE" | "NON_REFUNDABLE" | "PARTIALLY_REFUNDABLE"
  downPaymentPrice: number

  // Step 4 - Packages
  packages: Package[]

  // Step 5 - Contact Details
  brandName: string
  secondaryContact: string
  websiteUrl: string
  instagramUrl: string
  facebookUrl: string
  bookingEmail: string
  officeAddress: string
  googleMapsLink: string

  // Step 6 - Images
  images: File[]
}

type FormContextType = {
  formData: FormData
  currentStep: number
  setCurrentStep: (step: number) => void
  updateFormData: (data: Partial<FormData>) => void
  isValid: (step: number) => boolean
}

const defaultFormData: FormData = {
  businessType: null,
  fullName: "",
  email: "",
  contactNumber: "",
  password: "",
  confirmPassword: "",
  agreeToTerms: false,
  citiesCovered: [],
  staffGender: [],
  minimumPrice: 0,
  description: "",
  additionalInfo: "",
  paymentType: "",
  covidCompliant: false,
  cancellationPolicy: "REFUNDABLE",
  packages: [
    {
      name: "Basic",
      price: 2000,
      services: [],
    },
  ],
  brandName: "",
  secondaryContact: "",
  websiteUrl: "",
  instagramUrl: "",
  facebookUrl: "",
  bookingEmail: "",
  officeAddress: "",
  googleMapsLink: "",
  images: [],
  downPaymentPrice: 0,
}

const FormContext = createContext<FormContextType | undefined>(undefined)

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [currentStep, setCurrentStep] = useState(0)

  const updateFormData = (newData: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...newData }))
  }

  const isValid = (step: number) => {
    switch (step) {
      case 0:
        return formData.businessType !== null
      case 1:
        return (
          formData.fullName !== "" &&
          formData.email !== "" &&
          formData.contactNumber !== "" &&
          formData.password !== "" &&
          formData.password === formData.confirmPassword &&
          formData.agreeToTerms
        )
      // Add validation for other steps
      default:
        return true
    }
  }

  return (
    <FormContext.Provider value={{ formData, currentStep, setCurrentStep, updateFormData, isValid }}>
      {children}
    </FormContext.Provider>
  )
}

export function useFormContext() {
  const context = useContext(FormContext)
  if (context === undefined) {
    throw new Error("useFormContext must be used within a FormProvider")
  }
  return context
}


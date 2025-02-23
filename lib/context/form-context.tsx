"use client"

import BusinessDetails from "@/components/VendorStepForms/business-details"
import ContactDetails from "@/components/VendorStepForms/contact-details"
import ImagesStep from "@/components/VendorStepForms/images-step"
import Packages from "@/components/VendorStepForms/packages"
import PersonalDetails from "@/components/VendorStepForms/personal-details"
import Preview from "@/components/VendorStepForms/preview"
import { createContext, ReactElement, useContext, useState } from "react"

export type BusinessType =
  | "PHOTOGRAPHER"
  | "MAKEUP_ARTIST"
  | "WEDDING_VENUE"
  | "HENNA_ARTIST"
  | "DECOR"
  | "CATERING"
  | "CAR_RENTAL"
  | "BRIDAL_WEAR"
  | "WEDDING_INVITATIONS"

type FormContextType = {
  businessType: BusinessType | string,
  setBusinessType: React.Dispatch<React.SetStateAction<BusinessType | string>>
  steps: { title: string, description: string, form?: ReactElement }[]
}
const FormContext = createContext<FormContextType | undefined>(undefined)

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [businessType, setBusinessType] = useState<BusinessType | string>('')

  const steps = [
    {
      title: "Business Type",
      description: 'What is your line of business?'
    },
    {
      title: "Personal Details",
      description: 'Enter your personal details here.',
      form: <>
        <PersonalDetails />
      </>
    },
    {
      title: "Contact Details",
      description: 'Enter your contact details here',
      form: <>
        <ContactDetails />
      </>
    },
    {
      title: 'Business Details',
      description: 'Enter your business details here',
      form: <>
       <BusinessDetails/> 
      </>
    },
    {
      title: 'Package',
      description: 'Enter the package and price',
      form: <>
        <Packages />
      </>
    },
    {
      title: 'Images',
      description: 'You can upload up to 20 images',
      form: <>
        <ImagesStep />
      </>
    },
    {
      title: 'Preview',
      description: 'Review and confirm your all details',
      form: <>
        <Preview/>
      </>
    }
  ];

  return (
    <FormContext.Provider value={{ setBusinessType, businessType, steps }}>
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


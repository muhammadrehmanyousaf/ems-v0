"use client";

import BusinessDetails from "@/components/VendorStepForms/business-details";
import ContactDetails from "@/components/VendorStepForms/contact-details";
import ImagesStep from "@/components/VendorStepForms/images-step";
import Packages from "@/components/VendorStepForms/packages";
import PersonalDetails from "@/components/VendorStepForms/personal-details";
import Preview from "@/components/VendorStepForms/preview";
import { createContext, ReactElement, useContext, useState } from "react";

export type BusinessType =
  | "PHOTOGRAPHER"
  | "MAKEUP_ARTIST"
  | "WEDDING_VENUE"
  | "HENNA_ARTIST"
  | "DECOR"
  | "CATERING"
  | "CAR_RENTAL"
  | "BRIDAL_WEAR"
  | "WEDDING_INVITATIONS";

  interface Package {
    name: string;
    price: string;
    services: string;
  };

  type FormType = {
      fullName: string;
      email: string;
      phoneNumber: string;
      password: string;
      picture: string;
      businessType: string;
      brandName: string;
      profilePicture: string;
      city: string;
      subArea: string;
      secondaryContactNumber: string;
      instagram: string;
      facebook: string;
      bookingEmail: string;
      website: string;
      officeAddress: string;
      officeGoogleLink: string;
      staff: string[];
      minimumPrice: number;
      description: string;
      additionalInfo: string;
      downPaymentType: string;
      downPayment: number;
      covidComplaint: boolean;
      cancelationPolicy: string;
      packageName: string[];
      starterPrice: number;
      services: string;
      images: string[];
      reviewProfile: boolean;
      subBusinessType: string[];
      cityCovered: string[];
      travelToClientHome: string;
      serviceProvided: string[];
      expertise: string[];
      packages: Package[]
      amenities: string[];
      maxCapacity: string;
      minCapacity: string;
      catering: string;
      parking: boolean;
      carParkingCapacity: string;
      sellMehndi: boolean;
      hasTeam: boolean;
      instruction: string;
      provideDecorationItem: boolean;
      provideFoodTesting: boolean;
      provideSounSystem: boolean;
      provideSeatingArrangement: boolean;
      provideWaiter: boolean;
      providePlate: boolean;
      active: boolean;
  }
type FormContextType = {
  businessType: BusinessType | string;
  setBusinessType: React.Dispatch<React.SetStateAction<BusinessType | string>>;
  steps: { title: string; description: string; form?: ReactElement }[];
  setFormData: React.Dispatch<
    React.SetStateAction<FormType>
  >;
  formData: FormType
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>
  errors: {};
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [businessType, setBusinessType] = useState<BusinessType | string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    picture: "",
    businessType: "",
    brandName: '',
    profilePicture: "",
    city: "",
    subArea: "",
    secondaryContactNumber: "",
    instagram: "",
    facebook: "",
    bookingEmail: "",
    website: "",
    officeAddress: "",
    officeGoogleLink: "",
    staff: [""],
    minimumPrice: 0,
    description: "",
    additionalInfo: "",
    downPaymentType: "",
    downPayment: 0,
    covidComplaint: false,
    cancelationPolicy: "",
    packageName: [""],
    starterPrice: 0,
    services: "",
    images: [""],
    reviewProfile: false,
    subBusinessType: [""],
    cityCovered: [""],
    travelToClientHome: "",
    serviceProvided: [""],
    expertise: [""],
    packages: [{
      name: "",
      price: '',
      services: "",
    }],
    amenities: [""],
    maxCapacity: "",
    minCapacity: "",
    catering: '',
    parking: false,
    carParkingCapacity: "",
    sellMehndi: false,
    hasTeam: false,
    instruction: "",
    provideDecorationItem: false,
    provideFoodTesting: false,
    provideSounSystem: false,
    provideSeatingArrangement: false,
    provideWaiter: false,
    providePlate: false,
    active: true,
  });

  const steps = [
    { title: "Business Type", description: "What is your line of business?" },
    { title: "Personal Details", description: "Enter your personal details here.", form: <PersonalDetails setErrors={setErrors} errors={errors} /> },
    { title: "Contact Details", description: "Enter your contact details here", form: <ContactDetails /> },
    { title: "Business Details", description: "Enter your business details here", form: <BusinessDetails /> },
    { title: "Package", description: "Enter the package and price", form: <Packages /> },
    { title: "Images", description: "You can upload up to 20 images", form: <ImagesStep /> },
    { title: "Preview", description: "Review and confirm all details", form: <Preview /> },
  ];

  return (
    <FormContext.Provider value={{ setBusinessType, businessType, steps, setFormData, formData, setErrors, errors }}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
}

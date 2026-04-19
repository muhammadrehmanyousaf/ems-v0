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
  id?: number;
  name: string;
  price: number;
  features: Record<string, string[]>;
}

export interface CarRentalPackageCar {
  carIndex: number;   // index into formData.packages (fleet)
  quantity: number;
}

export interface CarRentalPackage {
  name: string;
  description: string;
  totalPrice: number;
  cars: CarRentalPackageCar[];
  citiesCovered: string[];
}

export type FormType = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  re_enterPassword: string;
  // picture: string;
  businessType: string;
  name: string;
  profilePicture: string;
  city: string;
  subArea: string;
  secondaryContactNumber: string;
  instagram: string;
  facebook: string;
  bookingEmail: string;
  website: string;
  roleIds: number[];
  officeAddress: string;
  officeGoogleLink: string;
  staff: string[];
  description: string;
  additionalInfo: string;
  downPaymentType: string;
  downPayment: number;
  covidComplaint: boolean;
  cancelationPolicy: string;
  // packageName: string[];
  // services: string;
  images: string[];
  imageFiles: File[];
  packageImageFiles: File[][];
  profileImageFile?: File | null;
  subBusinessType: string[];
  cityCovered: string[];
  // travelToClientHome: string;
  // serviceProvided: string[];
  expertise: string[];
  packages: Package[];
  carRentalPackages: CarRentalPackage[];
  amenities: string[];
  maxCapacity: string;
  minCapacity: number;
  catering: string;
  parking: boolean;
  // Bridal Wear specific service fields (reuse existing DB boolean columns)
  travelToClientHome: boolean;
  sellMehndi: boolean;
  hasTeam: boolean;
  provideDecorationItem: boolean;
  provideFoodTesting: boolean;
  provideWaiter: boolean;
  provideSoundSystem: boolean;
  provideSeatingArrangement: boolean;
  providePlate: boolean;
  instruction: string;
  serviceProvided: string[];
  minimumPrice: number;
};
type FormContextType = {
  businessType: BusinessType | string;
  setBusinessType: React.Dispatch<React.SetStateAction<BusinessType | string>>;
  steps: { title: string; description: string; form?: ReactElement }[];
  setFormData: React.Dispatch<React.SetStateAction<FormType>>;
  formData: FormType;
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  errors: {};
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  currentStep: number;
  currentErrors: {
    [key: string]: string;
  };
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [businessType, setBusinessType] = useState<BusinessType | string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormType>({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    re_enterPassword: "",
    // picture: "",
    businessType: "",
    name: "",
    profilePicture: "",
    city: "",
    roleIds: [2],
    subArea: "",
    secondaryContactNumber: "",
    instagram: "",
    facebook: "",
    bookingEmail: "",
    website: "",
    officeAddress: "",
    officeGoogleLink: "",
    staff: [],
    description: "",
    additionalInfo: "",
    downPaymentType: "",
    downPayment: 0,
    covidComplaint: false,
    cancelationPolicy: "",
    // packageName: [],
    // services: "",
    images: [],
    imageFiles: [],
    packageImageFiles: [],
    profileImageFile: null,
    subBusinessType: [],
    cityCovered: [],
    // travelToClientHome: "",
    // serviceProvided: [],
    expertise: [],
    // packages: [
    //   {
    //     name: "",
    //     price: "",
    //     services: "",
    //   },
    // ],
    packages: [
      {
        id: undefined,
        name: "",
        price: 0,
        features: {},
      },
    ],
    carRentalPackages: [],
    amenities: [],
    maxCapacity: "",
    minCapacity: 0,
    catering: "",
    parking: false,
    travelToClientHome: false,
    sellMehndi: false,
    hasTeam: false,
    provideDecorationItem: false,
    provideFoodTesting: false,
    provideWaiter: false,
    provideSoundSystem: false,
    provideSeatingArrangement: false,
    providePlate: false,
    instruction: "",
    serviceProvided: [],
    minimumPrice: 0,
  });

  let currentErrors: { [key: string]: string } = {};

  const steps = [
    { title: "Business Type", description: "What is your line of business?" },
    {
      title: "Personal Details",
      description: "Enter your personal details here.",
      form: <PersonalDetails setErrors={setErrors} errors={errors} />,
    },
    // { title: "Contact Details", description: "Enter your contact details here", form: <ContactDetails /> },
    {
      title: "Business Details",
      description: "Enter your business details here",
      form: <BusinessDetails />,
    },
    // { title: "Package", description: "Enter the package and price", form: <Packages /> },
    // { title: "Images", description: "You can upload up to 20 images", form: <ImagesStep /> },
    {
      title: "Preview",
      description: "Review and confirm all details",
      form: <Preview />,
    },
  ];

  return (
    <FormContext.Provider
      value={{
        setBusinessType,
        businessType,
        steps,
        setFormData,
        formData,
        setErrors,
        errors,
        setCurrentStep,
        currentStep,
        currentErrors,
      }}
    >
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

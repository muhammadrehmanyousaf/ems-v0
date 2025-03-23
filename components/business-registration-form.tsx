"use client";

import { useState } from "react";
import { PersonalDetailsStep } from "./steps/personal-details-step";
import { BusinessTypeStep } from "./steps/business-type-step";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formSchema } from "@/lib/formSchema/vendor-schema";

import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Flag, Loader2 } from "lucide-react";
import { FormType, useFormContext } from "@/lib/context/form-context";
import { toast } from "./ui/use-toast";
import VenueSteps from "./VendorStepForms/newVendorRegisterationForm/venueSteps/venue-steps";
import axios from "axios";
import { BACKEND_URL } from "@/lib/backend-url";
import { vanueValidations } from "./VendorStepForms/newVendorRegisterationForm/venueSteps/vanueComponents/vanueValidations";
import SuccessModal from "./VendorStepForms/components/SuccessModal";
import FormSteps from "./VendorStepForms/newVendorRegisterationForm/CarRentalAndBridleWear/form-steps";
import { CarRentalOrBridleWearValidations } from "./VendorStepForms/newVendorRegisterationForm/CarRentalAndBridleWear/components/validations";

export function BusinessRegistrationForm() {
  // const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const { businessType, setBusinessType, steps, setFormData, formData, setErrors, errors, setCurrentStep, currentStep } = useFormContext()
  const [openModal, setOpenModal] = useState(false);

  const carRentalOrBridleWear = businessType === 'Car rental' || businessType === 'Bridal wearing';

  const handleValidations = () => {
    let currentErrors: { [key: string]: string } = {};

    if (currentStep === 0) {
      if (!formData.businessType) currentErrors.businessType = "Select Business Type";
    } else
      if (formData.businessType === 'Wedding venue') {
        vanueValidations({ currentStep, formData, currentErrors })
        setErrors(currentErrors);
        return currentErrors;
      };
    if (carRentalOrBridleWear) {
      CarRentalOrBridleWearValidations({ currentStep, formData, currentErrors })
      setErrors(currentErrors);
      return currentErrors;
    };
  }

  const handleNext = () => {

    const validationErrors = handleValidations();

    if (validationErrors && Object.keys(validationErrors).length > 0) {
      toast({
        title: "Validation Error",
        description: Object.values(validationErrors).join(", "),
      });
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    const validationErrors = handleValidations();

    if (validationErrors && Object.keys(validationErrors).length > 0) {
      toast({
        title: "Validation Error",
        description: Object.values(validationErrors).join(", "),
      });
      return;
    }

    const loadingToastId = toast({
      title: "Processing",
      description: (
        <div className="flex items-center">
          <Loader2 className="animate-spin mr-2" size={16} />
          <span>Business being registered...</span>
        </div>
      ),
    });

    try {
      const formatedData = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        bookingEmail: formData.bookingEmail,
        officeAddress: formData.officeAddress,
        officeGoogleLink: formData.officeGoogleLink,
        city: formData.city,
        secondaryContactNumber: formData.secondaryContactNumber,
        vendorType: formData.businessType,
        // "isVendor": true,
        name: formData.name,
        brandLogo: formData.profilePicture,
        roleIds: [2],
        subBusinessType: formData.subBusinessType,
        expertise: formData.expertise,
        amenities: formData.amenities,
        staff: formData.staff,
        maxCapacity: formData.maxCapacity,
        minimumPrice: formData.minimumPrice,
        description: formData.description,
        downPaymentType: formData.downPaymentType,
        downPayment: formData.downPayment,
        cancelationPolicy: formData.cancelationPolicy,
        covidComplaint: false,
        parking: false,
        images: formData.images,
      }
      const rentalData = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        bookingEmail: formData.bookingEmail,
        officeAddress: formData.officeAddress,
        officeGoogleLink: formData.officeGoogleLink,
        city: formData.city,
        secondaryContactNumber: formData.secondaryContactNumber,
        vendorType: formData.businessType,
        // "isVendor": true,
        name: formData.name,
        brandLogo: formData.profilePicture,
        roleIds: [2],
      }
      const response = await axios.post(
        `${BACKEND_URL}api/v1/businesses/create-business-with-vendor`,
        {
          ...(carRentalOrBridleWear ? rentalData : formatedData),
        },
      );

      if (carRentalOrBridleWear) {
        setFormData({
          fullName: "",
          email: "",
          phoneNumber: "",
          password: "",
          re_enterPassword: "",
          businessType: "",
          name: "",
          profilePicture: "",
          city: "",
          roleIds: [2],
          secondaryContactNumber: "",
          instagram: "",
          facebook: "",
          bookingEmail: "",
          website: "",
          officeAddress: "",
          officeGoogleLink: "",
          staff: [],
          minimumPrice: 0,
          description: "",
          additionalInfo: "",
          downPaymentType: "",
          downPayment: 0,
          covidComplaint: false,
          cancelationPolicy: "",
          starterPrice: 0,
          images: [],
          subBusinessType: '',
          expertise: [],
          packages: [{
            id: undefined,
            name: "",
            price: 0,
            services: "",
          }],
          amenities: [],
          maxCapacity: "",
          catering: "",
          parking: false,
        })
        loadingToastId.dismiss();
        setOpenModal(true);
        setCurrentStep(0)
      }
      const responseData = response.data
      const vendorData = responseData.data

      if (response.status === 201 && vendorData.business && !carRentalOrBridleWear) {
        const vendorId = vendorData.business.id;
        const packagesArray = formData.packages.map(pkg => ({
          name: pkg.name,
          price: pkg.price,
          description: pkg.services,
          businessId: vendorId,
        }));

        // Send package details directly as an array
        await axios.post(`${BACKEND_URL}api/v1/packages`, packagesArray);

        setFormData({
          fullName: "",
          email: "",
          phoneNumber: "",
          password: "",
          re_enterPassword: "",
          businessType: "",
          name: "",
          profilePicture: "",
          city: "",
          roleIds: [2],
          secondaryContactNumber: "",
          instagram: "",
          facebook: "",
          bookingEmail: "",
          website: "",
          officeAddress: "",
          officeGoogleLink: "",
          staff: [],
          minimumPrice: 0,
          description: "",
          additionalInfo: "",
          downPaymentType: "",
          downPayment: 0,
          covidComplaint: false,
          cancelationPolicy: "",
          starterPrice: 0,
          images: [],
          subBusinessType: '',
          expertise: [],
          packages: [{
            id: undefined,
            name: "",
            price: 0,
            services: "",
          }],
          amenities: [],
          maxCapacity: "",
          catering: "",
          parking: false,
        })
        loadingToastId.dismiss();
        setOpenModal(true);
        setCurrentStep(0)
      }

    } catch (error: any) {
      loadingToastId.dismiss();
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong. Please try again.",
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center justify-between px-6 h-[10vh] border-b sticky top-0 bg-white z-10">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/placeholder.svg" alt="Perfect Wedding Logo" width={40} height={40} />
          <span className="text-lg lg:text-2xl font-semibold">Perfect Wedding</span>
        </Link>
        <Link href="/get-help" className="text-rose-600 text-sm hover:underline">
          <span className="hidden md:inline">Having Trouble?</span>Get Help
        </Link>
      </header>

      <main className="h-[90vh] grid lg:grid-cols-5">
        <div className="hidden lg:block lg:col-span-2 h-full bg-white pl-5">
          <Image
            src="https://img.freepik.com/free-vector/hospital-receptionist-pointing-man-without-mask-nurse-patient-quarantine-flat-vector-illustration_74855-11279.jpg?ga=GA1.1.851296793.1738481066&semt=ais_hybrid"
            alt="Illustration"
            width={400}
            height={400}
            className=""
          />
        </div>

        <div className="lg:col-span-3 relative h-full overflow-y-auto hide_scrollbar lg:pl-10 mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-3xl">
          <section className="px-5 min-h-[80vh] w-full">
            <div className="py-5">

              {currentStep === 0 || currentStep < 1 ? (
                <BusinessTypeStep setBusinessType={setBusinessType} businessType={businessType} />
              ) :
                <div>
                  {formData.businessType === 'Wedding venue' ?
                    <VenueSteps setFile={setFile} file={file} error={errors} setErrors={setErrors} currentStep={currentStep} />
                    :
                    carRentalOrBridleWear ?
                      <FormSteps setFile={setFile} file={file} error={errors} setErrors={setErrors} currentStep={currentStep} />
                      :
                      <div></div>
                  }
                </div>
              }
            </div>
          </section>

          <div className="border-t sticky bottom-0 flex items-center justify-between py-3 bg-white px-3 lg:px-5">
            <Button disabled={currentStep === 0} onClick={handleBack} variant={'outline'} className="">
              Back
            </Button>
            <Button
              type="button"
              onClick={(carRentalOrBridleWear && currentStep === 2) ? handleSubmit : currentStep === 6 ? handleSubmit : handleNext}
              className="bg-roze-default hover:bg-roze-default/90 text-white"
            >
              {(carRentalOrBridleWear && currentStep === 2) ? 'Submit' : currentStep === 6 ? "Submit" : "Next"}
            </Button>

          </div>
        </div>
      </main>
      <SuccessModal
        open={openModal}
        setOpen={setOpenModal}
      />
    </div>
  );
}
function setErrors(currentErrors: { [key: string]: string; }) {
  throw new Error("Function not implemented.");
}


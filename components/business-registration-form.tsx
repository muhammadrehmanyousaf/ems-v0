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
import { Flag } from "lucide-react";
import { useFormContext } from "@/lib/context/form-context";
import { toast } from "./ui/use-toast";

export function BusinessRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const { businessType, setBusinessType, steps, setFormData, formData, setErrors, errors } = useFormContext()
  console.log('formData', formData);
  console.log('businessType', businessType);

  const handleValidations = () => {
    let currentErrors: { [key: string]: string } = {};

    if (currentStep === 0) {
      if (!formData.businessType) currentErrors.businessType = "Select Business Type";
    } else if (currentStep === 1) {
      if (!formData.fullName) currentErrors.fullName = "Full Name is required";
      if (!formData.email) currentErrors.email = "Email is required";
      if (!formData.phoneNumber) currentErrors.phoneNumber = "Phone number is required";
      if (!formData.password) currentErrors.password = "Password is required";
    }

    setErrors(currentErrors);

    return currentErrors;
  };

  console.log('errors', errors);
  
  const handleNext = () => {
    
    const validationErrors = handleValidations();

    if (Object.keys(validationErrors).length > 0) {
      toast({
        title: "Validation Error",
        description: Object.values(validationErrors).join(", "),
      });
      return;
    }

    setCurrentStep((prev) => prev + 1);
};

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const filteredSteps = steps[currentStep]

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
            <div className="space-y-6 py-5">
              <div className="space-y-3">
                <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">{filteredSteps.title}</h1>
                <p className="text-sm md:text-base lg:text-lg font-medium">{filteredSteps.description}</p>
              </div>
              {currentStep > 0 ? (
                <div>
                  {filteredSteps.form}
                </div>
              ) : (
                <BusinessTypeStep setBusinessType={setBusinessType} businessType={businessType} />
              )}
            </div>
          </section>

          <div className="border-t sticky bottom-0 flex items-center justify-between py-3 bg-white px-3 lg:px-5">
            <Button disabled={currentStep === 0} onClick={handleBack} variant={'outline'} className="">
              Back
            </Button>
            <Button
              type="submit"
              disabled={currentStep === steps.length - 1}
              onClick={handleNext}
              className="bg-roze-default hover:bg-roze-default/90 text-white"
            >
              {currentStep === steps.length - 1 ? "Submit" : "Next"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
function setErrors(currentErrors: { [key: string]: string; }) {
  throw new Error("Function not implemented.");
}


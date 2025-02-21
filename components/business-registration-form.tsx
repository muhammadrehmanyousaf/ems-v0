"use client";

import { useState } from "react";
import { PersonalDetailsStep } from "./steps/personal-details-step";
import { BusinessTypeStep } from "./steps/business-type-step";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormData, formSchema } from "@/lib/formSchema/vendor-schema";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Flag } from "lucide-react";

export function BusinessRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formValues, setFormValues] = useState<FormData>({
    name: "",
    email: "",
    phoneNumber: 0,
    password: "",
    confirmPassword: "",
  });
const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: 0,
      password: "",
      confirmPassword: "",
    },
  });
  const steps = [
    { title: "Business Type" },
    { title: "Personal Details" },
  ];

  function handleStepSubmit(data: Partial<FormData>) {
      const updatedValues = {...data };
        // console.log("Final Form Data:", updatedValues);
  }

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
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
          <span className="text-2xl font-semibold">Perfect Wedding</span>
        </Link>
        <Link href="/get-help" className="text-rose-600 text-sm hover:underline">
          Having Trouble? <span className="ml-1 text-rose-600">Get Help</span>
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

        <div className="lg:col-span-3 relative h-full overflow-y-auto hide-scrollbar md:pl-10 max-w-3xl">
          <form onSubmit={handleSubmit(currentStep === 1 ? handleStepSubmit : handleNext)}>
          <section className="px-5 min-h-[80vh] w-full">
            <div className="space-y-6 pt-5">
              <h1 className="text-3xl text-roze-default font-semibold">{currentStep === 0 ? 'Business Type' : 'Personal Details'}</h1>
              {currentStep > 0 ? (
                <div className="space-y-5 py-3">
                <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
        
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="Enter your email address"
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>
        
              {/* Contact Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Contact Number *</Label>
                <div className="flex">
                  <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-gray-50">
                    <Flag className="w-4 h-4 text-gray-500" />
                    <span className="ml-2 text-sm text-gray-500">+92</span>
                  </div>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    {...register("phoneNumber")}
                    placeholder="Enter your phone number"
                    className="rounded-l-none"
                  />
                </div>
                {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>}
              </div>
        
              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="Enter your password"
                />
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
              </div>
        
              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Retype Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
              </div>
        
              {/* Terms Agreement Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox id="agreeToTerms" />
                <Label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                  Agree to{" "}
                  <Link href="/terms" className="text-rose-600 hover:underline">
                    Terms & Conditions
                  </Link>
                </Label>
              </div>
              </div>
              ): (
                <BusinessTypeStep/>
              )}
            </div>
          </section>

          <div className="border-t sticky bottom-0 flex items-center justify-between py-3 bg-white px-3 lg:px-5">
            <Button disabled={currentStep === 0} onClick={handleBack} className="secondary_button hover:bg-gray-50">
              Back
            </Button>
            <Button
            type="submit"
            onClick={handleNext}
              className="bg-roze-default hover:bg-roze-default/90 text-white"
            >
              {currentStep === steps.length - 1 ? "Submit" : "Next"}
            </Button>
          </div>
          </form>
        </div>
      </main>
    </div>
  );
}

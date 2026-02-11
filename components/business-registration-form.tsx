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
import { Flag, Loader2, ArrowLeft, HelpCircle, CheckCircle, Star, Award, Shield, Sparkles } from "lucide-react";
import { FormType, useFormContext } from "@/lib/context/form-context";
import { toast } from "./ui/use-toast";
import VenueSteps from "./VendorStepForms/newVendorRegisterationForm/venueSteps/venue-steps";
import PhotographerSteps from "./VendorStepForms/newVendorRegisterationForm/Photographer/photographer-steps";
import MakeupArtistSteps from "./VendorStepForms/newVendorRegisterationForm/MakeupArtist/makeup-artist-steps";
import HennaArtistSteps from "./VendorStepForms/newVendorRegisterationForm/HennaArtist/henna-artist-steps";
import DecoratorSteps from "./VendorStepForms/newVendorRegisterationForm/Decorator/decorator-steps";
import CateringSteps from "./VendorStepForms/newVendorRegisterationForm/Catering/catering-steps";
import axios from "axios";
import { BACKEND_URL } from "@/lib/backend-url";
import { vanueValidations } from "./VendorStepForms/newVendorRegisterationForm/venueSteps/vanueComponents/vanueValidations";
import SuccessModal from "./VendorStepForms/components/SuccessModal";
import FormSteps from "./VendorStepForms/newVendorRegisterationForm/CarRentalAndBridleWear/form-steps";
import { CarRentalOrBridleWearValidations } from "./VendorStepForms/newVendorRegisterationForm/CarRentalAndBridleWear/components/validations";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function BusinessRegistrationForm() {
  // const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const { businessType, setBusinessType, steps, setFormData, formData, setErrors, errors, setCurrentStep, currentStep } = useFormContext()
  const [openModal, setOpenModal] = useState(false);

  const carRentalOrBridleWear = businessType === 'Car rental' || businessType === 'Bridal wearing';
  const photographer = businessType === 'Photographer';
  const makeupArtist = businessType === 'Makeup artist';
  const hennaArtist = businessType === 'Henna artist';
  const decorator = businessType === 'Decorator';
  const catering = businessType === 'Catering';

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (currentStep === 0) return 0;
    if (carRentalOrBridleWear && currentStep === 2) return 100;
    if ((photographer || makeupArtist || hennaArtist || decorator || catering) && currentStep === 6) return 100;
    if (currentStep === 6) return 100;
    
    const maxSteps = carRentalOrBridleWear ? 2 : 6;
    return Math.round((currentStep / maxSteps) * 100);
  };

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
    if (photographer || makeupArtist || hennaArtist || decorator || catering) {
      // For now, use basic validation for new business types
      if (currentStep === 1) {
        if (!formData.fullName) currentErrors.fullName = "Full name is required";
        if (!formData.email) currentErrors.email = "Email is required";
        if (!formData.phoneNumber) currentErrors.phoneNumber = "Phone number is required";
        if (!formData.password) currentErrors.password = "Password is required";
      }
      if (currentStep === 2) {
        if (!formData.name) currentErrors.name = "Business name is required";
        if (!formData.city) currentErrors.city = "City is required";
      }
      if (currentStep === 3) {
        if (!formData.description) currentErrors.description = "Business description is required";
        if (!formData.minimumPrice) currentErrors.minimumPrice = "Starting price is required";
        if (!formData.subBusinessType) currentErrors.subBusinessType = "Business type is required";
      }
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
        maxCapacity: formData.maxCapacity || 1,
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-rose-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200 shadow-sm">
        <div className="w-[90%] mx-auto sm:container sm:mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  Perfect Wedding
                </h1>
                <p className="text-xs text-neutral-500">Business Registration</p>
              </div>
            </Link>
            
            <Link 
              href="/get-help" 
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all duration-200"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Need Help?</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-[90%] mx-auto sm:container sm:mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
          
          {/* Left Side - Sticky Hero Section */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="lg:sticky lg:top-24 space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Progress Section */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-semibold text-neutral-900">Registration Progress</h2>
                      <span className="text-sm font-medium text-rose-600">{getProgressPercentage()}%</span>
                    </div>
                    <Progress value={getProgressPercentage()} className="h-2" />
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Step {currentStep + 1} of {carRentalOrBridleWear ? 3 : 7}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits Section */}
              <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0 shadow-xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center">
                      <Award className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-rose-200" />
                      <h3 className="text-lg sm:text-xl font-bold mb-2">Join Our Premium Network</h3>
                      <p className="text-rose-100 text-sm">
                        Connect with thousands of couples looking for your services
                      </p>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-sm font-medium">Free Business Profile</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-sm font-medium">Direct Customer Leads</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-sm font-medium">Professional Marketing Tools</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-sm font-medium">24/7 Customer Support</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Section */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center gap-2">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                      Platform Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">500+</div>
                        <div className="text-xs text-blue-600">Active Vendors</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">10K+</div>
                        <div className="text-xs text-green-600">Happy Couples</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Side - Form Section */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                {/* Step Content */}
                <div className="min-h-[400px] sm:min-h-[500px]">
                  {currentStep === 0 || currentStep < 1 ? (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="text-center space-y-3 sm:space-y-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                          <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
                            Choose Your Business Type
                          </h2>
                          <p className="text-sm sm:text-base text-neutral-600">
                            Select the category that best describes your wedding services
                          </p>
                        </div>
                      </div>
                      <BusinessTypeStep setBusinessType={setBusinessType} businessType={businessType} />
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm sm:text-base">{currentStep}</span>
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
                            {businessType} Registration
                          </h2>
                          <p className="text-sm sm:text-base text-neutral-600">Complete your business profile</p>
                        </div>
                      </div>
                      
                      {formData.businessType === 'Wedding venue' ?
                        <VenueSteps setFile={setFile} file={file} error={errors} setErrors={setErrors} currentStep={currentStep} />
                        :
                        carRentalOrBridleWear ?
                          <FormSteps setFile={setFile} file={file} error={errors} setErrors={setErrors} currentStep={currentStep} />
                          :
                          photographer ?
                            <PhotographerSteps setFile={setFile} file={file} error={errors} setErrors={setErrors} currentStep={currentStep} />
                            :
                            makeupArtist ?
                              <MakeupArtistSteps setFile={setFile} file={file} error={errors} setErrors={setErrors} currentStep={currentStep} />
                              :
                              hennaArtist ?
                                <HennaArtistSteps setFile={setFile} file={file} error={errors} setErrors={setErrors} currentStep={currentStep} />
                                :
                                decorator ?
                                  <DecoratorSteps setFile={setFile} file={file} error={errors} setErrors={setErrors} currentStep={currentStep} />
                                  :
                                  catering ?
                                    <CateringSteps setFile={setFile} file={file} error={errors} setErrors={setErrors} currentStep={currentStep} />
                                    :
                                    <div></div>
                      }
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 border-t border-neutral-200 mt-6 sm:mt-8">
                  <Button 
                    disabled={currentStep === 0} 
                    onClick={handleBack} 
                    variant="outline" 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 border-neutral-200 hover:border-rose-500 hover:text-rose-600 transition-all duration-200 py-3 sm:py-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={(carRentalOrBridleWear && currentStep === 2) || (photographer && currentStep === 6) || (makeupArtist && currentStep === 6) || (hennaArtist && currentStep === 6) || (decorator && currentStep === 6) || (catering && currentStep === 6) ? handleSubmit : currentStep === 6 ? handleSubmit : handleNext}
                    className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-6 sm:px-8 py-3 sm:py-2 font-semibold"
                  >
                    {(carRentalOrBridleWear && currentStep === 2) || (photographer && currentStep === 6) || (makeupArtist && currentStep === 6) || (hennaArtist && currentStep === 6) || (decorator && currentStep === 6) || (catering && currentStep === 6) ? 'Submit Registration' : currentStep === 6 ? "Submit Registration" : "Continue"}
                  </Button>
                </div>
              </CardContent>
            </Card>
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


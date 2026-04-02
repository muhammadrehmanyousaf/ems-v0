"use client";

import { useEffect, useState } from "react";
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
import {
  Flag,
  Loader2,
  ArrowLeft,
  HelpCircle,
  CheckCircle,
  Star,
  Award,
  Shield,
  Sparkles,
  Heart,
  Calendar,
  Users,
} from "lucide-react";
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
import { useFetchData } from "@/hooks/use-fetch-data";
import { usePlatformStats } from "@/hooks/use-platform-stats";
import { Icons } from "./ui/icons";
import { motion } from "framer-motion";
import { Package } from "@/lib/types";

export function BusinessRegistrationForm() {
  // const [currentStep, setCurrentStep] = useState(0);
  const {
    businessType,
    setBusinessType,
    steps,
    setFormData,
    formData,
    setErrors,
    errors,
    setCurrentStep,
    currentStep,
  } = useFormContext();
  console.log("Current Step:", currentStep);
  console.log("Business type:", businessType);

  const [file, setFile] = useState<File | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { data: stats, isLoading: isLoadingStats } = usePlatformStats();

  const carRentalOrBridleWear =
    businessType === "Car rental" || businessType === "Bridal wearing";
  const photographer = businessType === "Photographer";
  const makeupArtist = businessType === "Makeup artist";
  const hennaArtist = businessType === "Henna artist";
  const decorator = businessType === "Decorator";
  const catering = businessType === "Catering";

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (currentStep === 0) return 0;
    if (carRentalOrBridleWear && currentStep === 2) return 100;
    if (
      (photographer || makeupArtist || hennaArtist || decorator || catering) &&
      currentStep === 6
    )
      return 100;
    if (currentStep === 6) return 100;

    const maxSteps = carRentalOrBridleWear ? 2 : 6;
    return Math.round((currentStep / maxSteps) * 100);
  };

  console.log("formdata here iasefaoeoifvnnafn", formData);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleValidations = () => {
    let currentErrors: { [key: string]: string } = {};
    console.log("Running validations for step:", currentStep);

    if (currentStep === 0) {
      if (!formData.businessType) {
        console.log("in no business type 43525452435", formData.businessType);
        currentErrors.businessType = "Select Business Type";
      }
      setErrors(currentErrors);
      return currentErrors;
    } else if (formData.businessType === "Wedding venue") {
      vanueValidations({ currentStep, formData, currentErrors });
      setErrors(currentErrors);
      return currentErrors;
    }
    if (carRentalOrBridleWear) {
      CarRentalOrBridleWearValidations({
        currentStep,
        formData,
        currentErrors,
      });
      setErrors(currentErrors);
      return currentErrors;
    }
    if (photographer || makeupArtist || hennaArtist || decorator || catering) {
      // For now, use basic validation for new business types
      if (currentStep === 1) {
        if (!formData.fullName)
          currentErrors.fullName = "Full name is required";
        if (!formData.email) currentErrors.email = "Email is required";
        if (formData.email && !validateEmail(formData.email))
          currentErrors.email = "Invalid email address";
        if (!formData.phoneNumber)
          currentErrors.phoneNumber = "Phone number is required";
        if (!formData.password) currentErrors.password = "Password is required";
        if (formData.password && formData.password.length < 8)
          currentErrors.password = "Password must be at least 8 characters";
        if (!formData.re_enterPassword)
          currentErrors.re_enterPassword = "Re-enter password is required";
        else if (formData.password !== formData.re_enterPassword)
          currentErrors.re_enterPassword = "Passwords do not match";
      }
      if (currentStep === 2) {
        if (!formData.name) currentErrors.name = "Business name is required";
        if (!formData.secondaryContactNumber) {
          currentErrors.secondaryContactNumber = "Secondary contact number is required";
        } else if (!/^\d+$/.test(String(formData.secondaryContactNumber))) {
          currentErrors.secondaryContactNumber = "Invalid phone number format";
        }
        if (!formData.city) currentErrors.city = "City is required";
        if (!formData.subArea) currentErrors.subArea = "Sub area is required";
        if (!formData.officeAddress) currentErrors.officeAddress = "Office address is required";
        const urlPattern = /^(https?:\/\/)/;
        if (!formData.instagram) {
          currentErrors.instagram = "Instagram link is required";
        } else if (!urlPattern.test(formData.instagram)) {
          currentErrors.instagram = "Invalid Instagram link";
        }
        if (!formData.officeGoogleLink) {
          currentErrors.officeGoogleLink = "Google Maps link is required";
        } else if (!urlPattern.test(formData.officeGoogleLink)) {
          currentErrors.officeGoogleLink = "Invalid Google Maps link";
        }
      }
      if (currentStep === 3) {
        if (!formData.description)
          currentErrors.description = "Business description is required";
        if (!Array.isArray(formData.subBusinessType) || formData.subBusinessType.length === 0)
          currentErrors.subBusinessType = "Business type is required";
        if (!formData.staff || formData.staff.length < 1)
          currentErrors.staff = "Staff is required";
        if (!formData.cancelationPolicy)
          currentErrors.cancelationPolicy = "Cancellation policy is required";
        if (!formData.downPaymentType)
          currentErrors.downPaymentType = "Down payment type is required";
        if (!formData.downPayment || Number(formData.downPayment) <= 0)
          currentErrors.downPayment = "Down payment is required";
        else if (
          formData.downPaymentType === "Percentage" &&
          Number(formData.downPayment) > 100
        ) {
          currentErrors.downPayment = "Percentage must be between 0 and 100";
        }
      }
      if (currentStep === 4) {
        const isMenuType =
          formData.businessType === "Wedding venue" ||
          formData.businessType === "Catering";
        const itemLabel = isMenuType ? "menu" : "package";
        const validPackages =
          formData.packages?.filter((pkg: any) => pkg.name && pkg.price) ?? [];
        if (validPackages.length === 0) {
          currentErrors.packages = `At least one ${itemLabel} with a name and price is required`;
        }
        if (formData.packages) {
          formData.packages.forEach((pkg: any, index: number) => {
            if (!pkg.name) {
              currentErrors[`packages[${index}].name`] =
                `${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} name is required`;
            }
            if (!pkg.price) {
              currentErrors[`packages[${index}].price`] =
                `${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} price is required`;
            }
            // Features Validation: every item in a selected feature must be filled
            if (pkg.features) {
              Object.keys(pkg.features).forEach((feature) => {
                const items = pkg.features[feature];
                if (items && items.length > 0) {
                  const hasEmptyItem = items.some(
                    (item: string) => item.trim() === "",
                  );
                  if (hasEmptyItem) {
                    currentErrors[`packages[${index}].features.${feature}`] =
                      `All ${feature} fields must be filled in`;
                  }
                }
              });
            }
          });
        }
      }
      if (currentStep === 5) {
        const imageCount = formData.imageFiles?.length ?? 0;
        if (imageCount === 0) {
          currentErrors.images = "Please upload at least one image";
        } else if (imageCount > 20) {
          currentErrors.images = `Maximum 20 images allowed. You have uploaded ${imageCount}. Please remove ${imageCount - 20} image(s).`;
        }
      }
      setErrors(currentErrors);
      return currentErrors;
    }
  };

  const handleNext = () => {
    const validationErrors = handleValidations();
    console.log("Validation Errors:", validationErrors);

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
      // Single tempId used for both logo and image uploads
      const uploadTempId = crypto.randomUUID();
      let uploadedImageUrls: string[] = [];

      // Upload brand logo if a file was selected
      if (file) {
        const logoFormData = new FormData();
        logoFormData.append("images", file);
        try {
          await axios.post(
            `${BACKEND_URL}api/v1/businesses/upload-images?tempId=${uploadTempId}&type=logo`,
            logoFormData,
            { headers: { "Content-Type": "multipart/form-data" } },
          );
        } catch {
          toast({
            title: "Error",
            description: "Failed to upload logo. Please try again.",
          });
          loadingToastId.dismiss();
          return;
        }
      }

      // Upload business images
      if (formData.imageFiles && formData.imageFiles.length > 0) {
        const imageFiles = formData.imageFiles.slice(0, 20); // hard cap at 20
        const imgFormData = new FormData();
        imageFiles.forEach((f: File) => {
          imgFormData.append("images", f);
        });
        try {
          const uploadRes = await axios.post(
            `${BACKEND_URL}api/v1/businesses/upload-images?tempId=${uploadTempId}`,
            imgFormData,
            { headers: { "Content-Type": "multipart/form-data" } },
          );
          uploadedImageUrls = uploadRes.data?.data || [];
        } catch {
          toast({
            title: "Error",
            description: "Failed to upload images. Please try again.",
          });
          loadingToastId.dismiss();
          return;
        }
      }

      const formatedData = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        bookingEmail: formData.bookingEmail,
        officeAddress: formData.officeAddress,
        officeGoogleLink: formData.officeGoogleLink,
        city: formData.city,
        subArea: formData.subArea,
        secondaryContactNumber: formData.secondaryContactNumber,
        vendorType: formData.businessType,
        name: formData.name,
        brandLogo: formData.profilePicture,
        roleIds: [2],
        subBusinessType: formData.subBusinessType,
        expertise: formData.expertise,
        amenities: formData.amenities,
        staff: formData.staff,
        maxCapacity: formData.maxCapacity || 1,
        description: formData.description,
        additionalInfo: formData.additionalInfo || undefined,
        downPaymentType: formData.downPaymentType,
        downPayment: formData.downPayment,
        cancelationPolicy: formData.cancelationPolicy,
        covidComplaint: formData.covidComplaint,
        parking: formData.parking,
        catering: formData.catering === "internal",
        images:
          uploadedImageUrls.length > 0 ? uploadedImageUrls : formData.images,
        packages:
          formData.packages?.filter((p: any) => p.name && p.price) || [],
        ...(uploadTempId ? { tempId: uploadTempId } : {}),
      };

      const rentalData = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        bookingEmail: formData.bookingEmail,
        officeAddress: formData.officeAddress,
        officeGoogleLink: formData.officeGoogleLink,
        city: formData.city,
        subArea: formData.subArea,
        secondaryContactNumber: formData.secondaryContactNumber,
        vendorType: formData.businessType,
        // "isVendor": true,
        name: formData.name,
        brandLogo: formData.profilePicture,
        roleIds: [2],
      };
      // Build the payload — use FormData so vendor profile image can be included
      const submitPayload = carRentalOrBridleWear ? rentalData : formatedData;
      let requestBody: FormData | object = submitPayload;
      let requestHeaders: Record<string, string> = {};

      if (formData.profileImageFile) {
        const fd = new globalThis.FormData();
        // Append simple scalar fields
        Object.entries(submitPayload).forEach(([key, val]) => {
          if (val === undefined || val === null) return;
          if (val instanceof File) return; // skip, handled separately
          if (typeof val === "object") {
            fd.append(key, JSON.stringify(val));
          } else {
            fd.append(key, String(val));
          }
        });
        fd.append("profileImage", formData.profileImageFile);
        requestBody = fd;
        requestHeaders["Content-Type"] = "multipart/form-data";
      }

      const response = await axios.post(
        `${BACKEND_URL}api/v1/businesses/create-business-with-vendor`,
        requestBody,
        requestHeaders["Content-Type"] ? { headers: requestHeaders } : undefined,
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
          subArea: "",
          roleIds: [2],
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
          images: [],
          imageFiles: [],
          profileImageFile: null,
          subBusinessType: [],
          expertise: [],
          packages: [
            {
              id: undefined,
              name: "",
              price: 0,
              features: {
                deliverables: [],
                photography: [],
                team: [],
                videography: [],
              },
            },
          ],
          amenities: [],
          maxCapacity: "",
          catering: "",
          parking: false,
        });
        loadingToastId.dismiss();
        setSuccessMessage(response.data?.message || "");
        setOpenModal(true);
        setCurrentStep(0);
        return;
      }
      const responseData = response.data;
      const vendorData = responseData.data;

      if (
        response.status === 201 &&
        vendorData.business &&
        !carRentalOrBridleWear
      ) {
        // Packages are now included in the business creation payload above,
        // so no separate auth-required API call is needed.
        // TODO: Re-enable separate Package records creation after login flow is implemented
        // const vendorId = vendorData.business.id;
        // const packagesArray = formData.packages.map(pkg => ({
        //   name: pkg.name,
        //   price: pkg.price,
        //   description: pkg.services,
        //   businessId: vendorId,
        // }));
        // await axios.post(`${BACKEND_URL}api/v1/packages`, packagesArray);

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
          subArea: "",
          roleIds: [2],
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
          images: [],
          imageFiles: [],
          profileImageFile: null,
          subBusinessType: [],
          expertise: [],
          packages: [
            {
              id: undefined,
              name: "",
              price: 0,
              features: {
                deliverables: [],
                photography: [],
                team: [],
                videography: [],
              },
            },
          ],
          amenities: [],
          maxCapacity: "",
          catering: "",
          parking: false,
        });
        loadingToastId.dismiss();
        setSuccessMessage(response.data?.message || "");
        setOpenModal(true);
        setCurrentStep(0);
      }
    } catch (error: any) {
      loadingToastId.dismiss();
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-purple-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="w-[90%] mx-auto sm:container sm:mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center space-x-2 sm:space-x-3 group"
            >
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                  Perfect Wedding
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Business Registration
                </p>
              </div>
            </Link>

            <Link
              href="/get-help"
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-neutral-800 rounded-lg transition-all duration-200"
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
              <Card className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        Registration Progress
                      </h2>
                      <span className="text-sm font-medium text-purple-600">
                        {getProgressPercentage()}%
                      </span>
                    </div>
                    <Progress value={getProgressPercentage()} className="h-2" />
                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>
                        Step {currentStep + 1} of{" "}
                        {carRentalOrBridleWear ? 3 : 7}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits Section */}
              <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0 shadow-xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center">
                      <Award className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-purple-200" />
                      <h3 className="text-lg sm:text-xl font-bold mb-2">
                        Join Our Premium Network
                      </h3>
                      <p className="text-purple-100 text-sm">
                        Connect with thousands of couples looking for your
                        services
                      </p>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-sm font-medium">
                          Free Business Profile
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-sm font-medium">
                          Direct Customer Leads
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-sm font-medium">
                          Professional Marketing Tools
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-sm font-medium">
                          24/7 Customer Support
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats cards */}
              <Card className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                      Platform Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">
                          {stats ? stats.vendors : 0}
                          {"+"}
                        </div>
                        <div className="text-xs text-blue-600">
                          Active Vendors
                        </div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                          {stats ? stats.couplesServed : 0}
                          {"+"}
                        </div>
                        <div className="text-xs text-green-600">
                          Happy Couples
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Side - Form Section */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <Card className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                {/* Step Content */}
                <div className="min-h-[400px] sm:min-h-[500px]">
                  {currentStep === 0 || currentStep < 1 ? (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="text-center space-y-3 sm:space-y-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center mx-auto shadow-lg">
                          <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                            Choose Your Business Type
                          </h2>
                          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                            Select the category that best describes your wedding
                            services
                          </p>
                        </div>
                      </div>
                      <BusinessTypeStep
                        setBusinessType={setBusinessType}
                        businessType={businessType}
                        errors={errors}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm sm:text-base">
                            {currentStep}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">
                            {businessType} Registration
                          </h2>
                          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                            Complete your business profile
                          </p>
                        </div>
                      </div>

                      {formData.businessType === "Wedding venue" ? (
                        <VenueSteps
                          setFile={setFile}
                          file={file}
                          error={errors}
                          setErrors={setErrors}
                          currentStep={currentStep}
                        />
                      ) : carRentalOrBridleWear ? (
                        <FormSteps
                          setFile={setFile}
                          file={file}
                          error={errors}
                          setErrors={setErrors}
                          currentStep={currentStep}
                        />
                      ) : photographer ? (
                        <PhotographerSteps
                          setFile={setFile}
                          file={file}
                          error={errors}
                          setErrors={setErrors}
                          currentStep={currentStep}
                        />
                      ) : makeupArtist ? (
                        <MakeupArtistSteps
                          setFile={setFile}
                          file={file}
                          error={errors}
                          setErrors={setErrors}
                          currentStep={currentStep}
                        />
                      ) : hennaArtist ? (
                        <HennaArtistSteps
                          setFile={setFile}
                          file={file}
                          error={errors}
                          setErrors={setErrors}
                          currentStep={currentStep}
                        />
                      ) : decorator ? (
                        <DecoratorSteps
                          setFile={setFile}
                          file={file}
                          error={errors}
                          setErrors={setErrors}
                          currentStep={currentStep}
                        />
                      ) : catering ? (
                        <CateringSteps
                          setFile={setFile}
                          file={file}
                          error={errors}
                          setErrors={setErrors}
                          currentStep={currentStep}
                        />
                      ) : (
                        <div></div>
                      )}
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 border-t border-neutral-200 dark:border-neutral-800 mt-6 sm:mt-8">
                  <Button
                    disabled={currentStep === 0}
                    onClick={handleBack}
                    variant="outline"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 border-neutral-200 dark:border-neutral-700 hover:border-purple-500 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 py-3 sm:py-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>

                  <Button
                    type="button"
                    onClick={
                      (carRentalOrBridleWear && currentStep === 2) ||
                      (photographer && currentStep === 6) ||
                      (makeupArtist && currentStep === 6) ||
                      (hennaArtist && currentStep === 6) ||
                      (decorator && currentStep === 6) ||
                      (catering && currentStep === 6)
                        ? handleSubmit
                        : currentStep === 6
                          ? handleSubmit
                          : handleNext
                    }
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-6 sm:px-8 py-3 sm:py-2 font-semibold"
                  >
                    {(carRentalOrBridleWear && currentStep === 2) ||
                    (photographer && currentStep === 6) ||
                    (makeupArtist && currentStep === 6) ||
                    (hennaArtist && currentStep === 6) ||
                    (decorator && currentStep === 6) ||
                    (catering && currentStep === 6)
                      ? "Submit Registration"
                      : currentStep === 6
                        ? "Submit Registration"
                        : "Continue"}
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
        message={successMessage}
      />
    </div>
  );
}

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
  ArrowRight,
  HelpCircle,
  CheckCircle,
  Star,
  Award,
  Shield,
  Sparkles,
  Heart,
  Calendar,
  Users,
  Send,
} from "lucide-react";
import { FormType, useFormContext } from "@/lib/context/form-context";
import { toast } from "./ui/use-toast";
import VenueSteps from "./VendorStepForms/newVendorRegisterationForm/venueSteps/venue-steps";
import PhotographerSteps from "./VendorStepForms/newVendorRegisterationForm/Photographer/photographer-steps";
import MakeupArtistSteps from "./VendorStepForms/newVendorRegisterationForm/MakeupArtist/makeup-artist-steps";
import HennaArtistSteps from "./VendorStepForms/newVendorRegisterationForm/HennaArtist/henna-artist-steps";
import DecoratorSteps from "./VendorStepForms/newVendorRegisterationForm/Decorator/decorator-steps";
import CateringSteps from "./VendorStepForms/newVendorRegisterationForm/Catering/catering-steps";
// BK-100.55 Layer 2 — generic flow for the 14 new Pakistani categories.
import GenericSteps from "./VendorStepForms/newVendorRegisterationForm/Generic/generic-steps";
import axios from "axios";
import { BACKEND_URL } from "@/lib/backend-url";

// Temporary kill-switch — image storage isn't wired up on production
// yet. While the flag is OFF, the registration flow accepts image
// selections from the user, silently drops them, and submits the
// business with no images. Flip back to true once an S3/Cloudinary
// adapter ships and `/api/v1/businesses/upload-images` is alive.
//
// Honours `NEXT_PUBLIC_IMAGE_UPLOADS_ENABLED=1` on Vercel so ops can
// re-enable without a redeploy once storage is ready.
const IMAGE_UPLOADS_ENABLED =
  process.env.NEXT_PUBLIC_IMAGE_UPLOADS_ENABLED === "1";
import { TERMS_VERSION } from "@/lib/seo";
import { vanueValidations } from "./VendorStepForms/newVendorRegisterationForm/venueSteps/vanueComponents/vanueValidations";
import SuccessModal from "./VendorStepForms/components/SuccessModal";
import CarRentalSteps from "./VendorStepForms/newVendorRegisterationForm/CarRental/car-rental-steps";
import { CarRentalValidations } from "./VendorStepForms/newVendorRegisterationForm/CarRental/components/validations";
import BridalWearSteps from "./VendorStepForms/newVendorRegisterationForm/BridalWear/bridal-wear-steps";
import { BridalWearValidations } from "./VendorStepForms/newVendorRegisterationForm/BridalWear/components/validations";
import WeddingStationerySteps from "./VendorStepForms/newVendorRegisterationForm/WeddingStationery/wedding-stationery-steps";
import { WeddingStationeryValidations } from "./VendorStepForms/newVendorRegisterationForm/WeddingStationery/components/validations";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFetchData } from "@/hooks/use-fetch-data";
import { usePlatformStats } from "@/hooks/use-platform-stats";
import { Icons } from "./ui/icons";
import { motion } from "framer-motion";
import { Package } from "@/lib/types";
// 01-VR-ENHANCE-V1-FE — server-side draft sync
import { useDraftSync } from "@/lib/hooks/useDraftSync";
import { DraftResumePrompt } from "@/components/auth/DraftResumePrompt";

// Bridal primitives (Phase 0 — design revamp)
import { BridalButton } from "@/components/bridal/bridal-button";
import {
  BridalCard,
  BridalCrown,
  BridalTitle,
} from "@/components/bridal/bridal-card";
import { BridalBadge } from "@/components/bridal/bridal-badge";
import { FloralDivider } from "@/components/bridal/floral-divider";

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
  // T&C acceptance — explicit consent gate on the final step. Submit is
  // blocked until checked. Reference:
  // docs/payfast/01-payfast-integration-overview.md §2 item 6.
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { data: stats, isLoading: isLoadingStats } = usePlatformStats();

  // 01-VR-ENHANCE-V1-FE — server-side draft sync.
  // Auto-saves debounced 2s after any change to formData / currentStep / businessType
  // once a valid email is in formData.email. Disabled after openModal flips true
  // (i.e. after a successful submit) so the post-submit reset doesn't write
  // an empty draft over the just-submitted record.
  const draftSync = useDraftSync({
    formData,
    currentStep,
    vendorType: businessType ? String(businessType) : null,
    enabled: !openModal,
  });

  const carRental = businessType === "Car rental";
  const bridalWear = businessType === "Bridal wearing";
  const weddingStationery = businessType === "Wedding Invitations and Stationery";
  const photographer = businessType === "Photographer";
  const makeupArtist = businessType === "Makeup artist";
  const hennaArtist = businessType === "Henna artist";
  const decorator = businessType === "Decorator";
  const catering = businessType === "Catering";
  const venue = businessType === "Wedding venue";

  // BK-100.55 Layer 2 — 14 new Pakistani vendor categories all route
  // through the same `GenericSteps` flow (7-step layout, identical
  // numbering to photographer so the validation + progress + isFinalStep
  // logic in this file works unchanged). Per-category specialty UI
  // polish ships in Layer 3 by swapping the generic specialty step
  // for a category-aware component.
  const BK_100_55_GENERIC_CATEGORIES = [
    "Nikahkhwan",
    "Choreographer",
    "Dhol player",
    "Event host",
    "Live streaming",
    "Generator rental",
    "Marquee rental",
    "Furniture rental",
    "Florist",
    "Wedding cakes",
    "Mithai and sweets",
    "Live cooking stall",
    "Sound system rental",
    "Qawwali and Naat",
  ] as const;
  const isGenericNewCategory = (BK_100_55_GENERIC_CATEGORIES as readonly string[]).includes(
    businessType as string,
  );

  // VR-050 — every vendor type now has an extra "Specialty & Trust" step.
  // For photographer/venue/makeup/henna/decorator/catering it sits at #4
  // (between Business Details and Packages). For bridal-wear, car-rental
  // and stationery — whose flows have multiple specialised intermediate
  // steps — it sits just before Preview to avoid renumbering the middle.
  // Step counts (user-facing, currentStep 1..N):
  //   Bridal Wear / Stationery: 9 (was 8)
  //   Car Rental:               8 (was 7)
  //   Photographer / Venue / Makeup / Henna / Decorator / Catering: 7 (was 6)
  const maxUserSteps =
    bridalWear || weddingStationery
      ? 9
      : carRental
        ? 8
        : 7;

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (currentStep === 0) return 0;
    if (currentStep >= maxUserSteps) return 100;
    return Math.round((currentStep / maxUserSteps) * 100);
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
    if (carRental) {
      CarRentalValidations({ currentStep, formData, currentErrors });
      setErrors(currentErrors);
      return currentErrors;
    }
    if (bridalWear) {
      BridalWearValidations({ currentStep, formData, currentErrors });
      setErrors(currentErrors);
      return currentErrors;
    }
    if (weddingStationery) {
      WeddingStationeryValidations({ currentStep, formData, currentErrors });
      setErrors(currentErrors);
      return currentErrors;
    }
    if (photographer || makeupArtist || hennaArtist || decorator || catering || isGenericNewCategory) {
      // For now, use basic validation for new business types
      if (currentStep === 1) {
        if (!formData.fullName)
          currentErrors.fullName = "Full name is required";
        if (!formData.email) currentErrors.email = "Email is required";
        if (formData.email && !validateEmail(formData.email))
          currentErrors.email = "Invalid email address";
        if (!formData.phoneNumber) {
          currentErrors.phoneNumber = "Phone number is required";
        } else if (!/^3\d{9}$/.test(String(formData.phoneNumber))) {
          currentErrors.phoneNumber = "Enter a valid 10-digit number starting with 3 (e.g. 3001234567)";
        }
        if (!formData.password) currentErrors.password = "Password is required";
        if (formData.password && formData.password.length < 8)
          currentErrors.password = "Password must be at least 8 characters";
        if (!formData.re_enterPassword)
          currentErrors.re_enterPassword = "Re-enter password is required";
        else if (formData.password !== formData.re_enterPassword)
          currentErrors.re_enterPassword = "Passwords do not match";
      }
      if (currentStep === 2) {
        if (!formData.name) currentErrors.name = "Brand Name is required";
        if (formData.secondaryContactNumber) {
          if (!/^3\d{9}$/.test(String(formData.secondaryContactNumber))) {
            currentErrors.secondaryContactNumber = "Enter a valid 10-digit number starting with 3 (e.g. 3001234567)";
          } else if (String(formData.secondaryContactNumber) === String(formData.phoneNumber)) {
            currentErrors.secondaryContactNumber = "Secondary number must be different from your primary phone number";
          }
        }
        if (!formData.city) {
          currentErrors.city = "City is required";
        } else if (!/^[a-zA-Z\s\-]+$/.test(formData.city)) {
          currentErrors.city = "City must contain letters only";
        }
        if (!formData.subArea) {
          currentErrors.subArea = "Sub area is required";
        } else if (!/^[a-zA-Z0-9\s\-]+$/.test(formData.subArea)) {
          currentErrors.subArea = "Sub Area must contain letters, numbers, or hyphens only";
        }
        if (!formData.officeAddress) {
          currentErrors.officeAddress = "Office address is required";
        } else if (formData.officeAddress.includes("@") || /^https?:\/\//i.test(formData.officeAddress)) {
          currentErrors.officeAddress = "Please enter a valid office address";
        } else if (formData.officeAddress.trim().length < 5) {
          currentErrors.officeAddress = "Office address is too short";
        }
        if (formData.instagram && !/^https?:\/\/(www\.)?instagram\.com\/.+/i.test(formData.instagram)) {
          currentErrors.instagram = "Must be a valid Instagram link (e.g. https://instagram.com/youraccount)";
        }
        if (formData.facebook && !/^https?:\/\/(www\.)?facebook\.com\/.+/i.test(formData.facebook)) {
          currentErrors.facebook = "Must be a valid Facebook link (e.g. https://facebook.com/yourpage)";
        }
        if (formData.officeGoogleLink && !/google\.com\/maps|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl/i.test(formData.officeGoogleLink)) {
          currentErrors.officeGoogleLink = "Must be a valid Google Maps link";
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
      // VR-050 — every simple-flow vendor type (photographer, makeup, henna,
      // decorator, catering) inserted a "Specialty & Trust" step at 4, so
      // their Packages step is 5 and Images step is 6. Step 4 is optional
      // (no validation needed).
      const packagesStep = 5;
      const imagesStep = 6;
      if (currentStep === packagesStep) {
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
      if (currentStep === imagesStep) {
        const imageCount = formData.imageFiles?.length ?? 0;
        // Temporary — images optional while IMAGE_UPLOADS_ENABLED is
        // off (no storage backend yet). The 20-image cap still
        // applies as a defensive client-side limit so a vendor
        // can't queue up gigabytes of files we'd silently discard.
        if (IMAGE_UPLOADS_ENABLED && imageCount === 0) {
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

    // Explicit T&C gate — frontend cannot submit without an affirmative
    // tick. Backend defends in depth by also persisting the version /
    // timestamp / IP for chargeback evidence.
    if (!termsAccepted) {
      toast({
        title: "Please accept the Terms",
        description:
          "You must accept the Vendor Terms of Service, Privacy Policy, and Refund Policy before submitting.",
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

      // Upload brand logo if a file was selected.
      // Skipped entirely while IMAGE_UPLOADS_ENABLED is off — image
      // storage isn't wired up on production yet, so we silently
      // drop any selected logo and submit without one. Vendor can
      // upload from the dashboard later once storage is ready.
      //
      // BELT-AND-BRACES: Even when the flag is ON, an upload failure
      // is treated as a soft warning, NOT a submission blocker. A
      // photographer doesn't lose their entire registration because
      // the image bucket had a 5-second hiccup.
      if (IMAGE_UPLOADS_ENABLED && file) {
        const logoFormData = new FormData();
        logoFormData.append("images", file);
        try {
          await axios.post(
            `${BACKEND_URL}api/v1/businesses/upload-images?tempId=${uploadTempId}&type=logo`,
            logoFormData,
            { headers: { "Content-Type": "multipart/form-data" } },
          );
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("[business-registration] logo upload failed:", e);
        }
      }

      // Upload business images. Skipped while uploads are disabled
      // (see comment above). uploadedImageUrls stays [] and the
      // payload further down sends an empty images array.
      if (
        IMAGE_UPLOADS_ENABLED &&
        formData.imageFiles &&
        formData.imageFiles.length > 0
      ) {
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
        } catch (e) {
          // Non-fatal — log and submit the business without images.
          // eslint-disable-next-line no-console
          console.warn("[business-registration] image upload failed:", e);
        }
      }

      // Upload per-package images (Car Rental fleet / Bridal Wear outfits)
      // Keep original-index mapping so filtered packages use the right image array.
      const allRawPackages: any[] = formData.packages || [];
      const rawPkgImageFiles: File[][] = formData.packageImageFiles || [];
      const validPkgsWithIdx = allRawPackages
        .map((p: any, originalIdx: number) => ({ p, originalIdx }))
        .filter(({ p }) => p.name && p.price);

      let packagesWithImages: any[] = validPkgsWithIdx.map(({ p }) => ({ ...p }));

      // Per-package image uploads (Car Rental fleet / Bridal Wear
      // outfits). Same kill-switch — when off, selected files are
      // dropped and packages submit with their text fields only.
      if (
        IMAGE_UPLOADS_ENABLED &&
        rawPkgImageFiles.some((files) => files?.length > 0)
      ) {
        packagesWithImages = await Promise.all(
          validPkgsWithIdx.map(async ({ p, originalIdx }) => {
            const files: File[] = rawPkgImageFiles[originalIdx] ?? [];
            if (!files.length) return p;
            const fd = new FormData();
            files.slice(0, 10).forEach((f) => fd.append("images", f));
            try {
              const res = await axios.post(
                `${BACKEND_URL}api/v1/businesses/upload-images?tempId=${uploadTempId}`,
                fd,
                { headers: { "Content-Type": "multipart/form-data" } },
              );
              return { ...p, images: res.data?.data ?? [] };
            } catch {
              return p;
            }
          })
        );
      }

      const socialLinks = (formData.instagram || formData.facebook)
        ? {
            ...(formData.instagram ? { instagram: formData.instagram } : {}),
            ...(formData.facebook ? { facebook: formData.facebook } : {}),
          }
        : undefined;

      const formatedData = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        bookingEmail: formData.bookingEmail || undefined,
        website: formData.website || undefined,
        socialLinks,
        officeAddress: formData.officeAddress,
        officeGoogleLink: formData.officeGoogleLink,
        city: formData.city,
        subArea: formData.subArea,
        secondaryContactNumber: formData.secondaryContactNumber || undefined,
        vendorType: formData.businessType,
        name: formData.name,
        brandLogo: formData.profilePicture,
        roleIds: [2],
        subBusinessType: formData.subBusinessType,
        cityCovered: formData.cityCovered,
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
        // Bridal wear specific fields
        travelToClientHome: formData.travelToClientHome,
        sellMehndi: formData.sellMehndi,
        hasTeam: formData.hasTeam,
        provideDecorationItem: formData.provideDecorationItem,
        provideFoodTesting: formData.provideFoodTesting,
        provideWaiter: formData.provideWaiter,
        provideSoundSystem: formData.provideSoundSystem,
        provideSeatingArrangement: formData.provideSeatingArrangement,
        providePlate: formData.providePlate,
        instruction: formData.instruction || undefined,
        serviceProvided: formData.serviceProvided,
        minimumPrice: formData.minimumPrice || undefined,
        images:
          uploadedImageUrls.length > 0 ? uploadedImageUrls : formData.images,
        packages: packagesWithImages,
        carRentalPackages: (formData.carRentalPackages ?? [])
          .filter((pkg) => pkg.name?.trim() && pkg.totalPrice > 0)
          .map((pkg) => ({
            name: pkg.name,
            description: pkg.description || undefined,
            totalPrice: pkg.totalPrice,
            citiesCovered: pkg.citiesCovered,
            cars: pkg.cars
              .filter((c) => c.carIndex >= 0)
              .map((c) => ({
                carName: formData.packages[c.carIndex]?.name ?? '',
                quantity: c.quantity,
              })),
          })),
        ...(uploadTempId ? { tempId: uploadTempId } : {}),
        // Vendor T&C acceptance — recorded on the user row by the backend
        // signup controller. Reference: migration
        // 20260507110000-user-terms-acceptance.
        termsVersion: TERMS_VERSION,
        termsAcceptedAt: new Date().toISOString(),

        // ── VR-050 — vendor registration v2 fields. Every entry is conditional
        // (only included when the user actually filled it) so legacy v1
        // submissions stay byte-identical. The backend validates each one
        // and silently drops anything outside its whitelist.
        ...(formData.whatsappNumber ? { whatsappNumber: formData.whatsappNumber } : {}),
        ...(formData.languagesSpoken && formData.languagesSpoken.length > 0
          ? { languagesSpoken: formData.languagesSpoken }
          : {}),
        ...(formData.ownerName ? { ownerName: formData.ownerName } : {}),
        ...(formData.ownerBio ? { ownerBio: formData.ownerBio } : {}),
        ...(formData.yearsInBusiness !== "" && formData.yearsInBusiness != null
          ? { yearsInBusiness: Number(formData.yearsInBusiness) }
          : {}),
        ...(formData.weddingsCompleted !== "" && formData.weddingsCompleted != null
          ? { weddingsCompleted: Number(formData.weddingsCompleted) }
          : {}),
        ...(formData.ntnNumber ? { ntnNumber: formData.ntnNumber } : {}),
        ...(formData.typeSpecificDetails &&
        Object.keys(formData.typeSpecificDetails).length > 0
          ? { typeSpecificDetails: formData.typeSpecificDetails }
          : {}),
      };

      // Build the payload — use FormData so vendor profile image can be included
      const submitPayload = formatedData;
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

      const responseData = response.data;
      const vendorData = responseData.data;

      if (
        response.status === 201 &&
        vendorData.business
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
          packageImageFiles: [],
          profileImageFile: null,
          subBusinessType: [],
          cityCovered: [],
          expertise: [],
          packages: [{ id: undefined, name: "", price: 0, features: {} }],
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
          // VR-050 — clear the v2 fields so the next vendor starts clean
          whatsappNumber: "",
          languagesSpoken: [],
          ownerName: "",
          ownerBio: "",
          yearsInBusiness: "",
          weddingsCompleted: "",
          ntnNumber: "",
          typeSpecificDetails: {},
        });
        loadingToastId.dismiss();
        setSuccessMessage(response.data?.message || "");
        setOpenModal(true);
        setCurrentStep(0);

        // 01-VR-ENHANCE-V1-FE — drop the server-side draft now that the
        // business has been created. Non-blocking; failures are silent.
        if (formData?.email) {
          draftSync.clearDraft(formData.email).catch(() => null);
        }
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

  // Submit-vs-continue branch — final step is the last user-facing step
  // for each vendor type (see `maxUserSteps` above for the layout). The
  // total-step counter includes step 0 (business-type picker).
  const isFinalStep = currentStep === maxUserSteps;
  const totalSteps = maxUserSteps + 1;

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden lg:flex lg:flex-col bridal-surface relative">
      {/* Page-wide warm parchment + jaal background */}
      <div className="fixed inset-0 bg-bridal-hero -z-10" aria-hidden />
      <div
        aria-hidden
        className="fixed inset-0 bg-bridal-wash opacity-90 -z-10"
      />

      {/* ── Sticky bridal header ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-bridal-ivory/85 border-b border-bridal-beige/70">
        <div className="w-[92%] xl:w-[90%] max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-bridal-gold/15 border border-bridal-gold/40 flex items-center justify-center transition-colors group-hover:bg-bridal-gold/25">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-bridal-gold" />
            </div>
            <div className="min-w-0">
              <p className="font-display italic text-base sm:text-lg leading-tight text-bridal-charcoal">
                Wedding Wala
              </p>
              <p className="bridal-label text-[9px] sm:text-[10px] tracking-[0.2em]">
                Vendor Registration
              </p>
            </div>
          </Link>

          <Link
            href="/get-help"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 h-9 sm:h-10 rounded-[4px] border border-bridal-beige bg-bridal-cream font-bridal text-[12px] tracking-wide text-bridal-mauve hover:border-bridal-gold/60 hover:text-bridal-charcoal transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Need Help?</span>
          </Link>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="w-[92%] xl:w-[90%] max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-8 lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
        {/* On lg the row fills the viewport (flex-1 inside the fixed-height
            page) so there's no page scrollbar; both columns are h-full and
            their content is vertically centred, each scrolling internally.
            grid-rows minmax(0,1fr) lets the single row stretch to full height.
            On mobile this is a normal stacked grid. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start lg:flex-1 lg:min-h-0 lg:grid-rows-[minmax(0,1fr)]">
          {/* ── Left aside ──
              Full height of the pinned row (lg:h-full). Content sits at the
              top; if a vendor uses an unusually short window the rail scrolls
              internally behind a slim gold bar rather than overflowing the
              viewport or sliding under the header. */}
          <aside className="lg:col-span-4 order-2 lg:order-1 lg:h-full lg:min-h-0">
            <div className="lg:h-full lg:overflow-y-auto overflow-x-hidden bridal-scroll lg:pr-1">
              <div className="lg:min-h-full lg:flex lg:flex-col lg:justify-center space-y-5">
              {/* Progress card — compact */}
              <BridalCard className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="bridal-label">Your Progress</span>
                  <span className="font-display italic text-bridal-gold text-[18px] leading-none">
                    {getProgressPercentage()}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-bridal-beige overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-bridal-gold to-bridal-gold-dark transition-all duration-500"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 font-bridal text-[12.5px] text-bridal-text-soft">
                  <CheckCircle className="w-3.5 h-3.5 text-bridal-sage" />
                  <span>
                    Step{" "}
                    <span className="font-medium text-bridal-charcoal">
                      {currentStep + 1}
                    </span>{" "}
                    of {totalSteps}
                  </span>
                </div>
              </BridalCard>

              {/* Benefits — blush rose card, compact */}
              <BridalCard
                blush
                className="p-5 sm:p-6 border-bridal-rose/40"
              >
                <div className="text-center mb-3.5">
                  <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-bridal-cream border border-bridal-gold/40 flex items-center justify-center">
                    <Award className="w-5 h-5 text-bridal-gold" />
                  </div>
                  <h3 className="font-display italic text-[18px] text-bridal-charcoal leading-tight">
                    Join Pakistan&apos;s most{" "}
                    <span className="text-bridal-gold">trusted network</span>
                  </h3>
                  <p className="font-bridal text-[12.5px] text-bridal-text-soft mt-1.5 leading-snug">
                    Connect with couples planning the biggest day of their
                    lives.
                  </p>
                </div>

                <ul className="space-y-1.5">
                  {[
                    "Free, full-featured business profile",
                    "Direct, qualified customer leads",
                    "Booking calendar & package manager",
                    "24/7 vendor success support",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 font-bridal text-[12.5px] text-bridal-text"
                    >
                      <span className="mt-0.5 inline-flex w-4 h-4 flex-shrink-0 rounded-full bg-bridal-gold/15 border border-bridal-gold/40 items-center justify-center">
                        <CheckCircle className="w-2.5 h-2.5 text-bridal-gold" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </BridalCard>

              {/* Stats card — compact */}
              <BridalCard className="p-5 sm:p-6">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Star className="w-3.5 h-3.5 text-bridal-gold" />
                  <span className="bridal-label">Platform Pulse</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-md border border-bridal-beige bg-bridal-ivory/50 p-2.5 text-center">
                    <div className="font-display italic text-[22px] leading-none text-bridal-charcoal">
                      {stats ? stats.vendors : 0}
                      <span className="text-bridal-gold">+</span>
                    </div>
                    <div className="bridal-label mt-0.5">Active Vendors</div>
                  </div>
                  <div className="rounded-md border border-bridal-beige bg-bridal-blush/40 p-2.5 text-center">
                    <div className="font-display italic text-[22px] leading-none text-bridal-charcoal">
                      {stats ? stats.couplesServed : 0}
                      <span className="text-bridal-gold">+</span>
                    </div>
                    <div className="bridal-label mt-0.5">Happy Couples</div>
                  </div>
                </div>
              </BridalCard>
              </div>
            </div>
          </aside>

          {/* ── Right form panel ──
              col-span-8 (vs aside's col-span-4) gives the form ~67% of the
              width. Fills the full height of the pinned row; the step body
              scrolls internally and the nav footer stays pinned at the
              bottom of the card. */}
          <section className="lg:col-span-8 order-1 lg:order-2 lg:h-full lg:min-h-0">
            <BridalCard
              elevated
              className="p-0 bg-bridal-cream flex flex-col overflow-hidden lg:h-full"
            >
              {/* Scrollable step body — slim gold scrollbar (bridal-scroll).
                  The nav buttons live in a pinned footer below, so they stay
                  visible while this area scrolls. overflow-x-hidden keeps the
                  cards' hover-scale from spawning a horizontal bar. */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bridal-scroll p-5 sm:p-7 lg:p-9">
              {/* min-h-full + justify-center: centres a short step vertically,
                  while a tall step (e.g. the business-type grid) just grows
                  and scrolls from the top — no clipping. */}
              <div className="lg:min-h-full lg:flex lg:flex-col lg:justify-center">
              {/* 01-VR-ENHANCE-V1-FE — server-side resume prompt.
                  Shown only when an email is typed, the form is still empty
                  enough to safely overwrite, and the server has a saved draft. */}
              {formData?.email && currentStep <= 1 && !formData?.name && (
                <DraftResumePrompt
                  email={formData.email}
                  onResume={(d) => {
                    setFormData((prev) => ({ ...prev, ...(d.payload || {}) }));
                    if (typeof d.currentStep === "number") setCurrentStep(d.currentStep);
                    if (d.vendorType) setBusinessType(d.vendorType);
                    toast({
                      title: "Progress restored",
                      description: `Picked up where you left off (step ${(d.currentStep || 0) + 1}).`,
                    });
                  }}
                />
              )}

              {/* Step content */}
              <div className="min-h-[440px] sm:min-h-[500px]">
                {currentStep === 0 || currentStep < 1 ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="mx-auto w-11 h-11 rounded-full bg-bridal-gold/15 border border-bridal-gold/40 flex items-center justify-center mb-2.5">
                        <Shield className="w-5 h-5 text-bridal-gold" />
                      </div>
                      <BridalCrown className="mb-2">
                        Step 1 — Your Craft
                      </BridalCrown>
                      <BridalTitle size="h3" className="mb-1.5">
                        Choose your{" "}
                        <span className="text-bridal-gold">business type</span>
                      </BridalTitle>
                      <p className="font-bridal text-bridal-text-soft text-[12.5px] leading-snug max-w-sm mx-auto">
                        Select the category that best describes your wedding
                        services. We&apos;ll tailor the rest of the form to
                        your craft.
                      </p>
                    </div>

                    <FloralDivider width={180} />

                    <BusinessTypeStep
                      setBusinessType={setBusinessType}
                      businessType={businessType}
                      errors={errors}
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4 pb-5 border-b border-bridal-beige/70">
                      <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-bridal-gold flex items-center justify-center shadow-[0_8px_18px_-10px_rgba(176,125,84,0.55)]">
                        <span className="font-display italic text-lg sm:text-xl text-bridal-charcoal leading-none">
                          {currentStep}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="bridal-label">
                          {businessType} Registration
                        </span>
                        <h2 className="font-display italic text-[22px] sm:text-[26px] text-bridal-charcoal leading-tight mt-0.5">
                          Tell us more about{" "}
                          <span className="text-bridal-gold">your business</span>
                        </h2>
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
                    ) : carRental ? (
                      <CarRentalSteps
                        setFile={setFile}
                        file={file}
                        error={errors}
                        setErrors={setErrors}
                        currentStep={currentStep}
                      />
                    ) : bridalWear ? (
                      <BridalWearSteps
                        setFile={setFile}
                        file={file}
                        error={errors}
                        setErrors={setErrors}
                        currentStep={currentStep}
                      />
                    ) : weddingStationery ? (
                      <WeddingStationerySteps
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
                    ) : isGenericNewCategory ? (
                      // BK-100.55 Layer 2 — 14 new Pakistani categories
                      // share a single generic flow. Per-category
                      // specialty polish ships in Layer 3.
                      <GenericSteps
                        setFile={setFile}
                        file={file}
                        error={errors}
                        setErrors={setErrors}
                        currentStep={currentStep}
                      />
                    ) : (
                      <div />
                    )}
                  </div>
                )}
              </div>

              {/*
                T&C acceptance — visible only on the final step. Required
                for PayFast underwriting + chargeback defense. The submit
                button in the pinned footer below is disabled until this is
                ticked. Reference:
                docs/payfast/01-payfast-integration-overview.md §2 item 6,
                docs/seo/00-master-seo-playbook.md §28 item 6.6.
              */}
              {isFinalStep && (
                <label className="mt-6 flex items-start gap-2.5 cursor-pointer max-w-2xl">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                    className="mt-1 accent-bridal-gold"
                    aria-describedby="vendor-terms-text"
                  />
                  <span
                    id="vendor-terms-text"
                    className="font-bridal text-[12.5px] text-bridal-text-soft leading-relaxed"
                  >
                    I confirm that I am authorised to list this business on Wedding Wala, and I have read and agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-bridal-gold hover:underline"
                    >
                      Vendor Terms of Service
                    </Link>
                    ,{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-bridal-gold hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    ,{" "}
                    <Link
                      href="/refund-policy"
                      target="_blank"
                      className="text-bridal-gold hover:underline"
                    >
                      Refund Policy
                    </Link>
                    , and{" "}
                    <Link
                      href="/acceptable-use"
                      target="_blank"
                      className="text-bridal-gold hover:underline"
                    >
                      Acceptable Use Policy
                    </Link>
                    .
                  </span>
                </label>
              )}
              </div>{/* end centred content */}
              </div>{/* end scrollable step body */}

              {/* Pinned footer — nav buttons + sign-in link stay visible
                  while the body scrolls. flex-shrink-0 keeps it at the card's
                  bottom edge inside the full-height column. */}
              <div className="flex-shrink-0 border-t border-bridal-beige/70 bg-bridal-cream px-5 sm:px-7 lg:px-9 py-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <BridalButton
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </BridalButton>

                <div className="flex items-center sm:gap-3">
                  <span className="hidden sm:inline-block bridal-label text-[10px] tracking-[0.18em]">
                    {isFinalStep ? "One more click" : "Keep going"}
                  </span>
                  <BridalButton
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={isFinalStep ? handleSubmit : handleNext}
                    disabled={isFinalStep && !termsAccepted}
                  >
                    {isFinalStep ? (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Submit Registration
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </BridalButton>
                </div>
                </div>

                {/* Sign-in link — moved into the footer so it sits with the
                    buttons instead of dangling below the full-height card. */}
                <p className="text-center font-bridal text-[12px] text-bridal-text-soft">
                  Already have a vendor account?{" "}
                  <Link
                    href="/login"
                    className="text-bridal-gold hover:text-bridal-gold-dark font-medium underline-offset-4 hover:underline transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </BridalCard>
          </section>
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

"use client";

import { HelpRow } from "@/components/ui/field-help";
import { useUser } from "@/context/UserContext";
import { useCallback, useEffect, useRef, useState } from "react";
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
  true;

/* WP36 / VENDORTYPES-005: the Car Rental flow has no "business type" step, so the server refused the registration
   ("At least one business type is required") after nine steps. The business types of a car rental are its fleet's
   vehicle types; anything the vendor chose explicitly is kept. */
function carRentalSubTypes(businessType: unknown, current: unknown, packages: any[] | undefined): string[] {
  const chosen = Array.isArray(current) ? current.filter(Boolean) : current ? [String(current)] : [];
  if (chosen.length > 0 || businessType !== "Car rental") return chosen as string[];
  const out: string[] = [];
  for (const p of packages || []) {
    const vt = p?.features?.vehicleType;
    for (const v of Array.isArray(vt) ? vt : vt ? [vt] : []) {
      const s = String(v).trim();
      if (s && !out.includes(s)) out.push(s);
    }
  }
  return out;
}

/* Survives a remount of this component so a successful registration can never
   present itself as a failure. Session-scoped, so it dies with the tab. */
const REG_SUCCESS_KEY = "ww_vendor_reg_success";
import { TERMS_VERSION } from "@/lib/seo";
import { vanueValidations, venueMenuErrors } from "./VendorStepForms/newVendorRegisterationForm/venueSteps/vanueComponents/vanueValidations";
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
// Issue #10 — shared Pakistani phone validation (accepts 10 + 11 digit
// forms so vendors can paste their natural "0301..." or "+92 301..."
// numbers without being told they're wrong).
import {
  isValidPakistaniPhone,
  PHONE_VALIDATION_MESSAGE,
} from "@/lib/utils/pakistani-phone";
// 02-VR-RESILIENCE-V1 — local (device) draft layer + autosave indicator
import {
  queueLocalDraftSave,
  flushPendingLocalDraft,
  subscribeLocalDraft,
  clearLocalDraft,
  readLocalDraft,
  type LocalDraft,
} from "@/lib/draftStorage/localDraftStore";
import { clearAllBlobs, sweepExpiredBlobs } from "@/lib/draftStorage/imageBlobStore";
import {
  useImageBlobSync,
  restoreImageBlobsFromRefs,
  type ImageRefs,
} from "@/lib/draftStorage/useImageBlobSync";
import { AutoSaveIndicator } from "@/components/VendorStepForms/AutoSaveIndicator";
import { LocalDraftResumePrompt } from "@/components/VendorStepForms/LocalDraftResumePrompt";

// Bridal primitives (Phase 0 — design revamp)
import { BridalButton } from "@/components/bridal/bridal-button";
import {
  BridalCard,
  BridalCrown,
  BridalTitle,
} from "@/components/bridal/bridal-card";
import { BridalBadge } from "@/components/bridal/bridal-badge";
import { FloralDivider } from "@/components/bridal/floral-divider";
import { cancellationKey, partialRefundErrors, validatePartialRefund } from "@/lib/cancellation-policy";

export function BusinessRegistrationForm() {
  const { user: sessionUser, logout: logoutCustomer } = useUser();
  const signedInCustomer = !!sessionUser && (sessionUser as { isVendor?: boolean }).isVendor === false;
  const customerEmail = (sessionUser as { email?: string } | null)?.email || "";
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
  // Issue #6 — track which businessType the parent-owned `file` (brand
  // logo) was uploaded under. When the vendor switches type (e.g.
  // started a Car Rental registration and then went back to choose
  // Bridal Wear, or hit "Resume" on a stale draft for a different
  // category), the previously-uploaded logo would otherwise stay
  // sitting in `file` state and display as the new category's brand
  // logo. Use this ref + the effect below to clear it the moment the
  // category changes to a different one.
  const fileBusinessTypeRef = useRef<string | null>(null);

  /* Success state is seeded from sessionStorage, not just useState.

     The bug: a vendor completed all 8 steps, the server returned 201 and created
     the account (verified live — user 3371 / business 3361), and the screen threw
     them back to a BLANK STEP 1 at "0% progress" with no modal, no toast and no
     redirect. It reads exactly like a failure, so the natural response is to fill
     all 8 steps again — which then fails on "email already in use", and by then
     the draft has been deleted so there is nothing to resume.

     Why it happened: `setOpenModal(true)` and `setCurrentStep(0)` are adjacent,
     and the step reset demonstrably DID apply, so the modal state was set too.
     But this route logs React #418 (hydration text mismatch) and #423 ("error
     during concurrent rendering, recovered by synchronously re-rendering the
     entire root"). A root re-render remounts this component, and every piece of
     useState goes back to its initial value — openModal to false AND currentStep
     to 0. That is precisely the two symptoms observed, together.

     Rather than chase the hydration mismatch alone, make success survive a
     remount: persist it, and restore it on mount. Even if React tears the tree
     down, the vendor still gets told they succeeded.

     The restore runs in an EFFECT, not in the useState initialiser: seeding from
     sessionStorage during the first render would make the client disagree with
     the server-rendered HTML and introduce exactly the kind of hydration
     mismatch this is working around. */
  const [openModal, setOpenModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(REG_SUCCESS_KEY);
      if (saved) { setSuccessMessage(saved); setOpenModal(true); }
    } catch {}
  }, []);
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

  // 02-VR-RESILIENCE-V1 — local (device) draft layer.
  //
  // Covers the dangerous window before useDraftSync engages (i.e. before a
  // valid email has been typed). Saves debounced 500 ms to localStorage on
  // every change to formData / currentStep / businessType. The server layer
  // keeps writing in parallel once email is valid; both layers are wiped on
  // successful submit. Disabled after submit for the same reason as the
  // server layer.
  const [localLastSavedAt, setLocalLastSavedAt] = useState<Date | null>(null);
  const [localSaving, setLocalSaving] = useState(false);
  // Latest known blob id-map for the three image fields. Updated by
  // useImageBlobSync as files come and go. Kept in a ref instead of state
  // so the localStorage save effect doesn't loop on every blob assignment.
  const imageRefsRef = useRef<ImageRefs>({});

  // Refs-of-truth so the stable image-refs callback can save with current
  // state without re-creating on every keystroke (and so it can fire AFTER
  // useImageBlobSync's async pass completes, when refs are fresh but the
  // outer field-change effect has already run with stale refs).
  const formDataRef = useRef(formData);
  const currentStepRef = useRef(currentStep);
  const businessTypeRef = useRef(businessType);
  const openModalRef = useRef(openModal);
  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  useEffect(() => { businessTypeRef.current = businessType; }, [businessType]);
  useEffect(() => { openModalRef.current = openModal; }, [openModal]);

  // Issue #6 — clear the brand-logo file whenever the user switches
  // vendor category. This catches the "Resumed a Car Rental draft on
  // a Bridal Wear session" leak (the brand logo would otherwise stay
  // in `file` state and show up under the new category) AND the
  // simpler "went back, picked a different category" case. Only fires
  // when the type ACTUALLY changes to something different from when
  // the file was set — leaving a file under the same category alone.
  useEffect(() => {
    const current = businessType ? String(businessType) : null;
    if (!current) return;
    const owner = fileBusinessTypeRef.current;
    if (owner != null && owner !== current && file) {
      setFile(null);
      // Drop the in-form preview URL too so the upload tile reverts
      // to its empty state.
      setFormData((prev) => ({ ...prev, profilePicture: "", profileImageFile: null }));
    }
    fileBusinessTypeRef.current = current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessType]);

  // Keep formData.businessType synchronized with businessType from formContext
  // so that toggles or partial field updates never clear businessType and blank out the form
  useEffect(() => {
    if (businessType && formData.businessType !== businessType) {
      setFormData((prev) => ({ ...prev, businessType: String(businessType) }));
    }
  }, [businessType, formData.businessType, setFormData]);

  // Persist image binaries to IndexedDB so a refresh doesn't wipe a 10 MB
  // shop photo. Stash the id-map in a ref AND immediately schedule a draft
  // save with the fresh refs — otherwise, picking an image then refreshing
  // before any other interaction loses the blob-id mapping.
  const onImageRefsChange = useCallback((refs: ImageRefs) => {
    imageRefsRef.current = refs;
    if (openModalRef.current) return;
    queueLocalDraftSave({
      formData: formDataRef.current,
      currentStep: currentStepRef.current,
      businessType: businessTypeRef.current ? String(businessTypeRef.current) : "",
      imageRefs: refs,
    });
  }, []);

  useImageBlobSync({
    profileImageFile: formData.profileImageFile,
    imageFiles: formData.imageFiles,
    packageImageFiles: formData.packageImageFiles,
    enabled: !openModal,
    onChangeRefs: onImageRefsChange,
  });

  useEffect(() => {
    if (openModal) return; // already submitted; don't write back over success state
    setLocalSaving(true);
    queueLocalDraftSave({
      formData,
      currentStep,
      businessType: businessType ? String(businessType) : "",
      imageRefs: imageRefsRef.current,
    });
    // queueLocalDraftSave is debounced; clear the "saving" flag once the
    // debounce window passes. Slight over-estimate is fine.
    const t = setTimeout(() => setLocalSaving(false), 700);
    return () => clearTimeout(t);
  }, [formData, currentStep, businessType, openModal]);

  // Subscribe to commits so the indicator reflects the actual write time
  // (not just the queue time).
  useEffect(() => {
    const off = subscribeLocalDraft((d) => {
      if (d) setLocalLastSavedAt(new Date(d.updatedAt));
    });
    return off;
  }, []);

  // Flush any pending debounced write when the tab is closing. Best-effort —
  // browsers limit work during unload — but the queued snapshot is already
  // in memory so we just need to synchronously hit setItem.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const flush = () => flushPendingLocalDraft();
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    // Tab backgrounded on mobile → may be reaped without firing unload.
    const onVis = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Drop stale IndexedDB blobs from prior abandoned registrations on first
  // mount so the user's quota doesn't bloat.
  useEffect(() => {
    sweepExpiredBlobs().catch(() => null);
  }, []);

  // Prevent rogue browser focus-scroll on the outer container
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.querySelector<HTMLElement>(".bridal-surface");
    if (!root) return;
    const onScroll = () => {
      if (root.scrollTop !== 0) root.scrollTop = 0;
      if (root.scrollLeft !== 0) root.scrollLeft = 0;
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, []);

  // The indicator shows whichever layer wrote most recently.
  const combinedLastSavedAt: Date | null = (() => {
    const a = draftSync.lastSavedAt;
    const b = localLastSavedAt;
    if (a && b) return a.getTime() > b.getTime() ? a : b;
    return a || b;
  })();
  const combinedSaving = draftSync.saving || localSaving;

  // The venue wizard gained a "Menus" step at 6 (Images moved to 7, Preview to 8). A venue draft saved BEFORE that has no
  // `menus` field and numbers its steps the old way, so a vendor who stopped on Images (6) or Preview (7) would resume one step
  // early or on the wrong screen. Shift those by one; earlier steps are unchanged.
  const stepForResume = (d: { formData?: unknown; currentStep?: number; businessType?: string }): number | undefined => {
    if (typeof d.currentStep !== "number") return undefined;
    const f = (d.formData ?? {}) as { businessType?: string; menus?: unknown };
    const isVenueDraft = (d.businessType || f.businessType) === "Wedding venue";
    const savedBeforeMenus = !("menus" in f);
    return isVenueDraft && savedBeforeMenus && d.currentStep >= 6 ? d.currentStep + 1 : d.currentStep;
  };

  // Hydrate state from a localDraft when the user opts in via the resume prompt.
  // Restores formData / step / business type AND any image binaries that were
  // mirrored to IndexedDB (brand logo, gallery, per-package photos).
  const hydrateFromLocalDraft = async (d: LocalDraft) => {
    if (d.formData && typeof d.formData === "object") {
      setFormData((prev) => ({ ...prev, ...(d.formData as Partial<FormType>) }));
    }
    {
      const resumeAt = stepForResume(d);
      if (typeof resumeAt === "number") setCurrentStep(resumeAt);
    }
    if (d.businessType) setBusinessType(d.businessType);

    // Pull image binaries back from IDB and slot them into the three image
    // arrays. Done after the formData merge so it overwrites any (empty)
    // image arrays the spread above re-introduced.
    try {
      const restored = await restoreImageBlobsFromRefs(d.imageRefs);
      setFormData((prev) => ({
        ...prev,
        profileImageFile: restored.profileImageFile,
        imageFiles: restored.imageFiles,
        packageImageFiles: restored.packageImageFiles,
      }));
      // The brand-logo preview reads from this parent-owned `file` state,
      // NOT from formData.profileImageFile — so without this line the
      // photo restores into form state but never appears in the upload
      // tile after refresh + Resume.
      if (restored.profileImageFile) setFile(restored.profileImageFile);
    } catch {/* IDB failure is non-blocking */}

    // Password is intentionally NOT persisted (localStorage is plaintext
    // and would leak if the device is shared/stolen). Vendor must re-enter
    // on resume — navigate to Step 1 so they enter it upfront rather than
    // being blocked on final submission.
    const needsPassword = (d.currentStep ?? 0) >= 1 && !d.formData?.password;
    if (needsPassword) {
      setCurrentStep(1);
      toast({
        title: "Progress restored",
        description:
          "Welcome back! Your registration details have been restored. Please set your password on this step to continue.",
      });
    } else {
      const resumeAt = stepForResume(d);
      if (typeof resumeAt === "number") setCurrentStep(resumeAt);
      toast({
        title: "Progress restored",
        description: `Picked up where you left off${
          typeof resumeAt === "number" ? ` (step ${resumeAt + 1})` : ""
        }.`,
      });
    }
  };

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
  // A venue has one more: Menus (after Packages): 1 Personal 2 Contact 3 Business 4 Specialty 5 Packages 6 Menus 7 Images 8 Preview.
  const isVenueFlow = venue || formData.businessType === "Wedding venue";
  const maxUserSteps =
    bridalWear || weddingStationery
      ? 9
      : carRental || isVenueFlow
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
      if (!formData.businessType && !businessType) {
        currentErrors.businessType = "Select Business Type";
      }
      setErrors(currentErrors);
      return currentErrors;
    }

    // Step 1: Personal Details is universal across all categories
    if (currentStep === 1) {
      if (!formData.fullName || !formData.fullName.trim()) {
        currentErrors.fullName = "Full Name is required";
      }
      if (!formData.email || !formData.email.trim()) {
        currentErrors.email = "Email is required";
      } else if (!validateEmail(formData.email.trim())) {
        currentErrors.email = "Invalid email address";
      }
      if (!formData.phoneNumber) {
        currentErrors.phoneNumber = "Phone number is required";
      } else if (!isValidPakistaniPhone(formData.phoneNumber) && !/^3\d{9}$/.test(String(formData.phoneNumber))) {
        currentErrors.phoneNumber = PHONE_VALIDATION_MESSAGE;
      }
      if (!formData.password) {
        currentErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        currentErrors.password = "Password must be at least 8 characters";
      }
      if (!formData.re_enterPassword) {
        currentErrors.re_enterPassword = "Re-enter password is required";
      } else if (formData.password !== formData.re_enterPassword) {
        currentErrors.re_enterPassword = "Passwords do not match";
      }
      setErrors(currentErrors);
      return currentErrors;
    }

    // Step 2: Contact Details is universal across all categories
    if (currentStep === 2) {
      if (!formData.name || !formData.name.trim()) {
        currentErrors.name = "Brand Name is required";
      }
      if (formData.secondaryContactNumber) {
        if (!isValidPakistaniPhone(formData.secondaryContactNumber) && !/^3\d{9}$/.test(String(formData.secondaryContactNumber))) {
          currentErrors.secondaryContactNumber = PHONE_VALIDATION_MESSAGE;
        } else if (String(formData.secondaryContactNumber) === String(formData.phoneNumber)) {
          currentErrors.secondaryContactNumber = "Secondary number must be different from your primary phone number";
        }
      }
      if (!formData.city || !formData.city.trim()) {
        currentErrors.city = "City is required";
      } else if (!/^[a-zA-Z\s\-]+$/.test(formData.city.trim())) {
        currentErrors.city = "City must contain letters only";
      }
      if (!formData.subArea || !formData.subArea.trim()) {
        currentErrors.subArea = "Sub Area is required";
      } else if (!/^[a-zA-Z0-9\s\-]+$/.test(formData.subArea.trim())) {
        currentErrors.subArea = "Sub Area must contain letters, numbers, or hyphens only";
      }
      if (!formData.officeAddress || !formData.officeAddress.trim()) {
        currentErrors.officeAddress = "Office Address is required";
      } else if (formData.officeAddress.includes("@") || /^https?:\/\//i.test(formData.officeAddress)) {
        currentErrors.officeAddress = "Please enter a valid office address";
      } else if (formData.officeAddress.trim().length < 5) {
        currentErrors.officeAddress = "Office Address is too short";
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
      setErrors(currentErrors);
      return currentErrors;
    }

    // Step 3 and onwards: Category-specific validations
    if (venue || formData.businessType === "Wedding venue") {
      vanueValidations({ currentStep, formData, currentErrors });
      setErrors(currentErrors);
      return currentErrors;
    }
    if (carRental || formData.businessType === "Car rental") {
      CarRentalValidations({ currentStep, formData, currentErrors });
      setErrors(currentErrors);
      return currentErrors;
    }
    if (bridalWear || formData.businessType === "Bridal wearing") {
      BridalWearValidations({ currentStep, formData, currentErrors });
      setErrors(currentErrors);
      return currentErrors;
    }
    if (weddingStationery || formData.businessType === "Wedding Invitations and Stationery") {
      WeddingStationeryValidations({ currentStep, formData, currentErrors });
      setErrors(currentErrors);
      return currentErrors;
    }
    if (photographer || makeupArtist || hennaArtist || decorator || catering || isGenericNewCategory) {
      if (currentStep === 3) {
        if (!formData.description)
          currentErrors.description = "Business description is required";
        if (!Array.isArray(formData.subBusinessType) || formData.subBusinessType.length === 0)
          currentErrors.subBusinessType = "Business type is required";
        if (!formData.staff || formData.staff.length < 1)
          currentErrors.staff = "Staff is required";
        if (!formData.cancelationPolicy)
          currentErrors.cancelationPolicy = "Cancellation policy is required";
        else Object.assign(currentErrors, partialRefundErrors(formData)); // WP20
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
      const packagesStep = 5;
      const imagesStep = 6;
      if (currentStep === packagesStep) {
        const isMenuType =
          venue ||
          formData.businessType === "Wedding venue" ||
          catering ||
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
        if (IMAGE_UPLOADS_ENABLED && imageCount === 0) {
          currentErrors.images = "Please upload at least one image";
        } else if (imageCount > 20) {
          currentErrors.images = `Maximum 20 images allowed. You have uploaded ${imageCount}. Please remove ${imageCount - 20} image(s).`;
        }
      }
      setErrors(currentErrors);
      return currentErrors;
    }

    setErrors(currentErrors);
    return currentErrors;
  };

  const handleNext = () => {
    const validationErrors = handleValidations();
    console.log("Validation Errors:", validationErrors);

    if (validationErrors && Object.keys(validationErrors).length > 0) {
      const errorList = Object.values(validationErrors);
      toast({
        title: "Please complete required fields",
        description: errorList[0] || "Some required fields are missing or invalid.",
        variant: "destructive",
      });

      // Scroll to the first error element if present in DOM
      const firstErrorField = Object.keys(validationErrors)[0];
      if (typeof window !== "undefined") {
        setTimeout(() => {
          const el = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.focus();
          }
        }, 80);
      }
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  // Issue #4 — on step change, scroll the form back to its top edge.
  // Without this the vendor lands mid-form (whichever offset they'd
  // scrolled the previous step to) and reads the previous question's
  // tail before realising they've advanced. We scroll BOTH the inner
  // step-body container (the `.bridal-scroll` overflow-y-auto panel,
  // queried by class so we don't have to thread a ref through the JSX)
  // AND the window in case mobile is using the page scrollbar.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.querySelector<HTMLElement>(".bridal-surface");
    if (root) root.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    const panels = document.querySelectorAll<HTMLElement>(".bridal-scroll");
    panels.forEach((p) => p.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }));
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [currentStep]);

  const validateAllSteps = (): { valid: boolean; stepToRedirect?: number; errors: Record<string, string> } => {
    // 1. Step 1: Personal Details
    const s1: Record<string, string> = {};
    if (!formData.fullName || !formData.fullName.trim()) s1.fullName = "Full Name is required";
    if (!formData.email || !formData.email.trim()) {
      s1.email = "Email is required";
    } else if (!validateEmail(formData.email.trim())) {
      s1.email = "Invalid email address";
    }
    if (!formData.phoneNumber) {
      s1.phoneNumber = "Phone number is required";
    } else if (!isValidPakistaniPhone(formData.phoneNumber) && !/^3\d{9}$/.test(String(formData.phoneNumber))) {
      s1.phoneNumber = PHONE_VALIDATION_MESSAGE;
    }
    if (!formData.password) {
      s1.password = "Password is required";
    } else if (formData.password.length < 8) {
      s1.password = "Password must be at least 8 characters";
    }
    if (!formData.re_enterPassword) {
      s1.re_enterPassword = "Re-enter password is required";
    } else if (formData.password !== formData.re_enterPassword) {
      s1.re_enterPassword = "Passwords do not match";
    }
    if (Object.keys(s1).length > 0) {
      return { valid: false, stepToRedirect: 1, errors: s1 };
    }

    // 2. Step 2: Contact Details
    const s2: Record<string, string> = {};
    if (!formData.name || !formData.name.trim()) s2.name = "Brand Name is required";
    if (!formData.city || !formData.city.trim()) s2.city = "City is required";
    if (!formData.subArea || !formData.subArea.trim()) s2.subArea = "Sub Area is required";
    if (!formData.officeAddress || !formData.officeAddress.trim()) s2.officeAddress = "Office Address is required";
    if (Object.keys(s2).length > 0) {
      return { valid: false, stepToRedirect: 2, errors: s2 };
    }

    // 3. Step 3: Business Details
    const s3: Record<string, string> = {};
    if (venue || businessType === "Wedding venue" || formData.businessType === "Wedding venue") {
      vanueValidations({ currentStep: 3, formData, currentErrors: s3 });
    } else if (carRental || businessType === "Car rental" || formData.businessType === "Car rental") {
      CarRentalValidations({ currentStep: 3, formData, currentErrors: s3 });
    } else if (bridalWear || businessType === "Bridal wearing" || formData.businessType === "Bridal wearing") {
      BridalWearValidations({ currentStep: 3, formData, currentErrors: s3 });
    } else if (weddingStationery || businessType === "Wedding Invitations and Stationery" || formData.businessType === "Wedding Invitations and Stationery") {
      WeddingStationeryValidations({ currentStep: 3, formData, currentErrors: s3 });
    } else {
      if (!formData.description) s3.description = "Business description is required";
      if (!Array.isArray(formData.subBusinessType) || formData.subBusinessType.length === 0) s3.subBusinessType = "Business type is required";
      if (!formData.staff || formData.staff.length < 1) s3.staff = "Staff is required";
      if (!formData.cancelationPolicy) s3.cancelationPolicy = "Cancellation policy is required";
      if (!formData.downPaymentType) s3.downPaymentType = "Down payment type is required";
      if (!formData.downPayment || Number(formData.downPayment) <= 0) s3.downPayment = "Down payment is required";
    }
    if (Object.keys(s3).length > 0) {
      return { valid: false, stepToRedirect: 3, errors: s3 };
    }

    // 3b. A venue's Menus (step 6): at least one complete menu, or an explicit "hall only"
    if (venue || businessType === "Wedding venue" || formData.businessType === "Wedding venue") {
      const menuErrors = venueMenuErrors(formData);
      if (Object.keys(menuErrors).length > 0) {
        return { valid: false, stepToRedirect: 6, errors: menuErrors };
      }
    }

    // 4. Packages Validation (unless specialized flow)
    const isSpecializedFlow = carRental || businessType === "Car rental";
    if (!isSpecializedFlow) {
      const validPackages = formData.packages?.filter((p: any) => p.name && p.price) ?? [];
      const pkgStep = bridalWear || weddingStationery ? 7 : 5;
      if (validPackages.length === 0) {
        return {
          valid: false,
          stepToRedirect: pkgStep,
          errors: { packages: "At least one package/menu with a name and price is required" },
        };
      }
    }

    return { valid: true, errors: {} };
  };

  const handleSubmit = async () => {
    // Comprehensive full validation across all steps before submitting
    const comprehensiveCheck = validateAllSteps();
    if (!comprehensiveCheck.valid) {
      setErrors(comprehensiveCheck.errors);
      if (typeof comprehensiveCheck.stepToRedirect === "number") {
        setCurrentStep(comprehensiveCheck.stepToRedirect);
      }
      toast({
        title: "Please complete required fields",
        description: Object.values(comprehensiveCheck.errors)[0] || "Some required fields are missing or incomplete.",
        variant: "destructive",
      });
      return;
    }

    // WP20: a fixed refund is bounded by the highest price listed, and the packages are only known now.
    // Send the vendor back to the Cancellation Policy step (index 3 in every flow) instead of failing at the server.
    const partialErrs = partialRefundErrors(formData);
    if (Object.keys(partialErrs).length > 0) {
      setErrors(partialErrs);
      setCurrentStep(3);
      toast({ title: "Check the refund", description: Object.values(partialErrs).join(", ") });
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
      // WP36 / VENDORTYPES-001: the logo, the gallery and the package photos used to be POSTed to
      // /businesses/upload-images BEFORE the account existed. That route needs a login (rightly), so every upload
      // answered 401, the catch below swallowed it, and every new listing went live without a photo. The files now
      // travel WITH the registration request (multipart) and the server stores them once the business exists.
      const uploadTempId = crypto.randomUUID();
      const allRawPackages: any[] = formData.packages || [];
      const rawPkgImageFiles: File[][] = formData.packageImageFiles || [];
      const validPkgsWithIdx = allRawPackages
        .map((p: any, originalIdx: number) => ({ p, originalIdx }))
        .filter(({ p }) => p.name && p.price);
      const packagesWithImages: any[] = validPkgsWithIdx.map(({ p }) => ({ ...p }));
      // field name -> files; packageImages_<n> is the position in the SUBMITTED packages list
      const registrationFiles: Array<[string, File]> = [];
      if (IMAGE_UPLOADS_ENABLED) {
        if (file) registrationFiles.push(["brandLogoFile", file]);
        (formData.imageFiles || []).slice(0, 20).forEach((f: File) => registrationFiles.push(["galleryImages", f]));
        validPkgsWithIdx.forEach(({ originalIdx }, k) => {
          (rawPkgImageFiles[originalIdx] ?? []).slice(0, 10).forEach((f: File) => registrationFiles.push([`packageImages_${k}`, f]));
        });
      }

      const socialLinks = (formData.instagram || formData.facebook)
        ? {
            ...(formData.instagram ? { instagram: formData.instagram } : {}),
            ...(formData.facebook ? { facebook: formData.facebook } : {}),
          }
        : undefined;

      // The venue step now stores catering as a list (internal / external /
      // both). Older saved drafts still hold the single string, and "both" was
      // never storable before, so normalise all three shapes here.
      const cateringChoices: string[] = Array.isArray(formData.catering)
        ? formData.catering
        : formData.catering === "both"
          ? ["internal", "external"]
          : formData.catering
            ? [formData.catering]
            : [];

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
        vendorType: formData.businessType || (businessType as string),
        name: formData.name,
        brandLogo: formData.profilePicture,
        roleIds: [2],
        subBusinessType: carRentalSubTypes(
          formData.businessType || (businessType as string),
          formData.subBusinessType,
          formData.packages
        ),
        cityCovered: formData.cityCovered,
        expertise: formData.expertise,
        amenities: formData.amenities,
        staff: formData.staff,
        // WP36 / VENDORTYPES-003: never invent a capacity (the wizard sent 1, which refused every cart above one guest)
        maxCapacity: formData.maxCapacity ? Number(formData.maxCapacity) : undefined,
        // WP36 / VENDORTYPES-006: the venue's minimum guests was collected and never sent
        minCapacity: formData.minCapacity ? Number(formData.minCapacity) : undefined,
        description: formData.description,
        additionalInfo: formData.additionalInfo || undefined,
        downPaymentType: formData.downPaymentType,
        downPayment: formData.downPayment,
        cancelationPolicy: formData.cancelationPolicy,
        // WP20: the refund a Partially Refundable venue promises (the server validates it again and saves it as the venue's refund policy)
        ...(cancellationKey(formData.cancelationPolicy) === "partially_refundable"
          ? (() => {
              const v = validatePartialRefund(formData.partialRefundType, formData.partialRefundValue);
              return v.ok ? { partialRefundType: v.type, partialRefundValue: v.value } : {};
            })()
          : {}),
        covidComplaint: formData.covidComplaint,
        parking: formData.parking,
        // Backend column is INTEGER; blank stays undefined rather than 0, so a
        // vendor who skipped the question is not recorded as having no parking.
        carParkingCapacity: formData.carParkingCapacity
          ? Number(formData.carParkingCapacity)
          : undefined,
        // Catering is two INDEPENDENT policies, so it needs two flags. Squeezing
        // it into the single `catering` boolean is what made "both" impossible to
        // register: true meant internal, false meant external, and a venue that
        // does both had to under-declare itself. `outsideVendorsAllowed` already
        // exists on Business for exactly this ("customer free to bring external
        // vendors") — it simply was never set at signup.
        // Legacy single-string drafts ("internal" / "external") still map.
        catering: cateringChoices.includes("internal"),
        outsideVendorsAllowed: cateringChoices.includes("external"),
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
        images: formData.images,
        packages: packagesWithImages,
        // A venue's menus (per head). "Hall only" sends an empty list: the server stores no menus and that is deliberate.
        ...(venue || formData.businessType === "Wedding venue"
          ? {
              menus: formData.noMenus === true
                ? []
                : (formData.menus ?? [])
                    .filter((m) => (m.title || "").trim() || (m.items || []).some((d) => (d || "").trim()))
                    .map((m) => ({
                      title: (m.title || "").trim(),
                      price: Number(m.price),
                      ...(String(m.minGuaranteeCount ?? "").trim() ? { minGuaranteeCount: Number(m.minGuaranteeCount) } : {}),
                      items: (m.items || []).map((d) => (d || "").trim()).filter(Boolean),
                    })),
            }
          : {}),
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
        // venue-hierarchy — the onboarding space tree (only when the flag is on and
        // the vendor built one). Inert for legacy signups (nothing appended).
        ...(typeof window !== "undefined"
          ? (() => {
              try {
                const t = JSON.parse(localStorage.getItem("ww_reg_spaces_tree") || "[]");
                return Array.isArray(t) && t.length ? { spacesTree: t } : {};
              } catch {
                return {};
              }
            })()
          : {}),
      };

      // Build the payload — use FormData so vendor profile image can be included
      const submitPayload = formatedData;
      let requestBody: FormData | object = submitPayload;
      let requestHeaders: Record<string, string> = {};

      if (formData.profileImageFile || registrationFiles.length > 0) {
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
        if (formData.profileImageFile) fd.append("profileImage", formData.profileImageFile);
        registrationFiles.forEach(([field, f]) => fd.append(field, f));
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
        // venue-hierarchy — the space tree was persisted server-side with the
        // business; clear the onboarding stash so it isn't re-sent next signup.
        try {
          if (typeof window !== "undefined") localStorage.removeItem("ww_reg_spaces_tree");
        } catch {}
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
          partialRefundType: "",
          partialRefundValue: "",
          images: [],
          imageFiles: [],
          packageImageFiles: [],
          profileImageFile: null,
          subBusinessType: [],
          cityCovered: [],
          expertise: [],
          packages: [{ id: undefined, name: "", price: 0, features: {} }],
          menus: [],
          noMenus: false,
          carRentalPackages: [],
          amenities: [],
          maxCapacity: "",
          carParkingCapacity: "",
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
        // Persist BEFORE setting state: if the tree remounts (React #423 root
        // recovery has been observed on this route), the mount effect reads this
        // back and re-opens the modal, so the vendor is never left staring at a
        // blank step 1 wondering whether their registration went through.
        const successMsg =
          response.data?.message ||
          "Your business registration has been submitted for review. Our team will verify your details and email you once approved.";
        try { sessionStorage.setItem(REG_SUCCESS_KEY, successMsg); } catch {}
        setSuccessMessage(successMsg);
        // WP36 / VENDORTYPES-001: never lose photos silently
        const failedUploads = (vendorData as any)?.uploads?.failed;
        if (Array.isArray(failedUploads) && failedUploads.length > 0) {
          toast({
            title: "Some photos could not be uploaded",
            description: "Your registration is saved. Add the missing photos from Settings > Images after you sign in.",
          });
        }
        setOpenModal(true);
        setCurrentStep(0);

        // 01-VR-ENHANCE-V1-FE — drop the server-side draft now that the
        // business has been created. Non-blocking; failures are silent.
        if (formData?.email) {
          draftSync.clearDraft(formData.email).catch(() => null);
        }
        // 02-VR-RESILIENCE-V1 — drop the device draft + image blobs too,
        // so the next vendor on the same browser starts clean.
        clearLocalDraft();
        clearAllBlobs().catch(() => null);
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
    <div className="min-h-screen lg:h-screen lg:overflow-clip lg:flex lg:flex-col bridal-surface relative">
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

          <div className="flex items-center gap-3 sm:gap-4">
            {/* 02-VR-RESILIENCE-V1 — autosave indicator. Visible from the
                moment the vendor types anything; gives them confidence the
                form is being preserved. */}
            <div className="hidden sm:block">
              <AutoSaveIndicator
                lastSavedAt={combinedLastSavedAt}
                saving={combinedSaving}
              />
            </div>
            {/* "/get-help" is not a route and never has been — this 404'd.
                A vendor stuck halfway through registration clicked "Need Help?"
                and got a dead page. The help centre is app/(main)/help. */}
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 h-9 sm:h-10 rounded-[4px] border border-bridal-beige bg-bridal-cream font-bridal text-[12px] tracking-wide text-bridal-mauve hover:border-bridal-gold/60 hover:text-bridal-charcoal transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Need Help?</span>
            </Link>
          </div>
        </div>
      </header>

      {/* WP36 / PUBLIC-035: a signed-in CUSTOMER who taps "List your business" used to be bounced to the home page without a word */}
      {signedInCustomer && (
        <div role="status" className="w-[92%] xl:w-[90%] max-w-7xl mx-auto mt-4 rounded-[4px] border border-bridal-gold/40 bg-bridal-cream px-4 py-3 font-bridal text-[13px] text-bridal-charcoal">
          You are signed in as a customer{customerEmail ? ` (${customerEmail})` : ""}. A business account needs its own e-mail address: register below with a different e-mail, or{" "}
          <button type="button" className="underline underline-offset-4 text-bridal-gold-dark" onClick={() => { void logoutCustomer(); }}>sign out</button> first.
        </div>
      )}

      {/* ── Main content ── */}
      <main className="w-[92%] xl:w-[90%] max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-8 lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
        {/* On lg the row fills the viewport (flex-1 inside the fixed-height
            page) so there's no page scrollbar; both columns are h-full and
            their content is vertically centred, each scrolling internally.
            grid-rows minmax(0,1fr) lets the single row stretch to full height.
            On mobile this is a normal stacked grid. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start lg:flex-1 lg:min-h-0 lg:grid-rows-[minmax(0,1fr)]">
          {/* ── Left aside ──
              Full height of the pinned row (lg:h-full). Content is centred;
              on an unusually short window it can still scroll (wheel/touch)
              but the scrollbar itself is hidden (hide-scrollbar) so the rail
              never shows a bar. */}
          <aside className="lg:col-span-4 order-2 lg:order-1 lg:h-full lg:min-h-0">
            <div className="lg:h-full lg:overflow-y-auto overflow-x-hidden hide-scrollbar">
              <div className="lg:min-h-full lg:flex lg:flex-col lg:justify-center space-y-5">
              {/* Progress card — compact */}
              <BridalCard className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="bridal-label">Your Progress</span>
                  <span className="font-display italic text-bridal-gold-dark text-[18px] leading-none">
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
                    <span className="text-bridal-gold-dark">trusted network</span>
                  </h3>
                  <p className="font-bridal text-[12.5px] text-bridal-text-soft mt-1.5 leading-snug">
                    Connect with couples planning the biggest day of their
                    lives.
                  </p>
                </div>

                <ul className="space-y-1.5">
                  {[
                    "A free first month with every feature open, no card needed",
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
                      <span className="text-bridal-gold-dark">+</span>
                    </div>
                    <div className="bridal-label mt-0.5">Active Vendors</div>
                  </div>
                  <div className="rounded-md border border-bridal-beige bg-bridal-blush/40 p-2.5 text-center">
                    <div className="font-display italic text-[22px] leading-none text-bridal-charcoal">
                      {stats ? stats.couplesServed : 0}
                      <span className="text-bridal-gold-dark">+</span>
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
              className="p-0 bg-bridal-cream flex flex-col overflow-hidden lg:h-full hover:transform-none hover:shadow-[0_24px_40px_-28px_rgba(176,125,84,0.4)] transition-none"
            >
              {/* Scrollable step body — slim gold scrollbar (bridal-scroll).
                  The nav buttons live in a pinned footer below, so they stay
                  visible while this area scrolls. overflow-x-hidden keeps the
                  cards' hover-scale from spawning a horizontal bar. */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bridal-scroll p-5 sm:p-7 lg:p-9">
              {/* min-h-full + justify-center: centres a short step vertically,
                  while a tall step (e.g. the business-type grid) just grows
                  and scrolls from the top — no clipping. */}
              <div
                className={`lg:min-h-full lg:flex lg:flex-col ${
                  currentStep === 0 ? "lg:justify-center" : "lg:justify-start"
                }`}
              >
              {/* 02-VR-RESILIENCE-V1 — device-local resume prompt.
                  Fires the moment the page loads if a local draft exists,
                  even before the vendor types an email. This is the common
                  case (refresh / tab close / browser crash on the same
                  device). Suppressed while the form has any meaningful
                  content already (e.g. mid-typing or the server prompt
                  just hydrated) so we don't second-guess the user. */}
              <LocalDraftResumePrompt
                suppress={!!formData?.name || !!formData?.businessType || currentStep > 1}
                onResume={hydrateFromLocalDraft}
              />

              {/* 01-VR-ENHANCE-V1-FE — server-side resume prompt.
                  Shown only when an email is typed, the form is still empty
                  enough to safely overwrite, and the server has a saved draft.
                  Surfaces the cross-device case (vendor switches phone → laptop). */}
              {formData?.email && currentStep <= 1 && !formData?.name && (
                <DraftResumePrompt
                  email={formData.email}
                  onResume={(d) => {
                    // WW-005 — the server withholds the payload unless the
                    // saved-on-this-device resume token is presented. When it's
                    // protected (e.g. the vendor started on another device),
                    // don't jump to a late step with an empty form — keep them
                    // where they are and tell them where to resume.
                    if (d.payloadProtected || !d.payload || Object.keys(d.payload).length === 0) {
                      toast({
                        title: "Continue on your original device",
                        description:
                          "We found a saved draft, but for your security it can only be restored on the device or browser where you started it.",
                      });
                      return;
                    }
                    setFormData((prev) => ({ ...prev, ...(d.payload || {}) }));
                    const needsPassword = (d.currentStep || 0) >= 1 && !d.payload?.password;
                    if (needsPassword) {
                      setCurrentStep(1);
                      toast({
                        title: "Progress restored",
                        description:
                          "Welcome back! Your registration details have been restored. Please set your password on this step to continue.",
                      });
                    } else if (typeof d.currentStep === "number") {
                      // venue drafts saved before the Menus step count their steps the old way (see stepForResume)
                      const resumeAt = stepForResume({ formData: d.payload, currentStep: d.currentStep, businessType: d.vendorType ?? undefined }) ?? d.currentStep;
                      setCurrentStep(resumeAt);
                      toast({
                        title: "Progress restored",
                        description: `Picked up where you left off (step ${resumeAt + 1}).`,
                      });
                    }
                    if (d.vendorType) setBusinessType(d.vendorType);
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
                      <HelpRow help="businessType" className="mb-1.5 justify-center">
                        <BridalTitle size="h3" className="mb-0">
                          Choose your{" "}
                          <span className="text-bridal-gold-dark">business type</span>
                        </BridalTitle>
                      </HelpRow>
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

                    {venue || formData.businessType === "Wedding venue" ? (
                      <VenueSteps
                        setFile={setFile}
                        file={file}
                        error={errors}
                        setErrors={setErrors}
                        currentStep={currentStep}
                      />
                    ) : carRental || formData.businessType === "Car rental" ? (
                      <CarRentalSteps
                        setFile={setFile}
                        file={file}
                        error={errors}
                        setErrors={setErrors}
                        currentStep={currentStep}
                      />
                    ) : bridalWear || formData.businessType === "Bridal Wear" || formData.businessType === "Bridal wearing" ? (
                      <BridalWearSteps
                        setFile={setFile}
                        file={file}
                        error={errors}
                        setErrors={setErrors}
                        currentStep={currentStep}
                      />
                    ) : weddingStationery || formData.businessType === "Wedding Stationery" || formData.businessType === "Wedding Invitations and Stationery" ? (
                      <WeddingStationerySteps
                        setFile={setFile}
                        file={file}
                        error={errors}
                        setErrors={setErrors}
                        currentStep={currentStep}
                      />
                    ) : photographer || formData.businessType === "Photographer" ? (
                      <PhotographerSteps
                        setFile={setFile}
                        file={file}
                        error={errors}
                        setErrors={setErrors}
                        currentStep={currentStep}
                      />
                    ) : makeupArtist || formData.businessType === "Makeup artist" ? (
                      <MakeupArtistSteps
                        setFile={setFile}
                        file={file}
                        error={errors}
                        setErrors={setErrors}
                        currentStep={currentStep}
                      />
                    ) : hennaArtist || formData.businessType === "Henna artist" ? (
                      <HennaArtistSteps
                        setFile={setFile}
                        file={file}
                        error={errors}
                        setErrors={setErrors}
                        currentStep={currentStep}
                      />
                    ) : decorator || formData.businessType === "Decorator" ? (
                      <DecoratorSteps
                        setFile={setFile}
                        file={file}
                        error={errors}
                        setErrors={setErrors}
                        currentStep={currentStep}
                      />
                    ) : catering || formData.businessType === "Catering" ? (
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
                      // Fallback: Never render an empty div on step > 0! Default to VenueSteps so it never goes blank.
                      <VenueSteps
                        setFile={setFile}
                        file={file}
                        error={errors}
                        setErrors={setErrors}
                        currentStep={currentStep}
                      />
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

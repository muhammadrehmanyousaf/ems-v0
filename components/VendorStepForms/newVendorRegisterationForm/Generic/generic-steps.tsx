/**
 * BK-100.55 Layer 2 — Generic registration step orchestrator.
 *
 * Used by all 14 new Pakistani vendor categories (Nikahkhwan /
 * Choreographer / Dhol player / Event host / Live streaming /
 * Generator rental / Marquee rental / Furniture rental / Florist /
 * Wedding cakes / Mithai and sweets / Live cooking stall / Sound
 * system rental / Qawwali and Naat).
 *
 * 7-step layout, identical to the photographer flow numbering so the
 * parent BusinessRegistrationForm validation + progress + isFinalStep
 * logic works without further branching:
 *
 *   1 Personal · 2 Contact · 3 Business · 4 Specialty/Trust ·
 *   5 Packages · 6 Images · 7 Preview
 *
 * Per-category specialty polish ships in Layer 3 by swapping the
 * `<GenericSpecialtyTrust />` step for a category-specific component
 * driven by the backend's TYPE_SPECIFIC_WHITELIST.
 */

import React from "react";
import PersonalDetails from "../../personal-details";
import ContactDetails from "../../contact-details";
import GenericBusinessDetails from "./generic-business-details";
import GenericSpecialtyTrust from "./generic-specialty-trust";
import Packages from "../../packages";
import ImagesStep from "../../images-step";
import Preview from "../../preview";

interface GenericStepsProps {
  currentStep: number;
  error: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  file: File | null;
}

const GenericSteps = ({
  currentStep,
  error,
  setErrors,
  file,
  setFile,
}: GenericStepsProps) => {
  return (
    <>
      {currentStep === 1 ? (
        <div className="space-y-6">
          <div className="space-y-3 mb-6">
            <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">
              Personal Details
            </h1>
            <p className="text-sm md:text-base lg:text-lg font-medium">
              Enter your personal details here.
            </p>
          </div>
          <PersonalDetails errors={error} setErrors={setErrors} />
        </div>
      ) : currentStep === 2 ? (
        <div className="space-y-6">
          <div className="space-y-3 mb-6">
            <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">
              Contact Details
            </h1>
            <p className="text-sm md:text-base lg:text-lg font-medium">
              Enter your contact details here.
            </p>
          </div>
          <ContactDetails
            file={file}
            setFile={setFile}
            errors={error}
            setErrors={setErrors}
          />
        </div>
      ) : currentStep === 3 ? (
        <div className="space-y-6">
          <div className="space-y-3 mb-6">
            <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">
              Business Details
            </h1>
            <p className="text-sm md:text-base lg:text-lg font-medium">
              Tell us about your service.
            </p>
          </div>
          <GenericBusinessDetails errors={error} setErrors={setErrors} />
        </div>
      ) : currentStep === 4 ? (
        <div className="space-y-6">
          <div className="space-y-3 mb-6">
            <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">
              Specialty & Trust
            </h1>
            <p className="text-sm md:text-base lg:text-lg font-medium">
              Optional — universal trust details + what makes your service
              different. Verified vendors rank higher in search.
            </p>
          </div>
          <GenericSpecialtyTrust />
        </div>
      ) : currentStep === 5 ? (
        <div className="space-y-6">
          <div className="space-y-3 mb-6">
            <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">
              Packages
            </h1>
            <p className="text-sm md:text-base lg:text-lg font-medium">
              Enter your package details.
            </p>
          </div>
          <Packages setErrors={setErrors} errors={error} />
        </div>
      ) : currentStep === 6 ? (
        <div className="space-y-6">
          <div className="space-y-3 mb-6">
            <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">
              Images
            </h1>
            <p className="text-sm md:text-base lg:text-lg font-medium">
              Upload your portfolio images.
            </p>
          </div>
          <ImagesStep setErrors={setErrors} errors={error} />
        </div>
      ) : currentStep === 7 ? (
        <div>
          <Preview />
        </div>
      ) : null}
    </>
  );
};

export default GenericSteps;

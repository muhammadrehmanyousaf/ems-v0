'use client';

import React from 'react';
import PersonalDetails from '../../personal-details';
import ContactDetails from '../../contact-details';
import BridalWearBusinessDetails from './components/business-details';
import StoreProfileStep from './components/store-profile-step';
import ServicesStep from './components/services-step';
import ImagesStep from '../../images-step';
import OutfitListingsStep from './components/outfit-listings-step';
import BridalWearSpecialtyTrust from './components/specialty-trust';
import Preview from '../../preview';

interface BridalWearStepsProps {
    currentStep: number;
    error: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    file: File | null;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
}

// VR-050 — Bridal Wear gained an optional "Specialty & Trust" step at
// position 8 (just before Preview). Total user-facing steps grew 8 → 9.
const BridalWearSteps = ({ currentStep, error, setErrors, file, setFile }: BridalWearStepsProps) => {
    const stepHeadings: Record<number, { title: string; subtitle: string }> = {
        1: { title: 'Personal Details', subtitle: 'Enter your personal details here.' },
        2: { title: 'Contact Details', subtitle: 'Enter your business contact details.' },
        3: { title: 'Business Details', subtitle: 'Tell us about your bridal wear store.' },
        4: { title: 'Store Profile', subtitle: 'Your store type, outfit categories, and fabrics.' },
        5: { title: 'Services & Lead Time', subtitle: 'What services do you offer and how much notice do you need?' },
        6: { title: 'Portfolio Images', subtitle: 'Upload photos of your store and outfits (up to 20).' },
        7: { title: 'Outfit Listings', subtitle: 'Optionally add individual outfit listings for customers to browse.' },
        8: { title: 'Specialty & Trust', subtitle: 'Optional — bridal-wear specialty details and verification.' },
        9: { title: 'Preview', subtitle: 'Review all details before submitting.' },
    };

    const heading = stepHeadings[currentStep];

    return (
        <div className="space-y-6">
            {heading && (
                <div className="space-y-3 mb-6">
                    <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">{heading.title}</h1>
                    <p className="text-sm md:text-base lg:text-lg font-medium">{heading.subtitle}</p>
                </div>
            )}

            {currentStep === 1 && (
                <PersonalDetails errors={error} setErrors={setErrors} />
            )}
            {currentStep === 2 && (
                <ContactDetails file={file} setFile={setFile} errors={error} setErrors={setErrors} />
            )}
            {currentStep === 3 && (
                <BridalWearBusinessDetails errors={error} setErrors={setErrors} />
            )}
            {currentStep === 4 && (
                <StoreProfileStep errors={error} setErrors={setErrors} />
            )}
            {currentStep === 5 && (
                <ServicesStep errors={error} setErrors={setErrors} />
            )}
            {currentStep === 6 && (
                <ImagesStep errors={error} setErrors={setErrors} />
            )}
            {currentStep === 7 && (
                <OutfitListingsStep errors={error} setErrors={setErrors} />
            )}
            {currentStep === 8 && (
                <BridalWearSpecialtyTrust />
            )}
            {currentStep === 9 && (
                <Preview />
            )}
        </div>
    );
};

export default BridalWearSteps;

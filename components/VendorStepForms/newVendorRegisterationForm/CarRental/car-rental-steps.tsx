'use client';

import React from 'react';
import PersonalDetails from '../../personal-details';
import ContactDetails from '../../contact-details';
import CarRentalBusinessDetails from './components/business-details';
import CarDetailsStep from './components/car-details-step';
import CarPackagesStep from './components/car-packages-step';
import CarRentalSpecialtyTrust from './components/specialty-trust';
import ImagesStep from '../../images-step';
import Preview from '../../preview';

interface CarRentalStepsProps {
    currentStep: number;
    error: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    file: File | null;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
}

// VR-050 — Car Rental gained an optional "Specialty & Trust" step at
// position 7 (just before Preview). Total user-facing steps grew 7 → 8.
const CarRentalSteps = ({ currentStep, error, setErrors, file, setFile }: CarRentalStepsProps) => {
    const stepHeadings: Record<number, { title: string; subtitle: string }> = {
        1: { title: 'Personal Details', subtitle: 'Enter your personal details here.' },
        2: { title: 'Contact Details', subtitle: 'Enter your business contact details.' },
        3: { title: 'Business Details', subtitle: 'Tell us about your car rental business.' },
        4: { title: 'Fleet / Car Details', subtitle: 'Add the vehicles available in your fleet.' },
        5: { title: 'Portfolio Images', subtitle: 'Upload photos of your vehicles (up to 20).' },
        6: { title: 'Packages', subtitle: 'Create combo packages from your fleet (optional).' },
        7: { title: 'Specialty & Trust', subtitle: 'Optional — rental specialty details and verification.' },
        8: { title: 'Preview', subtitle: 'Review all details before submitting.' },
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
                <CarRentalBusinessDetails errors={error} setErrors={setErrors} />
            )}
            {currentStep === 4 && (
                <CarDetailsStep errors={error} setErrors={setErrors} />
            )}
            {currentStep === 5 && (
                <ImagesStep errors={error} setErrors={setErrors} />
            )}
            {currentStep === 6 && (
                <CarPackagesStep errors={error} setErrors={setErrors} />
            )}
            {currentStep === 7 && (
                <CarRentalSpecialtyTrust />
            )}
            {currentStep === 8 && (
                <Preview />
            )}
        </div>
    );
};

export default CarRentalSteps;

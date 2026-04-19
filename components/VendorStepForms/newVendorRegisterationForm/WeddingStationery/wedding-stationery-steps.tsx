'use client';

import React from 'react';
import PersonalDetails from '../../personal-details';
import ContactDetails from '../../contact-details';
import BusinessDetails from './components/business-details';
import StationeryProfileStep from './components/stationery-profile-step';
import ServicesStep from './components/services-step';
import ImagesStep from '../../images-step';
import ProductListingsStep from './components/product-listings-step';
import Preview from '../../preview';

interface WeddingStationeryStepsProps {
    currentStep: number;
    error: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    file: File | null;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
}

const WeddingStationerySteps = ({ currentStep, error, setErrors, file, setFile }: WeddingStationeryStepsProps) => {
    const stepHeadings: Record<number, { title: string; subtitle: string }> = {
        1: { title: 'Personal Details', subtitle: 'Enter your personal details here.' },
        2: { title: 'Contact Details', subtitle: 'Enter your business contact details.' },
        3: { title: 'Business Details', subtitle: 'Tell us about your stationery business.' },
        4: { title: 'Stationery Profile', subtitle: 'Your shop type, products offered, printing techniques, and languages.' },
        5: { title: 'Services & Turnaround', subtitle: 'What services do you offer and how long does production take?' },
        6: { title: 'Portfolio Images', subtitle: 'Upload photos of your stationery work (up to 20).' },
        7: { title: 'Product Listings', subtitle: 'Optionally add individual product listings for customers to browse.' },
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
                <BusinessDetails errors={error} setErrors={setErrors} />
            )}
            {currentStep === 4 && (
                <StationeryProfileStep errors={error} setErrors={setErrors} />
            )}
            {currentStep === 5 && (
                <ServicesStep errors={error} setErrors={setErrors} />
            )}
            {currentStep === 6 && (
                <ImagesStep errors={error} setErrors={setErrors} />
            )}
            {currentStep === 7 && (
                <ProductListingsStep errors={error} setErrors={setErrors} />
            )}
            {currentStep === 8 && (
                <Preview />
            )}
        </div>
    );
};

export default WeddingStationerySteps;

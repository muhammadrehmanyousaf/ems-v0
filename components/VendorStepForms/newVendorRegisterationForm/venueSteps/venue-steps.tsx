import React from 'react'
import PersonalDetails from '../../personal-details';
import ContactDetails from '../../contact-details';
import BusinessDetails from './vanueComponents/business-details';
import VenueSpecialtyTrust from './vanueComponents/specialty-trust';
import Packages from '../../packages';
import ImagesStep from '../../images-step';
import Preview from '../../preview';
import { RegistrationSpacesBuilder } from './registration-spaces-builder';

interface VenueStepsProps {
    currentStep: number;
    error: {};
    setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    file: File | null;
};

// VR-050 — venue flow grew from 6 to 7 steps with the addition of
// the "Specialty & Trust" step at position 4. Order:
//   1 Personal · 2 Contact · 3 Business · 4 Specialty/Trust ·
//   5 Packages · 6 Images · 7 Preview
const VenueSteps = ({ currentStep, error, setErrors, file, setFile }: VenueStepsProps) => {

    return (
        <>
            {currentStep === 1 ?
                <div className='space-y-6'>
                    <div className="space-y-3 mb-6">
                        <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">{'Personal Details'}</h1>
                        <p className="text-sm md:text-base lg:text-lg font-medium">{'Enter your personal details here.'}</p>
                    </div>
                    <PersonalDetails errors={error} setErrors={setErrors} />
                </div>
                : currentStep === 2 ?
                    <div className='space-y-6'>
                        <div className="space-y-3 mb-6">
                            <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">{'Contact Details'}</h1>
                            <p className="text-sm md:text-base lg:text-lg font-medium">{'Enter your contact details here.'}</p>
                        </div>
                        <ContactDetails file={file} setFile={setFile} errors={error} setErrors={setErrors} />
                    </div>
                    : currentStep === 3 ?
                        <div className='space-y-6'>
                            <div className="space-y-3 mb-6">
                                <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">{'Business Details'}</h1>
                                <p className="text-sm md:text-base lg:text-lg font-medium">{'Enter your business details here.'}</p>
                            </div>
                            <BusinessDetails
                                errors={error}
                                setErrors={setErrors}
                            />
                            {/* venue-hierarchy onboarding builder — renders null unless
                                NEXT_PUBLIC_VENUE_HIERARCHY_ON, so signup is byte-identical by default */}
                            <RegistrationSpacesBuilder />
                        </div>
                        : currentStep === 4 ?
                            <div className='space-y-6'>
                                <div className="space-y-3 mb-6">
                                    <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">{'Specialty & Trust'}</h1>
                                    <p className="text-sm md:text-base lg:text-lg font-medium">{'Optional — venue operations details couples ask about. Verified vendors rank higher in search.'}</p>
                                </div>
                                <VenueSpecialtyTrust />
                            </div>
                            : currentStep === 5 ?
                                <div className='space-y-6'>
                                    <div className="space-y-3 mb-6">
                                        <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">{'Packages'}</h1>
                                        <p className="text-sm md:text-base lg:text-lg font-medium">{'Enter your package details'}</p>
                                    </div>
                                    <Packages setErrors={setErrors} errors={error} />
                                </div>
                                : currentStep === 6 ?
                                    <div className='space-y-6'>
                                        <div className="space-y-3 mb-6">
                                            <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">{'Images'}</h1>
                                            <p className="text-sm md:text-base lg:text-lg font-medium">{'Upload your venue images'}</p>
                                        </div>
                                        <ImagesStep
                                            setErrors={setErrors}
                                            errors={error}
                                        />
                                    </div>
                                    : currentStep === 7 &&
                                    <div>
                                        <Preview />
                                    </div>
            }
        </>
    )
}

export default VenueSteps

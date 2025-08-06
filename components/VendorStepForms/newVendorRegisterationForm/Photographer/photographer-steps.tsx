import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React from 'react'
import PersonalDetails from '../../personal-details';
import ContactDetails from '../../contact-details';
import BusinessDetails from './photographerComponents/business-details';
import Packages from '../../packages';
import ImagesStep from '../../images-step';
import Preview from '../../preview';

interface PhotographerStepsProps {
    currentStep: number;
    error: {};
    setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    file: File | null;
};

const PhotographerSteps = ({ currentStep, error, setErrors, file, setFile }: PhotographerStepsProps) => {

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
                        </div>
                        : currentStep === 4 ?
                            <div className='space-y-6'>
                                <div className="space-y-3 mb-6">
                                    <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">{'Packages'}</h1>
                                    <p className="text-sm md:text-base lg:text-lg font-medium">{'Enter your package details'}</p>
                                </div>
                                <Packages setErrors={setErrors} errors={error} />
                            </div>
                            : currentStep === 5 ?
                                <div className='space-y-6'>
                                    <div className="space-y-3 mb-6">
                                        <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">{'Images'}</h1>
                                        <p className="text-sm md:text-base lg:text-lg font-medium">{'Upload your portfolio images'}</p>
                                    </div>
                                    <ImagesStep
                                    setErrors={setErrors}
                                    errors={error}
                                    />
                                </div>
                                : currentStep === 6 &&
                                <div>
                                    <Preview/>
                                </div>
            }
        </>
    )
}

export default PhotographerSteps 
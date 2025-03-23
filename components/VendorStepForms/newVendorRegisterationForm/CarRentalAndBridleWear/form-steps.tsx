import React from 'react'
import PersonalDetails from '../../personal-details'
import ContactDetails from '../../contact-details'

interface CarAndBrideStepsProps {
    currentStep: number;
    error: {};
    setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    file: File | null;
};

const FormSteps:React.FC<CarAndBrideStepsProps> = ({currentStep, error, setErrors, file, setFile}) => {
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
        : currentStep === 2 &&
        <div className='space-y-6'>
          <div className="space-y-3 mb-6">
            <h1 className="text-2xl lg:text-3xl text-roze-default font-semibold">{'contact Details'}</h1>
            <p className="text-sm md:text-base lg:text-lg font-medium">{'Enter your contact details here.'}</p>
          </div>
          <ContactDetails file={file} setFile={setFile} errors={error} setErrors={setErrors} />
        </div>
        }
    </>
  )
}

export default FormSteps
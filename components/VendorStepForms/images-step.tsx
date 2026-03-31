import React from 'react';
import MultipleFileUploader from './multiple-file-uploader';
import { useFormContext } from '@/lib/context/form-context';

interface ImageProps {
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{}>>;
};

const ImagesStep = ({ errors, setErrors }: ImageProps) => {
  const { setFormData, formData } = useFormContext();

  const handleSetFiles = (updater: File[] | ((prev: File[]) => File[])) => {
    const currentFiles = formData.imageFiles || [];
    const nextFiles = typeof updater === 'function' ? updater(currentFiles) : updater;

    const newImageUrls = nextFiles.map((file) => URL.createObjectURL(file));
    setFormData((prevData) => ({
      ...prevData,
      images: newImageUrls,
      imageFiles: nextFiles,
    }));

    if (nextFiles.length > 0) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        images: "",
      }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-800 mb-1">Portfolio Images</h3>
        <p className="text-sm text-neutral-500 mb-5">
          Showcase your best work — upload high-quality images to attract more clients
        </p>
        <MultipleFileUploader
          setFiles={handleSetFiles}
          files={formData.imageFiles || []}
          multiple={true}
        />
        {errors.images && (
          <p className="text-xs text-red-500 mt-3 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-500 rounded-full" />
            {errors.images}
          </p>
        )}
      </div>
    </div>
  );
};

export default ImagesStep;

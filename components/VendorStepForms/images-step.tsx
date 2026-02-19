import React, { useState, useEffect } from 'react';
import MultipleFileUploader from './multiple-file-uploader';
import { useFormContext } from '@/lib/context/form-context';

interface ImageProps {
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{}>>;
};

const ImagesStep = ({ errors, setErrors }: ImageProps) => {
  const { setFormData } = useFormContext();
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (files.length > 0) {
      const newImageUrls = files.map((file) => URL.createObjectURL(file));

      setFormData((prevData) => ({
        ...prevData,
        images: newImageUrls,
        imageFiles: files,
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        images: "",
      }));
    }
  }, [files, setFormData]);

  return (
    <div className='mb-8'>
      <MultipleFileUploader setFiles={setFiles} files={files} multiple={true} />
      {errors.images && <p className="text-xs text-red-500">{'Please add images'}</p>}
    </div>
  );
};

export default ImagesStep;

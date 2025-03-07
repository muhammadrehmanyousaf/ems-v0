import React, { useState, useEffect } from 'react';
import MultipleFileUploader from './multiple-file-uploader';
import { useFormContext } from '@/lib/context/form-context';

const ImagesStep = () => {
  const { setFormData } = useFormContext();
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (files.length > 0) {
      const newImageUrls = files.map((file) => URL.createObjectURL(file));

      setFormData((prevData) => ({
        ...prevData,
        images: newImageUrls,
      }));
    }
  }, [files, setFormData]);

  return (
    <div className='mb-8'>
      <MultipleFileUploader setFiles={setFiles} files={files} multiple={true} />
    </div>
  );
};

export default ImagesStep;

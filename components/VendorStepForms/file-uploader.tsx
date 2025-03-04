"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { MdCloudUpload } from "react-icons/md";

interface FileUploaderProps {
  rounded?: boolean;
  setFile: (file: File | null) => void;
  file: File | null;
}

export default function FileUploader({ rounded = false, setFile, file }: FileUploaderProps) {

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".png", ".jpg"] },
  });

  return (
    <div className="">
      <div
        {...getRootProps()}
        className={`size-20 p-2 border-2 border-dashed cursor-pointer flex items-center justify-center rounded-full
        } ${isDragActive ? "border-blue-500 bg-blue-100" : "border-gray-300"}`}
      >
        {file ? (
          <div className="w-full h-full relative group">
            <span className="h-full w-full rounded-full absolute opacity-0 group-hover:opacity-100 flex items-center justify-center">
              <input {...getInputProps()} />
            </span>
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className={`object-cover rounded-full h-full w-full`}
            />
          </div>
        ) : (
          <div className="text-center">
            <input {...getInputProps()} className="h-full w-full" />
            {isDragActive ?
              <p className="text-gray-600">Drop here...</p> :
              <div className="flex flex-col items-center justify-center">
                <MdCloudUpload className="text-gray-300" size={30} />
                <p className="text-[11px] text-center mt-1 text-gray-400">Upload a logo</p>
              </div>}
          </div>
        )}
      </div>
    </div>
  );
}

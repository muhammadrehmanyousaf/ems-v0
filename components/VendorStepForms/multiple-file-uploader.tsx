"use client";

import { useState, useCallback, SetStateAction } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { MdCloudUpload } from "react-icons/md";

interface FileUploaderProps {
  multiple?: boolean;
  setFiles: React.Dispatch<SetStateAction<File[]>>;
  files: File[]
}

export default function MultipleFileUploader({ setFiles, files, multiple = true }: FileUploaderProps) {

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles((prevFiles) => (multiple ? [...prevFiles, ...acceptedFiles] : [acceptedFiles[0]]));
    },
    [multiple]
  );

  const removeFile = (fileName: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".png", ".jpg"] },
    multiple,
  });

  return (
    <div className="h-[30vh]">
      <div
        {...getRootProps()}
        className={`border-2 h-full border-dashed cursor-pointer flex items-center justify-center rounded-lg
        } ${isDragActive ? "border-blue-500 bg-blue-100" : "border-gray-300"}`}
      >
        <input {...getInputProps()} />
        {files?.length > 0 && !multiple ? (
          <img
            src={URL.createObjectURL(files[0])}
            alt={files[0].name}
            className="w-16 h-16 object-cover rounded-md"
          />
        ) : (
          <div className="text-center">
            {isDragActive ? (
              <p className="text-gray-600">Release to upload your files...</p>
            ) : (
              <span>
                <MdCloudUpload className="size-32 lg:size-36 text-gray-300/70 mx-auto" />
                <p className="font-medium text-gray-700">Drag & Drop files here</p>
                <p className="text-gray-500 text-sm">or click to browse</p>
              </span>
            )}
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-base lg:text-lg font-semibold">Uploaded Files:</h3>
          <ul className="custom-scrollbar space-y-2 max-h-44 overflow-y-auto px-2">
            {files.map((file) => (
              <li key={file.name} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                <div className="flex items-center space-x-2">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded-md"
                  />
                  <span className="text-gray-700">{file.name}</span>
                </div>
                <button onClick={() => removeFile(file.name)} className="text-red-500">
                  <X size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

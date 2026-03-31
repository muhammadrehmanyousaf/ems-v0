"use client";

import { useState, useCallback, SetStateAction } from "react";
import { useDropzone } from "react-dropzone";
import { X, ImagePlus, Images, Upload, AlertCircle } from "lucide-react";

const MAX_IMAGES = 20;

interface FileUploaderProps {
  multiple?: boolean;
  setFiles: React.Dispatch<SetStateAction<File[]>>;
  files: File[];
}

export default function MultipleFileUploader({ setFiles, files, multiple = true }: FileUploaderProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [limitError, setLimitError] = useState<string>("");

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setLimitError("");
      setFiles((prevFiles) => {
        if (!multiple) return [acceptedFiles[0]];

        const remaining = MAX_IMAGES - prevFiles.length;
        if (remaining <= 0) {
          setLimitError(`You can only upload up to ${MAX_IMAGES} images.`);
          return prevFiles;
        }
        if (acceptedFiles.length > remaining) {
          setLimitError(`Only ${remaining} more image${remaining === 1 ? "" : "s"} allowed. ${acceptedFiles.length - remaining} file${acceptedFiles.length - remaining === 1 ? "" : "s"} skipped.`);
          return [...prevFiles, ...acceptedFiles.slice(0, remaining)];
        }
        return [...prevFiles, ...acceptedFiles];
      });
    },
    [multiple, setFiles]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".png", ".jpg"] },
    multiple,
    noClick: false,
  });

  const removeFile = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setLimitError("");
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isAtLimit = files.length >= MAX_IMAGES;

  return (
    <div className="space-y-5">

      {/* Limit error banner */}
      {limitError && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>{limitError}</span>
        </div>
      )}

      {/* Empty state drop zone */}
      {(files.length === 0 || !multiple) && (
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200
            ${isDragActive
              ? "border-violet-500 bg-violet-50 scale-[1.01] shadow-lg shadow-violet-100"
              : "border-neutral-300 bg-neutral-50/80 hover:border-violet-400 hover:bg-violet-50/50 hover:shadow-md"
            }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center select-none">
            <div className={`mb-5 p-5 rounded-2xl transition-colors duration-200 ${isDragActive ? "bg-violet-100" : "bg-white shadow-sm border border-neutral-100"}`}>
              <Upload className={`size-9 transition-colors duration-200 ${isDragActive ? "text-violet-500" : "text-neutral-400"}`} />
            </div>
            {isDragActive ? (
              <>
                <p className="text-violet-600 font-semibold text-lg">Release to upload your images</p>
                <p className="text-violet-400 text-sm mt-1">Files will be added to your portfolio</p>
              </>
            ) : (
              <>
                <p className="text-neutral-800 font-semibold text-base">Drag & drop your images here</p>
                <p className="text-neutral-400 text-sm mt-1.5">
                  or <span className="text-violet-500 font-semibold underline underline-offset-2 cursor-pointer">click to browse</span>
                </p>
                <div className="flex items-center gap-2 mt-4 text-xs text-neutral-400 bg-white border border-neutral-100 px-3 py-1.5 rounded-full shadow-sm">
                  <span className="font-medium text-neutral-500">JPG, JPEG, PNG</span>
                  <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                  <span>Up to {MAX_IMAGES} images</span>
                  <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                  <span>Max 10 MB each</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filled state — grid preview */}
      {files.length > 0 && multiple && (
        <div className="space-y-4">

          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-violet-100 rounded-lg">
                <Images className="size-4 text-violet-600" />
              </div>
              <span className="text-sm font-semibold text-neutral-700">Portfolio Images</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium border px-2.5 py-1 rounded-full
                ${isAtLimit
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-violet-50 text-violet-600 border-violet-200"
                }`}>
                {files.length} / {MAX_IMAGES}
              </span>
              {!isAtLimit && (
                <button
                  type="button"
                  onClick={open}
                  className="flex items-center gap-1.5 text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-full transition-colors duration-150"
                >
                  <ImagePlus size={13} />
                  Add more
                </button>
              )}
              {isAtLimit && (
                <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                  <AlertCircle size={12} />
                  Limit reached
                </span>
              )}
            </div>
          </div>

          {/* Drag-aware outer wrapper */}
          <div
            {...getRootProps({ onClick: (e) => e.stopPropagation() })}
            className={`rounded-2xl border-2 border-dashed transition-all duration-200 p-3
              ${isAtLimit
                ? "border-neutral-200 bg-neutral-50/30 cursor-not-allowed"
                : isDragActive
                  ? "border-violet-400 bg-violet-50"
                  : "border-neutral-200 bg-neutral-50/50"
              }`}
          >
            <input {...getInputProps()} disabled={isAtLimit} />

            {/* Scrollable grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[340px] overflow-y-auto pr-1">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-white aspect-square shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-default"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {/* Dark overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-200 ${hoveredIndex === index ? "opacity-100" : "opacity-0"}`} />
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => removeFile(e, index)}
                    className={`absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all duration-150 ${hoveredIndex === index ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
                  >
                    <X size={12} />
                  </button>
                  {/* File size + index badge */}
                  <div className={`absolute bottom-2 left-2 right-2 flex items-center justify-between transition-opacity duration-200 ${hoveredIndex === index ? "opacity-100" : "opacity-0"}`}>
                    <span className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium backdrop-blur-sm">
                      {formatBytes(file.size)}
                    </span>
                    <span className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium backdrop-blur-sm">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              ))}

              {/* Drag hint */}
              {isDragActive && !isAtLimit && (
                <div className="col-span-full flex items-center justify-center py-4 text-violet-500 font-medium text-sm">
                  <Upload size={16} className="mr-2" />
                  Drop to add images
                </div>
              )}
              {isDragActive && isAtLimit && (
                <div className="col-span-full flex items-center justify-center py-4 text-red-400 font-medium text-sm">
                  <AlertCircle size={16} className="mr-2" />
                  Image limit reached — remove some images first
                </div>
              )}
            </div>
          </div>

          {/* Tip */}
          {!isAtLimit && (
            <p className="text-xs text-neutral-400 text-center">
              Hover over an image to remove it · Drag new images onto the grid to add more
            </p>
          )}

        </div>
      )}

    </div>
  );
}

import React, { useRef, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { PasswordInput } from "../ui/password-input";
import { Flag, Camera, User } from "lucide-react";
import { useFormContext } from "@/lib/context/form-context";

const PersonalDetails = ({
  errors,
  setErrors,
}: {
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}) => {
  const { setFormData, formData } = useFormContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, profileImageFile: file }));
    e.target.value = "";
  };

  const formFields = [
    {
      label: "Full Name",
      place: "Enter your full name here",
      name: "fullName",
    },
    {
      label: "Email",
      place: "Enter your email here",
      type: "email",
      name: "email",
    },
    {
      label: "Phone Number",
      place: "+92 123xxxxxx",
      type: "number",
      name: "phoneNumber",
    },
    {
      label: "Password",
      place: "***********",
      type: "password",
      name: "password",
    },
    {
      label: "Re-enter Password",
      place: "***********",
      type: "password",
      name: "re_enterPassword",
    },
  ];

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
  ) => {
    const { value, type } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: type === "number" ? Number(value) : value,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: "",
    }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    fieldName: string,
  ) => {
    if (fieldName === "email") {
      const value = e.target.value;
      if (value && !validateEmail(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          email: "Please enter a valid email address",
        }));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Image Picker */}
      <div className="flex flex-col items-center gap-2">
        <Label className="self-start">Profile Photo <span className="text-neutral-400 text-xs">(optional)</span></Label>
        <div className="relative group">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            className="hidden"
            onChange={handleProfileImageSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-neutral-300 hover:border-purple-400 transition-colors duration-200 block"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Profile preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-neutral-100 flex flex-col items-center justify-center gap-1">
                <User className="w-7 h-7 text-neutral-400" />
                <span className="text-[9px] text-neutral-400 leading-tight text-center px-1">Add Photo</span>
              </div>
            )}
          </button>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white pointer-events-none">
            <Camera className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>

      {formFields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label>{field.label}</Label>
          {field.name === "phoneNumber" ? (
            <div className="flex">
              <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-gray-50">
                <Flag className="w-4 h-4 text-gray-500" />
                <span className="ml-2 text-sm text-gray-500">+92</span>
              </div>
              <Input
                type={field.type}
                placeholder={field.place}
                className="rounded-l-none"
                value={
                  String(formData[field.name as keyof typeof formData]) ?? ""
                }
                onChange={(e) => handleChange(e, field.name)}
              />
            </div>
          ) : field.type === "password" ? (
            <PasswordInput
              placeholder={field.place}
              value={String(
                formData[field.name as keyof typeof formData] ?? "",
              )}
              onChange={(e) => handleChange(e as React.ChangeEvent<HTMLInputElement>, field.name)}
              onBlur={(e) => handleBlur(e as React.FocusEvent<HTMLInputElement>, field.name)}
            />
          ) : (
            <Input
              type={field.type || "text"}
              placeholder={field.place}
              value={String(
                formData[field.name as keyof typeof formData] ?? "",
              )}
              onChange={(e) => handleChange(e, field.name)}
              onBlur={(e) => handleBlur(e, field.name)}
            />
          )}

          {errors[field.name] && (
            <p className="text-xs text-red-500">{errors[field.name]}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default PersonalDetails;

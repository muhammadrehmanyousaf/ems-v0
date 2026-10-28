import { FieldLabel } from "@/components/ui/field-help";
import type { FieldHelpKey } from "@/lib/field-help";
import React, { useEffect, useRef, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { PasswordInput } from "../ui/password-input";
import { Flag, Camera, User, X } from "lucide-react";
import { useFormContext } from "@/lib/context/form-context";
import { cn } from "@/lib/utils";
import { isValidPakistaniPhone, PHONE_VALIDATION_MESSAGE } from "@/lib/utils/pakistani-phone";
import axios from "axios";
import { BACKEND_URL } from "@/lib/backend-url";

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

  // 02-VR-RESILIENCE-V1 — derive the preview from formData.profileImageFile
  // so a restored draft re-shows the picture instead of just holding it in
  // form state with no UI cue. blob: URLs are revoked on unmount to avoid
  // leaks.
  useEffect(() => {
    const f = formData.profileImageFile;
    if (!f) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(f);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [formData.profileImageFile]);

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, profileImageFile: file }));
    e.target.value = "";
  };

  const handleProfileImageDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, profileImageFile: null }));
  };

  const formFields = [
    {
      label: "Full Name",
      place: "Enter your full name here",
      name: "fullName",
      help: "fullName" as FieldHelpKey,
    },
    {
      label: "Email",
      place: "Enter your email here",
      type: "email",
      name: "email",
      help: "email" as FieldHelpKey,
    },
    {
      label: "Phone Number",
      place: "3001234567",
      type: "tel",
      name: "phoneNumber",
      help: "phoneNumber" as FieldHelpKey,
    },
    {
      label: "Password",
      place: "At least 8 characters",
      type: "password",
      name: "password",
      help: "password" as FieldHelpKey,
    },
    {
      label: "Re-enter Password",
      place: "Confirm your password",
      type: "password",
      name: "re_enterPassword",
      help: "confirmPassword" as FieldHelpKey,
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
    let { value } = e.target;

    if (fieldName === "phoneNumber") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: value,
    }));

    setErrors((prevErrors) => {
      const next = { ...prevErrors, [fieldName]: "" };
      // Dynamic cross-field clearing
      if (fieldName === "password" && formData.re_enterPassword) {
        if (value === formData.re_enterPassword) {
          next.re_enterPassword = "";
        }
      }
      if (fieldName === "re_enterPassword" && formData.password) {
        if (value === formData.password) {
          next.re_enterPassword = "";
        }
      }
      return next;
    });
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    fieldName: string,
  ) => {
    const rawVal = e.target.value;
    const trimmed = rawVal.trim();

    if (fieldName === "fullName") {
      if (!trimmed) {
        setErrors((prev) => ({ ...prev, fullName: "Full Name is required" }));
      } else if (trimmed.length < 2) {
        setErrors((prev) => ({ ...prev, fullName: "Full Name is too short" }));
      }
    }

    if (fieldName === "email") {
      if (!trimmed) {
        setErrors((prev) => ({ ...prev, email: "Email is required" }));
      } else if (!validateEmail(trimmed)) {
        setErrors((prev) => ({
          ...prev,
          email: "Please enter a valid email address",
        }));
      } else {
        // WP36 / PUBLIC-031: learn on THIS step that the address is taken, not after the last one
        axios
          .get(`${BACKEND_URL}api/v1/auth/email-available`, { params: { email: trimmed } })
          .then((res) => {
            if (res.data?.data?.available === false) {
              setErrors((prev) => ({
                ...prev,
                email: "An account with this e-mail already exists. Sign in instead (Login page) or use another e-mail.",
              }));
            }
          })
          .catch(() => {
            /* a failed probe never blocks the form; the final submit still answers ACCOUNT_EXISTS */
          });
      }
    }

    if (fieldName === "phoneNumber") {
      if (!trimmed) {
        setErrors((prev) => ({ ...prev, phoneNumber: "Phone number is required" }));
      } else if (!isValidPakistaniPhone(trimmed) && !/^3\d{9}$/.test(trimmed)) {
        setErrors((prev) => ({
          ...prev,
          phoneNumber: "Enter a valid 10-digit number starting with 3 (e.g. 3001234567)",
        }));
      }
    }

    if (fieldName === "password") {
      if (!rawVal) {
        setErrors((prev) => ({ ...prev, password: "Password is required" }));
      } else if (rawVal.length < 8) {
        setErrors((prev) => ({ ...prev, password: "Password must be at least 8 characters" }));
      } else if (formData.re_enterPassword && rawVal !== formData.re_enterPassword) {
        setErrors((prev) => ({ ...prev, re_enterPassword: "Passwords do not match" }));
      }
    }

    if (fieldName === "re_enterPassword") {
      if (!rawVal) {
        setErrors((prev) => ({ ...prev, re_enterPassword: "Re-enter password is required" }));
      } else if (formData.password && rawVal !== formData.password) {
        setErrors((prev) => ({ ...prev, re_enterPassword: "Passwords do not match" }));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Image Picker */}
      <div className="flex flex-col items-center gap-2">
        <FieldLabel help="profilePhoto" wrapperClassName="self-start">Profile Photo <span className="text-neutral-400 text-xs">(optional)</span></FieldLabel>
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
            className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-neutral-300 hover:border-bridal-gold/55 transition-colors duration-200 block"
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
          {imagePreview ? (
            <button
              type="button"
              onClick={handleProfileImageDelete}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-colors"
              aria-label="Remove profile photo"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          ) : (
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-bridal-gold rounded-full flex items-center justify-center border-2 border-white pointer-events-none">
              <Camera className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </div>

      {formFields.map((field) => {
        const hasError = !!errors[field.name];
        return (
          <div key={field.name} className="space-y-2">
            <FieldLabel help={field.help}>{field.label}</FieldLabel>
            {field.name === "phoneNumber" ? (
              <div className="flex">
                <div className={cn(
                  "flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-gray-50 transition-colors",
                  hasError ? "border-red-500 bg-red-50/30" : "border-input"
                )}>
                  <Flag className="w-4 h-4 text-gray-500" />
                  <span className="ml-2 text-sm text-gray-500">+92</span>
                </div>
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder={field.place}
                  className={cn(
                    "rounded-l-none",
                    hasError && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30"
                  )}
                  value={
                    String(formData[field.name as keyof typeof formData] ?? "")
                  }
                  onChange={(e) => handleChange(e, field.name)}
                  onBlur={(e) => handleBlur(e, field.name)}
                  aria-invalid={hasError}
                />
              </div>
            ) : field.type === "password" ? (
              <PasswordInput
                id={field.name}
                name={field.name}
                placeholder={field.place}
                className={cn(
                  "w-full",
                  hasError && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30"
                )}
                value={String(
                  formData[field.name as keyof typeof formData] ?? "",
                )}
                onChange={(e) => handleChange(e as React.ChangeEvent<HTMLInputElement>, field.name)}
                onBlur={(e) => handleBlur(e as React.FocusEvent<HTMLInputElement>, field.name)}
                aria-invalid={hasError}
              />
            ) : (
              <Input
                id={field.name}
                name={field.name}
                type={field.type || "text"}
                placeholder={field.place}
                className={cn(
                  "w-full",
                  hasError && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30"
                )}
                value={String(
                  formData[field.name as keyof typeof formData] ?? "",
                )}
                onChange={(e) => handleChange(e, field.name)}
                onBlur={(e) => handleBlur(e, field.name)}
                aria-invalid={hasError}
              />
            )}

            {hasError && (
              <p className="text-xs text-red-500 font-medium" role="alert">
                {errors[field.name]}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PersonalDetails;

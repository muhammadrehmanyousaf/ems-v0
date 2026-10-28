import { FieldLabel } from '../ui/field-help';
import type { FieldHelpKey } from '@/lib/field-help';
import React, { useState } from 'react';
import { Input } from '../ui/input';
import FileUploader from './file-uploader';
import { Label } from '../ui/label';
import { Flag } from 'lucide-react';
import { useFormContext } from '@/lib/context/form-context';
import { cn } from '@/lib/utils';
import { isValidPakistaniPhone, PHONE_VALIDATION_MESSAGE } from '@/lib/utils/pakistani-phone';

interface ContactDetailsProps {
    setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
    errors: { [key: string]: string };
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    file: File | null;
};

const ContactDetails = ({ setErrors, errors, setFile, file }: ContactDetailsProps) => {
    const { setFormData, formData } = useFormContext();

    const formFields = [
        { name: 'name', help: 'brandName' as FieldHelpKey, label: 'Brand Name', place: 'Enter your Brand Name' },
        { name: 'secondaryContactNumber', help: 'secondaryContactNumber' as FieldHelpKey, label: 'Secondary Contact Number (optional)', place: '3001234567', type: 'tel' },
        { name: 'instagram', help: 'instagram' as FieldHelpKey, label: 'Instagram Link (optional)', place: 'Enter your Instagram link' },
        { name: 'facebook', help: 'facebook' as FieldHelpKey, label: 'Facebook Link (optional)', place: 'Enter your Facebook link' },
        { name: 'city', help: 'city' as FieldHelpKey, label: 'City', place: 'Enter your city' },
        { name: 'subArea', help: 'subArea' as FieldHelpKey, label: 'Sub Area', place: 'Enter your sub area (e.g., G-10 Markaz)' },
        { name: 'officeAddress', help: 'officeAddress' as FieldHelpKey, label: 'Office Address', place: 'Enter your office address here' },
        { name: 'officeGoogleLink', help: 'officeGoogleLink' as FieldHelpKey, label: 'Office Google map link (optional)', place: 'Enter here your Google map link' },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        let { value } = e.target;

        if (fieldName === "secondaryContactNumber") {
            value = value.replace(/\D/g, "").slice(0, 10);
        }

        setFormData((prevData) => ({ ...prevData, [fieldName]: value }));
        setErrors((prevErrors) => ({ ...prevErrors, [fieldName]: "" }));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>, fieldName: string) => {
        const raw = e.target.value;
        const value = raw.trim();

        const errorMap: { [key: string]: string } = {};

        if (fieldName === "name") {
            if (!value) {
                errorMap.name = "Brand Name is required";
            }
        }
        if (fieldName === "city") {
            if (!value) {
                errorMap.city = "City is required";
            } else if (!/^[a-zA-Z\s\-]+$/.test(value)) {
                errorMap.city = "City must contain letters only";
            }
        }
        if (fieldName === "subArea") {
            if (!value) {
                errorMap.subArea = "Sub Area is required";
            } else if (!/^[a-zA-Z0-9\s\-]+$/.test(value)) {
                errorMap.subArea = "Sub Area must contain letters, numbers, or hyphens only";
            }
        }
        if (fieldName === "officeAddress") {
            if (!value) {
                errorMap.officeAddress = "Office Address is required";
            } else if (value.includes("@") || /^https?:\/\//i.test(value)) {
                errorMap.officeAddress = "Please enter a valid office address";
            } else if (value.length < 5) {
                errorMap.officeAddress = "Office Address is too short";
            }
        }
        if (fieldName === "secondaryContactNumber" && value) {
            if (!isValidPakistaniPhone(value) && !/^3\d{9}$/.test(value)) {
                errorMap.secondaryContactNumber = PHONE_VALIDATION_MESSAGE;
            } else if (value === formData.phoneNumber) {
                errorMap.secondaryContactNumber = "Secondary number must be different from your primary phone number";
            }
        }
        if (fieldName === "instagram" && value && !/^https?:\/\/(www\.)?instagram\.com\/.+/i.test(value)) {
            errorMap.instagram = "Must be a valid Instagram link (e.g. https://instagram.com/youraccount)";
        }
        if (fieldName === "facebook" && value && !/^https?:\/\/(www\.)?facebook\.com\/.+/i.test(value)) {
            errorMap.facebook = "Must be a valid Facebook link (e.g. https://facebook.com/yourpage)";
        }
        if (fieldName === "officeGoogleLink" && value && !/google\.com\/maps|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl/i.test(value)) {
            errorMap.officeGoogleLink = "Must be a valid Google Maps link";
        }

        if (Object.keys(errorMap).length > 0) {
            setErrors((prev) => ({ ...prev, ...errorMap }));
        }
    };

    const handleFileUpload = (uploadedFile: File | null) => {
        setFile(uploadedFile);
        if (uploadedFile) {
            const fileUrl = URL.createObjectURL(uploadedFile);
            setFormData((prevData) => ({ ...prevData, profilePicture: fileUrl }));
            setErrors((prevErrors) => ({ ...prevErrors, profilePicture: "" }));
        } else {
            setFormData((prevData) => ({ ...prevData, profilePicture: "" }));
        }
    };

    return (
        <div className='space-y-6'>
            {formFields.slice(0, 2).map((field) => (
                field.name === 'name' ? (
                    <div key={field.name} className='flex items-center gap-5'>
                        <div>
                            <FileUploader setFile={handleFileUpload} file={file} />
                            {errors.profilePicture && <p className="text-xs text-red-500">{errors.profilePicture}</p>}
                        </div>
                        <div className='space-y-2 w-full'>
                            <FieldLabel help={field.help}>{field.label}</FieldLabel>
                            <Input
                                id={field.name}
                                name={field.name}
                                placeholder={field.place}
                                className={cn(
                                    'w-full',
                                    errors[field.name] && 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30'
                                )}
                                value={String(formData[field.name as keyof typeof formData]) ?? ''}
                                onChange={(e) => handleChange(e, field.name)}
                                onBlur={(e) => handleBlur(e, field.name)}
                                aria-invalid={!!errors[field.name]}
                            />
                            {errors[field.name] && <p className="text-xs text-red-500 font-medium" role="alert">{errors[field.name]}</p>}
                        </div>
                    </div>
                ) : (
                    <div key={field.name} className="space-y-2">
                        <FieldLabel help={field.help}>{field.label}</FieldLabel>
                        <div className="flex">
                            <div className={cn(
                                "flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-gray-50 transition-colors",
                                errors[field.name] ? "border-red-500 bg-red-50/30" : "border-input"
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
                                    errors[field.name] && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30"
                                )}
                                value={String(formData[field.name as keyof typeof formData]) ?? ''}
                                onChange={(e) => handleChange(e, field.name)}
                                onBlur={(e) => handleBlur(e, field.name)}
                                aria-invalid={!!errors[field.name]}
                            />
                        </div>
                        {errors[field.name] && <p className="text-xs text-red-500 font-medium" role="alert">{errors[field.name]}</p>}
                    </div>
                )
            ))}

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="px-2 bg-white text-gray-500">Social Media Links</span>
                </div>
            </div>

            {formFields.slice(2).map((field, i) => (
                <div key={i} className='space-y-2 w-full'>
                    <FieldLabel help={field.help}>{field.label}</FieldLabel>
                    <Input
                        id={field.name}
                        name={field.name}
                        placeholder={field.place}
                        className={cn(
                            'w-full',
                            errors[field.name] && 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30'
                        )}
                        value={String(formData[field.name as keyof typeof formData]) ?? ''}
                        onChange={(e) => handleChange(e, field.name)}
                        onBlur={(e) => handleBlur(e, field.name)}
                        aria-invalid={!!errors[field.name]}
                    />
                    {errors[field.name] && <p className="text-xs text-red-500 font-medium" role="alert">{errors[field.name]}</p>}
                </div>
            ))}

        </div>
    );
};

export default ContactDetails;

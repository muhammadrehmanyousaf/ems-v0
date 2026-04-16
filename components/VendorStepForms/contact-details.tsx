import React, { useState } from 'react';
import { Input } from '../ui/input';
import FileUploader from './file-uploader';
import { Label } from '../ui/label';
import { Flag } from 'lucide-react';
import { useFormContext } from '@/lib/context/form-context';

interface ContactDetailsProps {
    setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
    errors: { [key: string]: string };
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    file: File | null;
};

const ContactDetails = ({ setErrors, errors, setFile, file }: ContactDetailsProps) => {
    const { setFormData, formData } = useFormContext();

    const formFields = [
        { name: 'name', label: 'Brand Name', place: 'Enter your Brand Name' },
        { name: 'secondaryContactNumber', label: 'Secondary Contact Number (optional)', place: '3001234567', type: 'tel' },
        { name: 'instagram', label: 'Instagram Link (optional)', place: 'Enter your Instagram link' },
        { name: 'facebook', label: 'Facebook Link (optional)', place: 'Enter your Facebook link' },
        { name: 'city', label: 'City', place: 'Enter your city' },
        { name: 'subArea', label: 'Sub Area', place: 'Enter your sub area (e.g., G-10 Markaz)' },
        { name: 'officeAddress', label: 'Office Address', place: 'Enter your office address here' },
        { name: 'officeGoogleLink', label: 'Office Google map link (optional)', place: 'Enter here your Google map link' },
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
        const value = e.target.value;
        if (!value) return;

        const errorMap: { [key: string]: string } = {};

        if (fieldName === "secondaryContactNumber") {
            if (!/^3\d{9}$/.test(value)) {
                errorMap.secondaryContactNumber = "Enter a valid 10-digit number starting with 3 (e.g. 3001234567)";
            } else if (value === formData.phoneNumber) {
                errorMap.secondaryContactNumber = "Secondary number must be different from your primary phone number";
            }
        }
        if (fieldName === "instagram" && !/^https?:\/\/(www\.)?instagram\.com\/.+/i.test(value)) {
            errorMap.instagram = "Must be a valid Instagram link (e.g. https://instagram.com/youraccount)";
        }
        if (fieldName === "facebook" && !/^https?:\/\/(www\.)?facebook\.com\/.+/i.test(value)) {
            errorMap.facebook = "Must be a valid Facebook link (e.g. https://facebook.com/yourpage)";
        }
        if (fieldName === "city" && !/^[a-zA-Z\s\-]+$/.test(value)) {
            errorMap.city = "City must contain letters only";
        }
        if (fieldName === "subArea" && !/^[a-zA-Z0-9\s\-]+$/.test(value)) {
            errorMap.subArea = "Sub Area must contain letters, numbers, or hyphens only";
        }
        if (fieldName === "officeAddress") {
            if (value.includes("@") || /^https?:\/\//i.test(value)) {
                errorMap.officeAddress = "Please enter a valid office address";
            } else if (value.trim().length < 5) {
                errorMap.officeAddress = "Office Address is too short";
            }
        }
        if (fieldName === "officeGoogleLink" && !/google\.com\/maps|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl/i.test(value)) {
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
                            <Label>{field.label}</Label>
                            <Input
                                placeholder={field.place}
                                className='w-full'
                                value={String(formData[field.name as keyof typeof formData]) ?? ''}
                                onChange={(e) => handleChange(e, field.name)}
                            />
                            {errors[field.name] && <p className="text-xs text-red-500">{errors[field.name]}</p>}
                        </div>
                    </div>
                ) : (
                    <div key={field.name} className="space-y-2">
                        <Label>{field.label}</Label>
                        <div className="flex">
                            <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-gray-50">
                                <Flag className="w-4 h-4 text-gray-500" />
                                <span className="ml-2 text-sm text-gray-500">+92</span>
                            </div>
                            <Input
                                type={field.type}
                                inputMode="numeric"
                                maxLength={10}
                                placeholder={field.place}
                                className="rounded-l-none"
                                value={String(formData[field.name as keyof typeof formData]) ?? ''}
                                onChange={(e) => handleChange(e, field.name)}
                                onBlur={(e) => handleBlur(e, field.name)}
                            />
                        </div>
                        {errors[field.name] && <p className="text-xs text-red-500">{errors[field.name]}</p>}
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
                    <Label>{field.label}</Label>
                    <Input
                        placeholder={field.place}
                        className='w-full'
                        value={String(formData[field.name as keyof typeof formData]) ?? ''}
                        onChange={(e) => handleChange(e, field.name)}
                        onBlur={(e) => handleBlur(e, field.name)}
                    />
                    {errors[field.name] && <p className="text-xs text-red-500">{errors[field.name]}</p>}
                </div>
            ))}

        </div>
    );
};

export default ContactDetails;

import React, { useState } from 'react';
import { Input } from '../ui/input';
import FileUploader from './file-uploader';
import { Label } from '../ui/label';
import { Flag } from 'lucide-react';
import { useFormContext } from '@/lib/context/form-context';

const ContactDetails = () => {
    const { setFormData, formData } = useFormContext();
    const [file, setFile] = useState<File | null>(null);

    const formFields = [
        {
            name: 'brandName',
            label: 'Brand Name',
            place: 'Enter your Brand Name'
        },
        {
            name: 'secondaryContactNumber',
            label: 'Secondary Contact Number',
            place: 'Enter your Secondary Contact Number',
            type: 'number'
        },
        {
            name: 'instagram',
            label: 'Instagram Link',
            place: 'Enter your Instagram link',
        },
        {
            name: 'facebook',
            label: 'Facebook Link',
            place: 'Enter your Facebook link',
        },
        {
            name: 'city',
            label: 'City',
            place: 'Enter your city',
        },
        {
            name: 'officeAddress',
            label: 'Office Address',
            place: 'Enter your office address here',
        },
        {
            name: 'officeGoogleLink',
            label: 'Office Google map link',
            place: 'Enter here your Google map link',
        },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const { value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [fieldName]: value,
        }));
    };

    const handleFileUpload = (uploadedFile: File | null) => {
        setFile(uploadedFile);
        if (uploadedFile) {
            const fileUrl = URL.createObjectURL(uploadedFile);
            setFormData((prevData) => ({
                ...prevData,
                profilePicture: fileUrl,
            }));
        }
    };

    return (
        <div className='space-y-6'>
            {formFields.slice(0, 2).map((field) => (
                field.name === 'brandName' ? (
                    <div key={field.name} className='flex items-center gap-5'>
                        <FileUploader setFile={handleFileUpload} file={file} />
                        <div className='space-y-2 w-full'>
                            <Label>{field.label}</Label>
                            <Input 
                                placeholder={field.place} 
                                className='w-full' 
                                value={String(formData[field.name as keyof typeof formData]) ?? ''}
                                onChange={(e) => handleChange(e, field.name)}
                            />
                        </div>
                    </div>
                ) : (
                    <div key={field.name} className="flex">
                        <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-gray-50">
                            <Flag className="w-4 h-4 text-gray-500" />
                            <span className="ml-2 text-sm text-gray-500">+92</span>
                        </div>
                        <Input
                            type={field.type}
                            placeholder={field.place}
                            className="rounded-l-none"
                            value={String(formData[field.name as keyof typeof formData]) ?? ''}
                            onChange={(e) => handleChange(e, field.name)}
                        />
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
                    />
                </div>
            ))}
        </div>
    );
};

export default ContactDetails;

import React from 'react'
import { Input } from '../ui/input'
import FileUploader from './file-uploader'
import { Label } from '../ui/label'
import { Flag } from 'lucide-react'

const ContactDetails = () => {
    const formFields = [
        {
            label: 'Brand Name',
            place: 'Enter your Brand Name'
        },
        {
            label: 'Secondary Contact Number',
            place: 'Enter your Secondary Contact Number',
            type: 'number'
        },
        {
            label: 'Instagram Link',
            place: 'Enter your instagram link',
        },
        {
            label: 'Facebook Link',
            place: 'Enter your facebook link',
        },
        {
            label: 'City',
            place: 'Enter your city',
        },
        {
            label: 'Office Address',
            place: 'Enter your office address here',
        },
        {
            label: 'Office Google map link',
            place: 'Enter here your google map link',
        },
    ]
    return (
        <div className='space-y-6'>
            {formFields.slice(0, 2).map((field) => (
                field.label === 'Brand Name' ? (
                    <div key={field.label} className='flex items-center gap-5'>
                        <FileUploader />
                        <div className='space-y-2 w-full'>
                            <Label>{field.label}</Label>
                            <Input placeholder={field.place} className='w-full' />
                        </div>
                    </div>
                ) :
                    (
                        <div className="flex">
                        <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-gray-50">
                          <Flag className="w-4 h-4 text-gray-500" />
                          <span className="ml-2 text-sm text-gray-500">+92</span>
                        </div>
                        <Input
                          type={field.type}
                          placeholder={field.place}
                          className="rounded-l-none"
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
                    <Input placeholder={field.place} className='w-full' />
                </div>
            ))}
        </div>
    )
}

export default ContactDetails

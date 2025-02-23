import React from 'react'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Flag } from 'lucide-react'

const PersonalDetails = () => {
  const formFields = [
    {
      label: 'Full Name',
      place: 'Enter your full name here'
    },
    {
      label: 'Email',
      place: 'Enter your email here',
      type: 'email'
    },
    {
      label: 'Phone Number',
      place: '+92 123xxxxxx',
      type: 'number'
    },
    {
      label: 'Password',
      place: '***********',
      type: 'password'
    },
    {
      label: 'Re-enter Password',
      place: '***********',
      type: 'password'
    }
  ]
  return (
    <div className='space-y-6'>
      {formFields.map((field) => (
        <div className='space-y-2'>
          <Label>{field.label}</Label>
          {field.label === 'Phone Number' ? (
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
            :
            (<Input
              type={field.type || 'text'}
              placeholder={field.place}
            />)}
        </div>
      ))}
    </div>
  )
}

export default PersonalDetails

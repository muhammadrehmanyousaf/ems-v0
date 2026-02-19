"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BookingFormData } from "@/lib/types"
import { User, Phone, Mail, Lock } from "lucide-react"
import { motion } from "framer-motion"

interface UserInfoStepProps {
  formData: BookingFormData
  updateFormData: React.Dispatch<React.SetStateAction<BookingFormData>>
}

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function UserInfoStep({ formData, updateFormData }: UserInfoStepProps) {
  const fields = [
    {
      id: 'username',
      label: 'Full Name',
      icon: User,
      type: 'text',
      placeholder: 'Enter your full name',
      value: formData.username,
      onChange: (v: string) => updateFormData({ ...formData, username: v }),
    },
    {
      id: 'phoneNumber',
      label: 'Phone Number',
      icon: Phone,
      type: 'tel',
      placeholder: '+92 300 1234567',
      value: formData.phoneNumber ?? '',
      onChange: (v: string) => updateFormData({ ...formData, phoneNumber: String(v) }),
    },
    {
      id: 'email',
      label: 'Email Address',
      icon: Mail,
      type: 'email',
      placeholder: 'you@example.com',
      value: formData.email,
      onChange: (v: string) => updateFormData({ ...formData, email: v }),
    },
  ]

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="visible">
      <motion.div variants={item}>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">Your Details</h2>
        <p className="mt-1 text-sm text-neutral-500">We&apos;ll use this to confirm your booking</p>
      </motion.div>

      <div className="space-y-4">
        {fields.map((field) => (
          <motion.div key={field.id} variants={item} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-sm font-medium text-neutral-700">
              {field.label}
            </Label>
            <div className="relative">
              <field.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="pl-10 h-11 rounded-lg border-neutral-200 bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all"
                required
              />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={item} className="flex items-center gap-2 text-xs text-neutral-400">
        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Your information is encrypted and only used for booking confirmation.</span>
      </motion.div>
    </motion.div>
  )
}

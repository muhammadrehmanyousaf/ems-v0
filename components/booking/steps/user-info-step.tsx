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
    <motion.div className="space-y-7" variants={container} initial="hidden" animate="visible">
      <motion.div variants={item}>
        <p className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-gold-dark mb-2">
          Step · Your details
        </p>
        <h2 className="font-display italic text-[28px] sm:text-[32px] text-bridal-charcoal leading-tight">
          Tell us a little about you
        </h2>
        <p className="mt-2 font-bridal text-[14px] text-bridal-text-soft">
          We&apos;ll use this to confirm your booking and send your invoice.
        </p>
      </motion.div>

      <div className="space-y-5">
        {fields.map((field) => (
          <motion.div key={field.id} variants={item} className="space-y-2">
            <Label htmlFor={field.id} className="font-bridal text-[10.5px] uppercase tracking-[0.25em] font-medium text-bridal-text-label">
              {field.label}
            </Label>
            <div className="relative">
              <field.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-bridal-gold" />
              <Input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="pl-10 h-12 rounded-[4px] border-bridal-beige bg-bridal-ivory font-bridal text-bridal-charcoal placeholder:text-bridal-text-soft focus-visible:border-bridal-gold/55 focus-visible:ring-1 focus-visible:ring-bridal-gold transition-all"
                required
              />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={item} className="flex items-center gap-2 font-bridal text-[12px] text-bridal-text-soft px-4 py-3 rounded-md bg-bridal-cream border border-bridal-beige">
        <Lock className="w-3.5 h-3.5 flex-shrink-0 text-bridal-gold" />
        <span>Your information is encrypted and only used for booking confirmation.</span>
      </motion.div>
    </motion.div>
  )
}

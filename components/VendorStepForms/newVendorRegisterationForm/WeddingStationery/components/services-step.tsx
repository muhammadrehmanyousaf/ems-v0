'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useFormContext } from '@/lib/context/form-context';

interface ServicesStepProps {
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const TURNAROUND_OPTIONS = [
    '3-5 Days',
    '1 Week',
    '2 Weeks',
    '3 Weeks',
    '1 Month',
    '2 Months',
    '3+ Months',
];

type BooleanField =
    | 'travelToClientHome'
    | 'sellMehndi'
    | 'hasTeam'
    | 'provideDecorationItem'
    | 'provideFoodTesting'
    | 'provideWaiter'
    | 'provideSoundSystem'
    | 'provideSeatingArrangement'
    | 'providePlate'
    | 'parking';

interface ServiceToggle {
    field: BooleanField;
    label: string;
    description: string;
}

// Mapping boolean model fields to stationery-specific service labels
const SERVICE_TOGGLES: ServiceToggle[] = [
    { field: 'travelToClientHome',       label: 'Home / Courier Delivery',       description: 'Deliver orders to client\'s home or via courier' },
    { field: 'sellMehndi',               label: 'Customisation Available',        description: 'Custom names, wording, and personalised designs' },
    { field: 'hasTeam',                  label: 'Digital Invitation Files',       description: 'Provide WhatsApp-ready / social media digital invites' },
    { field: 'provideDecorationItem',    label: 'Wax Seal / Stamp Available',     description: 'Offer custom wax seals or pre-made wax coins' },
    { field: 'provideFoodTesting',       label: 'Calligraphy Available',          description: 'Hand-written or printed calligraphy text' },
    { field: 'provideWaiter',            label: 'Envelope Included',              description: 'Matching envelopes provided with every card' },
    { field: 'provideSoundSystem',       label: 'Rush Orders Accepted',           description: 'Can fulfil urgent orders on short notice' },
    { field: 'provideSeatingArrangement', label: 'Bilingual Printing',            description: 'Urdu + English text on the same card' },
    { field: 'providePlate',             label: 'Acrylic Cards Available',        description: 'Offer premium clear or frosted acrylic invitations' },
    { field: 'parking',                  label: 'Nationwide Delivery',            description: 'Deliver orders across all cities in Pakistan' },
];

const ServicesStep = ({ errors, setErrors }: ServicesStepProps) => {
    const { formData, setFormData } = useFormContext();

    const toggle = (field: BooleanField) => {
        setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
                Tell customers what services your stationery business offers. Toggle each service on or off, and set your typical production turnaround time.
            </p>

            {/* Service Toggles */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Services Offered</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SERVICE_TOGGLES.map(({ field, label, description }) => {
                        const isOn = formData[field] as boolean;
                        return (
                            <button
                                key={field}
                                type="button"
                                onClick={() => toggle(field)}
                                className={`flex items-start justify-between px-4 py-3 rounded-lg border text-left text-sm transition-colors ${
                                    isOn
                                        ? 'bg-primary/10 border-primary/30 text-primary'
                                        : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                                }`}
                            >
                                <div className="flex-1 min-w-0 mr-3">
                                    <span className="font-medium block">{label}</span>
                                    <span className="text-xs mt-0.5 block opacity-70">{description}</span>
                                </div>
                                <span className={`text-xs font-semibold shrink-0 mt-0.5 ${isOn ? 'text-primary' : 'text-neutral-400'}`}>
                                    {isOn ? 'Yes' : 'No'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Turnaround Time */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Production Turnaround</h3>
                <div className="max-w-xs">
                    <Label className="text-sm font-medium text-neutral-700 block mb-1">
                        Typical production time <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-neutral-500 mb-2">
                        How long does it take from order confirmation to delivery?
                    </p>
                    <Select
                        value={formData.instruction}
                        onValueChange={(value) => {
                            setFormData((prev) => ({ ...prev, instruction: value }));
                            setErrors((prev) => ({ ...prev, instruction: '' }));
                        }}
                    >
                        <SelectTrigger className={errors.instruction ? 'border-red-500' : 'border-neutral-300'}>
                            <SelectValue placeholder="Select turnaround time" />
                        </SelectTrigger>
                        <SelectContent>
                            {TURNAROUND_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.instruction && (
                        <p className="text-red-500 text-sm mt-1">{errors.instruction}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServicesStep;

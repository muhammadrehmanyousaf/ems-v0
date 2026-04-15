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

const LEAD_TIME_OPTIONS = [
    '1 Week',
    '2 Weeks',
    '1 Month',
    '2 Months',
    '3 Months',
    '4+ Months',
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

const SERVICE_TOGGLES: ServiceToggle[] = [
    { field: 'travelToClientHome', label: 'Home Delivery', description: 'Deliver outfits to client\'s home' },
    { field: 'sellMehndi', label: 'Rental Available', description: 'Customers can rent outfits instead of buying' },
    { field: 'hasTeam', label: 'Bridesmaid Outfits', description: 'Also cater to bridesmaid / family dressing' },
    { field: 'provideDecorationItem', label: 'Design Consultation', description: 'Offer personalized design consultation sessions' },
    { field: 'provideFoodTesting', label: 'Trial / Fitting Session', description: 'Allow trial and fitting before final order' },
    { field: 'provideWaiter', label: 'Alteration Service', description: 'Provide in-house alteration and stitching adjustments' },
    { field: 'provideSoundSystem', label: 'Accessory Matching', description: 'Help match jewellery, shoes, and accessories' },
    { field: 'provideSeatingArrangement', label: 'Dupatta Styling', description: 'Offer dupatta pinning / draping service' },
    { field: 'providePlate', label: 'Groom Wear Available', description: 'Also carry sherwani and groom outfits' },
    { field: 'parking', label: 'Rush Orders Accepted', description: 'Can fulfil urgent orders on short notice' },
];

const ServicesStep = ({ errors, setErrors }: ServicesStepProps) => {
    const { formData, setFormData } = useFormContext();

    const toggle = (field: BooleanField) => {
        setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
                Tell customers what services your store offers. Toggle each service on or off, and set your typical stitching / order lead time.
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

            {/* Lead Time */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Order Lead Time</h3>
                <div className="max-w-xs">
                    <Label className="text-sm font-medium text-neutral-700 block mb-1">
                        Typical delivery / stitching time <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-neutral-500 mb-2">
                        How much notice do you need before the wedding date?
                    </p>
                    <Select
                        value={formData.instruction}
                        onValueChange={(value) => {
                            setFormData((prev) => ({ ...prev, instruction: value }));
                            setErrors((prev) => ({ ...prev, instruction: '' }));
                        }}
                    >
                        <SelectTrigger className={errors.instruction ? 'border-red-500' : 'border-neutral-300'}>
                            <SelectValue placeholder="Select lead time" />
                        </SelectTrigger>
                        <SelectContent>
                            {LEAD_TIME_OPTIONS.map((opt) => (
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

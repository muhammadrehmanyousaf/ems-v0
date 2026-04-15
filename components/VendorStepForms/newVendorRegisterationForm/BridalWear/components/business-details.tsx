'use client';

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useFormContext } from '@/lib/context/form-context';

interface Errors {
    description?: string;
    downPaymentType?: string;
    downPayment?: string;
    cancelationPolicy?: string;
    [key: string]: unknown;
}

interface BusinessDetailsProps {
    errors: Errors;
    setErrors: React.Dispatch<React.SetStateAction<Errors>>;
}

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];
const CANCELLATION_POLICIES = ['Refundable', 'Partially Refundable', 'Non-refundable'];
const DOWN_PAYMENT_TYPES = ['Percentage', 'Fixed Amount'];

const BridalWearBusinessDetails = ({ errors, setErrors }: BusinessDetailsProps) => {
    const { formData, setFormData } = useFormContext();

    const [selectedCities, setSelectedCities] = useState<string[]>(formData.cityCovered ?? []);
    const [downPaymentType, setDownPaymentType] = useState<string>(formData.downPaymentType || 'Percentage');

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            cityCovered: selectedCities,
            downPaymentType,
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCities, downPaymentType]);

    const toggleCity = (city: string) => {
        setSelectedCities((prev) =>
            prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
        );
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Column */}
                <div className="space-y-6">

                    {/* Business Description */}
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Business Overview</h3>
                        <div>
                            <Label htmlFor="bw-description" className="text-sm font-medium text-neutral-700">
                                Business Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="bw-description"
                                placeholder="Describe your bridal wear store, specialties, and years of experience..."
                                value={formData.description}
                                onChange={(e) => {
                                    setFormData((prev) => ({ ...prev, description: e.target.value }));
                                    setErrors((prev) => ({ ...prev, description: '' }));
                                }}
                                className={`mt-1 min-h-[120px] ${errors.description ? 'border-red-500' : 'border-neutral-300'}`}
                            />
                            {errors.description && (
                                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Cities Served */}
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Service Area</h3>
                        <div>
                            <Label className="text-sm font-medium text-neutral-700 block mb-2">
                                Cities Served
                            </Label>
                            <p className="text-xs text-neutral-500 mb-3">
                                Select cities where you offer delivery or home visits.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {CITIES.map((city) => {
                                    const isSelected = selectedCities.includes(city);
                                    return (
                                        <Badge
                                            key={city}
                                            variant={isSelected ? 'default' : 'outline'}
                                            className={`cursor-pointer text-sm px-3 py-1.5 transition-colors ${
                                                isSelected
                                                    ? 'bg-primary hover:bg-primary/90'
                                                    : 'hover:bg-muted'
                                            }`}
                                            onClick={() => toggleCity(city)}
                                        >
                                            {city}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">

                    {/* Down Payment */}
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Pricing & Payment</h3>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-neutral-700">
                                    Down Payment <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex gap-3 mt-1">
                                    <Select
                                        value={downPaymentType}
                                        onValueChange={(value) => {
                                            setDownPaymentType(value);
                                            setFormData((prev) => ({ ...prev, downPaymentType: value }));
                                            setErrors((prev) => ({ ...prev, downPaymentType: '' }));
                                        }}
                                    >
                                        <SelectTrigger className="w-36 border-neutral-300">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DOWN_PAYMENT_TYPES.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        placeholder={downPaymentType === 'Percentage' ? 'e.g. 30' : 'e.g. 10000'}
                                        value={formData.downPayment || ''}
                                        min={1}
                                        onKeyDown={(e) => {
                                            if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                                        }}
                                        onChange={(e) => {
                                            const num = Number(e.target.value);
                                            setFormData((prev) => ({ ...prev, downPayment: isNaN(num) ? 0 : num }));
                                            setErrors((prev) => ({ ...prev, downPayment: '' }));
                                        }}
                                        className={`flex-1 ${errors.downPayment ? 'border-red-500' : 'border-neutral-300'}`}
                                    />
                                </div>
                                {errors.downPayment && (
                                    <p className="text-red-500 text-sm mt-1">{errors.downPayment}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cancellation Policy */}
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Business Policy</h3>
                        <div>
                            <Label className="text-sm font-medium text-neutral-700 block mb-1">
                                Cancellation Policy <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.cancelationPolicy}
                                onValueChange={(value) => {
                                    setFormData((prev) => ({ ...prev, cancelationPolicy: value }));
                                    setErrors((prev) => ({ ...prev, cancelationPolicy: '' }));
                                }}
                            >
                                <SelectTrigger className={`border-neutral-300 ${errors.cancelationPolicy ? 'border-red-500' : ''}`}>
                                    <SelectValue placeholder="Select cancellation policy" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CANCELLATION_POLICIES.map((policy) => (
                                        <SelectItem key={policy} value={policy}>{policy}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.cancelationPolicy && (
                                <p className="text-red-500 text-sm mt-1">{errors.cancelationPolicy}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BridalWearBusinessDetails;

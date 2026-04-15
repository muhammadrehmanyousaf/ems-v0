'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useFormContext } from '@/lib/context/form-context';

interface StoreProfileStepProps {
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const STORE_TYPES = [
    'Boutique',
    'Designer Studio',
    'Rental Store',
    'Multi-brand Outlet',
    'Online Boutique',
];

const OCCASIONS = [
    'Bridal (Barat)',
    'Walima',
    'Engagement',
    'Mehndi / Mayun',
    'Nikah',
    'Post-wedding',
    'Bridesmaid',
];

const OUTFIT_CATEGORIES = [
    'Bridal Lehenga',
    'Sharara',
    'Gharara',
    'Farshi Gharara',
    'Maxi',
    'Anarkali',
    'Saree',
    'Western Bridal',
    'Groom Sherwani',
    'Nikah Dress',
];

const FABRICS = [
    'Silk',
    'Organza',
    'Net',
    'Velvet',
    'Chiffon',
    'Cotton',
    'Khaddar',
    'Banarsi',
    'Jamawar',
    'Tissue',
    'Karandi',
];

const StoreProfileStep = ({ errors, setErrors }: StoreProfileStepProps) => {
    const { formData, setFormData } = useFormContext();

    const storeType = formData.subBusinessType?.[0] ?? '';
    const occasions = formData.expertise ?? [];
    const outfitCategories = formData.amenities ?? [];
    const fabrics = formData.serviceProvided ?? [];

    const setStoreType = (value: string) => {
        setFormData((prev) => ({ ...prev, subBusinessType: [value] }));
        setErrors((prev) => ({ ...prev, subBusinessType: '' }));
    };

    const toggleOccasion = (item: string) => {
        const next = occasions.includes(item)
            ? occasions.filter((o) => o !== item)
            : [...occasions, item];
        setFormData((prev) => ({ ...prev, expertise: next }));
    };

    const toggleCategory = (item: string) => {
        const next = outfitCategories.includes(item)
            ? outfitCategories.filter((c) => c !== item)
            : [...outfitCategories, item];
        setFormData((prev) => ({ ...prev, amenities: next }));
    };

    const toggleFabric = (item: string) => {
        const next = fabrics.includes(item)
            ? fabrics.filter((f) => f !== item)
            : [...fabrics, item];
        setFormData((prev) => ({ ...prev, serviceProvided: next }));
    };

    return (
        <div className="space-y-6">

            {/* Store Type */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Store Type</h3>
                <div>
                    <Label className="text-sm font-medium text-neutral-700 block mb-1">
                        What type of store do you operate? <span className="text-red-500">*</span>
                    </Label>
                    <Select value={storeType} onValueChange={setStoreType}>
                        <SelectTrigger className={errors.subBusinessType ? 'border-red-500' : 'border-neutral-300'}>
                            <SelectValue placeholder="Select store type" />
                        </SelectTrigger>
                        <SelectContent>
                            {STORE_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.subBusinessType && (
                        <p className="text-red-500 text-sm mt-1">{errors.subBusinessType}</p>
                    )}
                </div>
            </div>

            {/* Occasions / Specializations */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-800 mb-1">Occasions Catered</h3>
                <p className="text-xs text-neutral-500 mb-4">Select all occasions you dress brides/grooms for.</p>
                <div className="flex flex-wrap gap-2">
                    {OCCASIONS.map((item) => {
                        const isSelected = occasions.includes(item);
                        return (
                            <Badge
                                key={item}
                                variant={isSelected ? 'default' : 'outline'}
                                className={`cursor-pointer text-sm px-3 py-1.5 transition-colors ${
                                    isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'
                                }`}
                                onClick={() => toggleOccasion(item)}
                            >
                                {item}
                            </Badge>
                        );
                    })}
                </div>
            </div>

            {/* Outfit Categories */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-800 mb-1">Outfit Categories</h3>
                <p className="text-xs text-neutral-500 mb-4">Select all outfit types you carry in your store.</p>
                <div className="flex flex-wrap gap-2">
                    {OUTFIT_CATEGORIES.map((item) => {
                        const isSelected = outfitCategories.includes(item);
                        return (
                            <Badge
                                key={item}
                                variant={isSelected ? 'default' : 'outline'}
                                className={`cursor-pointer text-sm px-3 py-1.5 transition-colors ${
                                    isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'
                                }`}
                                onClick={() => toggleCategory(item)}
                            >
                                {item}
                            </Badge>
                        );
                    })}
                </div>
            </div>

            {/* Fabrics */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-800 mb-1">Fabrics Available</h3>
                <p className="text-xs text-neutral-500 mb-4">Select the fabrics you work with.</p>
                <div className="flex flex-wrap gap-2">
                    {FABRICS.map((item) => {
                        const isSelected = fabrics.includes(item);
                        return (
                            <Badge
                                key={item}
                                variant={isSelected ? 'default' : 'outline'}
                                className={`cursor-pointer text-sm px-3 py-1.5 transition-colors ${
                                    isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'
                                }`}
                                onClick={() => toggleFabric(item)}
                            >
                                {item}
                            </Badge>
                        );
                    })}
                </div>
            </div>

            {/* Starting Price */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Price Range</h3>
                <div className="max-w-xs">
                    <Label htmlFor="bw-min-price" className="text-sm font-medium text-neutral-700">
                        Starting Price (PKR)
                    </Label>
                    <p className="text-xs text-neutral-500 mb-1">The lowest price of outfits in your store.</p>
                    <Input
                        id="bw-min-price"
                        type="number"
                        placeholder="e.g. 25000"
                        min={0}
                        value={formData.minimumPrice || ''}
                        onKeyDown={(e) => {
                            if (['.', '-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
                        }}
                        onChange={(e) => {
                            const num = Number(e.target.value);
                            setFormData((prev) => ({ ...prev, minimumPrice: isNaN(num) ? 0 : num }));
                        }}
                        className="border-neutral-300"
                    />
                </div>
            </div>
        </div>
    );
};

export default StoreProfileStep;

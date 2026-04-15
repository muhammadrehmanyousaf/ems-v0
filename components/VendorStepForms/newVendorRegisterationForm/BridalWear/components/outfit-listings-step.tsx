'use client';

import React, { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Shirt, PackageOpen, ImagePlus, X } from 'lucide-react';
import { useFormContext } from '@/lib/context/form-context';
import { useDropzone } from 'react-dropzone';

interface OutfitListingsStepProps {
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const OUTFIT_CATEGORIES = [
    'Bridal Lehenga', 'Sharara', 'Gharara', 'Farshi Gharara', 'Maxi',
    'Anarkali', 'Saree', 'Western Bridal', 'Groom Sherwani', 'Nikah Dress',
];
const FABRICS = [
    'Silk', 'Organza', 'Net', 'Velvet', 'Chiffon', 'Cotton', 'Khaddar', 'Banarsi', 'Jamawar', 'Tissue',
];
const OCCASIONS = [
    'Bridal (Barat)', 'Walima', 'Engagement', 'Mehndi / Mayun', 'Nikah', 'Post-wedding', 'Bridesmaid',
];
const COLORS = [
    'Red', 'Maroon', 'Pink', 'Gold', 'Silver', 'Ivory', 'White', 'Green', 'Blue', 'Purple',
    'Peach', 'Orange', 'Rust', 'Black', 'Multi-color',
];

interface OutfitFeatures {
    category: string[];
    fabric: string[];
    occasions: string[];
    color: string[];
}

interface OutfitPackage {
    id?: number;
    name: string;
    price: number;
    features: Record<string, string[]>;
}

const MAX_OUTFIT_IMAGES = 8;

// ── Per-outfit image uploader ─────────────────────────────────────────────────

interface OutfitImageUploaderProps {
    files: File[];
    onAdd: (files: File[]) => void;
    onRemove: (index: number) => void;
}

function OutfitImageUploader({ files, onAdd, onRemove }: OutfitImageUploaderProps) {
    const isAtLimit = files.length >= MAX_OUTFIT_IMAGES;

    const onDrop = useCallback(
        (accepted: File[]) => {
            const remaining = MAX_OUTFIT_IMAGES - files.length;
            onAdd(accepted.slice(0, remaining));
        },
        [files.length, onAdd]
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        multiple: true,
        disabled: isAtLimit,
        noClick: files.length > 0,
    });

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-neutral-700">Outfit Images</Label>
                <span className={`text-xs font-medium border px-2.5 py-1 rounded-full ${
                    isAtLimit
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-violet-50 text-violet-600 border-violet-200'
                }`}>
                    {files.length} / {MAX_OUTFIT_IMAGES}
                </span>
            </div>

            {files.length === 0 ? (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                        isDragActive
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-neutral-300 bg-neutral-50 hover:border-violet-400 hover:bg-violet-50/40'
                    }`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center py-7 text-center select-none">
                        <ImagePlus className={`w-7 h-7 mb-2 ${isDragActive ? 'text-violet-500' : 'text-neutral-400'}`} />
                        <p className="text-sm font-medium text-neutral-600">
                            {isDragActive ? 'Drop to upload' : 'Add outfit photos'}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                            JPG, PNG · up to {MAX_OUTFIT_IMAGES} images
                        </p>
                    </div>
                </div>
            ) : (
                <div
                    {...getRootProps({ onClick: (e) => e.stopPropagation() })}
                    className={`border-2 border-dashed rounded-xl p-3 transition-all duration-200 ${
                        isDragActive ? 'border-violet-400 bg-violet-50' : 'border-neutral-200 bg-neutral-50/40'
                    }`}
                >
                    <input {...getInputProps()} />
                    <div className="grid grid-cols-4 gap-2">
                        {files.map((file, i) => (
                            <div
                                key={`${file.name}-${i}`}
                                className="relative group aspect-square rounded-lg overflow-hidden border border-neutral-200 bg-white shadow-sm"
                            >
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                        {!isAtLimit && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); open(); }}
                                className="aspect-square rounded-lg border-2 border-dashed border-violet-300 bg-violet-50 hover:bg-violet-100 flex items-center justify-center transition-colors"
                            >
                                <ImagePlus className="w-5 h-5 text-violet-400" />
                            </button>
                        )}
                    </div>
                    {isDragActive && !isAtLimit && (
                        <p className="text-center text-violet-500 text-xs mt-2 font-medium">Drop images here</p>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

const OutfitListingsStep = ({ errors, setErrors }: OutfitListingsStepProps) => {
    const { formData, setFormData } = useFormContext();

    const packages: OutfitPackage[] = formData.packages ?? [];
    const imageFiles: File[][] = formData.packageImageFiles ?? [];

    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    // ── helpers ──────────────────────────────────────────────────────────────

    const setPackages = (nextPkgs: OutfitPackage[], nextImgFiles: File[][]) => {
        setFormData((prev) => ({ ...prev, packages: nextPkgs, packageImageFiles: nextImgFiles }));
    };

    const addOutfit = () => {
        const nextPkgs = [...packages, { id: undefined, name: '', price: 0, features: {} }];
        const nextImgs = [...imageFiles, []];
        setPackages(nextPkgs, nextImgs);
        setExpandedIdx(nextPkgs.length - 1);
    };

    const removeOutfit = (idx: number) => {
        const nextPkgs = packages.filter((_, i) => i !== idx);
        const nextImgs = imageFiles.filter((_, i) => i !== idx);
        setPackages(nextPkgs, nextImgs);
        if (expandedIdx === idx) setExpandedIdx(null);
        else if (expandedIdx !== null && expandedIdx > idx) setExpandedIdx(expandedIdx - 1);
    };

    const updateField = (idx: number, field: 'name' | 'price', value: string | number) => {
        const nextPkgs = packages.map((p, i) => i === idx ? { ...p, [field]: value } : p);
        setFormData((prev) => ({ ...prev, packages: nextPkgs }));
        setErrors((prev) => ({ ...prev, [`packages[${idx}].${field}`]: '' }));
    };

    const getFeatures = (pkg: OutfitPackage): OutfitFeatures => ({
        category: pkg.features?.category ?? [],
        fabric: pkg.features?.fabric ?? [],
        occasions: pkg.features?.occasions ?? [],
        color: pkg.features?.color ?? [],
    });

    const toggleFeature = (pkgIdx: number, featureKey: keyof OutfitFeatures, value: string) => {
        const pkg = packages[pkgIdx];
        const current: string[] = pkg.features?.[featureKey] ?? [];
        const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
        const nextPkgs = packages.map((p, i) =>
            i === pkgIdx ? { ...p, features: { ...p.features, [featureKey]: next } } : p
        );
        setFormData((prev) => ({ ...prev, packages: nextPkgs }));
    };

    const addImages = (idx: number, incoming: File[]) => {
        const nextImgs = imageFiles.map((arr, i) => {
            if (i !== idx) return arr;
            return [...arr, ...incoming].slice(0, MAX_OUTFIT_IMAGES);
        });
        // Ensure array is long enough
        while (nextImgs.length <= idx) nextImgs.push([]);
        setFormData((prev) => ({ ...prev, packageImageFiles: nextImgs }));
    };

    const removeImage = (outfitIdx: number, imgIdx: number) => {
        const nextImgs = imageFiles.map((arr, i) =>
            i === outfitIdx ? arr.filter((_, j) => j !== imgIdx) : arr
        );
        setFormData((prev) => ({ ...prev, packageImageFiles: nextImgs }));
    };

    // ── Empty state ───────────────────────────────────────────────────────────

    if (packages.length === 0) {
        return (
            <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                    Add individual outfit listings so customers can browse your collection. This step is optional — you can add listings later from the dashboard.
                </p>
                <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 flex flex-col items-center gap-4 bg-white/40">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <PackageOpen className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-neutral-700">No outfit listings yet</p>
                        <p className="text-sm text-neutral-500 mt-1">
                            Add outfits to showcase your collection to potential customers.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={addOutfit}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
                    >
                        <Plus className="w-4 h-4" />
                        Add Outfit
                    </Button>
                </div>
            </div>
        );
    }

    // ── List ─────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Add outfit listings with photos and details. Only name and price are required per listing.
            </p>

            {packages.map((pkg, idx) => {
                const features = getFeatures(pkg);
                const isExpanded = expandedIdx === idx;
                const outfitImages = imageFiles[idx] ?? [];

                return (
                    <div key={idx} className="border rounded-xl bg-white/50 backdrop-blur-sm overflow-hidden">
                        {/* Card Header */}
                        <div
                            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-neutral-50/60 transition-colors"
                            onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {outfitImages.length > 0 ? (
                                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-neutral-200 shrink-0">
                                        <img
                                            src={URL.createObjectURL(outfitImages[0])}
                                            alt="outfit"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Shirt className="w-4 h-4 text-primary" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-neutral-800 truncate">
                                        {pkg.name.trim() || `Outfit ${idx + 1}`}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {pkg.price > 0 && (
                                            <span className="text-xs text-neutral-500">PKR {pkg.price.toLocaleString()}</span>
                                        )}
                                        {outfitImages.length > 0 && (
                                            <span className="text-xs text-violet-500 font-medium">
                                                {outfitImages.length} photo{outfitImages.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeOutfit(idx); }}
                                    className="text-red-500 hover:bg-red-50 hover:text-red-600 w-8 h-8"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                                <span className="text-neutral-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                            </div>
                        </div>

                        {/* Expanded Body */}
                        {isExpanded && (
                            <div className="px-5 pb-5 space-y-5 border-t border-neutral-100 pt-4">

                                {/* Name + Price */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-neutral-700">
                                            Outfit Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            placeholder='e.g. "Red Silk Bridal Lehenga"'
                                            value={pkg.name}
                                            onChange={(e) => updateField(idx, 'name', e.target.value)}
                                            className={errors[`packages[${idx}].name`] ? 'border-red-500' : ''}
                                        />
                                        {errors[`packages[${idx}].name`] && (
                                            <p className="text-red-500 text-xs">{errors[`packages[${idx}].name`]}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-neutral-700">
                                            Price (PKR) <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 85000"
                                            min={0}
                                            value={pkg.price > 0 ? pkg.price : ''}
                                            onKeyDown={(e) => { if (['.', '-', 'e', 'E', '+'].includes(e.key)) e.preventDefault(); }}
                                            onChange={(e) => {
                                                const num = Number(e.target.value);
                                                updateField(idx, 'price', isNaN(num) ? 0 : num);
                                            }}
                                            className={errors[`packages[${idx}].price`] ? 'border-red-500' : ''}
                                        />
                                        {errors[`packages[${idx}].price`] && (
                                            <p className="text-red-500 text-xs">{errors[`packages[${idx}].price`]}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Images */}
                                <OutfitImageUploader
                                    files={outfitImages}
                                    onAdd={(files) => addImages(idx, files)}
                                    onRemove={(imgIdx) => removeImage(idx, imgIdx)}
                                />

                                {/* Category */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-neutral-700">Outfit Category</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {OUTFIT_CATEGORIES.map((item) => {
                                            const isSelected = features.category.includes(item);
                                            return (
                                                <Badge
                                                    key={item}
                                                    variant={isSelected ? 'default' : 'outline'}
                                                    className={`cursor-pointer text-xs px-2.5 py-1 transition-colors ${
                                                        isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'
                                                    }`}
                                                    onClick={() => toggleFeature(idx, 'category', item)}
                                                >
                                                    {item}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Fabric */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-neutral-700">Fabric</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {FABRICS.map((item) => {
                                            const isSelected = features.fabric.includes(item);
                                            return (
                                                <Badge
                                                    key={item}
                                                    variant={isSelected ? 'default' : 'outline'}
                                                    className={`cursor-pointer text-xs px-2.5 py-1 transition-colors ${
                                                        isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'
                                                    }`}
                                                    onClick={() => toggleFeature(idx, 'fabric', item)}
                                                >
                                                    {item}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Occasions */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-neutral-700">Suitable For</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {OCCASIONS.map((item) => {
                                            const isSelected = features.occasions.includes(item);
                                            return (
                                                <Badge
                                                    key={item}
                                                    variant={isSelected ? 'default' : 'outline'}
                                                    className={`cursor-pointer text-xs px-2.5 py-1 transition-colors ${
                                                        isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'
                                                    }`}
                                                    onClick={() => toggleFeature(idx, 'occasions', item)}
                                                >
                                                    {item}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Color */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-neutral-700">Color</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {COLORS.map((item) => {
                                            const isSelected = features.color.includes(item);
                                            return (
                                                <Badge
                                                    key={item}
                                                    variant={isSelected ? 'default' : 'outline'}
                                                    className={`cursor-pointer text-xs px-2.5 py-1 transition-colors ${
                                                        isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'
                                                    }`}
                                                    onClick={() => toggleFeature(idx, 'color', item)}
                                                >
                                                    {item}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            <Button
                variant="outline"
                type="button"
                onClick={addOutfit}
                className="flex items-center gap-2 text-primary border-primary hover:bg-primary hover:text-white"
            >
                <Plus className="w-4 h-4" />
                Add Another Outfit
            </Button>
        </div>
    );
};

export default OutfitListingsStep;

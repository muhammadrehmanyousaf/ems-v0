'use client';

import React, { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, PackageOpen, ImagePlus, X, Mail } from 'lucide-react';
import { useFormContext } from '@/lib/context/form-context';
import { useDropzone } from 'react-dropzone';

interface ProductListingsStepProps {
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const PRODUCT_TYPES = [
    'Invitation Card Suite',
    'Bid / Favour Box Set (بِد ڈبی)',
    'Nikkah Nama Booklet & Pen',
    'Haq Mehar Box / Envelope (حق مہر)',
    'Doodh Pilai Glass & Tray Set',
    'Salami Box / Envelope (سلامی)',
    'Sweet Box Set (مٹھائی ڈبی)',
    'Thank You Card Set',
    'Seating Chart',
    'Welcome Sign / Board',
    'Venue Stationery Bundle',
    'Digital Invitation Package',
    'Custom Gift Box',
    'Zamzam Bottle Label Set',
    'Full Wedding Stationery Bundle',
];

const EVENTS = [
    'Nikkah (نکاح)',
    'Mehndi (مہندی)',
    'Barat (برات)',
    'Walima (ولیمہ)',
    'Engagement / Mangni (منگنی)',
    'Mayun (مایوں)',
    'Dholki (ڈھولکی)',
    'All Events',
];

const MAX_PRODUCT_IMAGES = 8;

interface ProductPackage {
    id?: number;
    name: string;
    price: number;
    description?: string;
    features: Record<string, string[]>;
}

// ── Per-product image uploader ────────────────────────────────────────────────

interface ProductImageUploaderProps {
    files: File[];
    onAdd: (files: File[]) => void;
    onRemove: (index: number) => void;
}

function ProductImageUploader({ files, onAdd, onRemove }: ProductImageUploaderProps) {
    const isAtLimit = files.length >= MAX_PRODUCT_IMAGES;

    const onDrop = useCallback(
        (accepted: File[]) => {
            const remaining = MAX_PRODUCT_IMAGES - files.length;
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
                <Label className="text-sm font-medium text-neutral-700">Product Images</Label>
                <span className={`text-xs font-medium border px-2.5 py-1 rounded-full ${
                    isAtLimit
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-violet-50 text-violet-600 border-violet-200'
                }`}>
                    {files.length} / {MAX_PRODUCT_IMAGES}
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
                            {isDragActive ? 'Drop to upload' : 'Add product photos'}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                            JPG, PNG · up to {MAX_PRODUCT_IMAGES} images
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

const ProductListingsStep = ({ errors, setErrors }: ProductListingsStepProps) => {
    const { formData, setFormData } = useFormContext();

    const packages: ProductPackage[] = formData.packages ?? [];
    const imageFiles: File[][] = formData.packageImageFiles ?? [];

    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    const setPackages = (nextPkgs: ProductPackage[], nextImgFiles: File[][]) => {
        setFormData((prev) => ({ ...prev, packages: nextPkgs, packageImageFiles: nextImgFiles }));
    };

    const addProduct = () => {
        const nextPkgs = [...packages, { id: undefined, name: '', price: 0, description: '', features: {} }];
        const nextImgs = [...imageFiles, []];
        setPackages(nextPkgs, nextImgs);
        setExpandedIdx(nextPkgs.length - 1);
    };

    const removeProduct = (idx: number) => {
        const nextPkgs = packages.filter((_, i) => i !== idx);
        const nextImgs = imageFiles.filter((_, i) => i !== idx);
        setPackages(nextPkgs, nextImgs);
        if (expandedIdx === idx) setExpandedIdx(null);
        else if (expandedIdx !== null && expandedIdx > idx) setExpandedIdx(expandedIdx - 1);
    };

    const updateField = (idx: number, field: 'name' | 'price' | 'description', value: string | number) => {
        const nextPkgs = packages.map((p, i) => i === idx ? { ...p, [field]: value } : p);
        setFormData((prev) => ({ ...prev, packages: nextPkgs }));
        setErrors((prev) => ({ ...prev, [`packages[${idx}].${field}`]: '' }));
    };

    const getFeatures = (pkg: ProductPackage) => ({
        productType: pkg.features?.productType ?? [],
        event: pkg.features?.event ?? [],
    });

    const toggleFeature = (pkgIdx: number, featureKey: string, value: string) => {
        const pkg = packages[pkgIdx];
        const current: string[] = pkg.features?.[featureKey] ?? [];
        const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
        const nextPkgs = packages.map((p, i) =>
            i === pkgIdx ? { ...p, features: { ...p.features, [featureKey]: next } } : p
        );
        setFormData((prev) => ({ ...prev, packages: nextPkgs }));
    };

    const addImages = (idx: number, incoming: File[]) => {
        const nextImgs = [...imageFiles];
        while (nextImgs.length <= idx) nextImgs.push([]);
        nextImgs[idx] = [...(nextImgs[idx] ?? []), ...incoming].slice(0, MAX_PRODUCT_IMAGES);
        setFormData((prev) => ({ ...prev, packageImageFiles: nextImgs }));
    };

    const removeImage = (outfitIdx: number, imgIdx: number) => {
        const nextImgs = imageFiles.map((arr, i) =>
            i === outfitIdx ? arr.filter((_, j) => j !== imgIdx) : arr
        );
        setFormData((prev) => ({ ...prev, packageImageFiles: nextImgs }));
    };

    if (packages.length === 0) {
        return (
            <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                    Add individual product listings so customers can browse your offerings and request quotes. This step is optional — you can add listings later from your dashboard.
                </p>
                <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 flex flex-col items-center gap-4 bg-white/40">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <PackageOpen className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-neutral-700">No product listings yet</p>
                        <p className="text-sm text-neutral-500 mt-1">
                            Add your invitation suites, bid boxes, Nikkah stationery sets, and other products.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={addProduct}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Add stationery product listings with photos and details. Only name and price are required per listing.
            </p>

            {packages.map((pkg, idx) => {
                const features = getFeatures(pkg);
                const isExpanded = expandedIdx === idx;
                const productImages = imageFiles[idx] ?? [];

                return (
                    <div key={idx} className="border rounded-xl bg-white/50 backdrop-blur-sm overflow-hidden">
                        {/* Card Header */}
                        <div
                            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-neutral-50/60 transition-colors"
                            onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {productImages.length > 0 ? (
                                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-neutral-200 shrink-0">
                                        <img
                                            src={URL.createObjectURL(productImages[0])}
                                            alt="product"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Mail className="w-4 h-4 text-primary" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-neutral-800 truncate">
                                        {pkg.name.trim() || `Product ${idx + 1}`}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {pkg.price > 0 && (
                                            <span className="text-xs text-neutral-500">PKR {pkg.price.toLocaleString()}</span>
                                        )}
                                        {productImages.length > 0 && (
                                            <span className="text-xs text-violet-500 font-medium">
                                                {productImages.length} photo{productImages.length > 1 ? 's' : ''}
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
                                    onClick={(e) => { e.stopPropagation(); removeProduct(idx); }}
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
                                            Product Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            placeholder='e.g. "Gold Foil Nikkah Card Suite"'
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
                                            placeholder="e.g. 15000"
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

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-neutral-700">Description</Label>
                                    <Textarea
                                        placeholder="e.g. Gold foil Nikkah card with Urdu calligraphy, laser cut border, comes with envelope and wax seal. Minimum 100 cards."
                                        value={pkg.description ?? ''}
                                        onChange={(e) => updateField(idx, 'description', e.target.value)}
                                        className="min-h-[80px]"
                                    />
                                </div>

                                {/* Images */}
                                <ProductImageUploader
                                    files={productImages}
                                    onAdd={(files) => addImages(idx, files)}
                                    onRemove={(imgIdx) => removeImage(idx, imgIdx)}
                                />

                                {/* Product Type */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-neutral-700">Product Type</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {PRODUCT_TYPES.map((item) => {
                                            const isSelected = features.productType.includes(item);
                                            return (
                                                <Badge
                                                    key={item}
                                                    variant={isSelected ? 'default' : 'outline'}
                                                    className={`cursor-pointer text-xs px-2.5 py-1 transition-colors ${
                                                        isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'
                                                    }`}
                                                    onClick={() => toggleFeature(idx, 'productType', item)}
                                                >
                                                    {item}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Events */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-neutral-700">Suitable For</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {EVENTS.map((item) => {
                                            const isSelected = features.event.includes(item);
                                            return (
                                                <Badge
                                                    key={item}
                                                    variant={isSelected ? 'default' : 'outline'}
                                                    className={`cursor-pointer text-xs px-2.5 py-1 transition-colors ${
                                                        isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'
                                                    }`}
                                                    onClick={() => toggleFeature(idx, 'event', item)}
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
                onClick={addProduct}
                className="flex items-center gap-2 text-primary border-primary hover:bg-primary hover:text-white"
            >
                <Plus className="w-4 h-4" />
                Add Another Product
            </Button>
        </div>
    );
};

export default ProductListingsStep;

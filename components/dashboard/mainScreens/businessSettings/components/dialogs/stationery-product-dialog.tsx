'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PackagesAPI, type ApiPackage } from '@/lib/api/dashboard';
import { getImageUrl } from '@/lib/utils/image-utils';
import { toast } from 'sonner';
import { ImagePlus, Loader2, Mail, X } from 'lucide-react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';

// ── Constants (mirrors registration product-listings-step) ────────────────────

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

const MAX_IMAGES = 8;

// ── Image uploader (reuses dropzone, same style as registration) ───────────────

interface ImageUploaderProps {
    existingUrls: string[];
    newPreviews: string[];
    onAddFiles: (files: File[]) => void;
    onRemoveExisting: (idx: number) => void;
    onRemoveNew: (idx: number) => void;
}

function ImageUploader({ existingUrls, newPreviews, onAddFiles, onRemoveExisting, onRemoveNew }: ImageUploaderProps) {
    const total = existingUrls.length + newPreviews.length;
    const isAtLimit = total >= MAX_IMAGES;

    const onDrop = useCallback((accepted: File[]) => {
        const remaining = MAX_IMAGES - total;
        onAddFiles(accepted.slice(0, remaining));
    }, [total, onAddFiles]);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        multiple: true,
        disabled: isAtLimit,
        noClick: total > 0,
    });

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Product Images</Label>
                <span className={`text-xs font-medium border px-2.5 py-1 rounded-full ${
                    isAtLimit ? 'bg-red-50 text-red-600 border-red-200' : 'bg-violet-50 text-violet-600 border-violet-200'
                }`}>
                    {total} / {MAX_IMAGES}
                </span>
            </div>

            {total === 0 ? (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        isDragActive ? 'border-violet-500 bg-violet-50' : 'border-neutral-300 bg-neutral-50 hover:border-violet-400 hover:bg-violet-50/40'
                    }`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center py-7 text-center select-none">
                        <ImagePlus className={`w-7 h-7 mb-2 ${isDragActive ? 'text-violet-500' : 'text-neutral-400'}`} />
                        <p className="text-sm font-medium text-neutral-600">
                            {isDragActive ? 'Drop to upload' : 'Add product photos'}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">JPG, PNG · up to {MAX_IMAGES} images</p>
                    </div>
                </div>
            ) : (
                <div
                    {...getRootProps({ onClick: (e) => e.stopPropagation() })}
                    className={`border-2 border-dashed rounded-xl p-3 transition-all ${
                        isDragActive ? 'border-violet-400 bg-violet-50' : 'border-neutral-200 bg-neutral-50/40'
                    }`}
                >
                    <input {...getInputProps()} />
                    <div className="grid grid-cols-4 gap-2">
                        {existingUrls.map((url, i) => (
                            <div key={`ex-${i}`} className="relative group aspect-square rounded-lg overflow-hidden border border-neutral-200 bg-white shadow-sm">
                                <Image src={getImageUrl(url)} alt={`photo ${i + 1}`} fill className="object-cover" sizes="80px" />
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onRemoveExisting(i); }}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                        {newPreviews.map((src, i) => (
                            <div key={`new-${i}`} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-primary/30 bg-white shadow-sm">
                                <Image src={src} alt={`new ${i + 1}`} fill className="object-cover" sizes="80px" />
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onRemoveNew(i); }}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                >
                                    <X size={10} />
                                </button>
                                <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[9px] bg-primary text-primary-foreground font-medium leading-none">new</div>
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
                </div>
            )}
        </div>
    );
}

// ── Badge selector helper ─────────────────────────────────────────────────────

function BadgeSelector({ label, options, selected, onToggle }: {
    label: string;
    options: string[];
    selected: string[];
    onToggle: (value: string) => void;
}) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">{label}</Label>
            <div className="flex flex-wrap gap-2">
                {options.map((opt) => {
                    const isSelected = selected.includes(opt);
                    return (
                        <Badge
                            key={opt}
                            variant={isSelected ? 'default' : 'outline'}
                            className={`cursor-pointer text-xs px-2.5 py-1 transition-colors ${
                                isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'
                            }`}
                            onClick={() => onToggle(opt)}
                        >
                            {opt}
                        </Badge>
                    );
                })}
            </div>
        </div>
    );
}

// ── Main dialog ───────────────────────────────────────────────────────────────

interface StationeryProductDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    businessId: number;
    editingPackage?: ApiPackage | null;
    onSuccess: () => void;
}

export function StationeryProductDialog({
    open,
    onOpenChange,
    businessId,
    editingPackage,
    onSuccess,
}: StationeryProductDialogProps) {
    const isEditing = !!editingPackage;

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [productTypes, setProductTypes] = useState<string[]>([]);
    const [events, setEvents] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    // Populate form when editing
    useEffect(() => {
        if (editingPackage) {
            setName(editingPackage.name || '');
            setPrice(editingPackage.price?.toString() || '');
            setDescription((editingPackage as unknown as Record<string, unknown>).description as string ?? '');
            setExistingImages(editingPackage.images ?? []);
            const f = editingPackage.features as Record<string, string[]> | null;
            setProductTypes(f?.productType ?? []);
            setEvents(f?.event ?? []);
        } else {
            setName('');
            setPrice('');
            setDescription('');
            setProductTypes([]);
            setEvents([]);
            setExistingImages([]);
        }
        setNewImageFiles([]);
        setNewImagePreviews([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingPackage, open]);

    const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setter((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);
    };

    const handleAddFiles = useCallback((files: File[]) => {
        const previews = files.map((f) => URL.createObjectURL(f));
        setNewImageFiles((prev) => [...prev, ...files]);
        setNewImagePreviews((prev) => [...prev, ...previews]);
    }, []);

    const handleRemoveExisting = (idx: number) =>
        setExistingImages((prev) => prev.filter((_, i) => i !== idx));

    const handleRemoveNew = (idx: number) => {
        URL.revokeObjectURL(newImagePreviews[idx]);
        setNewImageFiles((prev) => prev.filter((_, i) => i !== idx));
        setNewImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !price) return;

        setSaving(true);
        try {
            let uploadedUrls: string[] = [];
            if (newImageFiles.length > 0) {
                uploadedUrls = await PackagesAPI.uploadImages(newImageFiles, businessId);
            }
            const allImages = [...existingImages, ...uploadedUrls];

            const payload = {
                name: name.trim(),
                price: Number(price),
                description: description.trim() || undefined,
                features: { productType: productTypes, event: events },
                images: allImages.length > 0 ? allImages : undefined,
                businessId,
            };

            if (isEditing) {
                await PackagesAPI.update(editingPackage!.id, payload);
                toast.success('Product updated');
            } else {
                await PackagesAPI.create(payload);
                toast.success('Product added');
            }
            onSuccess();
            onOpenChange(false);
        } catch {
            toast.error(isEditing ? 'Failed to update product' : 'Failed to add product');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                            <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <DialogTitle>{isEditing ? 'Edit Product' : 'Add Product'}</DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name + Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="sp-name">Product Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="sp-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder='e.g. "Gold Foil Nikkah Card Suite"'
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="sp-price">Price (PKR) <span className="text-red-500">*</span></Label>
                            <Input
                                id="sp-price"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="e.g. 15000"
                                min="1"
                                onKeyDown={(e) => { if (['.', '-', 'e', 'E', '+'].includes(e.key)) e.preventDefault(); }}
                                required
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="sp-desc">Description</Label>
                        <Textarea
                            id="sp-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Gold foil Nikkah card with Urdu calligraphy, laser cut border, comes with envelope and wax seal. Minimum 100 cards."
                            className="min-h-[80px]"
                        />
                    </div>

                    {/* Images */}
                    <ImageUploader
                        existingUrls={existingImages}
                        newPreviews={newImagePreviews}
                        onAddFiles={handleAddFiles}
                        onRemoveExisting={handleRemoveExisting}
                        onRemoveNew={handleRemoveNew}
                    />

                    {/* Product Type */}
                    <BadgeSelector
                        label="Product Type"
                        options={PRODUCT_TYPES}
                        selected={productTypes}
                        onToggle={(v) => toggle(setProductTypes, v)}
                    />

                    {/* Suitable For */}
                    <BadgeSelector
                        label="Suitable For (Event)"
                        options={EVENTS}
                        selected={events}
                        onToggle={(v) => toggle(setEvents, v)}
                    />

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Update Product' : 'Add Product'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

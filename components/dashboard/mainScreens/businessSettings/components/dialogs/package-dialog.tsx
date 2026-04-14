'use client';

import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { PackagesAPI, type ApiPackage } from '@/lib/api/dashboard';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

// ── Feature categories per vendor type (mirrors registration form) ────────────
const BUSINESS_CATEGORIES: Record<string, { id: string; label: string }[]> = {
    'Photographer': [
        { id: 'deliverables', label: 'Deliverables' },
        { id: 'photography', label: 'Photography' },
        { id: 'team', label: 'Team' },
        { id: 'videography', label: 'Videography' },
    ],
    'Makeup artist': [
        { id: 'services', label: 'Services' },
        { id: 'makeupBy', label: 'Makeup By' },
        { id: 'eyelashes', label: 'Eyelashes' },
        { id: 'hair', label: 'Hair' },
        { id: 'nails', label: 'Nails' },
    ],
    'Decorator': [
        { id: 'otherDetails', label: 'Other Details' },
        { id: 'stage', label: 'Stage' },
        { id: 'entrance', label: 'Entrance' },
        { id: 'seating', label: 'Seating' },
        { id: 'aisle', label: 'Aisle / Walkway' },
    ],
    'Henna artist': [
        { id: 'hands', label: 'Hands' },
        { id: 'feet', label: 'Feet' },
    ],
    'Car rental': [
        { id: 'withDecoration', label: 'With Decoration' },
        { id: 'withoutDecoration', label: 'Without Decoration' },
    ],
    'Wedding venue': [
        { id: 'starter', label: 'Starter' },
        { id: 'mainCourse', label: 'Main Course' },
        { id: 'drinks', label: 'Drinks' },
        { id: 'desserts', label: 'Desserts' },
    ],
    'Catering': [
        { id: 'starter', label: 'Starter' },
        { id: 'mainCourse', label: 'Main Course' },
        { id: 'desserts', label: 'Desserts' },
        { id: 'drinks', label: 'Drinks' },
    ],
};

type FeatureMap = Record<string, string[]>;

/** Convert any stored features shape into FeatureMap for the category UI */
function toFeatureMap(features: unknown, categories: { id: string }[]): FeatureMap {
    if (!features) return {};

    // Already a plain object (category map) — validate + return
    if (typeof features === 'object' && !Array.isArray(features)) {
        const obj = features as Record<string, unknown>;
        const result: FeatureMap = {};
        for (const cat of categories) {
            const val = obj[cat.id];
            if (Array.isArray(val) && val.length > 0) {
                result[cat.id] = val.map(String);
            }
        }
        return result;
    }

    // Flat array — no category info, return empty (can't map to categories)
    return {};
}

/** Convert any stored features shape into a plain string for the fallback textarea */
function toFlatText(features: unknown): string {
    if (!features) return '';
    if (Array.isArray(features)) {
        return (features as unknown[])
            .flatMap((item) =>
                typeof item === 'string' ? [item] : Array.isArray(item) ? item : []
            )
            .join('\n');
    }
    if (typeof features === 'object') {
        return Object.values(features as Record<string, unknown>)
            .flatMap((val) => (Array.isArray(val) ? val : [String(val)]))
            .join('\n');
    }
    return String(features);
}

// ─────────────────────────────────────────────────────────────────────────────

interface PackageDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    businessId: number;
    vendorType?: string | null;
    editingPackage?: ApiPackage | null;
    onSuccess: () => void;
}

export function PackageDialog({
    open,
    onOpenChange,
    businessId,
    vendorType,
    editingPackage,
    onSuccess,
}: PackageDialogProps) {
    const categories = BUSINESS_CATEGORIES[vendorType ?? ''] ?? [];
    const hasCategoryUI = categories.length > 0;

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    // Category-based features (used when hasCategoryUI)
    const [featureMap, setFeatureMap] = useState<FeatureMap>({});
    // Plain-text features (used when no categories defined for vendor type)
    const [featuresText, setFeaturesText] = useState('');
    const [saving, setSaving] = useState(false);

    const isEditing = !!editingPackage;

    // ── Populate form when opening for edit ───────────────────────────────────
    useEffect(() => {
        if (editingPackage) {
            setName(editingPackage.name || '');
            setPrice(editingPackage.price?.toString() || '');
            if (hasCategoryUI) {
                setFeatureMap(toFeatureMap(editingPackage.features, categories));
            } else {
                setFeaturesText(toFlatText(editingPackage.features));
            }
        } else {
            setName('');
            setPrice('');
            setFeatureMap({});
            setFeaturesText('');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingPackage, open]);

    // ── Category feature handlers ─────────────────────────────────────────────
    const toggleCategory = (catId: string, checked: boolean) => {
        setFeatureMap((prev) => {
            const next = { ...prev };
            if (checked) {
                next[catId] = [''];
            } else {
                delete next[catId];
            }
            return next;
        });
    };

    const updateItem = (catId: string, idx: number, value: string) => {
        setFeatureMap((prev) => {
            const items = [...(prev[catId] ?? [])];
            items[idx] = value;
            return { ...prev, [catId]: items };
        });
    };

    const addItem = (catId: string) => {
        setFeatureMap((prev) => ({
            ...prev,
            [catId]: [...(prev[catId] ?? []), ''],
        }));
    };

    const removeItem = (catId: string, idx: number) => {
        setFeatureMap((prev) => {
            const items = prev[catId].filter((_, i) => i !== idx);
            const next = { ...prev };
            if (items.length === 0) {
                delete next[catId];
            } else {
                next[catId] = items;
            }
            return next;
        });
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !price) return;

        const features: string[] | FeatureMap = hasCategoryUI
            ? featureMap
            : featuresText
                .split('\n')
                .map((f) => f.trim())
                .filter(Boolean);

        setSaving(true);
        try {
            if (isEditing) {
                await PackagesAPI.update(editingPackage!.id, {
                    name: name.trim(),
                    price: Number(price),
                    features: features as string[],
                    businessId,
                });
                toast.success('Package updated');
            } else {
                await PackagesAPI.create({
                    name: name.trim(),
                    price: Number(price),
                    features: features as string[],
                    businessId,
                });
                toast.success('Package created');
            }
            onSuccess();
            onOpenChange(false);
        } catch {
            toast.error(isEditing ? 'Failed to update package' : 'Failed to create package');
        } finally {
            setSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Package' : 'Add Package'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name + Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="pkg-name">Package Name</Label>
                            <Input
                                id="pkg-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Basic Package"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="pkg-price">Price (Rs.)</Label>
                            <Input
                                id="pkg-price"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="50000"
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    {/* Features */}
                    {hasCategoryUI ? (
                        <div className="space-y-2">
                            <Label>Features</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {categories.map((cat) => {
                                    const items = featureMap[cat.id] ?? [];
                                    const isActive = items.length > 0;

                                    return (
                                        <div
                                            key={cat.id}
                                            className="border rounded-md p-3 bg-muted/30 space-y-2"
                                        >
                                            {/* Category toggle */}
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`cat-${cat.id}`}
                                                    checked={isActive}
                                                    onCheckedChange={(checked) =>
                                                        toggleCategory(cat.id, checked as boolean)
                                                    }
                                                />
                                                <label
                                                    htmlFor={`cat-${cat.id}`}
                                                    className="text-sm font-medium cursor-pointer"
                                                >
                                                    {cat.label}
                                                </label>
                                            </div>

                                            {/* Items */}
                                            {isActive && (
                                                <div className="space-y-1.5 pl-6">
                                                    {items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-1.5">
                                                            <Input
                                                                value={item}
                                                                onChange={(e) =>
                                                                    updateItem(cat.id, idx, e.target.value)
                                                                }
                                                                placeholder={`Enter ${cat.label.toLowerCase()} item`}
                                                                className="h-8 text-sm"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                                                                onClick={() => removeItem(cat.id, idx)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full text-xs mt-1"
                                                        onClick={() => addItem(cat.id)}
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        Add More
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <Label htmlFor="pkg-features">Features (one per line)</Label>
                            <textarea
                                id="pkg-features"
                                value={featuresText}
                                onChange={(e) => setFeaturesText(e.target.value)}
                                placeholder={'HD Photography\nVideo Coverage\nAlbum Design\nDrone Shots'}
                                rows={5}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

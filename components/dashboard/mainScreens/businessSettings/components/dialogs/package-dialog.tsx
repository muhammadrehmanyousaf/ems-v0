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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PackagesAPI, type ApiPackage, type PackageFeatures } from '@/lib/api/dashboard';
import { toast } from 'sonner';
import { ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image-utils';
// 03-DRAFT-RESILIENCE — preserve in-progress package work across refresh.
// CREATE + EDIT supported (edit mode via pristineState in the hook).
// Image binaries are mirrored to IndexedDB so 10 MB product photos
// don't vanish on F5.
import { useFormDraft } from '@/lib/draftStorage/useFormDraft';
import { useFileArrayBlobSync, restoreFilesFromIds } from '@/lib/draftStorage/useFileArrayBlobSync';
import { deleteBlob, sweepExpiredBlobs } from '@/lib/draftStorage/imageBlobStore';
import { DraftResumeBanner, relativeTimeAgo } from '@/components/shared/DraftResumeBanner';
import { AutoSaveIndicator } from '@/components/VendorStepForms/AutoSaveIndicator';

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
    // Car rental uses a dedicated form — not the generic category UI
    'Car rental': [],
    'Wedding venue': [
        { id: 'hall', label: 'Hall / Venue' },
        { id: 'decoration', label: 'Decoration' },
        { id: 'seatingArrangement', label: 'Seating Arrangement' },
        { id: 'soundLighting', label: 'Sound & Lighting' },
        { id: 'catering', label: 'Catering' },
        { id: 'additionalServices', label: 'Additional Services' },
    ],
    'Catering': [
        { id: 'starter', label: 'Starter' },
        { id: 'mainCourse', label: 'Main Course' },
        { id: 'desserts', label: 'Desserts' },
        { id: 'drinks', label: 'Drinks' },
    ],
    'Bridal wearing': [],
    'Wedding Invitations and Stationery': [
        { id: 'productType', label: 'Product Type' },
        { id: 'event', label: 'Suitable For (Event)' },
    ],
    // ── BK-100.55 — 14 new categories ──
    'Nikahkhwan': [
        { id: 'ceremony', label: 'Ceremony' },
        { id: 'documentation', label: 'Documentation' },
        { id: 'extras', label: 'Extras' },
    ],
    'Choreographer': [
        { id: 'sessions', label: 'Sessions' },
        { id: 'performance', label: 'Performance' },
        { id: 'extras', label: 'Extras' },
    ],
    'Dhol player': [
        { id: 'coverage', label: 'Event Coverage' },
        { id: 'instruments', label: 'Instruments' },
        { id: 'extras', label: 'Extras' },
    ],
    'Event host': [
        { id: 'hosting', label: 'Hosting' },
        { id: 'addons', label: 'Add-ons' },
    ],
    'Live streaming': [
        { id: 'coverage', label: 'Coverage' },
        { id: 'equipment', label: 'Equipment' },
        { id: 'delivery', label: 'Delivery' },
    ],
    'Generator rental': [
        { id: 'unit', label: 'Unit' },
        { id: 'service', label: 'Service' },
    ],
    'Marquee rental': [
        { id: 'structure', label: 'Structure' },
        { id: 'furnishing', label: 'Furnishing' },
        { id: 'extras', label: 'Extras' },
    ],
    'Furniture rental': [
        { id: 'items', label: 'Items' },
        { id: 'service', label: 'Service' },
    ],
    'Florist': [
        { id: 'arrangements', label: 'Arrangements' },
        { id: 'flowers', label: 'Flowers' },
        { id: 'service', label: 'Service' },
    ],
    'Wedding cakes': [
        { id: 'cake', label: 'Cake' },
        { id: 'design', label: 'Design' },
        { id: 'service', label: 'Service' },
    ],
    'Mithai and sweets': [
        { id: 'sweets', label: 'Sweets' },
        { id: 'packaging', label: 'Packaging' },
        { id: 'service', label: 'Service' },
    ],
    'Live cooking stall': [
        { id: 'stations', label: 'Stations' },
        { id: 'service', label: 'Service' },
        { id: 'staff', label: 'Staff' },
    ],
    'Sound system rental': [
        { id: 'equipment', label: 'Equipment' },
        { id: 'service', label: 'Service' },
    ],
    'Qawwali and Naat': [
        { id: 'performance', label: 'Performance' },
        { id: 'instruments', label: 'Instruments' },
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

// ── Car rental fleet car form state ──────────────────────────────────────────
interface CarFleetFields {
    make: string;
    model: string;
    year: string;
    vehicleType: string;
    color: string;
    seatingCapacity: string;
    unitsAvailable: string;
    withDriver: boolean;
    acAvailable: boolean;
    decorationAvailable: boolean;
}

const DEFAULT_CAR_FIELDS: CarFleetFields = {
    make: '', model: '', year: '', vehicleType: '', color: '',
    seatingCapacity: '', unitsAvailable: '',
    withDriver: false, acAvailable: true, decorationAvailable: false,
};

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Luxury', 'Classic', 'Limousine', 'Bus', 'Van'];
const COLORS = ['White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Gold', 'Beige', 'Other'];

/** Match a stored value to a list option case-insensitively; returns the canonical option or the original value */
function matchOption(value: string, options: string[]): string {
    if (!value) return '';
    const lower = value.toLowerCase();
    return options.find((o) => o.toLowerCase() === lower) ?? value;
}

function carFieldsFromFeatures(features: unknown): CarFleetFields {
    if (!features || typeof features !== 'object' || Array.isArray(features)) return DEFAULT_CAR_FIELDS;
    const f = features as Record<string, string[]>;
    const first = (key: string) => f[key]?.[0] ?? '';
    return {
        make: first('make'),
        model: first('model'),
        year: first('year'),
        vehicleType: matchOption(first('vehicleType'), VEHICLE_TYPES),
        color: matchOption(first('color'), COLORS),
        seatingCapacity: first('seatingCapacity').replace(' Seats', ''),
        unitsAvailable: first('unitsAvailable').replace(' Units', ''),
        withDriver: first('driver') === 'Yes',
        acAvailable: first('ac') !== 'No',
        decorationAvailable: first('decoration') === 'Available',
    };
}

function carFieldsToFeatures(f: CarFleetFields): Record<string, string[]> {
    return {
        make: [f.make],
        model: [f.model],
        year: [f.year],
        vehicleType: [f.vehicleType],
        color: [f.color],
        seatingCapacity: [f.seatingCapacity ? `${f.seatingCapacity} Seats` : ''],
        unitsAvailable: [f.unitsAvailable ? `${f.unitsAvailable} Units` : ''],
        driver: [f.withDriver ? 'Yes' : 'No'],
        ac: [f.acAvailable ? 'Yes' : 'No'],
        decoration: [f.decorationAvailable ? 'Available' : 'Not Available'],
    };
}

// ─────────────────────────────────────────────────────────────────────────────

interface PackageDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    businessId: number;
    vendorType?: string | null;
    editingPackage?: ApiPackage | null;
    onSuccess: () => void;
    /** When true, forces the generic package form even for Car Rental vendors */
    forceGenericMode?: boolean;
}

export function PackageDialog({
    open,
    onOpenChange,
    businessId,
    vendorType,
    editingPackage,
    onSuccess,
    forceGenericMode = false,
}: PackageDialogProps) {
    const isCarRental = vendorType === 'Car rental' && !forceGenericMode;
    const isStationery = vendorType === 'Wedding Invitations and Stationery';
    const categories = BUSINESS_CATEGORIES[vendorType ?? ''] ?? [];
    const hasCategoryUI = !isCarRental && categories.length > 0;

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    // Category-based features (used when hasCategoryUI)
    const [featureMap, setFeatureMap] = useState<FeatureMap>({});
    // Plain-text features (used when no categories defined for vendor type)
    const [featuresText, setFeaturesText] = useState('');
    // Car rental fleet fields
    const [carFields, setCarFields] = useState<CarFleetFields>(DEFAULT_CAR_FIELDS);
    // Images — existing URLs + pending new files
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const isEditing = !!editingPackage;
    const totalImages = existingImages.length + newImageFiles.length;

    // 03-DRAFT-RESILIENCE — persist in-progress CREATE or EDIT state.
    //
    // Files themselves can't go in localStorage, so newImageFiles is mirrored
    // into IndexedDB via useFileArrayBlobSync (below). The draft holds an
    // ordered list of blob ids (`imageBlobIds`) plus a `newImageCount` so
    // draftState identity changes the moment the user picks a file (even
    // before the IDB put resolves). Resume reads the id list, fetches
    // Files from IDB, and slots them back into newImageFiles.
    //
    // Edit mode uses pristineState: the hook auto-treats "current matches
    // pristine" as not-meaningful, so opening a package for edit and
    // looking at it without changing anything does NOT write a draft.
    const [imageBlobIds, setImageBlobIds] = useState<string[]>([]);
    const draftState = {
        name,
        price,
        featureMap,
        featuresText,
        carFields,
        existingImages,
        imageBlobIds,
        newImageCount: newImageFiles.length,
    };
    // What pristine state would be for an edit. Mirrors the populate
    // useEffect below so they stay in sync — if you change the populate
    // logic, mirror it here. newImageBlobIds + newImageCount are zero in
    // pristine since edit-mode opens with no pending uploads.
    type DraftShape = typeof draftState;
    const editPristine: DraftShape | undefined = editingPackage ? {
        name: editingPackage.name || '',
        price: editingPackage.price?.toString() || '',
        featureMap: hasCategoryUI ? toFeatureMap(editingPackage.features, categories) : {},
        featuresText: !hasCategoryUI && !isCarRental ? toFlatText(editingPackage.features) : '',
        carFields: isCarRental ? carFieldsFromFeatures(editingPackage.features) : DEFAULT_CAR_FIELDS,
        existingImages: editingPackage.images ?? [],
        imageBlobIds: [],
        newImageCount: 0,
    } : undefined;
    // Per-resource storage key so create + edit-of-pkg-A + edit-of-pkg-B
    // each have their own draft on a shared device.
    const draftStorageKey = isEditing
        ? `package-edit-${businessId}-${editingPackage!.id}`
        : `package-create-${businessId}-${vendorType ?? 'unknown'}`;
    const draftEnabled = open;
    const draft = useFormDraft<DraftShape>({
        storageKey: draftStorageKey,
        state: draftState,
        // CREATE: gate on any text content OR pending file pick. EDIT:
        // pristine comparison via opt.
        pristineState: editPristine,
        isMeaningful: !isEditing
            ? ((s) => !!s.name.trim() || !!s.price.trim() ||
                Object.keys(s.featureMap).length > 0 || !!s.featuresText.trim() ||
                s.newImageCount > 0 ||
                (s.carFields && (s.carFields.make || s.carFields.model || s.carFields.year)) ? true : false)
            : undefined,
        enabled: draftEnabled,
    });

    // Mirror newImageFiles into IndexedDB. The hook calls our callback
    // each time the id list changes; we update local state which feeds
    // into draftState so the next useFormDraft tick persists the new
    // ordering. Disabled while the dialog is closed so we don't write
    // to IDB unnecessarily.
    useFileArrayBlobSync({
        files: newImageFiles,
        enabled: draftEnabled,
        onIdsChange: setImageBlobIds,
    });

    // Sweep stale blobs from prior abandoned dialogs once per mount.
    useEffect(() => {
        sweepExpiredBlobs().catch(() => null);
    }, []);

    // ── Populate form when opening for edit ───────────────────────────────────
    useEffect(() => {
        if (editingPackage) {
            setName(editingPackage.name || '');
            setPrice(editingPackage.price?.toString() || '');
            setExistingImages(editingPackage.images ?? []);
            if (isCarRental) {
                setCarFields(carFieldsFromFeatures(editingPackage.features));
            } else if (hasCategoryUI) {
                setFeatureMap(toFeatureMap(editingPackage.features, categories));
            } else {
                setFeaturesText(toFlatText(editingPackage.features));
            }
        } else {
            setName('');
            setPrice('');
            setFeatureMap({});
            setFeaturesText('');
            setCarFields(DEFAULT_CAR_FIELDS);
            setExistingImages([]);
        }
        setNewImageFiles([]);
        setNewImagePreviews([]);
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

    // ── Image handlers ────────────────────────────────────────────────────────
    const handleImageFiles = (files: FileList | null) => {
        if (!files) return;
        const remaining = 10 - totalImages;
        if (remaining <= 0) { toast.error('Maximum 10 images allowed per vehicle'); return; }
        const selected = Array.from(files).slice(0, remaining);
        const previews = selected.map((f) => URL.createObjectURL(f));
        setNewImageFiles((prev) => [...prev, ...selected]);
        setNewImagePreviews((prev) => [...prev, ...previews]);
    };

    const removeExistingImage = (idx: number) =>
        setExistingImages((prev) => prev.filter((_, i) => i !== idx));

    const removeNewImage = (idx: number) => {
        URL.revokeObjectURL(newImagePreviews[idx]);
        setNewImageFiles((prev) => prev.filter((_, i) => i !== idx));
        setNewImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    };

    // ── Car fleet field helpers ───────────────────────────────────────────────
    const setCar = (patch: Partial<CarFleetFields>) => {
        setCarFields((prev) => {
            const next = { ...prev, ...patch };
            // Auto-sync name from make + model + year
            const autoName = [next.make, next.model, next.year].filter(Boolean).join(' ');
            if (autoName) setName(autoName);
            return next;
        });
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !price) return;

        const features: PackageFeatures = isCarRental
            ? carFieldsToFeatures(carFields)
            : hasCategoryUI
                ? featureMap
                : featuresText
                    .split('\n')
                    .map((f) => f.trim())
                    .filter(Boolean);

        setSaving(true);
        try {
            // Upload any new image files first
            let uploadedUrls: string[] = [];
            if (newImageFiles.length > 0) {
                uploadedUrls = await PackagesAPI.uploadImages(newImageFiles, businessId);
            }
            const allImages = [...existingImages, ...uploadedUrls];

            if (isEditing) {
                await PackagesAPI.update(editingPackage!.id, {
                    name: name.trim(),
                    price: Number(price),
                    features,
                    images: allImages,
                    businessId,
                });
                toast.success(isCarRental ? 'Vehicle updated' : isStationery ? 'Product updated' : 'Package updated');
            } else {
                await PackagesAPI.create({
                    name: name.trim(),
                    price: Number(price),
                    features,
                    images: allImages.length > 0 ? allImages : undefined,
                    businessId,
                });
                toast.success(isCarRental ? 'Vehicle added' : isStationery ? 'Product added' : 'Package created');
            }
            // Drop the local draft now that the server has the package.
            // IDB blobs the user just uploaded will be reaped naturally
            // on next open (the file→id WeakMap is gone with this mount)
            // or via sweepExpiredBlobs after the TTL — safer than a
            // global clearAllBlobs() which could wipe blobs from OTHER
            // surfaces (e.g. an active vendor-registration draft) on a
            // shared device.
            draft.discard();
            onSuccess();
            onOpenChange(false);
        } catch {
            toast.error(isEditing
                ? (isCarRental ? 'Failed to update vehicle' : isStationery ? 'Failed to update product' : 'Failed to update package')
                : (isCarRental ? 'Failed to add vehicle' : isStationery ? 'Failed to add product' : 'Failed to create package')
            );
        } finally {
            setSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isCarRental
                            ? (isEditing ? 'Edit Vehicle' : 'Add Vehicle')
                            : isStationery
                                ? (isEditing ? 'Edit Product' : 'Add Product')
                                : (isEditing ? 'Edit Package' : 'Add Package')
                        }
                    </DialogTitle>
                </DialogHeader>

                {/* 03-DRAFT-RESILIENCE — resume banner. Fires for both
                    CREATE and EDIT mode when a fresh draft was saved on
                    this device for this exact package (or for "new").
                    Edit-mode meaningfulness is gated via the hook's
                    pristineState option, so just opening a package and
                    looking at it doesn't write a draft. */}
                <DraftResumeBanner
                    visible={draft.hasResumableDraft}
                    title={isEditing ? 'Resume your edits' : 'Resume your unsaved package'}
                    meta={draft.storedDraft ? `Last edited ${relativeTimeAgo(draft.storedDraft.updatedAt)}` : undefined}
                    onResume={async () => {
                        if (!draft.storedDraft) return;
                        const s = draft.storedDraft.state;
                        setName(s.name || '');
                        setPrice(s.price || '');
                        setFeatureMap(s.featureMap || {});
                        setFeaturesText(s.featuresText || '');
                        setCarFields(s.carFields || DEFAULT_CAR_FIELDS);
                        setExistingImages(s.existingImages || []);
                        // Restore image blobs from IDB so the in-flight
                        // uploads come back as actual Files (not just URLs).
                        try {
                            const restored = await restoreFilesFromIds(s.imageBlobIds);
                            setNewImageFiles(restored);
                            setNewImagePreviews(restored.map((f) => URL.createObjectURL(f)));
                        } catch { /* IDB failure: leave new files empty */ }
                        draft.discard();
                        toast.success(isEditing ? 'Restored your unsaved edits' : 'Restored your unsaved package');
                    }}
                    onDiscard={() => {
                        // Best-effort delete of the IDB blobs the
                        // discarded draft was referencing so the user's
                        // quota isn't bloated by abandoned work. Skip the
                        // global clearAllBlobs() because it would also
                        // wipe blobs from other surfaces (vendor-reg)
                        // on a shared device.
                        const stale = draft.storedDraft?.state.imageBlobIds ?? [];
                        for (const id of stale) {
                            deleteBlob(id).catch(() => null);
                        }
                        draft.discard();
                    }}
                />

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex justify-end -mb-2">
                        <AutoSaveIndicator lastSavedAt={draft.lastSavedAt} saving={draft.saving} />
                    </div>
                    {/* Name + Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="pkg-name">
                                {isCarRental ? 'Car Make & Model' : isStationery ? 'Product Name' : 'Package Name'}
                            </Label>
                            <Input
                                id="pkg-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={isCarRental ? 'e.g. Toyota Corolla 2022' : isStationery ? 'e.g. Nikkah Card Suite' : 'e.g. Basic Package'}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="pkg-price">
                                {isCarRental ? 'Price per Event (Rs.)' : 'Price (Rs.)'}
                            </Label>
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

                    {/* Car Rental — dedicated fleet form */}
                    {isCarRental && (
                        <div className="space-y-4">
                            <Label className="text-sm font-semibold">Vehicle Details</Label>

                            {/* Make / Model / Year */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="car-make" className="text-xs">Make</Label>
                                    <Input
                                        id="car-make"
                                        value={carFields.make}
                                        onChange={(e) => setCar({ make: e.target.value })}
                                        placeholder="Toyota"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="car-model" className="text-xs">Model</Label>
                                    <Input
                                        id="car-model"
                                        value={carFields.model}
                                        onChange={(e) => setCar({ model: e.target.value })}
                                        placeholder="Corolla"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="car-year" className="text-xs">Year</Label>
                                    <Input
                                        id="car-year"
                                        value={carFields.year}
                                        onChange={(e) => setCar({ year: e.target.value })}
                                        placeholder="2022"
                                    />
                                </div>
                            </div>

                            {/* Vehicle Type / Color */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Vehicle Type</Label>
                                    <Select
                                        value={carFields.vehicleType}
                                        onValueChange={(v) => setCar({ vehicleType: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {VEHICLE_TYPES.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Color</Label>
                                    <Select
                                        value={carFields.color}
                                        onValueChange={(v) => setCar({ color: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select color" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COLORS.map((c) => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Seating Capacity / Units Available */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="car-seats" className="text-xs">Seating Capacity</Label>
                                    <Input
                                        id="car-seats"
                                        type="number"
                                        min="1"
                                        value={carFields.seatingCapacity}
                                        onChange={(e) => setCar({ seatingCapacity: e.target.value })}
                                        placeholder="4"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="car-units" className="text-xs">Units Available</Label>
                                    <Input
                                        id="car-units"
                                        type="number"
                                        min="1"
                                        value={carFields.unitsAvailable}
                                        onChange={(e) => setCar({ unitsAvailable: e.target.value })}
                                        placeholder="2"
                                    />
                                </div>
                            </div>

                            {/* Toggles: Driver / AC / Decoration */}
                            <div className="grid grid-cols-3 gap-3">
                                {/* With Driver */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs">With Driver</Label>
                                    <div className="flex rounded-md border overflow-hidden">
                                        {(['Yes', 'No'] as const).map((opt) => {
                                            const active = opt === 'Yes' ? carFields.withDriver : !carFields.withDriver;
                                            return (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    className={`flex-1 py-1.5 text-sm font-medium transition-colors ${active ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                                                    onClick={() => setCar({ withDriver: opt === 'Yes' })}
                                                >
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* AC Available */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs">AC Available</Label>
                                    <div className="flex rounded-md border overflow-hidden">
                                        {(['Yes', 'No'] as const).map((opt) => {
                                            const active = opt === 'Yes' ? carFields.acAvailable : !carFields.acAvailable;
                                            return (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    className={`flex-1 py-1.5 text-sm font-medium transition-colors ${active ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                                                    onClick={() => setCar({ acAvailable: opt === 'Yes' })}
                                                >
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Decoration */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Decoration</Label>
                                    <div className="flex rounded-md border overflow-hidden">
                                        {([
                                            { label: 'Available', val: true },
                                            { label: 'No', val: false },
                                        ]).map(({ label, val }) => {
                                            const active = carFields.decorationAvailable === val;
                                            return (
                                                <button
                                                    key={label}
                                                    type="button"
                                                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${active ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                                                    onClick={() => setCar({ decorationAvailable: val })}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Features — other vendor types */}
                    {!isCarRental && hasCategoryUI ? (
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
                    ) : !isCarRental ? (
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
                    ) : null}

                    {/* ── Images section (car rental only) ──────────────────────────── */}
                    {isCarRental && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">
                                    Vehicle Photos
                                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                        ({totalImages}/10)
                                    </span>
                                </Label>
                                {totalImages < 10 && (
                                    <label className="cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => handleImageFiles(e.target.files)}
                                        />
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-input bg-background text-xs font-medium hover:bg-muted transition-colors">
                                            <ImagePlus className="h-3.5 w-3.5" />
                                            Add Photos
                                        </span>
                                    </label>
                                )}
                            </div>

                            {totalImages === 0 ? (
                                <label className="cursor-pointer block">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => handleImageFiles(e.target.files)}
                                    />
                                    <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg bg-muted/10 hover:bg-muted/20 hover:border-primary/40 transition-colors text-center">
                                        <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="text-sm font-medium">Click to upload photos</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Up to 10 images</p>
                                    </div>
                                </label>
                            ) : (
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                    {/* Existing images */}
                                    {existingImages.map((url, i) => (
                                        <div key={`ex-${i}`} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                                            <Image
                                                src={getImageUrl(url)}
                                                alt={`Vehicle photo ${i + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(i)}
                                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {/* New image previews */}
                                    {newImagePreviews.map((src, i) => (
                                        <div key={`new-${i}`} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-primary/30 bg-muted">
                                            <Image
                                                src={src}
                                                alt={`New photo ${i + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(i)}
                                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                            <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[9px] bg-primary text-primary-foreground font-medium leading-none">
                                                new
                                            </div>
                                        </div>
                                    ))}
                                    {/* Add more slot */}
                                    {totalImages < 10 && (
                                        <label className="cursor-pointer aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center hover:border-primary/50 hover:bg-muted/40 transition-colors">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={(e) => handleImageFiles(e.target.files)}
                                            />
                                            <ImagePlus className="h-5 w-5 text-muted-foreground" />
                                        </label>
                                    )}
                                </div>
                            )}
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
                            {isEditing ? 'Update' : isCarRental ? 'Add Vehicle' : isStationery ? 'Add Product' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

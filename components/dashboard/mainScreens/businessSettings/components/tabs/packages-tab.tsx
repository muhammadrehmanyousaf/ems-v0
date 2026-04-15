'use client';

import { useState, useEffect } from 'react';
import { PackagesAPI, type ApiPackage, type ApiBusiness } from '@/lib/api/dashboard';
import { getImageUrl } from '@/lib/utils/image-utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Car, Check, Flower2, Layers, MapPin, Package, Pencil, Plus, Trash2, Users, Wind } from 'lucide-react';
import { PackageDialog } from '../dialogs/package-dialog';
import { CarPackageDialog } from '../dialogs/car-package-dialog';
import { ConfirmDeleteDialog } from '@/components/dashboard/globalComponents/confirm-delete-dialog';

// Category label lookup — mirrors registration form
const CATEGORY_LABELS: Record<string, string> = {
    // Photographer
    deliverables: 'Deliverables', photography: 'Photography', team: 'Team', videography: 'Videography',
    // Makeup artist
    services: 'Services', makeupBy: 'Makeup By', eyelashes: 'Eyelashes', hair: 'Hair', nails: 'Nails',
    // Decorator
    otherDetails: 'Other Details', stage: 'Stage', entrance: 'Entrance', seating: 'Seating', aisle: 'Aisle / Walkway',
    // Henna artist
    hands: 'Hands', feet: 'Feet',
    // Car rental — fleet car fields
    make: 'Make', model: 'Model', year: 'Year', vehicleType: 'Vehicle Type',
    color: 'Color', seatingCapacity: 'Seating Capacity', unitsAvailable: 'Units Available',
    driver: 'With Driver', ac: 'AC Available', decoration: 'Decoration',
    // Wedding venue
    hall: 'Hall / Venue', seatingArrangement: 'Seating Arrangement',
    soundLighting: 'Sound & Lighting', catering: 'Catering', additionalServices: 'Additional Services',
    // Catering
    starter: 'Starter', mainCourse: 'Main Course', desserts: 'Desserts', drinks: 'Drinks',
};

function isCarFleetFeatures(features: unknown): boolean {
    if (!features || typeof features !== 'object' || Array.isArray(features)) return false;
    return 'make' in (features as object);
}

function isCarRentalPkgFeatures(features: unknown): boolean {
    if (!features || typeof features !== 'object' || Array.isArray(features)) return false;
    return 'cars' in (features as object) && !('make' in (features as object));
}

/** Car rental combo package card body — styled to match fleet card */
function CarRentalPackageCardBody({ pkg }: { pkg: ApiPackage }) {
    const f = pkg.features as Record<string, unknown> | null;
    if (!f) return null;
    const cars = Array.isArray(f.cars) ? (f.cars as { carName: string; quantity: number }[]) : [];
    const cities = Array.isArray(f.citiesCovered) ? (f.citiesCovered as string[]) : [];
    const totalQty = cars.reduce((sum, c) => sum + (c.quantity || 1), 0);

    return (
        <div className="px-4 py-3 space-y-3">
            {/* Quick info chips row */}
            <div className="flex flex-wrap items-center gap-2">
                {cars.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                        <Car className="h-3 w-3" />
                        {cars.length} Car {cars.length === 1 ? 'Type' : 'Types'}
                    </span>
                )}
                {totalQty > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-medium">
                        <Layers className="h-3 w-3" />
                        {totalQty} Total
                    </span>
                )}
                {cities.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-medium">
                        <MapPin className="h-3 w-3" />
                        {cities.length} {cities.length === 1 ? 'City' : 'Cities'}
                    </span>
                )}
            </div>

            {/* Cars as feature chips */}
            {cars.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {cars.map((c, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                            <Car className="h-3 w-3" />
                            {c.carName}
                            {c.quantity > 1 && (
                                <span className="font-bold ml-0.5">×{c.quantity}</span>
                            )}
                        </span>
                    ))}
                </div>
            )}

            {/* City badges */}
            {cities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {cities.map((city) => (
                        <Badge key={city} variant="outline" className="text-[10px] px-2 py-0.5 font-medium">
                            {city}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Description */}
            {pkg.description && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {pkg.description}
                </p>
            )}
        </div>
    );
}

/** Car fleet card body — rich spec layout */
function CarFleetCardBody({ features }: { features: ApiPackage['features'] }) {
    if (!isCarFleetFeatures(features)) return null;
    const f = features as Record<string, string[]>;
    const get = (key: string) => f[key]?.[0] ?? '';

    const vehicleType = get('vehicleType');
    const color = get('color');
    const seats = get('seatingCapacity');
    const units = get('unitsAvailable');
    const driver = get('driver');
    const ac = get('ac');
    const decoration = get('decoration');

    const featureChips = [
        { label: 'Driver', value: driver, active: driver === 'Yes', icon: <Users className="h-3 w-3" /> },
        { label: 'AC', value: ac, active: ac === 'Yes', icon: <Wind className="h-3 w-3" /> },
        { label: 'Decoration', value: decoration === 'Available' ? 'Available' : 'No', active: decoration === 'Available', icon: <Flower2 className="h-3 w-3" /> },
    ];

    return (
        <div className="px-4 py-3 space-y-3">
            {/* Quick info row */}
            <div className="flex flex-wrap items-center gap-2">
                {vehicleType && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                        <Car className="h-3 w-3" />
                        {vehicleType}
                    </span>
                )}
                {color && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-medium">
                        <span className="w-2 h-2 rounded-full border border-border bg-gray-300 shrink-0" />
                        {color}
                    </span>
                )}
                {seats && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-medium">
                        <Users className="h-3 w-3" />
                        {seats}
                    </span>
                )}
                {units && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-medium">
                        <Layers className="h-3 w-3" />
                        {units}
                    </span>
                )}
            </div>

            {/* Feature chips */}
            <div className="flex flex-wrap gap-1.5">
                {featureChips.map(({ label, active, icon }) => (
                    <span
                        key={label}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-muted/50 text-muted-foreground border-border'
                        }`}
                    >
                        {icon}
                        {label}
                        <span className={`font-semibold ${active ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                            {active ? '✓' : '✗'}
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
}

/** Render features for a package — handles both flat arrays and category objects */
function PackageFeatures({ features }: { features: ApiPackage['features'] }) {
    if (!features) return null;

    // Category object: { starter: ["item1"], mainCourse: ["item2"] }
    if (typeof features === 'object' && !Array.isArray(features)) {
        const entries = Object.entries(features as Record<string, string[]>).filter(
            ([, items]) => Array.isArray(items) && items.length > 0,
        );
        if (entries.length === 0) return null;
        return (
            <div className="space-y-3">
                {entries.map(([catId, items]) => (
                    <div key={catId}>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                            {CATEGORY_LABELS[catId] ?? catId}
                        </p>
                        <ul className="space-y-1">
                            {items.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                    <span className="text-muted-foreground leading-tight">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        );
    }

    // Flat array: ["HD Photography", "Video Coverage"]
    if (Array.isArray(features) && features.length > 0) {
        return (
            <ul className="space-y-1">
                {(features as string[]).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground leading-tight">{String(f)}</span>
                    </li>
                ))}
            </ul>
        );
    }

    return null;
}

function featureCount(features: ApiPackage['features']): number {
    if (!features) return 0;
    if (isCarFleetFeatures(features)) return 0;
    if (Array.isArray(features)) return features.length;
    if (typeof features === 'object') {
        return Object.values(features as Record<string, string[]>).reduce(
            (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0,
        );
    }
    return 0;
}

// ─────────────────────────────────────────────────────────────────────────────

interface PackagesTabProps {
    business: ApiBusiness;
    onSuccess: () => void;
    /** 'fleet' = show only fleet cars, 'packages' = show only generic packages, undefined = show all */
    mode?: 'fleet' | 'packages';
}

const PackagesTab = ({ business, onSuccess, mode }: PackagesTabProps) => {
    const [packages, setPackages] = useState<ApiPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<ApiPackage | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ApiPackage | null>(null);

    const fetchPackages = async () => {
        try {
            const data = await PackagesAPI.getAll(business.id);
            setPackages(data);
        } catch {
            setPackages([]);
            toast.error('Failed to load packages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPackages(); }, [business.id]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await PackagesAPI.delete(deleteTarget.id);
            setPackages((prev) => prev.filter((p) => p.id !== deleteTarget.id));
            toast.success('Package deleted');
            onSuccess();
        } catch {
            toast.error('Failed to delete package');
        }
    };

    const handleSuccess = () => { fetchPackages(); onSuccess(); };

    const isFleetMode = mode === 'fleet';
    const isPackagesMode = mode === 'packages';
    const isCarRental = business.vendor?.vendorType === 'Car rental';
    // Use CarPackageDialog when car rental vendor is on the packages tab
    const useCarPkgDialog = isCarRental && isPackagesMode;

    // Filter by mode: 'fleet' = only car fleet entries, 'packages' = only generic packages
    const displayPackages = isFleetMode
        ? packages.filter((p) => isCarFleetFeatures(p.features))
        : isPackagesMode
            ? packages.filter((p) => !isCarFleetFeatures(p.features))
            : packages;

    // Fleet cars available for the CarPackageDialog dropdown
    const fleetCars = packages.filter((p) => isCarFleetFeatures(p.features));

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-56 w-full rounded-xl" />
                ))}
            </div>
        );
    }
    const entityLabel = isFleetMode ? 'Vehicle' : 'Package';
    const tabTitle = isFleetMode ? 'Fleet / Cars' : 'Packages';

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{tabTitle}</h3>
                    <Badge variant="secondary" className="rounded-full px-2.5">
                        {displayPackages.length}
                    </Badge>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add {entityLabel}
                </Button>
            </div>

            {/* Empty state */}
            {displayPackages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/10">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        {isFleetMode
                            ? <Car className="h-7 w-7 text-primary" />
                            : <Package className="h-7 w-7 text-primary" />
                        }
                    </div>
                    <h4 className="font-semibold text-base">No {entityLabel.toLowerCase()}s yet</h4>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                        {isFleetMode
                            ? 'Add vehicles to your fleet to showcase your cars to customers.'
                            : 'Create packages to showcase your services and pricing to customers.'}
                    </p>
                    <Button size="sm" className="mt-5" onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add First {entityLabel}
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {displayPackages.map((pkg) => {
                        const fCount = featureCount(pkg.features);
                        const isFleetCar = isCarFleetFeatures(pkg.features);
                        const isComboPackage = isCarRentalPkgFeatures(pkg.features);
                        const fleetF = isFleetCar ? (pkg.features as Record<string, string[]>) : null;
                        const comboF = isComboPackage ? (pkg.features as Record<string, unknown>) : null;
                        const vehicleType = fleetF?.vehicleType?.[0];
                        const units = fleetF?.unitsAvailable?.[0];
                        const coverImage = pkg.images?.[0];
                        // Combo package derived info
                        const comboCars = Array.isArray(comboF?.cars) ? (comboF!.cars as { carName: string; quantity: number }[]) : [];
                        const comboCities = Array.isArray(comboF?.citiesCovered) ? (comboF!.citiesCovered as string[]) : [];

                        return (
                            <div
                                key={pkg.id}
                                className="flex flex-col rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                            >
                                {/* Cover image (fleet car only) */}
                                {isFleetCar && coverImage && (
                                    <div className="relative w-full h-36 bg-muted shrink-0">
                                        <Image
                                            src={getImageUrl(coverImage)}
                                            alt={pkg.name}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    </div>
                                )}

                                {/* Card header */}
                                <div className="bg-primary/5 border-b px-4 py-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                                            {isFleetCar
                                                ? <Car className="h-4 w-4 text-primary" />
                                                : <Package className="h-4 w-4 text-primary" />
                                            }
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-semibold text-sm truncate leading-tight">{pkg.name}</h4>
                                            {vehicleType && (
                                                <p className="text-[11px] text-muted-foreground">{vehicleType}</p>
                                            )}
                                            {isComboPackage && comboCars.length > 0 && (
                                                <p className="text-[11px] text-muted-foreground">
                                                    {comboCars.length} car {comboCars.length === 1 ? 'type' : 'types'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {units && (
                                        <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
                                            {units}
                                        </Badge>
                                    )}
                                    {isComboPackage && comboCities.length > 0 && (
                                        <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
                                            {comboCities.length} {comboCities.length === 1 ? 'city' : 'cities'}
                                        </Badge>
                                    )}
                                    {!isFleetCar && !isComboPackage && fCount > 0 && (
                                        <Badge variant="secondary" className="text-[10px] shrink-0">
                                            {fCount} {fCount === 1 ? 'item' : 'items'}
                                        </Badge>
                                    )}
                                </div>

                                {/* Price */}
                                <div className="px-4 pt-3 pb-1">
                                    <p className="text-xl font-bold text-primary">
                                        Rs.&nbsp;{pkg.price?.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {isFleetCar ? 'per event' : isComboPackage ? 'per package' : 'per booking'}
                                    </p>
                                </div>

                                {/* Car fleet spec body */}
                                {isFleetCar && (
                                    <>
                                        <Separator className="mx-4 w-auto" />
                                        <CarFleetCardBody features={pkg.features} />
                                    </>
                                )}

                                {/* Car rental combo package body */}
                                {isCarRentalPkgFeatures(pkg.features) && (
                                    <>
                                        <Separator className="mx-4 w-auto" />
                                        <CarRentalPackageCardBody pkg={pkg} />
                                    </>
                                )}

                                {/* Generic package features */}
                                {!isFleetCar && !isCarRentalPkgFeatures(pkg.features) && fCount > 0 && (
                                    <>
                                        <Separator className="mx-4 w-auto" />
                                        <div className="px-4 py-3 flex-1 overflow-hidden">
                                            <PackageFeatures features={pkg.features} />
                                        </div>
                                    </>
                                )}

                                {/* Photo strip — all vehicle images */}
                                {isFleetCar && pkg.images && pkg.images.length > 0 && (
                                    <div className="px-4 pb-3">
                                        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                                            {pkg.images.map((img, i) => (
                                                <div
                                                    key={i}
                                                    className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-border bg-muted"
                                                >
                                                    <Image
                                                        src={getImageUrl(img)}
                                                        alt={`${pkg.name} photo ${i + 1}`}
                                                        fill
                                                        className="object-cover"
                                                        sizes="56px"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="mt-auto border-t px-4 py-2.5 flex items-center justify-between gap-2 bg-muted/20">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={() => setEditingPackage(pkg)}
                                    >
                                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => setDeleteTarget(pkg)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Car rental combo package dialogs */}
            {useCarPkgDialog ? (
                <>
                    <CarPackageDialog
                        open={createOpen}
                        onOpenChange={setCreateOpen}
                        businessId={business.id}
                        fleetCars={fleetCars}
                        cities={business.cityCovered ?? []}
                        onSuccess={handleSuccess}
                    />
                    <CarPackageDialog
                        open={!!editingPackage}
                        onOpenChange={(v) => { if (!v) setEditingPackage(null); }}
                        businessId={business.id}
                        fleetCars={fleetCars}
                        cities={business.cityCovered ?? []}
                        editingPackage={editingPackage}
                        onSuccess={handleSuccess}
                    />
                </>
            ) : (
                <>
                    <PackageDialog
                        open={createOpen}
                        onOpenChange={setCreateOpen}
                        businessId={business.id}
                        vendorType={business.vendor?.vendorType}
                        forceGenericMode={isPackagesMode}
                        onSuccess={handleSuccess}
                    />
                    <PackageDialog
                        open={!!editingPackage}
                        onOpenChange={(v) => { if (!v) setEditingPackage(null); }}
                        businessId={business.id}
                        vendorType={business.vendor?.vendorType}
                        forceGenericMode={isPackagesMode}
                        editingPackage={editingPackage}
                        onSuccess={handleSuccess}
                    />
                </>
            )}

            <ConfirmDeleteDialog
                open={!!deleteTarget}
                onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
                title="Delete Package"
                description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default PackagesTab;

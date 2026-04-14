'use client';

import { useState, useEffect } from 'react';
import { PackagesAPI, type ApiPackage, type ApiBusiness } from '@/lib/api/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Check, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { PackageDialog } from '../dialogs/package-dialog';
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
    // Car rental
    withDecoration: 'With Decoration', withoutDecoration: 'Without Decoration',
    // Wedding venue
    hall: 'Hall / Venue', decoration: 'Decoration', seatingArrangement: 'Seating Arrangement',
    soundLighting: 'Sound & Lighting', catering: 'Catering', additionalServices: 'Additional Services',
    // Catering
    starter: 'Starter', mainCourse: 'Main Course', desserts: 'Desserts', drinks: 'Drinks',
};

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
}

const PackagesTab = ({ business, onSuccess }: PackagesTabProps) => {
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

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-56 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Packages</h3>
                    <Badge variant="secondary" className="rounded-full px-2.5">
                        {packages.length}
                    </Badge>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Package
                </Button>
            </div>

            {/* Empty state */}
            {packages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/10">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Package className="h-7 w-7 text-primary" />
                    </div>
                    <h4 className="font-semibold text-base">No packages yet</h4>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                        Create packages to showcase your services and pricing to customers.
                    </p>
                    <Button size="sm" className="mt-5" onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Create First Package
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {packages.map((pkg) => {
                        const fCount = featureCount(pkg.features);
                        return (
                            <div
                                key={pkg.id}
                                className="flex flex-col rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                            >
                                {/* Card header strip */}
                                <div className="bg-primary/5 border-b px-4 py-3 flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                                            <Package className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                        <h4 className="font-semibold text-sm capitalize truncate">{pkg.name}</h4>
                                    </div>
                                    {fCount > 0 && (
                                        <Badge variant="secondary" className="text-[10px] shrink-0">
                                            {fCount} {fCount === 1 ? 'item' : 'items'}
                                        </Badge>
                                    )}
                                </div>

                                {/* Price */}
                                <div className="px-4 pt-3 pb-2">
                                    <p className="text-2xl font-bold text-primary">
                                        Rs.&nbsp;{pkg.price?.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">per booking</p>
                                </div>

                                {/* Features */}
                                {fCount > 0 && (
                                    <>
                                        <Separator className="mx-4 w-auto" />
                                        <div className="px-4 py-3 flex-1 overflow-hidden">
                                            <PackageFeatures features={pkg.features} />
                                        </div>
                                    </>
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

            <PackageDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                businessId={business.id}
                vendorType={business.vendor?.vendorType}
                onSuccess={handleSuccess}
            />

            <PackageDialog
                open={!!editingPackage}
                onOpenChange={(v) => { if (!v) setEditingPackage(null); }}
                businessId={business.id}
                vendorType={business.vendor?.vendorType}
                editingPackage={editingPackage}
                onSuccess={handleSuccess}
            />

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

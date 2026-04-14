'use client';

import { useState, useEffect } from 'react';
import { PackagesAPI, type ApiPackage, type ApiBusiness } from '@/lib/api/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Check, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { PackageDialog } from '../dialogs/package-dialog';
import { ConfirmDeleteDialog } from '@/components/dashboard/globalComponents/confirm-delete-dialog';

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

    useEffect(() => {
        fetchPackages();
    }, [business.id]);

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

    const handleSuccess = () => {
        fetchPackages();
        onSuccess();
    };

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-52 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Packages</h3>
                    <Badge variant="secondary">{packages.length}</Badge>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Package
                </Button>
            </div>

            {packages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
                    <Package className="h-10 w-10 text-muted-foreground mb-3" />
                    <h4 className="font-medium">No packages yet</h4>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Create packages to showcase your services and pricing to customers.
                    </p>
                    <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Create First Package
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {packages.map((pkg) => (
                        <Card key={pkg.id} className="flex flex-col">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base capitalize">{pkg.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-3">
                                <p className="text-xl font-bold text-primary">
                                    Rs. {pkg.price?.toLocaleString()}
                                </p>
                                {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                                    <ul className="space-y-1.5">
                                        {pkg.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                                <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                                <span className="text-muted-foreground">{String(feature)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingPackage(pkg)}
                                >
                                    <Pencil className="h-3.5 w-3.5 mr-1" />
                                    Edit
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDeleteTarget(pkg)}
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Delete
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
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

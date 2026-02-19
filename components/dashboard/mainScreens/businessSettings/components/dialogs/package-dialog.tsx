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
import { Textarea } from '@/components/ui/textarea';
import { PackagesAPI, type ApiPackage } from '@/lib/api/dashboard';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PackageDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    businessId: number;
    editingPackage?: ApiPackage | null;
    onSuccess: () => void;
}

export function PackageDialog({
    open,
    onOpenChange,
    businessId,
    editingPackage,
    onSuccess,
}: PackageDialogProps) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [features, setFeatures] = useState('');
    const [saving, setSaving] = useState(false);

    const isEditing = !!editingPackage;

    useEffect(() => {
        if (editingPackage) {
            setName(editingPackage.name || '');
            setPrice(editingPackage.price?.toString() || '');
            setFeatures(
                Array.isArray(editingPackage.features)
                    ? editingPackage.features.join('\n')
                    : ''
            );
        } else {
            setName('');
            setPrice('');
            setFeatures('');
        }
    }, [editingPackage, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !price) return;

        setSaving(true);
        const featureArray = features
            .split('\n')
            .map((f) => f.trim())
            .filter(Boolean);

        try {
            if (isEditing) {
                await PackagesAPI.update(editingPackage!.id, {
                    name: name.trim(),
                    price: Number(price),
                    features: featureArray,
                    businessId,
                });
                toast.success('Package updated');
            } else {
                await PackagesAPI.create({
                    name: name.trim(),
                    price: Number(price),
                    features: featureArray,
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Package' : 'Add Package'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="pkg-name">Package Name</Label>
                        <Input
                            id="pkg-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Premium Wedding Package"
                            required
                        />
                    </div>
                    <div>
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
                    <div>
                        <Label htmlFor="pkg-features">Features (one per line)</Label>
                        <Textarea
                            id="pkg-features"
                            value={features}
                            onChange={(e) => setFeatures(e.target.value)}
                            placeholder={"HD Photography\nVideo Coverage\nAlbum Design\nDrone Shots"}
                            rows={5}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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

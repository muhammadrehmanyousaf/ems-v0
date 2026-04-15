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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PackagesAPI, type ApiPackage } from '@/lib/api/dashboard';
import { toast } from 'sonner';
import { Car, Loader2, Plus, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CarRow {
    carName: string;
    quantity: number;
}

interface CarRentalPkgFeatures {
    cars: CarRow[];
    citiesCovered: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fleetLabel(pkg: ApiPackage): string {
    const f = pkg.features as Record<string, string[]> | null;
    const make = f?.make?.[0] ?? '';
    const model = f?.model?.[0] ?? '';
    const year = f?.year?.[0] ?? '';
    const units = f?.unitsAvailable?.[0] ?? '';
    const base = [make, model, year].filter(Boolean).join(' ') || pkg.name || 'Unnamed Car';
    return units ? `${base} (${units})` : base;
}

function fleetMaxUnits(pkg: ApiPackage): number {
    const f = pkg.features as Record<string, string[]> | null;
    const raw = f?.unitsAvailable?.[0] ?? '';
    const num = parseInt(raw.replace(' Units', '').trim(), 10);
    return isNaN(num) || num < 1 ? 999 : num;
}

function featuresFromPkg(pkg: ApiPackage): CarRentalPkgFeatures {
    const f = pkg.features as Record<string, unknown> | null;
    if (!f) return { cars: [{ carName: '', quantity: 1 }], citiesCovered: [] };
    const cars = Array.isArray(f.cars)
        ? (f.cars as CarRow[]).map((c) => ({ carName: c.carName ?? '', quantity: c.quantity ?? 1 }))
        : [{ carName: '', quantity: 1 }];
    const citiesCovered = Array.isArray(f.citiesCovered) ? (f.citiesCovered as string[]) : [];
    return { cars, citiesCovered };
}

const DEFAULT_CAR_ROW: CarRow = { carName: '', quantity: 1 };

// ── Component ─────────────────────────────────────────────────────────────────

interface CarPackageDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    businessId: number;
    fleetCars: ApiPackage[];
    cities: string[];
    editingPackage?: ApiPackage | null;
    onSuccess: () => void;
}

export function CarPackageDialog({
    open,
    onOpenChange,
    businessId,
    fleetCars,
    cities,
    editingPackage,
    onSuccess,
}: CarPackageDialogProps) {
    const isEditing = !!editingPackage;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [totalPrice, setTotalPrice] = useState('');
    const [cars, setCars] = useState<CarRow[]>([{ ...DEFAULT_CAR_ROW }]);
    const [citiesCovered, setCitiesCovered] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    // Populate form when editing
    useEffect(() => {
        if (editingPackage) {
            setName(editingPackage.name || '');
            setDescription(editingPackage.description || '');
            setTotalPrice(editingPackage.price?.toString() || '');
            const f = featuresFromPkg(editingPackage);
            setCars(f.cars.length > 0 ? f.cars : [{ ...DEFAULT_CAR_ROW }]);
            setCitiesCovered(f.citiesCovered);
        } else {
            setName('');
            setDescription('');
            setTotalPrice('');
            setCars([{ ...DEFAULT_CAR_ROW }]);
            setCitiesCovered([]);
        }
    }, [editingPackage, open]);

    // ── Car row handlers ──────────────────────────────────────────────────────

    const updateCarRow = (idx: number, field: keyof CarRow, value: string | number) => {
        setCars((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    };

    const addCarRow = () => setCars((prev) => [...prev, { ...DEFAULT_CAR_ROW }]);

    const removeCarRow = (idx: number) => setCars((prev) => prev.filter((_, i) => i !== idx));

    // ── City toggle ───────────────────────────────────────────────────────────

    const toggleCity = (city: string) => {
        setCitiesCovered((prev) =>
            prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
        );
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !totalPrice) return;

        const validCars = cars.filter((c) => c.carName.trim());
        if (validCars.length === 0) {
            toast.error('Please select at least one car for this package');
            return;
        }

        const features = {
            cars: validCars,
            citiesCovered,
        };

        setSaving(true);
        try {
            if (isEditing) {
                await PackagesAPI.update(editingPackage!.id, {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    price: Number(totalPrice),
                    features,
                    businessId,
                });
                toast.success('Package updated');
            } else {
                await PackagesAPI.create({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    price: Number(totalPrice),
                    features,
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
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Package' : 'Add Package'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Package Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="cp-name">
                            Package Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="cp-name"
                            placeholder='e.g. "Wedding Baraat Special"'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Cars Included */}
                    <div className="space-y-3">
                        <div>
                            <Label className="text-sm font-medium">
                                Cars Included <span className="text-red-500">*</span>
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Select car types from your fleet and set quantities for this package.
                            </p>
                        </div>

                        {fleetCars.length === 0 ? (
                            <p className="text-xs text-amber-600 border border-amber-200 bg-amber-50 rounded-lg px-3 py-2">
                                No fleet cars found. Add vehicles in the Fleet / Cars tab first.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {cars.map((carRow, idx) => {
                                    const selectedFleet = fleetCars.find((f) => fleetLabel(f) === carRow.carName);
                                    const max = selectedFleet ? fleetMaxUnits(selectedFleet) : 999;
                                    const takenNames = cars.filter((_, i) => i !== idx).map((c) => c.carName);

                                    return (
                                        <div key={idx} className="flex items-center gap-3">
                                            {/* Car dropdown */}
                                            <div className="flex-1">
                                                <Select
                                                    value={carRow.carName}
                                                    onValueChange={(v) => updateCarRow(idx, 'carName', v)}
                                                >
                                                    <SelectTrigger>
                                                        <div className="flex items-center gap-2">
                                                            <Car className="w-3.5 h-3.5 text-muted-foreground" />
                                                            <SelectValue placeholder="Select a car" />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {fleetCars.map((fc) => {
                                                            const label = fleetLabel(fc);
                                                            return (
                                                                <SelectItem
                                                                    key={fc.id}
                                                                    value={label}
                                                                    disabled={takenNames.includes(label)}
                                                                >
                                                                    {label}
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Quantity */}
                                            <div className="w-24">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={max}
                                                    placeholder="Qty"
                                                    value={carRow.quantity > 0 ? carRow.quantity : ''}
                                                    onChange={(e) => {
                                                        const raw = e.target.value;
                                                        if (raw === '') { updateCarRow(idx, 'quantity', 0); return; }
                                                        const num = parseInt(raw, 10);
                                                        if (!isNaN(num)) updateCarRow(idx, 'quantity', Math.min(max, Math.max(1, num)));
                                                    }}
                                                />
                                            </div>

                                            {/* Remove */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                type="button"
                                                onClick={() => removeCarRow(idx)}
                                                disabled={cars.length <= 1}
                                                className={`text-destructive hover:text-destructive hover:bg-destructive/10 ${cars.length <= 1 ? 'opacity-0 pointer-events-none' : ''}`}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    );
                                })}

                                {cars.length < fleetCars.length && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        type="button"
                                        onClick={addCarRow}
                                        className="text-xs text-primary border-primary/40 hover:bg-primary/5"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Another Car Type
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cities Covered */}
                    {cities.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Cities Covered</Label>
                            <div className="flex flex-wrap gap-2">
                                {cities.map((city) => {
                                    const isSelected = citiesCovered.includes(city);
                                    return (
                                        <Badge
                                            key={city}
                                            variant={isSelected ? 'default' : 'outline'}
                                            className={`cursor-pointer text-sm px-3 py-1.5 transition-colors ${
                                                isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'
                                            }`}
                                            onClick={() => toggleCity(city)}
                                        >
                                            {city}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Total Price */}
                    <div className="space-y-1.5">
                        <Label htmlFor="cp-price">
                            Total Price (PKR) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="cp-price"
                            type="number"
                            placeholder="e.g. 100000"
                            min={0}
                            value={totalPrice}
                            onChange={(e) => setTotalPrice(e.target.value)}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="cp-desc">
                            Description{' '}
                            <span className="text-muted-foreground font-normal text-xs">(recommended)</span>
                        </Label>
                        <Textarea
                            id="cp-desc"
                            placeholder='e.g. "10 Corolla + 2 Limousines available across 5 cities — perfect for large baraats."'
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[80px] text-sm resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Update' : 'Create Package'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

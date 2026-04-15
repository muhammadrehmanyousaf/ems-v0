'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Package, Car, X, PackageOpen } from 'lucide-react';
import { useFormContext, CarRentalPackage, CarRentalPackageCar } from '@/lib/context/form-context';

/* ------------------------------------------------------------------ */
/*  Helpers to read fleet data from formData.packages                   */
/* ------------------------------------------------------------------ */
function fleetLabel(pkg: { name: string; features: Record<string, string[]> }): string {
    // packages in fleet store car data via carToPackage() in car-details-step
    const make = pkg.features?.make?.[0] ?? '';
    const model = pkg.features?.model?.[0] ?? '';
    const year = pkg.features?.year?.[0] ?? '';
    const units = pkg.features?.unitsAvailable?.[0] ?? '';
    const base = [make, model, year].filter(Boolean).join(' ') || pkg.name || 'Unnamed Car';
    return units ? `${base} (${units})` : base;
}

function fleetMaxUnits(pkg: { features: Record<string, string[]> }): number {
    const raw = pkg.features?.unitsAvailable?.[0] ?? '';
    const num = parseInt(raw.replace(' Units', '').trim(), 10);
    return isNaN(num) || num < 1 ? 999 : num;
}

/* ------------------------------------------------------------------ */
/*  Default values                                                       */
/* ------------------------------------------------------------------ */
const DEFAULT_CAR_ENTRY: CarRentalPackageCar = { carIndex: -1, quantity: 1 };

const DEFAULT_PACKAGE: CarRentalPackage = {
    name: '',
    description: '',
    totalPrice: 0,
    cars: [{ ...DEFAULT_CAR_ENTRY }],
    citiesCovered: [],
};

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */
interface CarPackagesStepProps {
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

/* ================================================================== */
/*  Component                                                           */
/* ================================================================== */
const CarPackagesStep = ({ errors, setErrors }: CarPackagesStepProps) => {
    const { formData, setFormData } = useFormContext();

    // Valid fleet cars only (must have a name/make)
    const fleet = formData.packages.filter((p) => p.name?.trim());
    const cities = formData.cityCovered ?? [];

    const packages = formData.carRentalPackages ?? [];

    /* ---------- helpers ---------- */
    const setPackages = (next: CarRentalPackage[]) => {
        setFormData((prev) => ({ ...prev, carRentalPackages: next }));
    };

    const updatePackage = (pkgIdx: number, field: keyof CarRentalPackage, value: unknown) => {
        const next = packages.map((p, i) =>
            i === pkgIdx ? { ...p, [field]: value } : p
        );
        setPackages(next);
        setErrors((prev) => ({ ...prev, [`crPkg[${pkgIdx}].${field}`]: '', [`crPkg[${pkgIdx}].name`]: '', [`crPkg[${pkgIdx}].price`]: '' }));
    };

    const addPackage = () => {
        setPackages([...packages, { ...DEFAULT_PACKAGE, cars: [{ ...DEFAULT_CAR_ENTRY }], citiesCovered: [] }]);
    };

    const removePackage = (pkgIdx: number) => {
        setPackages(packages.filter((_, i) => i !== pkgIdx));
    };

    /* --- car rows within a package --- */
    const addCarRow = (pkgIdx: number) => {
        const next = packages.map((p, i) =>
            i === pkgIdx ? { ...p, cars: [...p.cars, { ...DEFAULT_CAR_ENTRY }] } : p
        );
        setPackages(next);
    };

    const removeCarRow = (pkgIdx: number, carIdx: number) => {
        const next = packages.map((p, i) =>
            i === pkgIdx ? { ...p, cars: p.cars.filter((_, ci) => ci !== carIdx) } : p
        );
        setPackages(next);
    };

    const updateCarRow = (pkgIdx: number, carIdx: number, field: keyof CarRentalPackageCar, value: number) => {
        const next = packages.map((p, i) => {
            if (i !== pkgIdx) return p;
            const cars = p.cars.map((c, ci) =>
                ci === carIdx ? { ...c, [field]: value } : c
            );
            return { ...p, cars };
        });
        setPackages(next);
        setErrors((prev) => ({ ...prev, [`crPkg[${pkgIdx}].cars`]: '', [`crPkg[${pkgIdx}].car[${carIdx}].qty`]: '' }));
    };

    /* --- city toggles --- */
    const toggleCity = (pkgIdx: number, city: string) => {
        const pkg = packages[pkgIdx];
        const current = pkg.citiesCovered ?? [];
        const next = current.includes(city)
            ? current.filter((c) => c !== city)
            : [...current, city];
        updatePackage(pkgIdx, 'citiesCovered', next);
        setErrors((prev) => ({ ...prev, [`crPkg[${pkgIdx}].cities`]: '' }));
    };

    /* ---------------------------------------------------------------- */
    /*  Empty state                                                       */
    /* ---------------------------------------------------------------- */
    if (packages.length === 0) {
        return (
            <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                    Optionally bundle your fleet into combo packages (e.g. "10 Corolla + 2 Limousines in Lahore for PKR 1,00,000"). Skip this step if you don't offer packages.
                </p>
                <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 flex flex-col items-center gap-4 bg-white/40">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <PackageOpen className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-neutral-700">No packages yet</p>
                        <p className="text-sm text-neutral-500 mt-1">
                            Create packages to offer curated bundles to your customers.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={addPackage}
                        disabled={fleet.length === 0}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
                    >
                        <Plus className="w-4 h-4" />
                        Add Package
                    </Button>
                    {fleet.length === 0 && (
                        <p className="text-xs text-amber-600">Add fleet cars in the previous step first.</p>
                    )}
                </div>
            </div>
        );
    }

    /* ---------------------------------------------------------------- */
    /*  Packages list                                                     */
    /* ---------------------------------------------------------------- */
    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
                Bundle your fleet into combo packages. All fields are required when a package is added.
            </p>

            {packages.map((pkg, pkgIdx) => (
                <div
                    key={pkgIdx}
                    className="border rounded-xl p-6 space-y-5 bg-white/50 backdrop-blur-sm relative"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            <h3 className="text-base font-semibold text-neutral-800">
                                {pkg.name.trim() || `Package ${pkgIdx + 1}`}
                            </h3>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={() => removePackage(pkgIdx)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Package Name */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-neutral-700">
                            Package Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            placeholder='e.g. "Wedding Baraat Special"'
                            value={pkg.name}
                            onChange={(e) => updatePackage(pkgIdx, 'name', e.target.value)}
                            className={errors[`crPkg[${pkgIdx}].name`] ? 'border-red-500' : ''}
                        />
                        {errors[`crPkg[${pkgIdx}].name`] && (
                            <p className="text-red-500 text-xs">{errors[`crPkg[${pkgIdx}].name`]}</p>
                        )}
                    </div>

                    {/* Cars in this package */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-neutral-700">
                            Cars Included <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-xs text-neutral-500 -mt-1">
                            Select car types from your fleet and set quantities for this package.
                        </p>

                        {pkg.cars.map((carRow, carIdx) => {
                            const selectedFleet = carRow.carIndex >= 0 ? fleet[carRow.carIndex] : null;
                            const max = selectedFleet ? fleetMaxUnits(selectedFleet) : 999;

                            // Already-selected carIndexes in other rows of this package (for duplicate prevention)
                            const takenIndexes = pkg.cars
                                .filter((_, i) => i !== carIdx)
                                .map((c) => c.carIndex);

                            return (
                                <div key={carIdx} className="flex items-start gap-3">
                                    {/* Car dropdown */}
                                    <div className="flex-1 space-y-1">
                                        <Select
                                            value={carRow.carIndex >= 0 ? String(carRow.carIndex) : ''}
                                            onValueChange={(v) => updateCarRow(pkgIdx, carIdx, 'carIndex', Number(v))}
                                        >
                                            <SelectTrigger className={errors[`crPkg[${pkgIdx}].cars`] ? 'border-red-500' : ''}>
                                                <div className="flex items-center gap-2">
                                                    <Car className="w-3.5 h-3.5 text-neutral-400" />
                                                    <SelectValue placeholder="Select a car" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {fleet.map((f, fi) => (
                                                    <SelectItem
                                                        key={fi}
                                                        value={String(fi)}
                                                        disabled={takenIndexes.includes(fi)}
                                                    >
                                                        {fleetLabel(f)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Quantity */}
                                    <div className="w-24 space-y-1">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={max}
                                            placeholder="Qty"
                                            value={carRow.quantity > 0 ? carRow.quantity : ''}
                                            onChange={(e) => {
                                                const raw = e.target.value;
                                                if (raw === '') {
                                                    updateCarRow(pkgIdx, carIdx, 'quantity', 0);
                                                    return;
                                                }
                                                const num = parseInt(raw, 10);
                                                if (!isNaN(num)) {
                                                    updateCarRow(pkgIdx, carIdx, 'quantity', Math.min(max, Math.max(0, num)));
                                                }
                                            }}
                                            onBlur={() => {
                                                if (!carRow.quantity || carRow.quantity < 1) {
                                                    updateCarRow(pkgIdx, carIdx, 'quantity', 1);
                                                }
                                            }}
                                            className={errors[`crPkg[${pkgIdx}].car[${carIdx}].qty`] ? 'border-red-500' : ''}
                                        />
                                    </div>

                                    {/* Remove row */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        onClick={() => removeCarRow(pkgIdx, carIdx)}
                                        disabled={pkg.cars.length <= 1}
                                        className={`text-red-400 hover:text-red-600 hover:bg-red-50 mt-0.5 ${pkg.cars.length <= 1 ? 'opacity-0 pointer-events-none' : ''}`}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            );
                        })}

                        {/* Per-car errors */}
                        {errors[`crPkg[${pkgIdx}].cars`] && (
                            <p className="text-red-500 text-xs">{errors[`crPkg[${pkgIdx}].cars`]}</p>
                        )}
                        {pkg.cars.map((_, ci) =>
                            errors[`crPkg[${pkgIdx}].car[${ci}].qty`] ? (
                                <p key={ci} className="text-red-500 text-xs">
                                    Car {ci + 1}: {errors[`crPkg[${pkgIdx}].car[${ci}].qty`]}
                                </p>
                            ) : null
                        )}

                        {/* Add car row button */}
                        {pkg.cars.length < fleet.length && (
                            <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={() => addCarRow(pkgIdx)}
                                className="text-xs text-primary border-primary/40 hover:bg-primary/5"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Another Car Type
                            </Button>
                        )}
                    </div>

                    {/* Cities Covered */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-neutral-700">
                            Cities Covered <span className="text-red-500">*</span>
                        </Label>
                        {cities.length === 0 ? (
                            <p className="text-xs text-amber-600">
                                No cities found. Please add cities in the Business Details step.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {cities.map((city) => {
                                    const isSelected = pkg.citiesCovered.includes(city);
                                    return (
                                        <Badge
                                            key={city}
                                            variant={isSelected ? 'default' : 'outline'}
                                            className={`cursor-pointer text-sm px-3 py-1.5 transition-colors ${
                                                isSelected
                                                    ? 'bg-primary hover:bg-primary/90'
                                                    : 'hover:bg-muted'
                                            }`}
                                            onClick={() => toggleCity(pkgIdx, city)}
                                        >
                                            {city}
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                        {errors[`crPkg[${pkgIdx}].cities`] && (
                            <p className="text-red-500 text-xs">{errors[`crPkg[${pkgIdx}].cities`]}</p>
                        )}
                    </div>

                    {/* Total Price */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-neutral-700">
                                Total Price (PKR) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="number"
                                placeholder="e.g. 100000"
                                min={0}
                                value={pkg.totalPrice > 0 ? pkg.totalPrice : ''}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === '') { updatePackage(pkgIdx, 'totalPrice', 0); return; }
                                    const num = parseInt(raw, 10);
                                    if (!isNaN(num)) updatePackage(pkgIdx, 'totalPrice', Math.max(0, num));
                                }}
                                className={errors[`crPkg[${pkgIdx}].price`] ? 'border-red-500' : ''}
                            />
                            {errors[`crPkg[${pkgIdx}].price`] && (
                                <p className="text-red-500 text-xs">{errors[`crPkg[${pkgIdx}].price`]}</p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-neutral-700">
                            Description{' '}
                            <span className="text-neutral-400 font-normal text-xs">(recommended)</span>
                        </Label>
                        <Textarea
                            placeholder='e.g. "10 Corolla + 2 Limousines available across 5 cities — perfect for large baraats."'
                            value={pkg.description}
                            onChange={(e) => updatePackage(pkgIdx, 'description', e.target.value)}
                            className="min-h-[80px] text-sm"
                        />
                    </div>
                </div>
            ))}

            {/* Add package button */}
            <Button
                variant="outline"
                type="button"
                onClick={addPackage}
                className="flex items-center gap-2 text-primary border-primary hover:bg-primary hover:text-white"
            >
                <Plus className="w-4 h-4" />
                Add Another Package
            </Button>
        </div>
    );
};

export default CarPackagesStep;

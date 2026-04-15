'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus, Car, ImagePlus, X } from 'lucide-react';
import { useFormContext } from '@/lib/context/form-context';
import { useDropzone } from 'react-dropzone';

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Luxury', 'Classic', 'Limousine', 'Bus', 'Van'];
const COLORS = ['White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Gold', 'Beige', 'Other'];

interface CarEntry {
    make: string;
    model: string;
    year: string;
    vehicleType: string;
    color: string;
    seatingCapacity: string;
    unitsAvailable: string;
    pricePerEvent: string;
    withDriver: boolean;
    acAvailable: boolean;
    decorationAvailable: boolean;
    imageFiles: File[];
}

const DEFAULT_CAR: CarEntry = {
    make: '',
    model: '',
    year: '',
    vehicleType: '',
    color: '',
    seatingCapacity: '',
    unitsAvailable: '',
    pricePerEvent: '',
    withDriver: false,
    acAvailable: true,
    decorationAvailable: false,
    imageFiles: [],
};

function carToPackage(car: CarEntry) {
    return {
        id: undefined as number | undefined,
        name: [car.make, car.model, car.year].filter(Boolean).join(' '),
        price: Number(car.pricePerEvent) || 0,
        features: {
            make: car.make ? [car.make] : [],
            model: car.model ? [car.model] : [],
            year: car.year ? [car.year] : [],
            vehicleType: car.vehicleType ? [car.vehicleType] : [],
            color: car.color ? [car.color] : [],
            seatingCapacity: car.seatingCapacity ? [`${car.seatingCapacity} Seats`] : [],
            unitsAvailable: car.unitsAvailable ? [`${car.unitsAvailable} Units`] : [],
            driver: [car.withDriver ? 'Yes' : 'No'],
            ac: [car.acAvailable ? 'Yes' : 'No'],
            decoration: [car.decorationAvailable ? 'Available' : 'Not Available'],
        },
    };
}

function packageToCar(pkg: ReturnType<typeof carToPackage>, imageFiles: File[] = []): CarEntry {
    return {
        make: pkg.features.make?.[0] ?? '',
        model: pkg.features.model?.[0] ?? '',
        year: pkg.features.year?.[0] ?? '',
        vehicleType: pkg.features.vehicleType?.[0] ?? '',
        color: pkg.features.color?.[0] ?? '',
        seatingCapacity: (pkg.features.seatingCapacity?.[0] ?? '').replace(' Seats', ''),
        unitsAvailable: (pkg.features.unitsAvailable?.[0] ?? '').replace(' Units', ''),
        pricePerEvent: pkg.price ? String(pkg.price) : '',
        withDriver: pkg.features.driver?.[0] === 'Yes',
        acAvailable: pkg.features.ac?.[0] === 'Yes',
        decorationAvailable: pkg.features.decoration?.[0] === 'Available',
        imageFiles,
    };
}

/* ------------------------------------------------------------------ */
/*  Per-car inline image uploader                                       */
/* ------------------------------------------------------------------ */
interface CarImageUploaderProps {
    files: File[];
    onAdd: (files: File[]) => void;
    onRemove: (index: number) => void;
}

const MAX_CAR_IMAGES = 10;

function CarImageUploader({ files, onAdd, onRemove }: CarImageUploaderProps) {
    const isAtLimit = files.length >= MAX_CAR_IMAGES;

    const onDrop = useCallback(
        (accepted: File[]) => {
            const remaining = MAX_CAR_IMAGES - files.length;
            onAdd(accepted.slice(0, remaining));
        },
        [files.length, onAdd]
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
        multiple: true,
        disabled: isAtLimit,
        noClick: files.length > 0,
    });

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-neutral-700">Car Images</Label>
                <span className={`text-xs font-medium border px-2.5 py-1 rounded-full ${
                    isAtLimit
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-violet-50 text-violet-600 border-violet-200'
                }`}>
                    {files.length} / {MAX_CAR_IMAGES}
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
                    <div className="flex flex-col items-center justify-center py-8 text-center select-none">
                        <ImagePlus className={`w-8 h-8 mb-2 ${isDragActive ? 'text-violet-500' : 'text-neutral-400'}`} />
                        <p className="text-sm font-medium text-neutral-600">
                            {isDragActive ? 'Drop to upload' : 'Add car photos'}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                            JPG, PNG · up to {MAX_CAR_IMAGES} images
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
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
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
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow"
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

interface CarDetailsStepProps {
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const CarDetailsStep = ({ errors, setErrors }: CarDetailsStepProps) => {
    const { formData, setFormData } = useFormContext();

    const [cars, setCars] = useState<CarEntry[]>(() => {
        // Restore from formData.packages if navigating back
        const existing = formData.packages.filter((p) => p.name || p.price);
        if (existing.length > 0) {
            return existing.map((p, i) =>
                packageToCar(
                    p as ReturnType<typeof carToPackage>,
                    formData.packageImageFiles?.[i] ?? []
                )
            );
        }
        return [{ ...DEFAULT_CAR }];
    });

    // Sync cars → formData.packages on every change
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            packages: cars.map(carToPackage),
            packageImageFiles: cars.map((c) => c.imageFiles),
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cars]);

    const updateCar = (index: number, field: keyof CarEntry, value: string | boolean) => {
        setCars((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
        // Clear field-level errors
        setErrors((prev) => ({ ...prev, [`packages[${index}].name`]: '', [`packages[${index}].price`]: '', packages: '' }));
    };

    const addCar = () => {
        setCars((prev) => [...prev, { ...DEFAULT_CAR }]);
    };

    const removeCar = (index: number) => {
        setCars((prev) => prev.filter((_, i) => i !== index));
    };

    const addCarImages = (index: number, incoming: File[]) => {
        setCars((prev) => {
            const next = [...prev];
            const current = next[index].imageFiles;
            const merged = [...current, ...incoming].slice(0, 10);
            next[index] = { ...next[index], imageFiles: merged };
            return next;
        });
    };

    const removeCarImage = (carIndex: number, imgIndex: number) => {
        setCars((prev) => {
            const next = [...prev];
            const files = next[carIndex].imageFiles.filter((_, i) => i !== imgIndex);
            next[carIndex] = { ...next[carIndex], imageFiles: files };
            return next;
        });
    };

    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
                Add the vehicles in your fleet. Each entry represents one car available for booking.
            </p>

            {cars.map((car, index) => (
                <div key={index} className="border rounded-xl p-6 space-y-5 bg-white/50 backdrop-blur-sm relative">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Car className="w-5 h-5 text-primary" />
                            <h3 className="text-base font-semibold text-neutral-800">
                                {[car.make, car.model, car.year].filter(Boolean).join(' ') || `Car ${index + 1}`}
                            </h3>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeCar(index)}
                            disabled={cars.length <= 1}
                            className={`text-red-500 hover:bg-red-50 hover:text-red-600 ${cars.length <= 1 ? 'opacity-0 pointer-events-none' : ''}`}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Row 1: Make, Model, Year */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-neutral-700">Car Make <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder="e.g. Toyota"
                                value={car.make}
                                onChange={(e) => updateCar(index, 'make', e.target.value)}
                                className={errors[`packages[${index}].name`] ? 'border-red-500' : ''}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-neutral-700">Car Model <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder="e.g. Corolla"
                                value={car.model}
                                onChange={(e) => updateCar(index, 'model', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-neutral-700">Year</Label>
                            <Input
                                placeholder="e.g. 2022"
                                value={car.year}
                                maxLength={4}
                                onChange={(e) => updateCar(index, 'year', e.target.value.replace(/\D/g, ''))}
                            />
                        </div>
                    </div>
                    {errors[`packages[${index}].name`] && (
                        <p className="text-red-500 text-xs -mt-3">{errors[`packages[${index}].name`]}</p>
                    )}

                    {/* Row 2: Vehicle Type, Color, Seating Capacity */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-neutral-700">Vehicle Type</Label>
                            <Select value={car.vehicleType} onValueChange={(v) => updateCar(index, 'vehicleType', v)}>
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
                            <Label className="text-sm font-medium text-neutral-700">Color</Label>
                            <Select value={car.color} onValueChange={(v) => updateCar(index, 'color', v)}>
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
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-neutral-700">Seating Capacity</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 5"
                                min={1}
                                max={60}
                                value={car.seatingCapacity}
                                onKeyDown={(e) => {
                                    if (['.', '-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
                                }}
                                onChange={(e) => updateCar(index, 'seatingCapacity', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Row 3: Price + Units Available */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-neutral-700">
                                Price per Event (PKR) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="number"
                                placeholder="e.g. 15000"
                                min={0}
                                value={car.pricePerEvent}
                                onKeyDown={(e) => {
                                    if (['.', '-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
                                }}
                                onChange={(e) => updateCar(index, 'pricePerEvent', e.target.value)}
                                className={errors[`packages[${index}].price`] ? 'border-red-500' : ''}
                            />
                            {errors[`packages[${index}].price`] && (
                                <p className="text-red-500 text-xs">{errors[`packages[${index}].price`]}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <Label className="text-sm font-medium text-neutral-700">Units Available</Label>
                                <div className="group relative flex items-center">
                                    <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-500 text-[10px] font-bold flex items-center justify-center cursor-default select-none">i</span>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center whitespace-nowrap bg-neutral-800 text-white text-xs rounded-lg px-3 py-1.5 shadow-lg z-10 pointer-events-none">
                                        Number of Cars Available for this Model
                                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800" />
                                    </div>
                                </div>
                            </div>
                            <Input
                                type="number"
                                placeholder="e.g. 3"
                                min={1}
                                value={car.unitsAvailable}
                                onKeyDown={(e) => {
                                    if (['.', '-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
                                }}
                                onChange={(e) => updateCar(index, 'unitsAvailable', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Row 4: Toggles */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-neutral-700">Features</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {([
                                { field: 'withDriver', label: 'Driver Included' },
                                { field: 'acAvailable', label: 'AC Available' },
                                { field: 'decorationAvailable', label: 'Decoration Available' },
                            ] as { field: keyof CarEntry; label: string }[]).map(({ field, label }) => {
                                const isOn = car[field] as boolean;
                                return (
                                    <button
                                        key={field}
                                        type="button"
                                        onClick={() => updateCar(index, field, !isOn)}
                                        className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                                            isOn
                                                ? 'bg-primary/10 border-primary/30 text-primary'
                                                : 'bg-neutral-50 border-neutral-200 text-neutral-500 hover:bg-neutral-100'
                                        }`}
                                    >
                                        <span>{label}</span>
                                        <span className={`text-xs font-semibold ml-2 ${isOn ? 'text-primary' : 'text-neutral-400'}`}>
                                            {isOn ? 'Yes' : 'No'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Row 5: Car Images */}
                    <CarImageUploader
                        files={car.imageFiles}
                        onAdd={(files) => addCarImages(index, files)}
                        onRemove={(imgIndex) => removeCarImage(index, imgIndex)}
                    />
                </div>
            ))}

            {errors.packages && (
                <p className="text-red-500 text-sm">{errors.packages}</p>
            )}

            <Button
                variant="outline"
                onClick={addCar}
                className="flex items-center gap-2 text-primary border-primary hover:bg-primary hover:text-white"
            >
                <Plus className="w-4 h-4" />
                Add Another Car
            </Button>
        </div>
    );
};

export default CarDetailsStep;

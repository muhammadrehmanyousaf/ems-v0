'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import {
    Loader2, CalendarIcon, User, CalendarDays, Building2, FileText,
    Receipt, Minus, Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    PackagesAPI, MenusAPI, BookingsAPI,
    type ApiBusiness, type ApiPackage, type ApiMenu,
} from '@/lib/api/dashboard';
import { useBusiness } from '@/context/BusinessContext';

interface OfflineBookingDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSuccess: () => void;
}

const TIME_SLOTS = [
    { value: '09:00', label: 'Morning  (9 AM – 12 PM)' },
    { value: '14:00', label: 'Afternoon (2 PM – 6 PM)' },
    { value: '18:00', label: 'Evening  (6 PM – 11 PM)' },
];

// Vendor types that need guest count
const GUEST_COUNT_TYPES = ['Wedding venue', 'Catering', 'Decorator'];
const MENU_TYPES = ['Catering'];
const QUANTITY_TYPES = ['Car rental', 'Bridal wearing', 'Wedding Invitations and Stationery'];

// Car rental feature detectors (mirrors packages-tab logic)
const isCarFleetFeatures = (f: unknown) =>
    !!f && typeof f === 'object' && !Array.isArray(f) && 'make' in (f as object);
const isCarPackageFeatures = (f: unknown) =>
    !!f && typeof f === 'object' && !Array.isArray(f) && 'cars' in (f as object) && !('make' in (f as object));

function getQuantityLabel(vendorType: string) {
    if (vendorType === 'Car rental') return 'Vehicles';
    if (vendorType === 'Bridal wearing') return 'Outfits';
    return 'Sets';
}

function getDateLabel(vendorType: string) {
    if (vendorType === 'Car rental') return 'Service Date *';
    if (vendorType === 'Bridal wearing') return 'Fitting Date *';
    if (vendorType === 'Wedding Invitations and Stationery') return 'Delivery Date *';
    return 'Event Date *';
}

function getDialogDescription(vendorType: string) {
    if (vendorType === 'Car rental') return 'Record a vehicle booking for a walk-in customer.';
    if (vendorType === 'Bridal wearing') return 'Record a bridal wear booking for a walk-in customer.';
    if (vendorType === 'Wedding Invitations and Stationery') return 'Record a stationery order for a walk-in customer.';
    return 'Create a booking for a walk-in customer. Fill in their details below.';
}

function getVendorTypeBadgeColor(vendorType: string) {
    const map: Record<string, string> = {
        'Photographer': 'bg-blue-100 text-blue-700',
        'Decorator': 'bg-pink-100 text-pink-700',
        'Henna artist': 'bg-orange-100 text-orange-700',
        'Makeup artist': 'bg-rose-100 text-rose-700',
        'Wedding venue': 'bg-purple-100 text-purple-700',
        'Car rental': 'bg-cyan-100 text-cyan-700',
        'Catering': 'bg-green-100 text-green-700',
        'Bridal wearing': 'bg-fuchsia-100 text-fuchsia-700',
        'Wedding Invitations and Stationery': 'bg-amber-100 text-amber-700',
    };
    return map[vendorType] ?? 'bg-neutral-100 text-neutral-700';
}

const formatPKR = (n: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n);

function getFeaturePreview(features: ApiPackage['features']): string[] {
    if (!features) return [];
    if (Array.isArray(features)) return (features as string[]).slice(0, 3);
    if (typeof features === 'object') {
        const f = features as Record<string, unknown>;
        if ('make' in f) {
            const ff = f as Record<string, string[]>;
            return [ff.vehicleType?.[0], ff.seatingCapacity?.[0] && `${ff.seatingCapacity[0]} seats`, ff.driver?.[0] === 'Yes' ? 'With driver' : '', ff.ac?.[0] === 'Yes' ? 'AC' : ''].filter(Boolean).slice(0, 4) as string[];
        }
        if ('cars' in f) {
            const cars = (f.cars as { carName: string; quantity: number }[]) ?? [];
            return cars.slice(0, 3).map(c => c.quantity > 1 ? `${c.carName} ×${c.quantity}` : c.carName);
        }
        return Object.values(f as Record<string, string[]>).flat().slice(0, 3) as string[];
    }
    return [];
}

function MenuOption({ menu }: { menu: ApiMenu }) {
    const items = (menu.data as Record<string, unknown>)?.items;
    const itemList = Array.isArray(items) ? (items as string[]).slice(0, 4) : [];
    return (
        <div className="flex flex-col gap-0.5 py-0.5 w-full">
            <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-sm truncate">{menu.title}</span>
                <span className="text-xs font-semibold text-green-600 shrink-0">
                    {formatPKR(menu.price)}<span className="font-normal text-muted-foreground">/head</span>
                </span>
            </div>
            {itemList.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                    {itemList.map((item, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                            {item}
                        </span>
                    ))}
                    {Array.isArray(items) && items.length > 4 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
                            +{items.length - 4} more
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

function PackageOption({ pkg }: { pkg: ApiPackage }) {
    const preview = getFeaturePreview(pkg.features);
    return (
        <div className="flex flex-col gap-0.5 py-0.5 w-full">
            <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-sm truncate">{pkg.name}</span>
                <span className="text-xs font-semibold text-purple-600 shrink-0">{formatPKR(pkg.price)}</span>
            </div>
            {pkg.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-1">{pkg.description}</p>
            )}
            {preview.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                    {preview.map((f, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                            {f}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export function OfflineBookingDialog({ open, onOpenChange, onSuccess }: OfflineBookingDialogProps) {
    // Customer fields
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    // Event / service fields
    const [bookingDate, setBookingDate] = useState<Date | undefined>();
    const [bookingTime, setBookingTime] = useState('');
    const [guestCount, setGuestCount] = useState('');
    const [quantity, setQuantity] = useState(1);

    // Service selection
    const [selectedBusinessId, setSelectedBusinessId] = useState('');
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [selectedMenuId, setSelectedMenuId] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');
    const [carMode, setCarMode] = useState<'package' | 'single'>('package');

    // Remote data
    const { businesses, loading: loadingBusinesses } = useBusiness();
    const [packages, setPackages] = useState<ApiPackage[]>([]);
    const [menus, setMenus] = useState<ApiMenu[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load packages & menus when business changes
    useEffect(() => {
        if (!selectedBusinessId) { setPackages([]); setMenus([]); return; }
        const bizId = Number(selectedBusinessId);
        setLoadingOptions(true);
        setSelectedPackageId('');
        setSelectedMenuId('');
        setQuantity(1);
        setCarMode('package');
        Promise.all([PackagesAPI.getAll(bizId), MenusAPI.getAll(bizId)])
            .then(([pkgs, mns]) => { setPackages(pkgs); setMenus(mns); })
            .catch(() => toast.error('Failed to load packages / menus'))
            .finally(() => setLoadingOptions(false));
    }, [selectedBusinessId]);

    const resetForm = useCallback(() => {
        setCustomerName(''); setCustomerEmail(''); setCustomerPhone('');
        setBookingDate(undefined); setBookingTime('');
        setGuestCount(''); setQuantity(1);
        setSelectedBusinessId(''); setSelectedPackageId(''); setSelectedMenuId('');
        setSpecialRequests('');
        setCarMode('package');
        setPackages([]); setMenus([]);

    }, []);

    const handleClose = (v: boolean) => { if (!v) resetForm(); onOpenChange(v); };

    // Derived values
    const selectedBusiness = useMemo(
        () => businesses.find((b) => String(b.id) === selectedBusinessId),
        [businesses, selectedBusinessId],
    );
    const vendorType = selectedBusiness?.vendor?.vendorType ?? '';
    const showGuestCount = GUEST_COUNT_TYPES.includes(vendorType);
    const showMenu = MENU_TYPES.includes(vendorType);
    const isCarRental = vendorType === 'Car rental';
    const showQuantity = isCarRental ? carMode === 'single' : QUANTITY_TYPES.includes(vendorType);
    const qtyLabel = getQuantityLabel(vendorType);

    // For car rental: filter packages by mode
    const filteredPackages = isCarRental
        ? carMode === 'single'
            ? packages.filter(p => isCarFleetFeatures(p.features))
            : packages.filter(p => isCarPackageFeatures(p.features))
        : packages;

    // Selected package / menu objects for price display
    const selectedPackageObj = useMemo(
        () => packages.find((p) => String(p.id) === selectedPackageId),
        [packages, selectedPackageId],
    );
    const selectedMenuObj = useMemo(
        () => menus.find((m) => String(m.id) === selectedMenuId),
        [menus, selectedMenuId],
    );

    // Live price calculation (mirrors server-side logic)
    const priceBreakdown = useMemo(() => {
        if (!selectedBusiness) return null;
        const items: { label: string; amount: number }[] = [];

        if (selectedPackageObj) {
            const unitPrice = Number(selectedPackageObj.price) || 0;
            const total = unitPrice * (showQuantity ? quantity : 1);
            items.push({
                label: showQuantity && quantity > 1
                    ? `${selectedPackageObj.name} ×${quantity}`
                    : selectedPackageObj.name,
                amount: total,
            });
        }
        if (selectedMenuObj) {
            const menuUnitPrice = Number(selectedMenuObj.price) || 0;
            const guests = showGuestCount && guestCount ? Number(guestCount) : 1;
            const menuTotal = menuUnitPrice * guests;
            items.push({
                label: showGuestCount && guests > 1
                    ? `${selectedMenuObj.title} ×${guests} guests`
                    : selectedMenuObj.title,
                amount: menuTotal,
            });
        }
        if (items.length === 0 && selectedBusiness.minimumPrice) {
            items.push({ label: 'Base price', amount: Number(selectedBusiness.minimumPrice) });
        }

        const subtotal = items.reduce((s, i) => s + i.amount, 0);

        // Down payment
        const dpType = (selectedBusiness.downPaymentType || '').toLowerCase();
        const dpValue = Number(selectedBusiness.downPayment) || 0;
        let downPayment = 0;
        if (dpType === 'percentage' || dpType === 'percent') {
            downPayment = Math.round(subtotal * (dpValue / 100));
        } else {
            downPayment = dpValue;
        }

        return { items, subtotal, downPayment };
    }, [selectedBusiness, selectedPackageObj, selectedMenuObj, quantity, showQuantity, guestCount, showGuestCount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName.trim() || !customerPhone.trim()) {
            toast.error('Please fill in customer name and phone number');
            return;
        }
        if (!bookingDate || !bookingTime) {
            toast.error('Please select a date and time');
            return;
        }
        if (!selectedBusinessId) {
            toast.error('Please select a business');
            return;
        }

        setSaving(true);
        try {
            await BookingsAPI.create({
                customerName: customerName.trim(),
                customerEmail: customerEmail.trim() || `offline_${Date.now()}@ajoint.app`,
                customerPhone: customerPhone.trim(),
                bookingDate: format(bookingDate, 'yyyy-MM-dd'),
                bookingTime,
                guestCount: showGuestCount && guestCount ? Number(guestCount) : undefined,
                vendors: [{
                    businessId: Number(selectedBusinessId),
                    packageId: selectedPackageId ? Number(selectedPackageId) : null,
                    menuId: selectedMenuId ? Number(selectedMenuId) : null,
                    vehicleQuantity: showQuantity ? quantity : undefined,
                    totalAmount: 0,   // server overrides
                    downPayment: 0,   // server overrides
                    specialRequests: specialRequests.trim() || null,
                }],
                isOfflineBooking: true,
            });
            toast.success('Booking created successfully');
            resetForm();
            onOpenChange(false);
            onSuccess();
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to create booking';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
                    <DialogTitle>Add Offline Booking</DialogTitle>
                    <DialogDescription>
                        {vendorType ? getDialogDescription(vendorType) : 'Create a booking for a walk-in customer.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto px-6 py-2 space-y-5">

                    {/* ── Customer Info ── */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <User className="h-4 w-4" />
                            Customer Information
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="ob-name">Full Name *</Label>
                                <Input
                                    id="ob-name"
                                    placeholder="Customer name"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ob-phone">Phone Number *</Label>
                                <Input
                                    id="ob-phone"
                                    placeholder="03XX-XXXXXXX"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="sm:col-span-2 space-y-1.5">
                                <Label htmlFor="ob-email">
                                    Email
                                    <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                                </Label>
                                <Input
                                    id="ob-email"
                                    type="email"
                                    placeholder="customer@example.com"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* ── Service Selection ── */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            Service Selection
                        </div>
                        <div className="space-y-3">
                            {/* Business + vendor type badge */}
                            <div className="space-y-1.5">
                                <Label>Business *</Label>
                                <Select
                                    value={selectedBusinessId}
                                    onValueChange={setSelectedBusinessId}
                                    disabled={loadingBusinesses}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingBusinesses ? 'Loading...' : 'Select your business'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {businesses.map((b) => (
                                            <SelectItem key={b.id} value={String(b.id)}>
                                                <div className="flex items-center gap-2">
                                                    <span>{b.name}</span>
                                                    {b.vendor?.vendorType && (
                                                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', getVendorTypeBadgeColor(b.vendor.vendorType))}>
                                                            {b.vendor.vendorType}
                                                        </span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {vendorType && (
                                    <p className="text-xs text-muted-foreground">
                                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', getVendorTypeBadgeColor(vendorType))}>
                                            {vendorType}
                                        </span>
                                        {selectedBusiness?.city && ` · ${selectedBusiness.city}`}
                                        {showGuestCount && selectedBusiness?.maxCapacity ? ` · Max ${selectedBusiness.maxCapacity} guests` : ''}
                                    </p>
                                )}
                            </div>

                            {/* Car Rental mode toggle */}
                            {isCarRental && selectedBusinessId && (
                                <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => { setCarMode('package'); setSelectedPackageId(''); setQuantity(1); }}
                                        className={cn('flex-1 py-2 text-sm font-medium transition-colors',
                                            carMode === 'package' ? 'bg-purple-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'
                                        )}
                                    >
                                        Package
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setCarMode('single'); setSelectedPackageId(''); setQuantity(1); }}
                                        className={cn('flex-1 py-2 text-sm font-medium border-l border-neutral-200 transition-colors',
                                            carMode === 'single' ? 'bg-purple-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'
                                        )}
                                    >
                                        Single Car
                                    </button>
                                </div>
                            )}

                            {/* Package */}
                            {selectedBusinessId && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label>
                                            {isCarRental
                                                ? carMode === 'single' ? 'Select Vehicle' : 'Select Package'
                                                : vendorType === 'Bridal wearing' ? 'Outfit Package'
                                                : vendorType === 'Wedding Invitations and Stationery' ? 'Product'
                                                : 'Package'}
                                        </Label>
                                        <Select
                                            value={selectedPackageId}
                                            onValueChange={setSelectedPackageId}
                                            disabled={loadingOptions}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={
                                                    loadingOptions ? 'Loading...' :
                                                    filteredPackages.length === 0
                                                        ? (isCarRental && carMode === 'single' ? 'No vehicles' : 'No packages')
                                                        : (isCarRental && carMode === 'single' ? 'Select vehicle' : 'Select package')
                                                } />
                                            </SelectTrigger>
                                            <SelectContent className="max-w-sm">
                                                {filteredPackages.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)} textValue={`${p.name} — ${formatPKR(p.price)}`}>
                                                        <PackageOption pkg={p} />
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Menu — only for venue / catering */}
                                    {showMenu && (
                                        <div className="space-y-1.5">
                                            <Label>Menu</Label>
                                            <Select
                                                value={selectedMenuId}
                                                onValueChange={setSelectedMenuId}
                                                disabled={loadingOptions}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={
                                                        loadingOptions ? 'Loading...' :
                                                        menus.length === 0 ? 'No menus' : 'Select menu'
                                                    } />
                                                </SelectTrigger>
                                                <SelectContent className="max-w-sm">
                                                    {menus.map((m) => (
                                                        <SelectItem key={m.id} value={String(m.id)} textValue={`${m.title} — ${formatPKR(m.price)}/head`}>
                                                            <MenuOption menu={m} />
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quantity stepper — car rental / bridal / stationery */}
                            {showQuantity && selectedPackageId && (
                                <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5">
                                    <span className="text-sm font-medium text-neutral-700">
                                        Number of {qtyLabel}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            disabled={quantity <= 1}
                                            className="w-7 h-7 rounded-full flex items-center justify-center border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-bold text-neutral-900">{quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(q => Math.min(99, q + 1))}
                                            disabled={quantity >= 99}
                                            className="w-7 h-7 rounded-full flex items-center justify-center border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* ── Event / Service Date ── */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            {vendorType === 'Car rental' ? 'Service Details' :
                             vendorType === 'Bridal wearing' ? 'Fitting Details' :
                             vendorType === 'Wedding Invitations and Stationery' ? 'Delivery Details' :
                             'Event Details'}
                        </div>
                        <div className={cn('grid gap-3', showGuestCount ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}>
                            {/* Date */}
                            <div className="space-y-1.5">
                                <Label>{getDateLabel(vendorType)}</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn('w-full justify-start text-left font-normal', !bookingDate && 'text-muted-foreground')}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {bookingDate ? format(bookingDate, 'MMM dd, yyyy') : 'Pick a date'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={bookingDate}
                                            onSelect={setBookingDate}
                                            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Time slot */}
                            <div className="space-y-1.5">
                                <Label>Time Slot *</Label>
                                <Select value={bookingTime} onValueChange={setBookingTime}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIME_SLOTS.map((slot) => (
                                            <SelectItem key={slot.value} value={slot.value}>
                                                {slot.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Guest count — only for venue/catering/decorator */}
                            {showGuestCount && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="ob-guests">Number of Guests</Label>
                                    <Input
                                        id="ob-guests"
                                        type="number"
                                        min={1}
                                        placeholder="e.g. 200"
                                        value={guestCount}
                                        onChange={(e) => setGuestCount(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* ── Notes ── */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            Additional Notes
                        </div>
                        <Textarea
                            placeholder="Any special requests or notes..."
                            value={specialRequests}
                            onChange={(e) => setSpecialRequests(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {/* ── Live Price Summary ── */}
                    {priceBreakdown && priceBreakdown.subtotal > 0 && (
                        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-1">
                                <Receipt className="h-4 w-4 text-purple-500" />
                                Price Summary
                            </div>
                            {priceBreakdown.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-neutral-600">{item.label}</span>
                                    <span className="font-medium text-neutral-800">{formatPKR(item.amount)}</span>
                                </div>
                            ))}
                            <div className="border-t border-neutral-200 pt-2 flex justify-between text-sm font-semibold">
                                <span className="text-neutral-800">Total</span>
                                <span className="text-purple-700">{formatPKR(priceBreakdown.subtotal)}</span>
                            </div>
                            {priceBreakdown.downPayment > 0 && (
                                <div className="flex justify-between text-xs text-purple-600">
                                    <span>Down Payment (due now)</span>
                                    <span className="font-medium">{formatPKR(priceBreakdown.downPayment)}</span>
                                </div>
                            )}
                        </div>
                    )}

                </div>
                    <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Booking
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

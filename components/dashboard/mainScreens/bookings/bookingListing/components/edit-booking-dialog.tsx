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
import { Switch } from '@/components/ui/switch';
import {
    Loader2, CalendarIcon, User, CalendarDays, Building2,
    FileText, CreditCard, Minus, Plus, Receipt,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BookingData } from '@/lib/dashboard-types';
import axiosInstance from '@/lib/axiosConfig';
import { BACKEND_URL } from '@/lib/backend-url';
import {
    BusinessesAPI, PackagesAPI, MenusAPI,
    type ApiBusiness, type ApiPackage, type ApiMenu,
} from '@/lib/api/dashboard';

interface EditBookingDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    booking: BookingData;
    onSuccess: (updated: Partial<BookingData> | null) => void;
}

const TIME_SLOTS = [
    { value: '09:00', label: 'Morning  (9 AM – 12 PM)' },
    { value: '14:00', label: 'Afternoon (2 PM – 6 PM)' },
    { value: '18:00', label: 'Evening  (6 PM – 11 PM)' },
];

const GUEST_COUNT_TYPES = ['Wedding venue', 'Catering', 'Decorator'];
const MENU_TYPES        = ['Catering'];
const QUANTITY_TYPES    = ['Car rental', 'Bridal wearing', 'Wedding Invitations and Stationery'];

const isCarFleetFeatures = (f: unknown) =>
    !!f && typeof f === 'object' && !Array.isArray(f) && 'make' in (f as object);
const isCarPackageFeatures = (f: unknown) =>
    !!f && typeof f === 'object' && !Array.isArray(f) && 'cars' in (f as object) && !('make' in (f as object));

function getQuantityLabel(vendorType: string) {
    if (vendorType === 'Car rental')   return 'Vehicles';
    if (vendorType === 'Bridal wearing') return 'Outfits';
    return 'Sets';
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

function PackageOption({ pkg }: { pkg: ApiPackage }) {
    const preview = getFeaturePreview(pkg.features);
    return (
        <div className="flex flex-col gap-0.5 py-0.5 w-full">
            <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-sm truncate">{pkg.name}</span>
                <span className="text-xs font-semibold text-bridal-gold-dark shrink-0">{formatPKR(pkg.price)}</span>
            </div>
            {pkg.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-1">{pkg.description}</p>
            )}
            {preview.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                    {preview.map((f, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-bridal-cream text-bridal-gold-dark border border-bridal-beige">
                            {f}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

const statusBadge: Record<string, string> = {
    'Awaiting Payment': 'bg-orange-100 text-orange-700',
    Pending:   'bg-amber-100 text-amber-700',
    Confirmed: 'bg-blue-100 text-blue-700',
    Completed: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
};

export function EditBookingDialog({ open, onOpenChange, booking, onSuccess }: EditBookingDialogProps) {
    // Customer
    const [customerName,  setCustomerName]  = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');

    // Event
    const [bookingDate, setBookingDate] = useState<Date | undefined>();
    const [bookingTime, setBookingTime] = useState('');
    const [guestCount,  setGuestCount]  = useState('');

    // Service
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [selectedMenuId,    setSelectedMenuId]    = useState('');
    const [quantity,          setQuantity]          = useState(1);
    const [specialRequests,   setSpecialRequests]   = useState('');
    const [carMode,           setCarMode]           = useState<'package' | 'single'>('package');

    // Status
    const [markCompleted, setMarkCompleted] = useState(false);

    // Remote data
    const [business,        setBusiness]        = useState<ApiBusiness | null>(null);
    const [packages,        setPackages]        = useState<ApiPackage[]>([]);
    const [menus,           setMenus]           = useState<ApiMenu[]>([]);
    const [loadingService,  setLoadingService]  = useState(false);
    const [saving,          setSaving]          = useState(false);

    const detail     = booking.bookingDetails?.[0];
    const businessId = detail?.businessId;

    // Load business + packages + menus when dialog opens
    useEffect(() => {
        if (!open || !businessId) return;
        setLoadingService(true);

        Promise.all([
            BusinessesAPI.getUserBusinesses(),
            PackagesAPI.getAll(businessId),
            MenusAPI.getAll(businessId),
        ])
            .then(([businesses, pkgs, mns]) => {
                setBusiness(businesses.find((b) => b.id === businessId) ?? null);
                setPackages(pkgs);
                setMenus(mns);
            })
            .catch(() => toast.error('Failed to load service details'))
            .finally(() => setLoadingService(false));
    }, [open, businessId]);

    // Populate form fields from booking data
    useEffect(() => {
        if (!open) return;
        setCustomerName(booking.customerName ?? '');
        setCustomerPhone(booking.customerPhone ?? '');
        setCustomerEmail(booking.customerEmail ?? '');
        setBookingDate(booking.bookingDate ? parseISO(booking.bookingDate) : undefined);
        setBookingTime(booking.bookingTime ?? '');
        setSpecialRequests(booking.specialRequests ?? booking.additionalRequests ?? '');
        setGuestCount(booking.guestCount ? String(booking.guestCount) : '');
        setMarkCompleted(false);
        setCarMode('package');
        // Pre-select current package / menu
        setSelectedPackageId(detail?.packageId ? String(detail.packageId) : '');
        setSelectedMenuId(detail?.menuId ? String(detail.menuId) : '');
        setQuantity(1);
    }, [open, booking, detail]);

    const vendorType     = business?.vendor?.vendorType ?? '';
    const showGuestCount = GUEST_COUNT_TYPES.includes(vendorType);
    const showMenu       = MENU_TYPES.includes(vendorType);
    const isCarRental    = vendorType === 'Car rental';
    const showQuantity   = isCarRental ? carMode === 'single' : QUANTITY_TYPES.includes(vendorType);
    const qtyLabel       = getQuantityLabel(vendorType);

    const filteredPackages = isCarRental
        ? carMode === 'single'
            ? packages.filter(p => isCarFleetFeatures(p.features))
            : packages.filter(p => isCarPackageFeatures(p.features))
        : packages;

    const selectedPackageObj = useMemo(
        () => packages.find((p) => String(p.id) === selectedPackageId),
        [packages, selectedPackageId],
    );

    // Derive original quantity and car mode from totalAmount/packagePrice
    useEffect(() => {
        if (!open || !selectedPackageObj || !detail?.totalAmount) return;
        if (!QUANTITY_TYPES.includes(vendorType)) return;
        if (selectedPackageId !== (detail?.packageId ? String(detail.packageId) : '')) return;
        const unitPrice = Number(selectedPackageObj.price);
        if (unitPrice <= 0) return;
        const derived = Math.max(1, Math.round(Number(detail.totalAmount) / unitPrice));
        if (isCarRental) {
            // More than 1 vehicle means it was booked as single-car mode
            if (derived > 1) {
                setCarMode('single');
                setQuantity(derived);
            }
            // derived = 1 → keep default 'package' mode
        } else {
            setQuantity(derived);
        }
    }, [open, vendorType, isCarRental, selectedPackageObj, detail?.totalAmount, selectedPackageId, detail?.packageId]);

    const selectedMenuObj = useMemo(
        () => menus.find((m) => String(m.id) === selectedMenuId),
        [menus, selectedMenuId],
    );

    // Live price preview (mirrors server logic)
    const priceBreakdown = useMemo(() => {
        if (!business) return null;
        const items: { label: string; amount: number }[] = [];

        if (selectedPackageObj) {
            const unitPrice = Number(selectedPackageObj.price) || 0;
            const total     = unitPrice * (showQuantity ? quantity : 1);
            items.push({
                label: showQuantity && quantity > 1
                    ? `${selectedPackageObj.name} ×${quantity}`
                    : selectedPackageObj.name,
                amount: total,
            });
        }
        if (selectedMenuObj) {
            items.push({ label: selectedMenuObj.title, amount: Number(selectedMenuObj.price) || 0 });
        }
        if (items.length === 0 && business.minimumPrice) {
            items.push({ label: 'Base price', amount: Number(business.minimumPrice) });
        }

        const subtotal = items.reduce((s, i) => s + i.amount, 0);
        const dpType   = (business.downPaymentType || '').toLowerCase();
        const dpValue  = Number(business.downPayment) || 0;
        const downPayment =
            dpType === 'percentage' || dpType === 'percent'
                ? Math.round(subtotal * (dpValue / 100))
                : dpValue;

        return { items, subtotal, downPayment };
    }, [business, selectedPackageObj, selectedMenuObj, quantity, showQuantity]);

    const handleClose = useCallback((v: boolean) => {
        if (!v) {
            setBusiness(null);
            setPackages([]);
            setMenus([]);
        }
        onOpenChange(v);
    }, [onOpenChange]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName.trim() || !customerPhone.trim()) {
            toast.error('Customer name and phone are required');
            return;
        }
        if (!bookingDate || !bookingTime) {
            toast.error('Please select a date and time');
            return;
        }

        const payload: Record<string, unknown> = {
            customerName:  customerName.trim(),
            customerPhone: customerPhone.trim(),
            bookingDate:   format(bookingDate, 'yyyy-MM-dd'),
            bookingTime,
            specialRequests: specialRequests.trim() || null,
        };

        const emailVal = customerEmail.trim();
        if (emailVal && !emailVal.startsWith('offline_')) {
            payload.customerEmail = emailVal;
        }
        if (showGuestCount && guestCount) {
            payload.guestCount = Number(guestCount);
        }
        if (markCompleted) {
            payload.status = 'Completed';
        }

        // Only send service changes if the vendor selected a package (service section was shown)
        if (businessId) {
            payload.packageId       = selectedPackageId ? Number(selectedPackageId) : null;
            payload.menuId          = selectedMenuId    ? Number(selectedMenuId)    : null;
            payload.vehicleQuantity = showQuantity ? quantity : 1;
        }

        setSaving(true);
        try {
            const res = await axiosInstance.patch(`${BACKEND_URL}api/v1/bookings/${booking.id}`, payload);
            toast.success('Booking updated successfully');
            handleClose(false);
            onSuccess(res.data?.data ?? null);
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to update booking';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const isOfflineEmail  = (booking.customerEmail ?? '').startsWith('offline_');
    const canComplete     = booking.status === 'Confirmed';
    const isFullyPaid     = booking.paymentStatus === 'Paid';
    const packageChanged  = selectedPackageId !== (detail?.packageId ? String(detail.packageId) : '');
    const menuChanged     = selectedMenuId    !== (detail?.menuId    ? String(detail.menuId)    : '');

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div>
                            <DialogTitle>Edit Booking #{booking.id}</DialogTitle>
                            <DialogDescription className="mt-0.5">
                                Update the details for this booking.
                            </DialogDescription>
                        </div>
                        <span className={cn('ml-auto text-xs font-medium px-2.5 py-1 rounded-full shrink-0', statusBadge[booking.status] ?? 'bg-neutral-100 text-neutral-700')}>
                            {booking.status}
                        </span>
                    </div>
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
                                <Label htmlFor="eb-name">Full Name *</Label>
                                <Input
                                    id="eb-name"
                                    placeholder="Customer name"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="eb-phone">Phone Number *</Label>
                                <Input
                                    id="eb-phone"
                                    placeholder="03XX-XXXXXXX"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="sm:col-span-2 space-y-1.5">
                                <Label htmlFor="eb-email">
                                    Email
                                    {isOfflineEmail && (
                                        <span className="ml-1 text-xs text-muted-foreground">(offline booking)</span>
                                    )}
                                </Label>
                                <Input
                                    id="eb-email"
                                    type="email"
                                    placeholder="customer@example.com"
                                    value={isOfflineEmail ? '' : customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* ── Service / Package ── */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            Service Selection
                        </div>

                        {/* Business name (read-only) */}
                        <div className="space-y-1.5">
                            <Label>Business</Label>
                            <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                                {loadingService
                                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…</>
                                    : (business?.name ?? detail?.business?.name ?? '—')
                                }
                            </div>
                        </div>

                        {/* Car Rental mode toggle */}
                        {isCarRental && (
                            <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => { setCarMode('package'); setSelectedPackageId(''); setQuantity(1); }}
                                    className={cn('flex-1 py-2 text-sm font-medium transition-colors',
                                        carMode === 'package' ? 'bg-bridal-gold text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'
                                    )}
                                >
                                    Package
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setCarMode('single'); setSelectedPackageId(''); setQuantity(1); }}
                                    className={cn('flex-1 py-2 text-sm font-medium border-l border-neutral-200 transition-colors',
                                        carMode === 'single' ? 'bg-bridal-gold text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'
                                    )}
                                >
                                    Single Car
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Package */}
                            <div className="space-y-1.5">
                                <Label>
                                    {isCarRental
                                        ? carMode === 'single' ? 'Select Vehicle' : 'Select Package'
                                        : vendorType === 'Bridal wearing' ? 'Outfit Package'
                                        : vendorType === 'Wedding Invitations and Stationery' ? 'Product'
                                        : 'Package'}
                                    {packageChanged && <span className="ml-1 text-xs text-blue-500">• changed</span>}
                                </Label>
                                <Select
                                    value={selectedPackageId}
                                    onValueChange={(v) => { setSelectedPackageId(v); setQuantity(1); }}
                                    disabled={loadingService || packages.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={
                                            loadingService ? 'Loading…' :
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

                            {/* Menu — venue / catering only */}
                            {showMenu && (
                                <div className="space-y-1.5">
                                    <Label>
                                        Menu
                                        {menuChanged && <span className="ml-1 text-xs text-blue-500">• changed</span>}
                                    </Label>
                                    <Select
                                        value={selectedMenuId}
                                        onValueChange={setSelectedMenuId}
                                        disabled={loadingService || menus.length === 0}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={
                                                loadingService ? 'Loading…' :
                                                menus.length === 0 ? 'No menus' : 'Select menu'
                                            } />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {menus.map((m) => (
                                                <SelectItem key={m.id} value={String(m.id)}>
                                                    {m.title} — {formatPKR(m.price)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* Quantity stepper */}
                        {showQuantity && selectedPackageId && (
                            <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5">
                                <span className="text-sm font-medium text-neutral-700">
                                    Number of {qtyLabel}
                                </span>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        disabled={quantity <= 1}
                                        className="w-7 h-7 rounded-full flex items-center justify-center border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                                    >
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="w-8 text-center text-sm font-bold text-neutral-900">{quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                                        disabled={quantity >= 99}
                                        className="w-7 h-7 rounded-full flex items-center justify-center border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Live price preview */}
                        {priceBreakdown && (
                            <div className="rounded-lg border border-bridal-beige bg-bridal-cream px-4 py-3 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-bridal-gold-dark mb-2">
                                    <Receipt className="h-3.5 w-3.5" />
                                    Price Preview
                                </div>
                                {priceBreakdown.items.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-neutral-600">{item.label}</span>
                                        <span className="font-medium">{formatPKR(item.amount)}</span>
                                    </div>
                                ))}
                                <div className="border-t border-bridal-beige pt-1.5 flex justify-between text-sm font-bold text-bridal-gold-dark">
                                    <span>Total</span>
                                    <span>{formatPKR(priceBreakdown.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-neutral-500">
                                    <span>Down Payment</span>
                                    <span>{formatPKR(priceBreakdown.downPayment)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* ── Event Details ── */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            Event Details
                        </div>
                        <div className={cn('grid gap-3', showGuestCount ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}>
                            {/* Date */}
                            <div className="space-y-1.5">
                                <Label>Event Date *</Label>
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
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Time */}
                            <div className="space-y-1.5">
                                <Label>Time Slot *</Label>
                                <Select value={bookingTime} onValueChange={setBookingTime}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIME_SLOTS.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Guest Count */}
                            {showGuestCount && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="eb-guests">Guest Count</Label>
                                    <Input
                                        id="eb-guests"
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
                            Notes &amp; Special Requests
                        </div>
                        <Textarea
                            placeholder="Special requests or notes…"
                            value={specialRequests}
                            onChange={(e) => setSpecialRequests(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* ── Mark Completed ── */}
                    {canComplete && (
                        <>
                            <Separator />
                            <div className={cn(
                                'flex items-center justify-between rounded-lg border px-4 py-3',
                                isFullyPaid ? 'border-neutral-200 bg-neutral-50' : 'border-orange-200 bg-orange-50/50'
                            )}>
                                <div>
                                    <p className="text-sm font-medium text-neutral-800">Mark as Completed</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {isFullyPaid
                                            ? 'The event has taken place and the booking is closed.'
                                            : 'Full payment must be received before marking as completed.'
                                        }
                                    </p>
                                </div>
                                <Switch
                                    checked={markCompleted}
                                    onCheckedChange={setMarkCompleted}
                                    disabled={!isFullyPaid}
                                />
                            </div>
                        </>
                    )}

                </div>
                    <DialogFooter className="px-6 py-4 border-t shrink-0">
                        <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

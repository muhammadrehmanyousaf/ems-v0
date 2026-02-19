'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Loader2, CalendarIcon, User, CalendarDays, Building2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    BusinessesAPI, PackagesAPI, MenusAPI, BookingsAPI,
    type ApiBusiness, type ApiPackage, type ApiMenu,
} from '@/lib/api/dashboard';

interface OfflineBookingDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSuccess: () => void;
}

const TIME_SLOTS = [
    { value: '09:00', label: '09:00 AM' },
    { value: '14:00', label: '02:00 PM' },
    { value: '18:00', label: '06:00 PM' },
];

export function OfflineBookingDialog({ open, onOpenChange, onSuccess }: OfflineBookingDialogProps) {
    // Form state
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [bookingDate, setBookingDate] = useState<Date | undefined>();
    const [bookingTime, setBookingTime] = useState('');
    const [guestCount, setGuestCount] = useState('');
    const [selectedBusinessId, setSelectedBusinessId] = useState('');
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [selectedMenuId, setSelectedMenuId] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');

    // Data state
    const [businesses, setBusinesses] = useState<ApiBusiness[]>([]);
    const [packages, setPackages] = useState<ApiPackage[]>([]);
    const [menus, setMenus] = useState<ApiMenu[]>([]);
    const [loadingBusinesses, setLoadingBusinesses] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load vendor's businesses on open
    useEffect(() => {
        if (!open) return;
        setLoadingBusinesses(true);
        BusinessesAPI.getUserBusinesses()
            .then(setBusinesses)
            .catch(() => toast.error('Failed to load businesses'))
            .finally(() => setLoadingBusinesses(false));
    }, [open]);

    // Load packages & menus when business changes
    useEffect(() => {
        if (!selectedBusinessId) {
            setPackages([]);
            setMenus([]);
            return;
        }
        const bizId = Number(selectedBusinessId);
        setLoadingOptions(true);
        setSelectedPackageId('');
        setSelectedMenuId('');
        Promise.all([
            PackagesAPI.getAll(bizId),
            MenusAPI.getAll(bizId),
        ])
            .then(([pkgs, mns]) => {
                setPackages(pkgs);
                setMenus(mns);
            })
            .catch(() => toast.error('Failed to load packages/menus'))
            .finally(() => setLoadingOptions(false));
    }, [selectedBusinessId]);

    const resetForm = useCallback(() => {
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
        setBookingDate(undefined);
        setBookingTime('');
        setGuestCount('');
        setSelectedBusinessId('');
        setSelectedPackageId('');
        setSelectedMenuId('');
        setSpecialRequests('');
        setPackages([]);
        setMenus([]);
    }, []);

    const handleClose = (v: boolean) => {
        if (!v) resetForm();
        onOpenChange(v);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
            toast.error('Please fill in all customer details');
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
                customerEmail: customerEmail.trim(),
                customerPhone: customerPhone.trim(),
                bookingDate: format(bookingDate, 'yyyy-MM-dd'),
                bookingTime,
                guestCount: guestCount ? Number(guestCount) : undefined,
                vendors: [{
                    businessId: Number(selectedBusinessId),
                    packageId: selectedPackageId ? Number(selectedPackageId) : null,
                    menuId: selectedMenuId ? Number(selectedMenuId) : null,
                    totalAmount: 0,
                    downPayment: 0,
                    specialRequests: specialRequests.trim() || null,
                }],
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

    const selectedBusiness = businesses.find((b) => String(b.id) === selectedBusinessId);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Offline Booking</DialogTitle>
                    <DialogDescription>
                        Create a booking for a walk-in customer. Fill in their details below.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Customer Info */}
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
                                <Label htmlFor="ob-email">Email *</Label>
                                <Input
                                    id="ob-email"
                                    type="email"
                                    placeholder="customer@example.com"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Event Info */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            Event Details
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label>Date *</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !bookingDate && 'text-muted-foreground'
                                            )}
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
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
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
                            <div className="space-y-1.5">
                                <Label htmlFor="ob-guests">Guests</Label>
                                <Input
                                    id="ob-guests"
                                    type="number"
                                    min={1}
                                    placeholder="No. of guests"
                                    value={guestCount}
                                    onChange={(e) => setGuestCount(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Service Selection */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            Service Selection
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label>Business *</Label>
                                <Select
                                    value={selectedBusinessId}
                                    onValueChange={setSelectedBusinessId}
                                    disabled={loadingBusinesses}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingBusinesses ? 'Loading...' : 'Select business'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {businesses.map((b) => (
                                            <SelectItem key={b.id} value={String(b.id)}>
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Package</Label>
                                <Select
                                    value={selectedPackageId}
                                    onValueChange={setSelectedPackageId}
                                    disabled={!selectedBusinessId || loadingOptions}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={
                                            loadingOptions ? 'Loading...' :
                                                packages.length === 0 ? 'No packages' : 'Select package'
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {packages.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.name} — Rs. {p.price.toLocaleString()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Menu</Label>
                                <Select
                                    value={selectedMenuId}
                                    onValueChange={setSelectedMenuId}
                                    disabled={!selectedBusinessId || loadingOptions}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={
                                            loadingOptions ? 'Loading...' :
                                                menus.length === 0 ? 'No menus' : 'Select menu'
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {menus.map((m) => (
                                            <SelectItem key={m.id} value={String(m.id)}>
                                                {m.title} — Rs. {m.price.toLocaleString()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {selectedBusiness && (
                            <p className="text-xs text-muted-foreground">
                                {selectedBusiness.city && `${selectedBusiness.city}`}
                                {selectedBusiness.maxCapacity ? ` · Max capacity: ${selectedBusiness.maxCapacity} guests` : ''}
                            </p>
                        )}
                    </div>

                    <Separator />

                    {/* Notes */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            Additional Notes
                        </div>
                        <Textarea
                            placeholder="Any special requests or notes..."
                            value={specialRequests}
                            onChange={(e) => setSpecialRequests(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
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

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
import { Vendor } from '@/lib/dashboard-types';
import axiosInstance from '@/lib/axiosConfig';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditVendorDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    vendor: Vendor | null;
    onSuccess: () => void;
}

export function EditVendorDialog({ open, onOpenChange, vendor, onSuccess }: EditVendorDialogProps) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (vendor) {
            setFullName(vendor.fullName || '');
            setEmail(vendor.email || '');
            setPhoneNumber(vendor.phoneNumber || '');
        }
    }, [vendor]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vendor) return;
        setSaving(true);
        try {
            await axiosInstance.patch(`/api/v1/users?id=${vendor.id}`, {
                fullName,
                email,
                phoneNumber,
            });
            toast.success('Vendor updated successfully');
            onSuccess();
            onOpenChange(false);
        } catch {
            toast.error('Failed to update vendor');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Vendor</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="edit-vendor-name">Full Name</Label>
                        <Input
                            id="edit-vendor-name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-vendor-email">Email</Label>
                        <Input
                            id="edit-vendor-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-vendor-phone">Phone Number</Label>
                        <Input
                            id="edit-vendor-phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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

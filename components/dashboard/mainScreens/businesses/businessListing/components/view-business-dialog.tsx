'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Business } from '@/lib/dashboard-types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, MapPin, Package, UserCircle } from 'lucide-react';

interface ViewBusinessDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    business: Business | null;
}

export function ViewBusinessDialog({ open, onOpenChange, business }: ViewBusinessDialogProps) {
    if (!business) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Business Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{business.name}</h3>
                            {business.vendorType && (
                                <Badge variant="outline" className="capitalize text-xs mt-1">
                                    {business.vendorType}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                            <span>Vendor: {business.vendorName || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>
                                {[business.subArea, business.city].filter(Boolean).join(', ') || '—'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>{business.total_packages ?? 0} package{(business.total_packages ?? 0) !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    {business.createdAt && (
                        <>
                            <Separator />
                            <p className="text-xs text-muted-foreground">
                                Created {new Date(business.createdAt).toLocaleDateString()}
                            </p>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

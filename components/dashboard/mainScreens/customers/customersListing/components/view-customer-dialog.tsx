'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CustomersType } from '@/lib/dashboard-types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Mail, Phone, ShoppingBag } from 'lucide-react';

interface ViewCustomerDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    customer: CustomersType | null;
}

export function ViewCustomerDialog({ open, onOpenChange, customer }: ViewCustomerDialogProps) {
    if (!customer) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Customer Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-14">
                            <AvatarFallback className="bg-primary/20 text-primary text-lg">
                                {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold text-lg">{customer.name}</h3>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{customer.phone || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            <span>{customer.total_booking} booking{customer.total_booking !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <span>Last booking: {customer.last_booking ? new Date(customer.last_booking).toLocaleDateString() : '—'}</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

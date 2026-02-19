"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Plus, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import axiosInstance from '@/lib/axiosConfig'
import { BACKEND_URL } from '@/lib/backend-url'
import { toast } from '@/components/ui/use-toast'

interface CreationsButtonsProps {
    onCustomerAdded?: () => void;
}

const CreationsButtons = ({ onCustomerAdded }: CreationsButtonsProps) => {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({ name: '', phoneno: '', email: '', address: '' })

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.phoneno.trim() || !form.address.trim()) {
            toast({ title: "Missing Fields", description: "Name, phone and address are required.", variant: "destructive" })
            return
        }
        try {
            setLoading(true)
            await axiosInstance.post(`${BACKEND_URL}api/v1/offlineCustomers`, form)
            toast({ title: "Customer Added", description: `${form.name} has been added successfully.` })
            setForm({ name: '', phoneno: '', email: '', address: '' })
            setOpen(false)
            onCustomerAdded?.()
        } catch (err: any) {
            toast({
                title: "Failed",
                description: err?.response?.data?.message || "Could not add customer.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className='flex items-center gap-2'>
                <Button
                    variant={'outline'}
                    className='gap-2 hidden md:flex'
                    onClick={() => {
                        const rows = document.querySelectorAll('table tbody tr');
                        if (rows.length === 0) {
                            toast({ title: 'No data', description: 'No customer data to export.', variant: 'destructive' });
                            return;
                        }
                        const headers = ['Name', 'Phone', 'Email', 'Address'];
                        const csvRows = [headers.join(',')];
                        rows.forEach((row) => {
                            const cells = row.querySelectorAll('td');
                            const values = Array.from(cells).slice(1, 5).map((c) =>
                                `"${(c.textContent || '').replace(/"/g, '""')}"`
                            );
                            if (values.length > 0) csvRows.push(values.join(','));
                        });
                        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: 'Exported', description: 'Customer data exported successfully.' });
                    }}
                >
                    <Download className='size-4' />
                    Export
                </Button>
                <Button className='gap-2' onClick={() => setOpen(true)}>
                    <Plus className='size-4' />
                    Add New
                </Button>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Offline Customer</DialogTitle>
                        <DialogDescription>
                            Add a customer who booked outside the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                placeholder="Customer name"
                                value={form.name}
                                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phoneno">Phone *</Label>
                            <Input
                                id="phoneno"
                                placeholder="03XX-XXXXXXX"
                                value={form.phoneno}
                                onChange={(e) => setForm(p => ({ ...p, phoneno: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="email@example.com"
                                value={form.email}
                                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Address *</Label>
                            <Input
                                id="address"
                                placeholder="Customer address"
                                value={form.address}
                                onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : "Add Customer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default CreationsButtons

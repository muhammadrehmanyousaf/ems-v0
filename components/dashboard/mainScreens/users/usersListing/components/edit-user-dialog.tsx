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
import { cn } from '@/lib/utils';
import { User } from '@/lib/dashboard-types';
import axiosInstance from '@/lib/axiosConfig';
import { RolesAPI, type ApiRole } from '@/lib/api/dashboard';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditUserDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    user: User | null;
    onSuccess: () => void;
}

export function EditUserDialog({ open, onOpenChange, user, onSuccess }: EditUserDialogProps) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [saving, setSaving] = useState(false);
    const [roles, setRoles] = useState<ApiRole[]>([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (user) {
            setFullName(user.fullName || '');
            setEmail(user.email || '');
            setPhoneNumber(user.phoneNumber || '');
            // Pre-select the user's current roles so saving doesn't drop them.
            setSelectedRoleIds(new Set((user.roles || []).map((r) => r.id)));
        }
    }, [user]);

    // Load assignable roles when the dialog opens.
    useEffect(() => {
        if (!open) return;
        RolesAPI.getAll()
            .then((rs) => setRoles(rs.filter((r) => r.name?.toLowerCase() !== 'super admin')))
            .catch(() => setRoles([]));
    }, [open]);

    const toggleRole = (id: number) => {
        setSelectedRoleIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            await axiosInstance.patch(`/api/v1/users?id=${user.id}`, {
                fullName,
                email,
                phoneNumber,
                roleIds: Array.from(selectedRoleIds),
            });
            toast.success('User updated successfully');
            onSuccess();
            onOpenChange(false);
        } catch {
            toast.error('Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="edit-fullName">Full Name</Label>
                        <Input
                            id="edit-fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                            id="edit-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-phone">Phone Number</Label>
                        <Input
                            id="edit-phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Roles</Label>
                        {roles.length === 0 ? (
                            <p className="text-xs text-muted-foreground mt-1">No assignable roles found.</p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {roles.map((r) => {
                                    const active = selectedRoleIds.has(r.id);
                                    return (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => toggleRole(r.id)}
                                            className={cn(
                                                'rounded-full border px-2.5 py-1 text-xs capitalize transition',
                                                active
                                                    ? 'border-bridal-gold-dark bg-bridal-gold-dark/10 text-bridal-gold-dark font-medium'
                                                    : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50',
                                            )}
                                            aria-pressed={active}
                                        >
                                            {r.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
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

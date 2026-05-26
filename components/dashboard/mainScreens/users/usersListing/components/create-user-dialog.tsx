'use client';

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import axiosInstance from '@/lib/axiosConfig';
import { RolesAPI, type ApiRole } from '@/lib/api/dashboard';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreateUserDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSuccess: () => void;
}

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [roles, setRoles] = useState<ApiRole[]>([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<Set<number>>(new Set());

    // Load assignable roles when the dialog opens so the admin can grant
    // access at creation time (the backend accepts roleIds; without this the
    // user would be created with no roles at all).
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
        setSaving(true);
        try {
            await axiosInstance.post('/api/v1/users', {
                fullName,
                email,
                phoneNumber,
                password,
                roleIds: Array.from(selectedRoleIds),
            });
            toast.success('User created successfully');
            setFullName('');
            setEmail('');
            setPhoneNumber('');
            setPassword('');
            setSelectedRoleIds(new Set());
            onSuccess();
            onOpenChange(false);
        } catch {
            toast.error('Failed to create user');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="new-fullName">Full Name</Label>
                        <Input
                            id="new-fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="new-email">Email</Label>
                        <Input
                            id="new-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="new-phone">Phone Number</Label>
                        <Input
                            id="new-phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+92 300 1234567"
                        />
                    </div>
                    <div>
                        <Label htmlFor="new-password">Password</Label>
                        <PasswordInput
                            id="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimum 6 characters"
                            required
                            minLength={6}
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
                        <p className="text-[11px] text-muted-foreground mt-1">
                            Without a role the user can sign in but has no dashboard access.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create User
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

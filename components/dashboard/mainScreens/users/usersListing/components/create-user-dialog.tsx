'use client';

import { useState } from 'react';
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
import axiosInstance from '@/lib/axiosConfig';
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axiosInstance.post('/api/v1/users', {
                fullName,
                email,
                phoneNumber,
                password,
            });
            toast.success('User created successfully');
            setFullName('');
            setEmail('');
            setPhoneNumber('');
            setPassword('');
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

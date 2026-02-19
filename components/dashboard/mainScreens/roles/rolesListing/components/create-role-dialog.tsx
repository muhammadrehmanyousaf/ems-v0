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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RolesAPI } from '@/lib/api/dashboard';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreateRoleDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSuccess: () => void;
}

export function CreateRoleDialog({ open, onOpenChange, onSuccess }: CreateRoleDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await RolesAPI.create({ name, description });
            toast.success('Role created successfully');
            setName('');
            setDescription('');
            onSuccess();
            onOpenChange(false);
        } catch {
            toast.error('Failed to create role');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="new-role-name">Name</Label>
                        <Input
                            id="new-role-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Manager"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="new-role-desc">Description</Label>
                        <Textarea
                            id="new-role-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Role description..."
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Role
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

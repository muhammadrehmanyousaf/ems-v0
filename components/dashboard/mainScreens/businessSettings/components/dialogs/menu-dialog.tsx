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
import { Textarea } from '@/components/ui/textarea';
import { MenusAPI, type ApiMenu } from '@/lib/api/dashboard';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface MenuDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    businessId: number;
    editingMenu?: ApiMenu | null;
    onSuccess: () => void;
}

export function MenuDialog({
    open,
    onOpenChange,
    businessId,
    editingMenu,
    onSuccess,
}: MenuDialogProps) {
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [items, setItems] = useState('');
    const [saving, setSaving] = useState(false);

    const isEditing = !!editingMenu;

    useEffect(() => {
        if (editingMenu) {
            setTitle(editingMenu.title || '');
            setPrice(editingMenu.price?.toString() || '');
            const menuItems = (editingMenu.data as Record<string, unknown>)?.items;
            setItems(
                Array.isArray(menuItems) ? menuItems.join('\n') : ''
            );
        } else {
            setTitle('');
            setPrice('');
            setItems('');
        }
    }, [editingMenu, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !price) return;

        setSaving(true);
        const itemsArray = items
            .split('\n')
            .map((i) => i.trim())
            .filter(Boolean);

        try {
            if (isEditing) {
                await MenusAPI.update(editingMenu!.id, {
                    title: title.trim(),
                    price: Number(price),
                    data: { items: itemsArray },
                });
                toast.success('Menu updated');
            } else {
                await MenusAPI.create({
                    title: title.trim(),
                    price: Number(price),
                    businessId,
                    data: { items: itemsArray },
                });
                toast.success('Menu created');
            }
            onSuccess();
            onOpenChange(false);
        } catch {
            toast.error(isEditing ? 'Failed to update menu' : 'Failed to create menu');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Menu' : 'Add Menu'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="menu-title">Menu Title</Label>
                        <Input
                            id="menu-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Premium Dinner Menu"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="menu-price">Price per Head (Rs.)</Label>
                        <Input
                            id="menu-price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="2500"
                            min="1"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="menu-items">Menu Items (one per line)</Label>
                        <Textarea
                            id="menu-items"
                            value={items}
                            onChange={(e) => setItems(e.target.value)}
                            placeholder={"Chicken Biryani\nMutton Karahi\nNaan\nRaita\nSalad\nDessert"}
                            rows={6}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

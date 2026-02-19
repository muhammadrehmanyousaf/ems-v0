'use client';

import { useState, useEffect } from 'react';
import { MenusAPI, type ApiMenu, type ApiBusiness } from '@/lib/api/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { MenuDialog } from '../dialogs/menu-dialog';
import { ConfirmDeleteDialog } from '@/components/dashboard/globalComponents/confirm-delete-dialog';

interface MenusTabProps {
    business: ApiBusiness;
    onSuccess: () => void;
}

const MenusTab = ({ business, onSuccess }: MenusTabProps) => {
    const [menus, setMenus] = useState<ApiMenu[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [editingMenu, setEditingMenu] = useState<ApiMenu | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ApiMenu | null>(null);

    const fetchMenus = async () => {
        try {
            const data = await MenusAPI.getAll(business.id);
            setMenus(data);
        } catch {
            setMenus([]);
            toast.error('Failed to load menus');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenus();
    }, [business.id]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await MenusAPI.delete(deleteTarget.id);
            setMenus((prev) => prev.filter((m) => m.id !== deleteTarget.id));
            toast.success('Menu deleted');
            onSuccess();
        } catch {
            toast.error('Failed to delete menu');
        }
    };

    const handleSuccess = () => {
        fetchMenus();
        onSuccess();
    };

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-52 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Menus</h3>
                    <Badge variant="secondary">{menus.length}</Badge>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Menu
                </Button>
            </div>

            {menus.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
                    <UtensilsCrossed className="h-10 w-10 text-muted-foreground mb-3" />
                    <h4 className="font-medium">No menus yet</h4>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Create menus to offer food options to your customers.
                    </p>
                    <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Create First Menu
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {menus.map((menu) => {
                        const menuItems = (menu.data as Record<string, unknown>)?.items;
                        const itemsList = Array.isArray(menuItems) ? menuItems : [];

                        return (
                            <Card key={menu.id} className="flex flex-col">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base capitalize">{menu.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-3">
                                    <p className="text-xl font-bold text-primary">
                                        Rs. {menu.price?.toLocaleString()}
                                        <span className="text-sm font-normal text-muted-foreground ml-1">/ head</span>
                                    </p>
                                    {itemsList.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {itemsList.map((item, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs font-normal">
                                                    {String(item)}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-between border-t pt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingMenu(menu)}
                                    >
                                        <Pencil className="h-3.5 w-3.5 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setDeleteTarget(menu)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                                        Delete
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            <MenuDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                businessId={business.id}
                onSuccess={handleSuccess}
            />

            <MenuDialog
                open={!!editingMenu}
                onOpenChange={(v) => { if (!v) setEditingMenu(null); }}
                businessId={business.id}
                editingMenu={editingMenu}
                onSuccess={handleSuccess}
            />

            <ConfirmDeleteDialog
                open={!!deleteTarget}
                onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
                title="Delete Menu"
                description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default MenusTab;

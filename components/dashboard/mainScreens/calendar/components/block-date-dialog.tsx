'use client';

import { useEffect, useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CalendarOff, Trash2 } from 'lucide-react';
import type { BlockedDate } from '@/lib/api/dashboard';

interface BlockDateDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    date: Date | null;
    existingBlock: BlockedDate | null;
    onSave: (reason: string) => Promise<void>;
    onUnblock: () => Promise<void>;
}

const QUICK_REASONS = [
    'Personal leave',
    'Public holiday',
    'Emergency',
    'Prior commitment',
    'Business maintenance',
];

export default function BlockDateDialog({
    open,
    onOpenChange,
    date,
    existingBlock,
    onSave,
    onUnblock,
}: BlockDateDialogProps) {
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setReason(existingBlock?.reason ?? '');
        }
    }, [open, existingBlock]);

    const formatted = date
        ? new Intl.DateTimeFormat('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date)
        : '';

    const isBlocked = !!existingBlock;

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(reason);
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    const handleUnblock = async () => {
        setSaving(true);
        try {
            await onUnblock();
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarOff className="h-5 w-5 text-red-500" />
                        {isBlocked ? 'Manage Blocked Date' : 'Block This Date'}
                    </DialogTitle>
                    <DialogDescription>{formatted}</DialogDescription>
                </DialogHeader>

                {isBlocked ? (
                    <div className="space-y-4 py-2">
                        <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-100 p-3">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-semibold text-red-700">This date is currently blocked</p>
                                {existingBlock?.reason && (
                                    <p className="text-red-600 mt-0.5">Reason: {existingBlock.reason}</p>
                                )}
                                <p className="text-red-500 text-xs mt-1">Customers cannot book on this day.</p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Update reason (optional)</Label>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Emergency, Public holiday, Prior commitment..."
                                rows={2}
                                className="resize-none"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-muted-foreground">
                            Blocking this date will prevent customers from making bookings on this day. You can unblock it any time.
                        </p>

                        <div className="space-y-1.5">
                            <Label>Reason (optional)</Label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {QUICK_REASONS.map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setReason(r)}
                                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                            reason === r
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-muted/50 text-muted-foreground border-muted hover:border-primary/50'
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Or write a custom reason..."
                                rows={2}
                                className="resize-none"
                            />
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    {isBlocked && (
                        <Button
                            variant="destructive"
                            onClick={handleUnblock}
                            disabled={saving}
                            className="gap-1.5"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Unblock Date
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    {isBlocked ? (
                        <Button onClick={handleSave} disabled={saving}>
                            Update Reason
                        </Button>
                    ) : (
                        <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white gap-1.5">
                            <CalendarOff className="h-3.5 w-3.5" />
                            Block This Date
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

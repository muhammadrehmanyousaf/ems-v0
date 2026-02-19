'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StartComponent } from './star-component';
import { Review } from '@/lib/dashboard-types';
import axiosInstance from '@/lib/axiosConfig';
import { BACKEND_URL } from '@/lib/backend-url';
import { toast } from 'sonner';
import { Loader2, MessageSquareReply } from 'lucide-react';

type ReplyDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    review: Review | null;
    onSuccess: () => void;
};

export function ReplyDialog({ open, onOpenChange, review, onSuccess }: ReplyDialogProps) {
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (review) {
            setReply(review.vendorReply || '');
        }
    }, [review]);

    if (!review) return null;

    const handleSubmit = async () => {
        if (!reply.trim()) {
            toast.error('Please write a reply');
            return;
        }
        try {
            setLoading(true);
            await axiosInstance.patch(`${BACKEND_URL}api/v1/reviews/${review.id}/reply`, {
                reply: reply.trim(),
            });
            toast.success('Reply posted successfully');
            onSuccess();
            onOpenChange(false);
        } catch {
            toast.error('Failed to post reply');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquareReply className="w-5 h-5 text-purple-500" />
                        Reply to Review
                    </DialogTitle>
                    <DialogDescription>
                        Respond to {review.reviewerName}'s feedback on your business.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{review.reviewerName}</span>
                            <StartComponent value={review.rating} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {review.reviewText || 'No comment provided.'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Your Reply</label>
                        <Textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Write a professional response to this review..."
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Your reply will be visible to all customers viewing this review.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !reply.trim()}>
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...</>
                        ) : (
                            review.vendorReply ? 'Update Reply' : 'Post Reply'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

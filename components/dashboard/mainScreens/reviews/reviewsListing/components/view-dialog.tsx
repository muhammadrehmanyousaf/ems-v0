'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
} from "@/components/ui/dialog";
import { StartComponent } from './star-component';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Review } from '@/lib/dashboard-types';

type ViewDialogProps = {
    open: boolean;
    setOpen: (v: boolean) => void;
    review: Review | null;
};

function ViewDialog({ open, setOpen, review }: ViewDialogProps) {
    if (!review) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className='p-5 max-w-md'>
                <DialogHeader>
                    <StartComponent value={review.rating} dialog />
                </DialogHeader>
                <DialogDescription className="text-foreground">
                    {review.reviewText || 'No review text provided.'}
                </DialogDescription>

                {review.businessName && (
                    <p className="text-sm text-muted-foreground">
                        Business: <span className="font-medium text-foreground">{review.businessName}</span>
                    </p>
                )}

                {review.vendorReply && (
                    <div className="bg-bridal-cream rounded-lg p-3 border border-bridal-beige">
                        <p className="text-xs font-semibold text-bridal-gold-dark mb-1">Your Reply</p>
                        <p className="text-sm text-neutral-700">{review.vendorReply}</p>
                        {review.vendorReplyDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {new Date(review.vendorReplyDate).toLocaleDateString('en-GB', {
                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                })}
                            </p>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <div className='flex items-end justify-between w-full'>
                        <div className='flex flex-1 items-center justify-start gap-2'>
                            <Avatar>
                                <AvatarFallback>
                                    {review.reviewerName?.charAt(0)?.toUpperCase() || 'R'}
                                </AvatarFallback>
                            </Avatar>
                            <span>
                                <h3 className='font-[600] text-sm'>{review.reviewerName}</h3>
                                <p className='-mt-0.5 text-[13px] text-muted-foreground'>{review.email}</p>
                            </span>
                        </div>
                        <p className='text-xs text-muted-foreground'>
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                            }) : ''}
                        </p>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ViewDialog;

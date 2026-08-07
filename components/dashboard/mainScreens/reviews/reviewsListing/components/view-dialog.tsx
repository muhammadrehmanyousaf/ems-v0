'use client';

/**
 * WWL-372 — this dialog had no `DialogTitle`, so Radix logged its own warning
 * ("DialogContent requires a DialogTitle…"), `aria-labelledby` pointed at an id
 * that did not exist in the document, and `aria-describedby` resolved to the
 * review text — making the review body the dialog's *description*. There were
 * zero buttons inside it: no close, no Reply, no Pin. A screen-reader user was
 * dropped into an unnamed dialog with no labelled way out, and a touch user had
 * only the overlay.
 *
 * WWL-373 — two of the eight live rows print a vendor reply dated BEFORE the
 * review it answers (Zeeshan Akram: review 01/08, reply 31/07). `replyToReview`
 * stamps `vendorReplyDate = new Date()` and nothing constrains it against
 * `createdAt`; the dialog printed both a few lines apart without comment. On a
 * screen that exists to evidence how a vendor handles feedback, that reads as
 * fabrication. It is now called out rather than presented as fact.
 *
 * WWL-375 — `Review.photosJson` exists, the upload and delete endpoints exist,
 * and the public review page uploads to them. Nothing in the vendor dashboard
 * read them, so a customer who photographed a problem documented it somewhere
 * the vendor could not look.
 */

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { StartComponent } from './star-component';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Review } from '@/lib/dashboard-types';

type ViewDialogProps = {
    open: boolean;
    setOpen: (v: boolean) => void;
    review: Review | null;
    /** Optional — lets the vendor act on what they just read. */
    onReply?: (review: Review) => void;
};

/** Karachi-local day. The rest of the dashboard is en-PK; this was en-GB. */
const fmtDay = (v?: string | null) => {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-PK', {
        timeZone: 'Asia/Karachi',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(d);
};

/** Photos can arrive as a JSON array of filenames or of {url} objects. */
function photoUrls(review: Review): string[] {
    const raw = (review as unknown as { photosJson?: unknown }).photosJson;
    if (!raw) return [];
    let list: unknown = raw;
    if (typeof raw === 'string') {
        try {
            list = JSON.parse(raw);
        } catch {
            return [];
        }
    }
    if (!Array.isArray(list)) return [];
    return list
        .map((p) => {
            if (typeof p === 'string') return p;
            if (p && typeof p === 'object') {
                const o = p as { url?: string; filename?: string };
                return o.url || o.filename || '';
            }
            return '';
        })
        .filter(Boolean)
        .map((p) => (p.startsWith('http') || p.startsWith('/') ? p : `/images/reviews/${p}`));
}

function ViewDialog({ open, setOpen, review, onReply }: ViewDialogProps) {
    if (!review) return null;

    const photos = photoUrls(review);
    const reviewedAt = review.createdAt ? new Date(review.createdAt) : null;
    const repliedAt = review.vendorReplyDate ? new Date(review.vendorReplyDate) : null;
    // WWL-373 — a reply cannot honestly predate the review it answers.
    const replyPredatesReview =
        !!reviewedAt &&
        !!repliedAt &&
        !Number.isNaN(reviewedAt.getTime()) &&
        !Number.isNaN(repliedAt.getTime()) &&
        repliedAt.getTime() < reviewedAt.getTime();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className='p-5 max-w-md'>
                <DialogHeader>
                    <DialogTitle className="text-base">
                        Review from {review.reviewerName || 'a customer'}
                    </DialogTitle>
                    <StartComponent value={review.rating} dialog />
                </DialogHeader>

                <DialogDescription className="text-foreground">
                    {review.reviewText || 'No review text provided.'}
                </DialogDescription>

                {photos.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {photos.map((src, i) => (
                            <a
                                key={src}
                                href={src}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block h-20 w-20 overflow-hidden rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={src}
                                    alt={`Photo ${i + 1} attached by ${review.reviewerName || 'the customer'}`}
                                    className="h-full w-full object-cover"
                                />
                            </a>
                        ))}
                    </div>
                )}

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
                            <p className="text-xs text-muted-foreground mt-1">{fmtDay(review.vendorReplyDate)}</p>
                        )}
                        {replyPredatesReview && (
                            <p className="mt-1.5 text-xs text-amber-700">
                                This reply is stamped earlier than the review itself — the reply
                                timestamp is recorded at the moment of posting and looks wrong here.
                                The reply is real; the date is not reliable.
                            </p>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <div className='flex w-full flex-wrap items-end justify-between gap-3'>
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
                        <p className='text-xs text-muted-foreground'>{fmtDay(review.createdAt)}</p>
                        <div className="flex w-full items-center justify-end gap-2">
                            {onReply && (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                        setOpen(false);
                                        onReply(review);
                                    }}
                                >
                                    {review.vendorReply ? 'Edit reply' : 'Reply'}
                                </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ViewDialog;

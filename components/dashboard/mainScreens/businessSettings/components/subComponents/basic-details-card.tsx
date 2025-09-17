import React from 'react'
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { IoStarHalf } from "react-icons/io5";
import { IoStar } from "react-icons/io5";
import { Facebook, Instagram, Phone } from 'lucide-react'

const BasicDetailsCard = () => {
    return (
        <Card>
            <CardHeader>
                <div
                    className=
                    'grid gap-10 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start'>
                    {/* Left: Title + Description */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <CardTitle className="truncate">Test Venue</CardTitle>
                            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
                                {'Wedding Venue'}
                            </Badge>
                        </div>
                        <div className='flex items-center gap-2.5'>
                            <span className='flex items-center gap-1 text-yellow-500'>
                                <IoStar />
                                <IoStar />
                                <IoStar />
                                <IoStar />
                                <IoStarHalf />
                            </span>
                            <span className='font-semibold'>
                                4.9
                            </span>
                            <span className='text-xs text-muted-foreground'>
                                {`(1k reviews)`}
                            </span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Phone className='size-4 text-primary font-medium' />
                            <p className='text-sm text-muted-foreground'>+92 111 222 3333</p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Instagram className='size-4 text-primary font-medium' />
                            <p className='text-sm text-muted-foreground'>https://example@Instagram.com</p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Facebook className='size-4 text-primary font-medium' />
                            <p className='text-sm text-muted-foreground'>https://example@facebook.com</p>
                        </div>
                        <div>
                            <Label className='text-primary text-sm font-medium'>Description</Label>
                            <CardDescription className="text-sm text-muted-foreground text-justify">
                                {`Welcome to Venue, a thoughtfully designed Type venue in [City]. Our flexible floor plan accommodates up to [Max Capacity] guests with dedicated zones for ceremony, reception, and photo ops. From premium sound and ambient lighting to climate control and secure parking, every detail elevates your event. Choose from our curated menus or bring a favorite external caterer (by prior approval). Whether you’re planning an elegant engagement, a classic wedding, or a lively milestone party, our in-house team ensures smooth execution—on time, on brief, and stress-free.`}
                            </CardDescription>
                        </div>
                    </div>

                    <figure className="relative w-full aspect-[4/3] overflow-hidden rounded-xl border bg-muted/40">
                        <img
                            src={"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSl7U4Tr2IHrO4H2-SGS7lQ45OHMKSRfKZgKg&s"}
                            alt={"Logo"}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain p-6 transition-transform duration-300 hover:scale-[1.02]"
                        />
                        <figcaption className="sr-only">{'Logo'}</figcaption>
                    </figure>
                </div>
            </CardHeader>
        </Card>
    )
}

export default BasicDetailsCard

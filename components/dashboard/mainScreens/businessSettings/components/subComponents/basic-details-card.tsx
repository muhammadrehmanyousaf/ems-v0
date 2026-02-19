import React from 'react'
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { MapPin, Phone } from 'lucide-react'
import { ApiBusiness } from '@/lib/api/dashboard'
import { getImageUrl } from '@/lib/utils/image-utils'

interface BasicDetailsCardProps {
    business: ApiBusiness;
}

const BasicDetailsCard = ({ business }: BasicDetailsCardProps) => {
    return (
        <Card>
            <CardHeader>
                <div
                    className='grid gap-10 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start'>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="truncate">{business.name}</CardTitle>
                            {business.vendor?.vendorType && (
                                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 capitalize">
                                    {business.vendor.vendorType}
                                </Badge>
                            )}
                        </div>
                        {(business.city || business.subArea) && (
                            <div className='flex items-center gap-2'>
                                <MapPin className='size-4 text-primary shrink-0' />
                                <p className='text-sm text-muted-foreground'>
                                    {[business.subArea, business.city].filter(Boolean).join(', ')}
                                </p>
                            </div>
                        )}
                        {business.vendor?.phoneNumber && (
                            <div className='flex items-center gap-2'>
                                <Phone className='size-4 text-primary shrink-0' />
                                <p className='text-sm text-muted-foreground'>{business.vendor.phoneNumber}</p>
                            </div>
                        )}
                        {business.description && (
                            <div>
                                <Label className='text-primary text-sm font-medium'>Description</Label>
                                <CardDescription className="text-sm text-muted-foreground text-justify">
                                    {business.description}
                                </CardDescription>
                            </div>
                        )}
                    </div>

                    <figure className="relative w-full aspect-[4/3] overflow-hidden rounded-xl border bg-muted/40">
                        {business.images?.[0] ? (
                            <img
                                src={getImageUrl(business.images[0])}
                                alt={business.name}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                            />
                        ) : business.vendor?.brandLogo ? (
                            <img
                                src={business.vendor.brandLogo}
                                alt={business.name}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-contain p-6 transition-transform duration-300 hover:scale-[1.02]"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                                No image
                            </div>
                        )}
                    </figure>
                </div>
            </CardHeader>
        </Card>
    )
}

export default BasicDetailsCard

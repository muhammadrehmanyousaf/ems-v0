import React from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Info } from 'lucide-react'
import { ApiBusiness } from '@/lib/api/dashboard'
import { getImageUrl } from '@/lib/utils/image-utils'

interface BasicDetailsCardProps {
    business: ApiBusiness;
}

const BasicDetailsCard = ({ business }: BasicDetailsCardProps) => {
    return (
        <Card>
            <CardHeader>
                <div className='grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start'>
                    {/* Left: Business Info */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-xl">{business.name}</CardTitle>
                            {business.vendor?.vendorType && (
                                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 capitalize">
                                    {business.vendor.vendorType}
                                </Badge>
                            )}
                        </div>

                        {(business.city || business.subArea) && (
                            <div className='flex items-start gap-2'>
                                <MapPin className='size-4 text-primary shrink-0 mt-0.5' />
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
                            <div className='space-y-1'>
                                <div className='flex items-center gap-1.5'>
                                    <Info className='size-3.5 text-primary shrink-0' />
                                    <span className='text-xs font-semibold text-primary uppercase tracking-wide'>About</span>
                                </div>
                                <CardDescription className="text-sm text-muted-foreground leading-relaxed text-justify">
                                    {business.description}
                                </CardDescription>
                            </div>
                        )}

                        {business.additionalInfo && (
                            <div className='space-y-1'>
                                <span className='text-xs font-semibold text-primary uppercase tracking-wide'>Additional Notes</span>
                                <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                                    {business.additionalInfo}
                                </CardDescription>
                            </div>
                        )}
                    </div>

                    {/* Right: Cover Image */}
                    <figure className="relative w-full aspect-[4/3] overflow-hidden rounded-xl border bg-muted/40">
                        {business.images?.[0] ? (
                            <img
                                src={getImageUrl(business.images[0])}
                                alt={business.name}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                            />
                        ) : business.brandLogo ? (
                            <img
                                src={business.brandLogo}
                                alt={business.name}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-contain p-6 transition-transform duration-300 hover:scale-[1.02]"
                            />
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                <span className="text-sm">No cover image</span>
                                <span className="text-xs opacity-60">Add images from the Images tab</span>
                            </div>
                        )}
                        {business.images && business.images.length > 1 && (
                            <div className="absolute bottom-2 right-2">
                                <Badge variant="secondary" className="text-[10px] bg-black/60 text-white border-0">
                                    +{business.images.length - 1} more
                                </Badge>
                            </div>
                        )}
                    </figure>
                </div>
            </CardHeader>
        </Card>
    )
}

export default BasicDetailsCard

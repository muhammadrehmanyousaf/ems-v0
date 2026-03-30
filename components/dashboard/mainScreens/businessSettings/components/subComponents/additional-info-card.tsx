import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ApiBusiness } from '@/lib/api/dashboard'
import { useUser } from '@/context/UserContext'
import { getVendorTypeConfig } from '@/lib/vendor-type-config'
import { VENDOR_TYPES } from '@/lib/vendor-types'
import { Check, X } from 'lucide-react'

interface AdditionalInfoCardProps {
    business: ApiBusiness;
}

function BoolField({ label, value }: { label: string; value: boolean | null | undefined }) {
    if (value == null) return null;
    return (
        <div className='space-y-0.5'>
            <Label className='text-primary'>{label}</Label>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {value ? (
                    <><Check className="h-3.5 w-3.5 text-emerald-500" /> Yes</>
                ) : (
                    <><X className="h-3.5 w-3.5 text-red-400" /> No</>
                )}
            </div>
        </div>
    );
}

function TextField({ label, value }: { label: string; value: string | number | null | undefined }) {
    if (value == null || value === '') return null;
    return (
        <div className='space-y-0.5'>
            <Label className='text-primary'>{label}</Label>
            <p className="text-sm text-muted-foreground">{String(value)}</p>
        </div>
    );
}

const AdditionalInfoCard = ({ business }: AdditionalInfoCardProps) => {
    const { user } = useUser();
    const vendorConfig = getVendorTypeConfig(user?.vendorType);

    const downPaymentDisplay = (() => {
        if (!business.downPayment) return null;
        if (business.downPaymentType === 'Percentage') return `${business.downPayment}%`;
        if (business.downPaymentType === 'Fixed Amount') return `Rs. ${business.downPayment.toLocaleString()}`;
        return String(business.downPayment);
    })();

    return (
        <Card className='col-span-2'>
            <CardHeader className='pb-3'>
                <CardTitle className='text-lg'>Additional Info</CardTitle>
            </CardHeader>
            <CardContent>
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    {/* Column 1: Location & Vendor */}
                    <div className='space-y-3'>
                        <TextField label="City" value={business.city} />
                        <TextField label="Sub Area" value={business.subArea} />
                        <TextField label="Vendor" value={business.vendor?.fullName} />
                    </div>

                    {/* Column 2: Pricing & Payment */}
                    <div className='space-y-3'>
                        <div className='space-y-0.5'>
                            <Label className='text-primary'>Vendor Type</Label>
                            <p className="text-sm text-muted-foreground capitalize">
                                {business.vendor?.vendorType || '\u2014'}
                            </p>
                        </div>
                        <TextField
                            label="Minimum Price"
                            value={business.minimumPrice ? `Rs. ${business.minimumPrice.toLocaleString()}` : null}
                        />
                        <TextField label="Down Payment" value={downPaymentDisplay} />
                        <TextField label="Cancellation Policy" value={business.cancelationPolicy} />
                    </div>

                    {/* Column 3: Type-specific info */}
                    <div className='space-y-3'>
                        {/* Show capacity for venue/catering */}
                        {(vendorConfig?.key === VENDOR_TYPES.WEDDING_VENUE || vendorConfig?.key === VENDOR_TYPES.CATERING) && (
                            <>
                                <TextField label="Max Capacity" value={business.maxCapacity} />
                                <TextField label="Min Capacity" value={business.minCapacity} />
                            </>
                        )}

                        {/* Venue-specific */}
                        {vendorConfig?.key === VENDOR_TYPES.WEDDING_VENUE && (
                            <>
                                <BoolField label="In-house Catering" value={business.catering} />
                                <BoolField label="Parking" value={business.parking} />
                            </>
                        )}

                        {/* Catering-specific */}
                        {vendorConfig?.key === VENDOR_TYPES.CATERING && (
                            <>
                                <BoolField label="Food Tasting" value={business.provideFoodTesting} />
                                <BoolField label="Waiter Service" value={business.provideWaiter} />
                            </>
                        )}

                        {/* Henna-specific */}
                        {vendorConfig?.key === VENDOR_TYPES.HENNA_ARTIST && (
                            <>
                                <BoolField label="Has a Team" value={business.hasTeam} />
                                <BoolField label="Sells Mehndi" value={business.sellMehndi} />
                            </>
                        )}

                        {/* Decorator-specific */}
                        {vendorConfig?.key === VENDOR_TYPES.DECORATOR && (
                            <BoolField label="Provides Decoration Items" value={business.provideDecorationItem} />
                        )}

                        {/* Packages & menus count for all */}
                        <TextField
                            label="Packages"
                            value={`${business.packages?.length ?? 0} package${(business.packages?.length ?? 0) !== 1 ? 's' : ''}`}
                        />
                        {vendorConfig?.hasMenus && (
                            <TextField
                                label="Menus"
                                value={`${business.menus?.length ?? 0} menu${(business.menus?.length ?? 0) !== 1 ? 's' : ''}`}
                            />
                        )}

                        {/* Expertise badges */}
                        {Array.isArray(business.expertise) && business.expertise.length > 0 && (
                            <div className='space-y-1'>
                                <Label className='text-primary'>Expertise</Label>
                                <div className="flex flex-wrap gap-1">
                                    {business.expertise.map((e, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">{e}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Amenities badges */}
                        {Array.isArray(business.amenities) && business.amenities.length > 0 && (
                            <div className='space-y-1'>
                                <Label className='text-primary'>Amenities</Label>
                                <div className="flex flex-wrap gap-1">
                                    {business.amenities.map((a, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">{a}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default AdditionalInfoCard

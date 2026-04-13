'use client'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ApiBusiness } from '@/lib/api/dashboard'
import { useUser } from '@/context/UserContext'
import { getVendorTypeConfig, type TypeSpecificFieldDef } from '@/lib/vendor-type-config'
import { Check, X } from 'lucide-react'

interface AdditionalInfoCardProps {
    business: ApiBusiness;
}

function BoolField({ label, value }: { label: string; value: boolean | null | undefined }) {
    if (value == null) return null;
    return (
        <div className='space-y-0.5'>
            <Label className='text-primary text-xs font-medium'>{label}</Label>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {value ? (
                    <><Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /><span>Yes</span></>
                ) : (
                    <><X className="h-3.5 w-3.5 text-red-400 shrink-0" /><span>No</span></>
                )}
            </div>
        </div>
    );
}

function TextField({ label, value }: { label: string; value: string | number | null | undefined }) {
    if (value == null || value === '') return null;
    return (
        <div className='space-y-0.5'>
            <Label className='text-primary text-xs font-medium'>{label}</Label>
            <p className="text-sm text-muted-foreground">{String(value)}</p>
        </div>
    );
}

function BadgesField({ label, values }: { label: string; values: string[] }) {
    if (!values || values.length === 0) return null;
    return (
        <div className='space-y-1'>
            <Label className='text-primary text-xs font-medium'>{label}</Label>
            <div className="flex flex-wrap gap-1">
                {values.map((v, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                ))}
            </div>
        </div>
    );
}

function TypeSpecificField({ field, business }: { field: TypeSpecificFieldDef; business: ApiBusiness }) {
    const value = (business as unknown as Record<string, unknown>)[field.key];

    switch (field.type) {
        case 'boolean':
            return <BoolField label={field.label} value={value as boolean | null} />;
        case 'number': {
            const num = value as number | null;
            if (num == null) return null;
            return <TextField label={field.label} value={num} />;
        }
        case 'text':
        case 'select':
            return <TextField label={field.label} value={value as string | null} />;
        case 'multi-select': {
            const arr = Array.isArray(value) ? (value as string[]) : [];
            return <BadgesField label={field.label} values={arr} />;
        }
        default:
            return null;
    }
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

    // Determine if subBusinessType is handled via the vendor config fields
    const configFieldKeys = new Set(vendorConfig?.typeSpecificFields.map(f => f.key) ?? []);
    const subBusinessTypeInConfig = configFieldKeys.has('subBusinessType');

    // Resolve subBusinessType value — may be a string or a string array from registration
    const subBizRaw = business.subBusinessType as unknown;
    const subBizBadges: string[] | null =
        Array.isArray(subBizRaw) && (subBizRaw as string[]).length > 0
            ? (subBizRaw as string[])
            : typeof subBizRaw === 'string' && subBizRaw
                ? [subBizRaw]
                : null;

    return (
        <Card>
            <CardHeader className='pb-3'>
                <CardTitle className='text-base'>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4'>

                    {/* ── Column 1: Location & Contact ─────────────────── */}
                    <div className='space-y-3'>
                        <p className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 border-b pb-1'>
                            Location &amp; Contact
                        </p>
                        <TextField label="City" value={business.city} />
                        <TextField label="Sub Area / Address" value={business.subArea} />
                        <TextField label="Vendor Name" value={business.vendor?.fullName} />
                        <div className='space-y-0.5'>
                            <Label className='text-primary text-xs font-medium'>Vendor Type</Label>
                            <p className="text-sm text-muted-foreground capitalize">
                                {business.vendor?.vendorType || '—'}
                            </p>
                        </div>

                        {/* Staff (e.g., photographer gender preference) */}
                        {Array.isArray(business.staff) && business.staff.length > 0 && (
                            <BadgesField label="Staff" values={business.staff} />
                        )}
                    </div>

                    {/* ── Column 2: Pricing & Policies ─────────────────── */}
                    <div className='space-y-3'>
                        <p className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 border-b pb-1'>
                            Pricing &amp; Policies
                        </p>
                        <TextField
                            label="Minimum Price"
                            value={business.minimumPrice ? `Rs. ${business.minimumPrice.toLocaleString()}` : null}
                        />
                        {downPaymentDisplay && (
                            <div className='space-y-0.5'>
                                <Label className='text-primary text-xs font-medium'>Down Payment</Label>
                                <p className="text-sm text-muted-foreground">
                                    {downPaymentDisplay}
                                    {business.downPaymentType && (
                                        <span className='text-xs text-muted-foreground/60 ml-1'>
                                            ({business.downPaymentType})
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
                        <TextField label="Cancellation Policy" value={business.cancelationPolicy} />

                        {/* subBusinessType when not handled by type-specific config */}
                        {!subBusinessTypeInConfig && subBizBadges && (
                            <BadgesField label="Business Type" values={subBizBadges} />
                        )}

                        {/* Packages & menus count */}
                        <TextField
                            label="Total Packages"
                            value={`${business.packages?.length ?? 0} package${(business.packages?.length ?? 0) !== 1 ? 's' : ''}`}
                        />
                        {vendorConfig?.hasMenus && (
                            <TextField
                                label="Total Menus"
                                value={`${business.menus?.length ?? 0} menu${(business.menus?.length ?? 0) !== 1 ? 's' : ''}`}
                            />
                        )}
                    </div>

                    {/* ── Column 3: Type-specific Details ──────────────── */}
                    <div className='space-y-3'>
                        <p className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 border-b pb-1'>
                            {vendorConfig ? `${vendorConfig.displayName} Details` : 'Business Details'}
                        </p>

                        {vendorConfig?.typeSpecificFields && vendorConfig.typeSpecificFields.length > 0 ? (
                            vendorConfig.typeSpecificFields.map((field) => (
                                <TypeSpecificField key={field.key} field={field} business={business} />
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No additional details.</p>
                        )}
                    </div>

                </div>
            </CardContent>
        </Card>
    )
}

export default AdditionalInfoCard

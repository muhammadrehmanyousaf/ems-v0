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
                    <Badge key={i} className="text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">{v}</Badge>
                ))}
            </div>
        </div>
    );
}

function GroupedBadgesField({ label, values, groups }: { label: string; values: string[]; groups: import('@/lib/vendor-type-config').OptionGroup[] }) {
    if (!values || values.length === 0) return null;
    return (
        <div className='space-y-2 md:col-span-3'>
            <div className="flex items-center justify-between">
                <Label className='text-primary text-xs font-medium'>{label}</Label>
                <span className="text-xs text-muted-foreground">{values.length} selected</span>
            </div>
            <div className="space-y-3">
                {groups.map(({ group, emoji, items }) => {
                    const selected = items.filter((item) => values.includes(item));
                    if (selected.length === 0) return null;
                    return (
                        <div key={group} className="border border-neutral-200 rounded-lg overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border-b border-neutral-200">
                                <span className="text-sm">{emoji}</span>
                                <p className="text-xs font-semibold text-neutral-700">{group}</p>
                                <span className="ml-auto text-xs text-muted-foreground">{selected.length}/{items.length}</span>
                            </div>
                            <div className="px-3 py-2 flex flex-wrap gap-1.5">
                                {selected.map((v, i) => (
                                    <Badge key={i} className="text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">{v}</Badge>
                                ))}
                            </div>
                        </div>
                    );
                })}
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
            if (field.groups && field.groups.length > 0) {
                return <GroupedBadgesField label={field.label} values={arr} groups={field.groups} />;
            }
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

    // Split fields: grouped multi-selects render full-width below the grid
    const inlineFields = vendorConfig?.typeSpecificFields.filter(
        (f) => !(f.type === 'multi-select' && f.groups && f.groups.length > 0)
    ) ?? [];
    const groupedFields = vendorConfig?.typeSpecificFields.filter(
        (f) => f.type === 'multi-select' && f.groups && f.groups.length > 0
    ) ?? [];

    return (
        <Card>
            <CardHeader className='pb-3'>
                <CardTitle className='text-base'>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
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
                        {!subBusinessTypeInConfig && subBizBadges && (
                            <BadgesField label="Business Type" values={subBizBadges} />
                        )}
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

                    {/* ── Column 3: Type-specific Details (inline fields only) ── */}
                    <div className='space-y-3'>
                        <p className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 border-b pb-1'>
                            {vendorConfig ? `${vendorConfig.displayName} Details` : 'Business Details'}
                        </p>
                        {inlineFields.length > 0 ? (
                            inlineFields.map((field) => (
                                <TypeSpecificField key={field.key} field={field} business={business} />
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No additional details.</p>
                        )}
                    </div>
                </div>

                {/* ── Full-width: grouped multi-select fields (e.g. stationery products) ── */}
                {groupedFields.map((field) => {
                    const value = (business as unknown as Record<string, unknown>)[field.key];
                    const arr = Array.isArray(value) ? (value as string[]) : [];
                    if (arr.length === 0) return null;
                    return (
                        <div key={field.key} className='space-y-3'>
                            <div className='flex items-center justify-between border-b pb-2'>
                                <p className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70'>
                                    {field.label}
                                </p>
                                <span className='text-xs text-muted-foreground'>{arr.length} selected</span>
                            </div>
                            <div className='space-y-3'>
                                {field.groups!.map(({ group, emoji, items }) => {
                                    const selected = items.filter((item) => arr.includes(item));
                                    if (selected.length === 0) return null;
                                    return (
                                        <div key={group} className='border border-neutral-200 rounded-xl overflow-hidden'>
                                            <div className='flex items-center justify-between px-4 py-2.5 bg-neutral-50 border-b border-neutral-200'>
                                                <div className='flex items-center gap-2'>
                                                    <span className='text-sm'>{emoji}</span>
                                                    <p className='text-xs font-semibold text-neutral-800'>{group}</p>
                                                </div>
                                                <span className='text-xs text-primary font-medium'>{selected.length}/{items.length}</span>
                                            </div>
                                            <div className='px-4 py-3 flex flex-wrap gap-2'>
                                                {selected.map((v, i) => (
                                                    <Badge key={i} className='text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'>
                                                        {v}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    )
}

export default AdditionalInfoCard

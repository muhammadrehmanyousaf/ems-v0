'use client';

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { BusinessesAPI, type ApiBusiness } from '@/lib/api/dashboard'
import { toast } from 'sonner'
import { Loader2, Building2, MapPin, DollarSign, Shield } from 'lucide-react'
// BK-100.5 — vendor-selectable cancellation policy presets.
import { CancellationPolicyCard } from '../subComponents/cancellation-policy-card'
// Pricing-rules engine (flag-gated) — weekend premium + early-bird.
import { PricingRulesCard } from '../subComponents/pricing-rules-card'
// BK-100.52 — vendor in-house bundled services (catering / decor / DJ / etc).
import { BundledServicesCard } from '../subComponents/bundled-services-card'
// BK-100.51 — multi-resource vendor capacity (halls / kitchen / crews / tents).
import { ResourcesCard } from '../subComponents/resources-card'

const formSchema = z.object({
    name: z.string().min(2, { message: "Business name must be at least 2 characters." }),
    city: z.string().optional(),
    subArea: z.string().optional(),
    description: z.string().optional(),
    additionalInfo: z.string().optional(),
    minimumPrice: z.string().optional(),
    maxCapacity: z.string().optional(),
    minCapacity: z.string().optional(),
    downPaymentType: z.string().optional(),
    downPayment: z.string().optional(),
    cancelationPolicy: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BasicInfoTabProps {
    business: ApiBusiness;
    onSuccess: () => void;
}

const BasicInfoTab = ({ business, onSuccess }: BasicInfoTabProps) => {
    const [saving, setSaving] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: business.name || '',
            city: business.city || '',
            subArea: business.subArea || '',
            description: business.description || '',
            additionalInfo: business.additionalInfo || '',
            minimumPrice: business.minimumPrice?.toString() || '',
            maxCapacity: business.maxCapacity?.toString() || '',
            minCapacity: business.minCapacity?.toString() || '',
            downPaymentType: business.downPaymentType || '',
            downPayment: business.downPayment?.toString() || '',
            cancelationPolicy: business.cancelationPolicy || '',
        },
    });

    const downPaymentType = form.watch('downPaymentType');

    const onSubmit = async (values: FormValues) => {
        setSaving(true);
        try {
            await BusinessesAPI.update(business.id, {
                name: values.name,
                city: values.city || null,
                subArea: values.subArea || null,
                description: values.description || null,
                additionalInfo: values.additionalInfo || null,
                minimumPrice: values.minimumPrice ? Number(values.minimumPrice) : null,
                maxCapacity: values.maxCapacity ? Number(values.maxCapacity) : null,
                minCapacity: values.minCapacity ? Number(values.minCapacity) : null,
                downPaymentType: (values.downPaymentType as ApiBusiness['downPaymentType']) || null,
                downPayment: values.downPayment ? Number(values.downPayment) : null,
                cancelationPolicy: values.cancelationPolicy || null,
            });
            toast.success('Business updated successfully');
            onSuccess();
        } catch {
            toast.error('Failed to update business');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className='max-w-4xl'>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
                    {/* Section: Basic Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Basic Details</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Business Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="My Business" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div /> {/* spacer */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Tell customers about your business, services, and what makes you special..."
                                                rows={4}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>This is shown to customers on your public profile.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="additionalInfo"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Additional Information</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Any extra details — special instructions, notes for customers, etc."
                                                rows={3}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Section: Location */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Location</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Lahore" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="subArea"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sub Area / Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="DHA Phase 5" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Section: Pricing */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Pricing</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="minimumPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Minimum Price (Rs.)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="50000" {...field} />
                                        </FormControl>
                                        <FormDescription>Lowest price you accept for a booking.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxCapacity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Capacity</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="500" {...field} />
                                        </FormControl>
                                        <FormDescription>Maximum number of guests.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="minCapacity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Min Capacity</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="50" {...field} />
                                        </FormControl>
                                        <FormDescription>Minimum number of guests.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="downPaymentType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Down Payment Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Percentage">Percentage (%)</SelectItem>
                                                <SelectItem value="Fixed Amount">Fixed Amount (Rs.)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="downPayment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Down Payment {downPaymentType === 'Percentage' ? '(%)' : downPaymentType === 'Fixed Amount' ? '(Rs.)' : ''}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder={downPaymentType === 'Percentage' ? '30' : '25000'}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {downPaymentType === 'Percentage'
                                                ? 'Percentage of total amount required upfront.'
                                                : downPaymentType === 'Fixed Amount'
                                                    ? 'Fixed rupee amount required upfront.'
                                                    : 'Select a down payment type first.'}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Section: Policies */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Policies</h3>
                        </div>
                        <div className="grid md:grid-cols-1 gap-4">
                            <FormField
                                control={form.control}
                                name="cancelationPolicy"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cancellation Policy</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe your cancellation and refund policy..."
                                                rows={3}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>Shown to customers before they book.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Form>

            {/* BK-100.5 — vendor-selectable cancellation policy presets.
                Renders independently from the form above so saving the
                basic-info form doesn't trigger an unrelated network round-trip,
                and so the legacy free-text `cancelationPolicy` field
                continues to coexist with the new structured policy. */}
            <div className="pt-6">
                <CancellationPolicyCard businessId={business.id} />
            </div>

            {/* Pricing-rules engine — weekend premium + early-bird discount.
                Flag-gated (NEXT_PUBLIC_PRICING_RULES); the backend engine is
                separately gated by env PRICING_RULES_ENGINE, so configuring
                here never changes prices until both are on. */}
            {process.env.NEXT_PUBLIC_PRICING_RULES === '1' && (
                <div className="pt-6">
                    <PricingRulesCard businessId={business.id} />
                </div>
            )}

            {/* BK-100.52 — vendor in-house bundled services. Vendor
                declares catering / decor / DJ / valet etc. they bundle
                with the venue; the customer-facing read-only display
                on the profile + the interactive add-on picker on the
                booking review step both consume this data. */}
            <div className="pt-6">
                <BundledServicesCard businessId={business.id} />
            </div>

            {/* BK-100.51 — multi-resource capacity declarations. The
                slot engine consults these rows when the "Use multi-
                resource capacity" flag below is on (per-kind capacity
                = quantity / unitsPerBooking; overall = MIN across
                kinds). Flag defaults off; flipping it on/off is
                instant + reversible. */}
            <div className="pt-6">
                <ResourcesCard businessId={business.id} />
            </div>
        </div>
    )
}

export default BasicInfoTab

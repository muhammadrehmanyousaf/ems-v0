"use client";

import React, { useMemo } from 'react';
import { useFormContext } from '@/lib/context/form-context';
import {
    User, Mail, Phone, Building2, MapPin, Instagram, Facebook,
    Globe, AtSign, ExternalLink,
} from 'lucide-react';

const SectionTitle = ({ title }: { title: string }) => (
    <h3 className='text-xs font-semibold uppercase text-gray-400 tracking-wider border-b pb-2 mb-4'>{title}</h3>
);

const Field = ({ label, value }: { label: string; value?: string | number | null }) => {
    if (!value && value !== 0) return null;
    return (
        <div className='flex flex-col gap-0.5'>
            <span className='text-[11px] uppercase tracking-wide text-gray-400'>{label}</span>
            <span className='text-sm text-gray-800'>{value}</span>
        </div>
    );
};

const Tags = ({ label, items, color = 'gray' }: { label: string; items: string[]; color?: string }) => {
    if (!items?.length) return null;
    const colorMap: Record<string, string> = {
        gray: 'bg-gray-100 text-gray-700',
        purple: 'bg-purple-50 text-purple-700',
        blue: 'bg-blue-50 text-blue-700',
        green: 'bg-green-50 text-green-700',
    };
    return (
        <div className='flex flex-col gap-1.5 sm:col-span-2'>
            <span className='text-[11px] uppercase tracking-wide text-gray-400'>{label}</span>
            <div className='flex flex-wrap gap-1.5'>
                {items.map((item, i) => (
                    <span key={i} className={`text-xs px-2.5 py-1 rounded-full ${colorMap[color] ?? colorMap.gray}`}>{item}</span>
                ))}
            </div>
        </div>
    );
};

const Preview = () => {
    const { formData } = useFormContext();

    const profilePhotoUrl = useMemo(() => {
        if (formData.profileImageFile instanceof File) {
            return URL.createObjectURL(formData.profileImageFile);
        }
        return null;
    }, [formData.profileImageFile]);

    const hasPackages = formData.packages?.some(p => p.name?.trim());
    const hasPricing = formData.downPaymentType || formData.downPayment > 0 || formData.cancelationPolicy || hasPackages;

    const subTypeLabel: Record<string, string> = {
        'Photographer': 'Photography Type',
        'Makeup artist': 'Makeup Type',
        'Henna artist': 'Henna Style',
        'Decorator': 'Decoration Type',
        'Catering': 'Catering Type',
        'Wedding venue': 'Venue Type',
        'Car rental': 'Vehicle Type',
        'Bridal wearing': 'Bridal Wear Type',
    };
    const businessTypeLabel = subTypeLabel[formData.businessType] ?? 'Business Type';

    return (
        <div className='space-y-8 w-full'>

            {/* ── Personal Details ── */}
            <section>
                <SectionTitle title="Personal Details" />
                <div className='flex items-center gap-4'>
                    <div className='size-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border flex-shrink-0'>
                        {profilePhotoUrl
                            ? <img src={profilePhotoUrl} alt="Profile" className='w-full h-full object-cover' />
                            : <User className='w-7 h-7 text-gray-400' />}
                    </div>
                    <div className='space-y-1.5'>
                        <p className='font-semibold text-base'>{formData.fullName || '—'}</p>
                        <div className='flex flex-wrap gap-3'>
                            {formData.email && (
                                <span className='flex items-center gap-1.5 text-sm text-gray-500'>
                                    <Mail className='w-3.5 h-3.5' />{formData.email}
                                </span>
                            )}
                            {formData.phoneNumber && (
                                <span className='flex items-center gap-1.5 text-sm text-gray-500'>
                                    <Phone className='w-3.5 h-3.5' />+92 {formData.phoneNumber}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Business / Contact Details ── */}
            <section>
                <SectionTitle title="Business Details" />

                {/* Logo + Brand */}
                <div className='flex items-center gap-4 mb-5'>
                    <div className='size-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border flex-shrink-0'>
                        {formData.profilePicture
                            ? <img src={formData.profilePicture} alt="Logo" className='w-full h-full object-cover' />
                            : <Building2 className='w-6 h-6 text-gray-400' />}
                    </div>
                    <div className='space-y-1'>
                        <p className='font-semibold text-base'>{formData.name || '—'}</p>
                        {formData.businessType && (
                            <span className='text-xs bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full'>{formData.businessType}</span>
                        )}
                    </div>
                </div>

                {/* Address fields */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5'>
                    <Field label="City" value={formData.city} />
                    <Field label="Sub Area" value={formData.subArea} />
                    <Field label="Office Address" value={formData.officeAddress} />
                    {formData.secondaryContactNumber && (
                        <Field label="Secondary Contact" value={`+92 ${formData.secondaryContactNumber}`} />
                    )}
                </div>

                {/* Online presence */}
                <div className='space-y-2'>
                    {formData.instagram && (
                        <a href={formData.instagram} target='_blank' rel='noreferrer'
                            className='flex items-center gap-2 text-sm text-pink-600 hover:underline break-all'>
                            <Instagram className='w-4 h-4 flex-shrink-0' />{formData.instagram}
                        </a>
                    )}
                    {formData.facebook && (
                        <a href={formData.facebook} target='_blank' rel='noreferrer'
                            className='flex items-center gap-2 text-sm text-blue-600 hover:underline break-all'>
                            <Facebook className='w-4 h-4 flex-shrink-0' />{formData.facebook}
                        </a>
                    )}
                    {formData.bookingEmail && (
                        <span className='flex items-center gap-2 text-sm text-gray-600'>
                            <AtSign className='w-4 h-4 flex-shrink-0' />{formData.bookingEmail}
                        </span>
                    )}
                    {formData.website && (
                        <a href={formData.website} target='_blank' rel='noreferrer'
                            className='flex items-center gap-2 text-sm text-blue-600 hover:underline break-all'>
                            <Globe className='w-4 h-4 flex-shrink-0' />{formData.website}
                        </a>
                    )}
                    {formData.officeGoogleLink && (
                        <a href={formData.officeGoogleLink} target='_blank' rel='noreferrer'
                            className='flex items-center gap-2 text-sm text-green-600 hover:underline'>
                            <MapPin className='w-4 h-4 flex-shrink-0' />View on Google Maps
                            <ExternalLink className='w-3 h-3' />
                        </a>
                    )}
                </div>
            </section>

            {/* ── Business Info ── */}
            <section>
                <SectionTitle title="Business Info" />
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    {formData.description && (
                        <div className='sm:col-span-2'>
                            <Field label="Description" value={formData.description} />
                        </div>
                    )}
                    <Tags label={businessTypeLabel} items={Array.isArray(formData.subBusinessType) ? formData.subBusinessType : formData.subBusinessType ? [formData.subBusinessType] : []} color="purple" />
                    <Tags label="Staff" items={formData.staff} color="blue" />
                    <Tags label="Expertise" items={formData.expertise} color="gray" />
                    <Tags label="Amenities" items={formData.amenities} color="green" />
                    <Field label="Max Capacity" value={formData.maxCapacity} />
                    {formData.catering && <Field label="Catering" value={formData.catering} />}
                    {(formData.parking === true || formData.parking === false) && formData.maxCapacity && (
                        <Field label="Parking" value={formData.parking ? 'Available' : 'Not Available'} />
                    )}
                    {formData.additionalInfo && (
                        <div className='sm:col-span-2'>
                            <Field label="Additional Info" value={formData.additionalInfo} />
                        </div>
                    )}
                </div>
            </section>

            {/* ── Pricing & Policies ── */}
            {hasPricing && (
                <section>
                    <SectionTitle title="Pricing & Policies" />
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5'>
                        <Field label="Down Payment Type" value={formData.downPaymentType} />
                        {formData.downPayment > 0 && (
                            <Field
                                label="Down Payment"
                                value={formData.downPaymentType === 'Percentage'
                                    ? `${formData.downPayment}%`
                                    : `PKR ${Number(formData.downPayment).toLocaleString()}`}
                            />
                        )}
                        {formData.cancelationPolicy && (
                            <div className='sm:col-span-2'>
                                <Field label="Cancellation Policy" value={formData.cancelationPolicy} />
                            </div>
                        )}
                    </div>

                    {hasPackages && (
                        <div className='overflow-x-auto'>
                            <table className='w-full table-auto text-sm border rounded-lg overflow-hidden'>
                                <thead>
                                    <tr className='bg-gray-50'>
                                        <th className='p-3 text-left font-medium text-gray-600 border-b'>Package</th>
                                        <th className='p-3 text-left font-medium text-gray-600 border-b'>Price</th>
                                        <th className='p-3 text-left font-medium text-gray-600 border-b'>Features</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.packages.filter(p => p.name?.trim()).map((pkg, i) => (
                                        <tr key={i} className='border-b last:border-0'>
                                            <td className='p-3 font-medium'>{pkg.name}</td>
                                            <td className='p-3 text-purple-600 font-semibold whitespace-nowrap'>
                                                PKR {Number(pkg.price).toLocaleString()}
                                            </td>
                                            <td className='p-3'>
                                                {pkg.features && Object.entries(pkg.features).map(([cat, items]) => {
                                                    const list = items as string[];
                                                    if (!list?.length) return null;
                                                    return (
                                                        <div key={cat} className='mb-1 last:mb-0'>
                                                            <span className='font-semibold capitalize text-xs text-gray-500'>{cat}: </span>
                                                            <span className='text-xs text-gray-600'>{list.join(', ')}</span>
                                                        </div>
                                                    );
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {/* ── Portfolio Images ── */}
            {formData.images.length > 0 && (
                <section>
                    <SectionTitle title={`Portfolio Images (${formData.images.length})`} />
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'>
                        {formData.images.map((src, i) => (
                            <div key={i} className='aspect-square rounded-lg overflow-hidden border bg-gray-50'>
                                <img src={src} alt={`Image ${i + 1}`} className='w-full h-full object-cover' />
                            </div>
                        ))}
                    </div>
                </section>
            )}

        </div>
    );
};

export default Preview;

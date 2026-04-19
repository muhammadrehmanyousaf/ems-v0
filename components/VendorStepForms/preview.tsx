"use client";

import React, { useMemo } from 'react';
import { useFormContext } from '@/lib/context/form-context';
import { getVendorTypeConfig, type OptionGroup } from '@/lib/vendor-type-config';
import {
    User, Mail, Phone, Building2, MapPin, Instagram, Facebook,
    Globe, AtSign, ExternalLink, CheckCircle,
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
        pink: 'bg-pink-50 text-pink-700',
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

// ── Stationery grouped expertise ──────────────────────────────────────────────

function GroupedExpertise({ groups, selected }: { groups: OptionGroup[]; selected: string[] }) {
    if (!selected?.length) return null;
    return (
        <div className='sm:col-span-2 space-y-3'>
            <span className='text-[11px] uppercase tracking-wide text-gray-400'>Products Offered</span>
            {groups.map(({ group, emoji, items }) => {
                const picked = items.filter((i) => selected.includes(i));
                if (!picked.length) return null;
                return (
                    <div key={group} className='border border-neutral-200 rounded-xl overflow-hidden'>
                        <div className='flex items-center gap-2 px-3 py-2 bg-neutral-50 border-b border-neutral-200'>
                            <span className='text-sm'>{emoji}</span>
                            <p className='text-xs font-semibold text-neutral-700'>{group}</p>
                            <span className='ml-auto text-xs text-gray-400'>{picked.length}/{items.length}</span>
                        </div>
                        <div className='px-3 py-2 flex flex-wrap gap-1.5'>
                            {picked.map((v, i) => (
                                <span key={i} className='text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700'>{v}</span>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Bridal Wear outfit card ────────────────────────────────────────────────────

interface OutfitCardProps {
    name: string;
    price: number;
    features: Record<string, string[]>;
    imageUrls: string[];
}

const FEATURE_LABELS: Record<string, { label: string; color: string }> = {
    category: { label: 'Category', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    fabric:   { label: 'Fabric',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
    occasions:{ label: 'For',      color: 'bg-blue-50 text-blue-700 border-blue-200' },
    color:    { label: 'Color',    color: 'bg-pink-50 text-pink-700 border-pink-200' },
};

function OutfitCard({ name, price, features, imageUrls }: OutfitCardProps) {
    const visibleImages = imageUrls.slice(0, 4);
    const extraCount = imageUrls.length - visibleImages.length;

    return (
        <div className='border rounded-xl overflow-hidden bg-white shadow-sm'>
            {/* Image strip */}
            {imageUrls.length > 0 ? (
                <div className={`grid gap-0.5 ${visibleImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {visibleImages.map((src, i) => (
                        <div
                            key={i}
                            className={`relative overflow-hidden bg-gray-100 ${
                                visibleImages.length === 1 ? 'h-44' :
                                visibleImages.length === 2 ? 'h-32' : 'h-28'
                            }`}
                        >
                            <img src={src} alt={`${name} ${i + 1}`} className='w-full h-full object-cover' />
                            {/* +N overlay on last visible image */}
                            {extraCount > 0 && i === visibleImages.length - 1 && (
                                <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
                                    <span className='text-white font-semibold text-sm'>+{extraCount}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className='h-24 bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center'>
                    <span className='text-3xl'>👗</span>
                </div>
            )}

            {/* Card body */}
            <div className='p-4 space-y-3'>
                <div className='flex items-start justify-between gap-2'>
                    <p className='font-semibold text-sm text-neutral-800 leading-tight'>{name}</p>
                    <span className='text-sm font-bold text-purple-600 whitespace-nowrap'>
                        PKR {Number(price).toLocaleString()}
                    </span>
                </div>

                {Object.entries(FEATURE_LABELS).map(([key, { label, color }]) => {
                    const items: string[] = features?.[key] ?? [];
                    if (!items.length) return null;
                    return (
                        <div key={key}>
                            <p className='text-[10px] uppercase tracking-wide text-gray-400 mb-1'>{label}</p>
                            <div className='flex flex-wrap gap-1'>
                                {items.map((item, i) => (
                                    <span key={i} className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${color}`}>
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Main Preview ──────────────────────────────────────────────────────────────

const Preview = () => {
    const { formData } = useFormContext();

    const profilePhotoUrl = useMemo(() => {
        if (formData.profileImageFile instanceof File) {
            return URL.createObjectURL(formData.profileImageFile);
        }
        return null;
    }, [formData.profileImageFile]);

    // Build (pkg, imageUrls) pairs preserving original index alignment
    const outfitEntries = useMemo(() => {
        const pkgImageFiles = formData.packageImageFiles ?? [];
        return (formData.packages ?? [])
            .map((pkg, origIdx) => ({
                pkg,
                imageUrls: (pkgImageFiles[origIdx] ?? []).map((f) => URL.createObjectURL(f)),
            }))
            .filter(({ pkg }) => pkg.name?.trim());
    }, [formData.packages, formData.packageImageFiles]);

    const hasPackages = outfitEntries.length > 0;
    const hasPricing = formData.downPaymentType || formData.downPayment > 0 || formData.cancelationPolicy || hasPackages;
    const isCarRental = formData.businessType === 'Car rental';
    const isBridalWear = formData.businessType === 'Bridal wearing';
    const isWeddingStationery = formData.businessType === 'Wedding Invitations and Stationery';

    const stationeryExpertiseGroups = useMemo(() => {
        if (!isWeddingStationery) return [];
        const cfg = getVendorTypeConfig('Wedding Invitations and Stationery');
        const field = cfg?.typeSpecificFields.find((f) => f.key === 'expertise');
        return (field?.groups ?? []) as OptionGroup[];
    }, [isWeddingStationery]);

    const tableHeaders = { col1: 'Package', col2: 'Price', col3: 'Specifications' };

    const subTypeLabel: Record<string, string> = {
        'Photographer': 'Photography Type',
        'Makeup artist': 'Makeup Type',
        'Henna artist': 'Henna Style',
        'Decorator': 'Decoration Type',
        'Catering': 'Catering Type',
        'Wedding venue': 'Venue Type',
        'Car rental': 'Vehicle Type',
        'Bridal wearing': 'Store Type',
    };
    const businessTypeLabel = subTypeLabel[formData.businessType] ?? 'Business Type';

    // Bridal wear service toggles
    const bridalServices = isBridalWear ? [
        { key: 'travelToClientHome',      label: 'Home Delivery' },
        { key: 'sellMehndi',              label: 'Rental Available' },
        { key: 'hasTeam',                 label: 'Bridesmaid Outfits' },
        { key: 'provideDecorationItem',   label: 'Design Consultation' },
        { key: 'provideFoodTesting',      label: 'Trial / Fitting' },
        { key: 'provideWaiter',           label: 'Alteration Service' },
        { key: 'provideSoundSystem',      label: 'Accessory Matching' },
        { key: 'provideSeatingArrangement', label: 'Dupatta Styling' },
        { key: 'providePlate',            label: 'Groom Wear' },
        { key: 'parking',                 label: 'Rush Orders' },
    ].filter(({ key }) => (formData as Record<string, unknown>)[key] === true) : [];

    const stationeryServices = isWeddingStationery ? [
        { key: 'travelToClientHome',        label: 'Home / Courier Delivery' },
        { key: 'sellMehndi',                label: 'Customisation Available' },
        { key: 'hasTeam',                   label: 'Digital Invitation Files' },
        { key: 'provideDecorationItem',     label: 'Wax Seal / Stamp Available' },
        { key: 'provideFoodTesting',        label: 'Calligraphy Available' },
        { key: 'provideWaiter',             label: 'Envelope Included' },
        { key: 'provideSoundSystem',        label: 'Rush Orders Accepted' },
        { key: 'provideSeatingArrangement', label: 'Bilingual Printing' },
        { key: 'providePlate',              label: 'Acrylic Cards Available' },
        { key: 'parking',                   label: 'Nationwide Delivery' },
    ].filter(({ key }) => (formData as Record<string, unknown>)[key] === true) : [];

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

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5'>
                    <Field label="City" value={formData.city} />
                    <Field label="Sub Area" value={formData.subArea} />
                    <Field label="Office Address" value={formData.officeAddress} />
                    {formData.secondaryContactNumber && (
                        <Field label="Secondary Contact" value={`+92 ${formData.secondaryContactNumber}`} />
                    )}
                </div>

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
                    {!isBridalWear && !isWeddingStationery && <Tags label="Staff" items={formData.staff} color="blue" />}

                    {/* Expertise — grouped for stationery, flat for everyone else */}
                    {isWeddingStationery
                        ? <GroupedExpertise groups={stationeryExpertiseGroups} selected={formData.expertise ?? []} />
                        : <Tags label={isBridalWear ? 'Occasions' : 'Expertise'} items={formData.expertise} color="gray" />
                    }

                    {!isWeddingStationery && (
                        <Tags label={isBridalWear ? 'Outfit Categories' : 'Amenities'} items={formData.amenities} color="green" />
                    )}
                    {!isBridalWear && !isWeddingStationery && <Field label="Max Capacity" value={formData.maxCapacity} />}
                    {!isBridalWear && !isWeddingStationery && formData.catering && <Field label="Catering" value={formData.catering} />}
                    {!isBridalWear && !isWeddingStationery && (formData.parking === true || formData.parking === false) && formData.maxCapacity && (
                        <Field label="Parking" value={formData.parking ? 'Available' : 'Not Available'} />
                    )}
                    {formData.additionalInfo && (
                        <div className='sm:col-span-2'>
                            <Field label="Additional Info" value={formData.additionalInfo} />
                        </div>
                    )}
                    {/* Bridal wear extras */}
                    {isBridalWear && (
                        <>
                            <Tags label="Fabrics" items={formData.serviceProvided ?? []} color="pink" />
                            {formData.instruction && <Field label="Order Lead Time" value={formData.instruction} />}
                            {(formData.minimumPrice ?? 0) > 0 && (
                                <Field label="Starting Price" value={`PKR ${Number(formData.minimumPrice).toLocaleString()}`} />
                            )}
                        </>
                    )}
                    {/* Wedding Stationery extras */}
                    {isWeddingStationery && (
                        <>
                            <Tags label="Printing Techniques" items={formData.amenities ?? []} color="green" />
                            <Tags label="Languages for Printing" items={formData.serviceProvided ?? []} color="blue" />
                            {formData.instruction && <Field label="Production Turnaround" value={formData.instruction} />}
                            {(formData.minCapacity ?? 0) > 0 && (
                                <Field label="Minimum Order Qty" value={`${formData.minCapacity} pieces`} />
                            )}
                            {(formData.minimumPrice ?? 0) > 0 && (
                                <Field label="Starting Price" value={`PKR ${Number(formData.minimumPrice).toLocaleString()}`} />
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* ── Services Offered (Bridal Wear & Wedding Stationery) ── */}
            {(isBridalWear && bridalServices.length > 0) || (isWeddingStationery && stationeryServices.length > 0) ? (
                <section>
                    <SectionTitle title="Services Offered" />
                    <div className='flex flex-wrap gap-2'>
                        {(isBridalWear ? bridalServices : stationeryServices).map(({ key, label }) => (
                            <span
                                key={key}
                                className='flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-medium'
                            >
                                <CheckCircle className='w-3.5 h-3.5' />
                                {label}
                            </span>
                        ))}
                    </div>
                </section>
            ) : null}

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

                    {/* ── Bridal Wear: outfit cards ── */}
                    {isBridalWear && hasPackages && (
                        <>
                            <p className='text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3'>
                                Outfit Listings ({outfitEntries.length})
                            </p>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                {outfitEntries.map(({ pkg, imageUrls }, i) => (
                                    <OutfitCard
                                        key={i}
                                        name={pkg.name}
                                        price={pkg.price}
                                        features={pkg.features as Record<string, string[]>}
                                        imageUrls={imageUrls}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* ── Car Rental fleet / other vendors: existing table ── */}
                    {!isBridalWear && hasPackages && (
                        <div className='overflow-x-auto'>
                            <table className='w-full table-auto text-sm border rounded-lg overflow-hidden'>
                                <thead>
                                    <tr className='bg-gray-50'>
                                        <th className='p-3 text-left font-medium text-gray-600 border-b'>
                                            {isCarRental ? 'Car' : tableHeaders.col1}
                                        </th>
                                        <th className='p-3 text-left font-medium text-gray-600 border-b'>
                                            {isCarRental ? 'Price / Event' : tableHeaders.col2}
                                        </th>
                                        <th className='p-3 text-left font-medium text-gray-600 border-b'>
                                            {isCarRental ? 'Specifications' : tableHeaders.col3}
                                        </th>
                                        {outfitEntries.some(({ imageUrls }) => imageUrls.length > 0) && (
                                            <th className='p-3 text-left font-medium text-gray-600 border-b'>Images</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {outfitEntries.map(({ pkg, imageUrls }, i) => (
                                        <tr key={i} className='border-b last:border-0'>
                                            <td className='p-3 font-medium'>{pkg.name}</td>
                                            <td className='p-3 text-purple-600 font-semibold whitespace-nowrap'>
                                                PKR {Number(pkg.price).toLocaleString()}
                                            </td>
                                            <td className='p-3'>
                                                {pkg.features && Object.entries(pkg.features).map(([cat, items]) => {
                                                    const list = items as string[];
                                                    if (!list?.length) return null;
                                                    const label = isCarRental
                                                        ? ({
                                                            make: 'Make', model: 'Model', year: 'Year',
                                                            vehicleType: 'Vehicle Type', color: 'Color',
                                                            seatingCapacity: 'Seats', unitsAvailable: 'Units Available',
                                                            driver: 'Driver', ac: 'AC', decoration: 'Decoration',
                                                          }[cat] ?? cat)
                                                        : cat;
                                                    return (
                                                        <div key={cat} className='mb-1 last:mb-0'>
                                                            <span className='font-semibold capitalize text-xs text-gray-500'>{label}: </span>
                                                            <span className='text-xs text-gray-600'>{list.join(', ')}</span>
                                                        </div>
                                                    );
                                                })}
                                            </td>
                                            {outfitEntries.some(({ imageUrls }) => imageUrls.length > 0) && (
                                                <td className='p-3'>
                                                    {imageUrls.length > 0 ? (
                                                        <div className='flex flex-wrap gap-1.5'>
                                                            {imageUrls.map((src, j) => (
                                                                <div key={j} className='w-14 h-14 rounded-md overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0'>
                                                                    <img src={src} alt={`img ${j + 1}`} className='w-full h-full object-cover' />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className='text-xs text-gray-400 italic'>No images</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {/* ── Car Rental Combo Packages ── */}
            {isCarRental && (formData.carRentalPackages ?? []).filter(p => p.name?.trim()).length > 0 && (
                <section>
                    <SectionTitle title="Packages" />
                    <div className='space-y-4'>
                        {(formData.carRentalPackages ?? []).filter(p => p.name?.trim()).map((pkg, i) => {
                            const fleet = formData.packages.filter(p => p.name?.trim());
                            return (
                                <div key={i} className='border rounded-xl p-4 bg-white/60 space-y-3'>
                                    <div className='flex items-center justify-between'>
                                        <p className='font-semibold text-sm text-neutral-800'>{pkg.name}</p>
                                        <span className='text-sm font-bold text-purple-600'>
                                            PKR {Number(pkg.totalPrice).toLocaleString()}
                                        </span>
                                    </div>
                                    {pkg.cars.filter(c => c.carIndex >= 0).length > 0 && (
                                        <div className='flex flex-wrap gap-2'>
                                            {pkg.cars.filter(c => c.carIndex >= 0).map((c, ci) => {
                                                const car = fleet[c.carIndex];
                                                const make = car?.features?.make?.[0] ?? '';
                                                const model = car?.features?.model?.[0] ?? '';
                                                const year = car?.features?.year?.[0] ?? '';
                                                const label = [make, model, year].filter(Boolean).join(' ') || car?.name || `Car ${c.carIndex + 1}`;
                                                return (
                                                    <span key={ci} className='text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full font-medium'>
                                                        {c.quantity}× {label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {pkg.citiesCovered?.length > 0 && (
                                        <div className='flex flex-wrap gap-1.5'>
                                            {pkg.citiesCovered.map((city, ci) => (
                                                <span key={ci} className='text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full'>
                                                    {city}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {pkg.description?.trim() && (
                                        <p className='text-xs text-gray-500 italic'>{pkg.description}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
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

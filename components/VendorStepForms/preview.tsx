"use client";

import React, { useMemo } from "react";
import { useFormContext } from "@/lib/context/form-context";
import { getVendorTypeConfig, type OptionGroup } from "@/lib/vendor-type-config";
import {
    User,
    Mail,
    Phone,
    Building2,
    MapPin,
    Instagram,
    Facebook,
    Globe,
    AtSign,
    ExternalLink,
    CheckCircle,
} from "lucide-react";
import { FloralDivider } from "@/components/bridal/floral-divider";

// ── Bridal section header — caps gold label + thin gold rule on each side ────
const SectionTitle = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 mb-5">
        <span className="bridal-label">{title}</span>
        <span className="flex-1 h-px bg-gradient-to-r from-bridal-gold/40 via-bridal-beige to-transparent" />
    </div>
);

// ── Field row — caps label + charcoal value (font-bridal) ────────────────────
const Field = ({
    label,
    value,
}: {
    label: string;
    value?: string | number | null;
}) => {
    if (!value && value !== 0) return null;
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[0.18em] text-bridal-text-label font-medium">
                {label}
            </span>
            <span className="font-bridal text-sm text-bridal-charcoal leading-snug">
                {value}
            </span>
        </div>
    );
};

// ── Tag chips — bridal palette only (rose / gold / sage / coral / mauve) ─────
type TagColor = "rose" | "gold" | "sage" | "coral" | "mauve";

const TAG_STYLES: Record<TagColor, string> = {
    rose:  "bg-bridal-blush border-bridal-rose/55 text-bridal-mauve",
    gold:  "bg-[#FFF8EE] border-bridal-gold/55 text-[#8B5E2E]",
    sage:  "bg-[#EFF5EC] border-bridal-sage/65 text-[#3F6B43]",
    coral: "bg-[#FFF1EC] border-bridal-coral/60 text-[#9B4A38]",
    mauve: "bg-bridal-mauve/10 border-bridal-mauve/30 text-bridal-mauve",
};

const Tags = ({
    label,
    items,
    color = "rose",
}: {
    label: string;
    items: string[];
    color?: TagColor;
}) => {
    if (!items?.length) return null;
    return (
        <div className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-bridal-text-label font-medium">
                {label}
            </span>
            <div className="flex flex-wrap gap-1.5">
                {items.map((item, i) => (
                    <span
                        key={i}
                        className={`text-[12px] font-bridal px-3 py-1 rounded-full border ${TAG_STYLES[color]}`}
                    >
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
};

// ── Stationery grouped expertise ─────────────────────────────────────────────
function GroupedExpertise({
    groups,
    selected,
}: {
    groups: OptionGroup[];
    selected: string[];
}) {
    if (!selected?.length) return null;
    return (
        <div className="sm:col-span-2 space-y-3">
            <span className="text-[11px] uppercase tracking-[0.18em] text-bridal-text-label font-medium">
                Products Offered
            </span>
            {groups.map(({ group, emoji, items }) => {
                const picked = items.filter((i) => selected.includes(i));
                if (!picked.length) return null;
                return (
                    <div
                        key={group}
                        className="bridal-card overflow-hidden p-0"
                    >
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-bridal-blush/45 border-b border-bridal-beige">
                            <span className="text-base">{emoji}</span>
                            <p className="font-display italic text-[15px] text-bridal-charcoal">
                                {group}
                            </p>
                            <span className="ml-auto text-[11px] tracking-[0.15em] uppercase text-bridal-text-label">
                                {picked.length}/{items.length}
                            </span>
                        </div>
                        <div className="px-4 py-3 flex flex-wrap gap-1.5">
                            {picked.map((v, i) => (
                                <span
                                    key={i}
                                    className={`text-[12px] font-bridal px-3 py-1 rounded-full border ${TAG_STYLES.rose}`}
                                >
                                    {v}
                                </span>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Bridal Wear outfit card ──────────────────────────────────────────────────
interface OutfitCardProps {
    name: string;
    price: number;
    features: Record<string, string[]>;
    imageUrls: string[];
}

const FEATURE_LABELS: Record<string, { label: string; color: TagColor }> = {
    category:  { label: "Category", color: "mauve" },
    fabric:    { label: "Fabric",   color: "gold"  },
    occasions: { label: "For",      color: "rose"  },
    color:     { label: "Color",    color: "coral" },
};

function OutfitCard({ name, price, features, imageUrls }: OutfitCardProps) {
    const visibleImages = imageUrls.slice(0, 4);
    const extraCount = imageUrls.length - visibleImages.length;

    return (
        <div className="bridal-card overflow-hidden p-0">
            {/* Image strip */}
            {imageUrls.length > 0 ? (
                <div
                    className={`grid gap-0.5 ${
                        visibleImages.length === 1 ? "grid-cols-1" : "grid-cols-2"
                    }`}
                >
                    {visibleImages.map((src, i) => (
                        <div
                            key={i}
                            className={`relative overflow-hidden bg-bridal-blush/40 ${
                                visibleImages.length === 1
                                    ? "h-44"
                                    : visibleImages.length === 2
                                    ? "h-32"
                                    : "h-28"
                            }`}
                        >
                            <img
                                src={src}
                                alt={`${name} ${i + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {extraCount > 0 && i === visibleImages.length - 1 && (
                                <div className="absolute inset-0 bg-bridal-charcoal/55 flex items-center justify-center">
                                    <span className="font-display italic text-bridal-ivory text-lg">
                                        +{extraCount}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-24 bg-gradient-to-br from-bridal-blush/60 to-bridal-cream flex items-center justify-center">
                    <span className="text-3xl">👗</span>
                </div>
            )}

            {/* Card body */}
            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <p className="font-display italic text-[16px] text-bridal-charcoal leading-tight">
                        {name}
                    </p>
                    <span className="font-bridal text-[13px] font-semibold text-bridal-gold-dark whitespace-nowrap">
                        PKR {Number(price).toLocaleString()}
                    </span>
                </div>

                {Object.entries(FEATURE_LABELS).map(([key, { label, color }]) => {
                    const items: string[] = features?.[key] ?? [];
                    if (!items.length) return null;
                    return (
                        <div key={key}>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-bridal-text-label font-medium mb-1.5">
                                {label}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {items.map((item, i) => (
                                    <span
                                        key={i}
                                        className={`text-[11px] font-bridal px-2 py-0.5 rounded-full border ${TAG_STYLES[color]}`}
                                    >
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

// ── Section card wrapper — kept at module scope to avoid focus-loss bug ──────
const Section = ({
    children,
    title,
}: {
    children: React.ReactNode;
    title: string;
}) => (
    <section className="bridal-card p-5 sm:p-6">
        <SectionTitle title={title} />
        {children}
    </section>
);

// ── Main Preview ─────────────────────────────────────────────────────────────
const Preview = () => {
    const { formData } = useFormContext();

    const profilePhotoUrl = useMemo(() => {
        if (formData.profileImageFile instanceof File) {
            return URL.createObjectURL(formData.profileImageFile);
        }
        return null;
    }, [formData.profileImageFile]);

    const outfitEntries = useMemo(() => {
        const pkgImageFiles = formData.packageImageFiles ?? [];
        return (formData.packages ?? [])
            .map((pkg, origIdx) => ({
                pkg,
                imageUrls: (pkgImageFiles[origIdx] ?? []).map((f) =>
                    URL.createObjectURL(f)
                ),
            }))
            .filter(({ pkg }) => pkg.name?.trim());
    }, [formData.packages, formData.packageImageFiles]);

    const hasPackages = outfitEntries.length > 0;
    const hasPricing =
        formData.downPaymentType ||
        formData.downPayment > 0 ||
        formData.cancelationPolicy ||
        hasPackages;
    const isCarRental = formData.businessType === "Car rental";
    const isBridalWear = formData.businessType === "Bridal wearing";
    const isWeddingStationery =
        formData.businessType === "Wedding Invitations and Stationery";

    const stationeryExpertiseGroups = useMemo(() => {
        if (!isWeddingStationery) return [];
        const cfg = getVendorTypeConfig("Wedding Invitations and Stationery");
        const field = cfg?.typeSpecificFields.find((f) => f.key === "expertise");
        return (field?.groups ?? []) as OptionGroup[];
    }, [isWeddingStationery]);

    const tableHeaders = { col1: "Package", col2: "Price", col3: "Specifications" };

    const subTypeLabel: Record<string, string> = {
        Photographer: "Photography Type",
        "Makeup artist": "Makeup Type",
        "Henna artist": "Henna Style",
        Decorator: "Decoration Type",
        Catering: "Catering Type",
        "Wedding venue": "Venue Type",
        "Car rental": "Vehicle Type",
        "Bridal wearing": "Store Type",
    };
    const businessTypeLabel =
        subTypeLabel[formData.businessType] ?? "Business Type";

    const bridalServices = isBridalWear
        ? [
              { key: "travelToClientHome",        label: "Home Delivery" },
              { key: "sellMehndi",                label: "Rental Available" },
              { key: "hasTeam",                   label: "Bridesmaid Outfits" },
              { key: "provideDecorationItem",     label: "Design Consultation" },
              { key: "provideFoodTesting",        label: "Trial / Fitting" },
              { key: "provideWaiter",             label: "Alteration Service" },
              { key: "provideSoundSystem",        label: "Accessory Matching" },
              { key: "provideSeatingArrangement", label: "Dupatta Styling" },
              { key: "providePlate",              label: "Groom Wear" },
              { key: "parking",                   label: "Rush Orders" },
          ].filter(({ key }) => (formData as Record<string, unknown>)[key] === true)
        : [];

    const stationeryServices = isWeddingStationery
        ? [
              { key: "travelToClientHome",        label: "Home / Courier Delivery" },
              { key: "sellMehndi",                label: "Customisation Available" },
              { key: "hasTeam",                   label: "Digital Invitation Files" },
              { key: "provideDecorationItem",     label: "Wax Seal / Stamp Available" },
              { key: "provideFoodTesting",        label: "Calligraphy Available" },
              { key: "provideWaiter",             label: "Envelope Included" },
              { key: "provideSoundSystem",        label: "Rush Orders Accepted" },
              { key: "provideSeatingArrangement", label: "Bilingual Printing" },
              { key: "providePlate",              label: "Acrylic Cards Available" },
              { key: "parking",                   label: "Nationwide Delivery" },
          ].filter(({ key }) => (formData as Record<string, unknown>)[key] === true)
        : [];

    return (
        <div className="space-y-5 w-full">
            {/* ── Editorial intro — Playfair italic, sets the tone ── */}
            <div className="text-center mb-2">
                <p className="bridal-label mb-2">Final Preview</p>
                <h2 className="font-display italic text-[26px] sm:text-[30px] text-bridal-charcoal leading-tight">
                    Review your{" "}
                    <span className="text-bridal-gold">listing</span> before
                    we publish
                </h2>
                <p className="font-bridal text-bridal-text-soft text-[13px] mt-2 max-w-md mx-auto">
                    This is exactly how your business will appear to couples
                    browsing the platform.
                </p>
                <FloralDivider className="mt-5" width={220} />
            </div>

            {/* ── Personal Details ── */}
            <Section title="Personal Details">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-bridal-cream border-2 border-bridal-gold/30 flex items-center justify-center flex-shrink-0">
                        {profilePhotoUrl ? (
                            <img
                                src={profilePhotoUrl}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="w-7 h-7 text-bridal-gold/70" />
                        )}
                    </div>
                    <div className="space-y-1.5 min-w-0">
                        <p className="font-display italic text-[20px] text-bridal-charcoal leading-tight">
                            {formData.fullName || "—"}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {formData.email && (
                                <span className="flex items-center gap-1.5 text-[13px] font-bridal text-bridal-text-soft">
                                    <Mail className="w-3.5 h-3.5 text-bridal-gold/80" />
                                    {formData.email}
                                </span>
                            )}
                            {formData.phoneNumber && (
                                <span className="flex items-center gap-1.5 text-[13px] font-bridal text-bridal-text-soft">
                                    <Phone className="w-3.5 h-3.5 text-bridal-gold/80" />
                                    +92 {formData.phoneNumber}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── Business / Contact Details ── */}
            <Section title="Business Details">
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-bridal-cream border-2 border-bridal-gold/30 flex items-center justify-center flex-shrink-0">
                        {formData.profilePicture ? (
                            <img
                                src={formData.profilePicture}
                                alt="Logo"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Building2 className="w-6 h-6 text-bridal-gold/70" />
                        )}
                    </div>
                    <div className="space-y-1.5 min-w-0">
                        <p className="font-display italic text-[18px] text-bridal-charcoal leading-tight">
                            {formData.name || "—"}
                        </p>
                        {formData.businessType && (
                            <span
                                className={`inline-block text-[11px] font-bridal font-medium uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-full border ${TAG_STYLES.rose}`}
                            >
                                {formData.businessType}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <Field label="City" value={formData.city} />
                    <Field label="Sub Area" value={formData.subArea} />
                    <Field label="Office Address" value={formData.officeAddress} />
                    {formData.secondaryContactNumber && (
                        <Field
                            label="Secondary Contact"
                            value={`+92 ${formData.secondaryContactNumber}`}
                        />
                    )}
                </div>

                {/* Social / external links */}
                {(formData.instagram ||
                    formData.facebook ||
                    formData.bookingEmail ||
                    formData.website ||
                    formData.officeGoogleLink) && (
                    <div className="space-y-2 pt-4 border-t border-bridal-beige/70">
                        {formData.instagram && (
                            <a
                                href={formData.instagram}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-[13px] font-bridal text-bridal-mauve hover:text-bridal-gold transition-colors break-all"
                            >
                                <Instagram className="w-4 h-4 flex-shrink-0 text-bridal-gold/80" />
                                {formData.instagram}
                            </a>
                        )}
                        {formData.facebook && (
                            <a
                                href={formData.facebook}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-[13px] font-bridal text-bridal-mauve hover:text-bridal-gold transition-colors break-all"
                            >
                                <Facebook className="w-4 h-4 flex-shrink-0 text-bridal-gold/80" />
                                {formData.facebook}
                            </a>
                        )}
                        {formData.bookingEmail && (
                            <span className="flex items-center gap-2 text-[13px] font-bridal text-bridal-text-soft">
                                <AtSign className="w-4 h-4 flex-shrink-0 text-bridal-gold/80" />
                                {formData.bookingEmail}
                            </span>
                        )}
                        {formData.website && (
                            <a
                                href={formData.website}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-[13px] font-bridal text-bridal-mauve hover:text-bridal-gold transition-colors break-all"
                            >
                                <Globe className="w-4 h-4 flex-shrink-0 text-bridal-gold/80" />
                                {formData.website}
                            </a>
                        )}
                        {formData.officeGoogleLink && (
                            <a
                                href={formData.officeGoogleLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-[13px] font-bridal text-bridal-mauve hover:text-bridal-gold transition-colors"
                            >
                                <MapPin className="w-4 h-4 flex-shrink-0 text-bridal-gold/80" />
                                View on Google Maps
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                )}
            </Section>

            {/* ── Business Info ── */}
            <Section title="Business Info">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {formData.description && (
                        <div className="sm:col-span-2">
                            <Field label="Description" value={formData.description} />
                        </div>
                    )}

                    <Tags
                        label={businessTypeLabel}
                        items={
                            Array.isArray(formData.subBusinessType)
                                ? formData.subBusinessType
                                : formData.subBusinessType
                                ? [formData.subBusinessType]
                                : []
                        }
                        color="rose"
                    />

                    {!isBridalWear && !isWeddingStationery && (
                        <Tags label="Staff" items={formData.staff} color="mauve" />
                    )}

                    {/* Expertise — grouped for stationery, flat for everyone else */}
                    {isWeddingStationery ? (
                        <GroupedExpertise
                            groups={stationeryExpertiseGroups}
                            selected={formData.expertise ?? []}
                        />
                    ) : (
                        <Tags
                            label={isBridalWear ? "Occasions" : "Expertise"}
                            items={formData.expertise}
                            color="gold"
                        />
                    )}

                    {!isWeddingStationery && (
                        <Tags
                            label={
                                isBridalWear ? "Outfit Categories" : "Amenities"
                            }
                            items={formData.amenities}
                            color="sage"
                        />
                    )}

                    {!isBridalWear && !isWeddingStationery && (
                        <Field label="Max Capacity" value={formData.maxCapacity} />
                    )}
                    {!isBridalWear && !isWeddingStationery && formData.catering && (
                        <Field label="Catering" value={formData.catering} />
                    )}
                    {!isBridalWear &&
                        !isWeddingStationery &&
                        (formData.parking === true || formData.parking === false) &&
                        formData.maxCapacity && (
                            <Field
                                label="Parking"
                                value={formData.parking ? "Available" : "Not Available"}
                            />
                        )}

                    {formData.additionalInfo && (
                        <div className="sm:col-span-2">
                            <Field
                                label="Additional Info"
                                value={formData.additionalInfo}
                            />
                        </div>
                    )}

                    {/* Bridal wear extras */}
                    {isBridalWear && (
                        <>
                            <Tags
                                label="Fabrics"
                                items={formData.serviceProvided ?? []}
                                color="coral"
                            />
                            {formData.instruction && (
                                <Field
                                    label="Order Lead Time"
                                    value={formData.instruction}
                                />
                            )}
                            {(formData.minimumPrice ?? 0) > 0 && (
                                <Field
                                    label="Starting Price"
                                    value={`PKR ${Number(
                                        formData.minimumPrice
                                    ).toLocaleString()}`}
                                />
                            )}
                        </>
                    )}

                    {/* Wedding Stationery extras */}
                    {isWeddingStationery && (
                        <>
                            <Tags
                                label="Printing Techniques"
                                items={formData.amenities ?? []}
                                color="sage"
                            />
                            <Tags
                                label="Languages for Printing"
                                items={formData.serviceProvided ?? []}
                                color="mauve"
                            />
                            {formData.instruction && (
                                <Field
                                    label="Production Turnaround"
                                    value={formData.instruction}
                                />
                            )}
                            {(formData.minCapacity ?? 0) > 0 && (
                                <Field
                                    label="Minimum Order Qty"
                                    value={`${formData.minCapacity} pieces`}
                                />
                            )}
                            {(formData.minimumPrice ?? 0) > 0 && (
                                <Field
                                    label="Starting Price"
                                    value={`PKR ${Number(
                                        formData.minimumPrice
                                    ).toLocaleString()}`}
                                />
                            )}
                        </>
                    )}
                </div>
            </Section>

            {/* ── Services Offered (Bridal Wear & Wedding Stationery) ── */}
            {(isBridalWear && bridalServices.length > 0) ||
            (isWeddingStationery && stationeryServices.length > 0) ? (
                <Section title="Services Offered">
                    <div className="flex flex-wrap gap-2">
                        {(isBridalWear ? bridalServices : stationeryServices).map(
                            ({ key, label }) => (
                                <span
                                    key={key}
                                    className={`flex items-center gap-1.5 text-[12px] font-bridal font-medium px-3 py-1.5 rounded-full border ${TAG_STYLES.sage}`}
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    {label}
                                </span>
                            )
                        )}
                    </div>
                </Section>
            ) : null}

            {/* ── Pricing & Policies ── */}
            {hasPricing && (
                <Section title="Pricing & Policies">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                        <Field
                            label="Down Payment Type"
                            value={formData.downPaymentType}
                        />
                        {formData.downPayment > 0 && (
                            <Field
                                label="Down Payment"
                                value={
                                    formData.downPaymentType === "Percentage"
                                        ? `${formData.downPayment}%`
                                        : `PKR ${Number(
                                              formData.downPayment
                                          ).toLocaleString()}`
                                }
                            />
                        )}
                        {formData.cancelationPolicy && (
                            <div className="sm:col-span-2">
                                <Field
                                    label="Cancellation Policy"
                                    value={formData.cancelationPolicy}
                                />
                            </div>
                        )}
                    </div>

                    {/* Bridal Wear: outfit cards */}
                    {isBridalWear && hasPackages && (
                        <>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-bridal-text-label font-medium mb-3">
                                Outfit Listings ({outfitEntries.length})
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {outfitEntries.map(({ pkg, imageUrls }, i) => (
                                    <OutfitCard
                                        key={i}
                                        name={pkg.name}
                                        price={pkg.price}
                                        features={
                                            pkg.features as Record<string, string[]>
                                        }
                                        imageUrls={imageUrls}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Other vendors: bridal table */}
                    {!isBridalWear && hasPackages && (
                        <div className="overflow-x-auto rounded-md border border-bridal-beige">
                            <table className="w-full table-auto text-sm">
                                <thead>
                                    <tr className="bg-bridal-blush/40">
                                        <th className="p-3 text-left font-bridal font-medium uppercase tracking-[0.18em] text-[11px] text-bridal-text-label border-b border-bridal-beige">
                                            {isCarRental ? "Car" : tableHeaders.col1}
                                        </th>
                                        <th className="p-3 text-left font-bridal font-medium uppercase tracking-[0.18em] text-[11px] text-bridal-text-label border-b border-bridal-beige">
                                            {isCarRental
                                                ? "Price / Event"
                                                : tableHeaders.col2}
                                        </th>
                                        <th className="p-3 text-left font-bridal font-medium uppercase tracking-[0.18em] text-[11px] text-bridal-text-label border-b border-bridal-beige">
                                            {isCarRental
                                                ? "Specifications"
                                                : tableHeaders.col3}
                                        </th>
                                        {outfitEntries.some(
                                            ({ imageUrls }) => imageUrls.length > 0
                                        ) && (
                                            <th className="p-3 text-left font-bridal font-medium uppercase tracking-[0.18em] text-[11px] text-bridal-text-label border-b border-bridal-beige">
                                                Images
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {outfitEntries.map(({ pkg, imageUrls }, i) => (
                                        <tr
                                            key={i}
                                            className="border-b border-bridal-beige/70 last:border-0 even:bg-bridal-ivory/40"
                                        >
                                            <td className="p-3 font-display italic text-[15px] text-bridal-charcoal">
                                                {pkg.name}
                                            </td>
                                            <td className="p-3 font-bridal font-semibold text-bridal-gold-dark whitespace-nowrap">
                                                PKR {Number(pkg.price).toLocaleString()}
                                            </td>
                                            <td className="p-3 font-bridal text-bridal-text-soft">
                                                {pkg.features &&
                                                    Object.entries(pkg.features).map(
                                                        ([cat, items]) => {
                                                            const list = items as string[];
                                                            if (!list?.length) return null;
                                                            const label = isCarRental
                                                                ? ({
                                                                      make: "Make",
                                                                      model: "Model",
                                                                      year: "Year",
                                                                      vehicleType:
                                                                          "Vehicle Type",
                                                                      color: "Color",
                                                                      seatingCapacity:
                                                                          "Seats",
                                                                      unitsAvailable:
                                                                          "Units Available",
                                                                      driver: "Driver",
                                                                      ac: "AC",
                                                                      decoration:
                                                                          "Decoration",
                                                                  }[cat] ?? cat)
                                                                : cat;
                                                            return (
                                                                <div
                                                                    key={cat}
                                                                    className="mb-1 last:mb-0"
                                                                >
                                                                    <span className="font-medium capitalize text-[11px] uppercase tracking-[0.12em] text-bridal-text-label">
                                                                        {label}:{" "}
                                                                    </span>
                                                                    <span className="text-[12px] text-bridal-text">
                                                                        {list.join(", ")}
                                                                    </span>
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                            </td>
                                            {outfitEntries.some(
                                                ({ imageUrls }) => imageUrls.length > 0
                                            ) && (
                                                <td className="p-3">
                                                    {imageUrls.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {imageUrls.map((src, j) => (
                                                                <div
                                                                    key={j}
                                                                    className="w-14 h-14 rounded-md overflow-hidden border border-bridal-beige bg-bridal-cream flex-shrink-0"
                                                                >
                                                                    <img
                                                                        src={src}
                                                                        alt={`img ${
                                                                            j + 1
                                                                        }`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[12px] font-bridal text-bridal-text-label/70 italic">
                                                            No images
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Section>
            )}

            {/* ── Car Rental Combo Packages ── */}
            {isCarRental &&
                (formData.carRentalPackages ?? []).filter((p) => p.name?.trim())
                    .length > 0 && (
                    <Section title="Packages">
                        <div className="space-y-4">
                            {(formData.carRentalPackages ?? [])
                                .filter((p) => p.name?.trim())
                                .map((pkg, i) => {
                                    const fleet = formData.packages.filter((p) =>
                                        p.name?.trim()
                                    );
                                    return (
                                        <div
                                            key={i}
                                            className="bridal-card p-4 space-y-3"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="font-display italic text-[16px] text-bridal-charcoal leading-tight">
                                                    {pkg.name}
                                                </p>
                                                <span className="font-bridal text-[13px] font-semibold text-bridal-gold-dark whitespace-nowrap">
                                                    PKR{" "}
                                                    {Number(
                                                        pkg.totalPrice
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                            {pkg.cars.filter((c) => c.carIndex >= 0)
                                                .length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {pkg.cars
                                                        .filter((c) => c.carIndex >= 0)
                                                        .map((c, ci) => {
                                                            const car =
                                                                fleet[c.carIndex];
                                                            const make =
                                                                car?.features?.make?.[0] ??
                                                                "";
                                                            const model =
                                                                car?.features?.model?.[0] ??
                                                                "";
                                                            const year =
                                                                car?.features?.year?.[0] ??
                                                                "";
                                                            const label =
                                                                [make, model, year]
                                                                    .filter(Boolean)
                                                                    .join(" ") ||
                                                                car?.name ||
                                                                `Car ${c.carIndex + 1}`;
                                                            return (
                                                                <span
                                                                    key={ci}
                                                                    className={`text-[12px] font-bridal font-medium px-3 py-1 rounded-full border ${TAG_STYLES.gold}`}
                                                                >
                                                                    {c.quantity}× {label}
                                                                </span>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                            {pkg.citiesCovered?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {pkg.citiesCovered.map((city, ci) => (
                                                        <span
                                                            key={ci}
                                                            className={`text-[12px] font-bridal px-2.5 py-0.5 rounded-full border ${TAG_STYLES.mauve}`}
                                                        >
                                                            {city}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {pkg.description?.trim() && (
                                                <p className="text-[12px] font-bridal italic text-bridal-text-soft">
                                                    {pkg.description}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </Section>
                )}

            {/* ── Portfolio Images ── */}
            {formData.images.length > 0 && (
                <Section title={`Portfolio Images (${formData.images.length})`}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {formData.images.map((src, i) => (
                            <div
                                key={i}
                                className="aspect-square rounded-md overflow-hidden border border-bridal-beige bg-bridal-cream hover:border-bridal-gold/55 transition-colors duration-250"
                            >
                                <img
                                    src={src}
                                    alt={`Image ${i + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
};

export default Preview;

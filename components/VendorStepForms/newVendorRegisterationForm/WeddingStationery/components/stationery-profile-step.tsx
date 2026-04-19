'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useFormContext } from '@/lib/context/form-context';

interface StationeryProfileStepProps {
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const SHOP_TYPES = [
    'Print Studio',
    'Digital Design Studio',
    'Boutique Stationery',
    'Full-Service Wedding Stationery',
    'Online Store',
    'Home-Based Business',
];

// Grouped product categories for easy selection
const PRODUCT_GROUPS: { group: string; emoji: string; description: string; items: string[] }[] = [
    {
        group: 'Invitation Cards — by Event',
        emoji: '✉️',
        description: 'Event-specific invitation cards for each Pakistani wedding ceremony',
        items: [
            'Nikkah Cards (نکاح کارڈ)',
            'Barat Invitation Cards (برات کارڈ)',
            'Walima Cards (ولیمہ کارڈ)',
            'Mehndi Cards (مہندی کارڈ)',
            'Mayun / Ubtan Cards (مایوں کارڈ)',
            'Engagement / Baat Pakki Cards (منگنی کارڈ)',
            'Dholki Invitation Cards (ڈھولکی کارڈ)',
            'Multi-Event Combined Card',
            'Save the Date Cards',
        ],
    },
    {
        group: 'Card Formats & Styles',
        emoji: '🎨',
        description: 'Different physical formats and premium finishes for invitation cards',
        items: [
            'Scroll / Box Invitations',
            'Laser-Cut Cards',
            'Acrylic Cards',
            'Velvet Pocket Cards',
            'Foil / Metallic Cards',
            'Digital / WhatsApp Invitations',
        ],
    },
    {
        group: 'Bid Boxes & Favour Boxes',
        emoji: '🎁',
        description: 'Bid boxes (بِد کی ڈبی) and favour boxes distributed at Nikkah and other events',
        items: [
            'Bid Boxes / Nikkah Favour Boxes (بِد کی ڈبی)',
            'Mehndi Favour Bags / Boxes',
            'Sweet Boxes (مٹھائی ڈبی)',
            'Chocolate Boxes',
            'Dry Fruit Boxes',
            'Tin / Velvet Boxes',
            'Pyramid / Pillow Boxes',
            'Jute / Jammawar Pouches',
        ],
    },
    {
        group: 'Nikkah Ceremony Stationery',
        emoji: '📜',
        description: 'Specialised stationery items specifically for the Nikkah ceremony',
        items: [
            'Nikkah Nama Booklet / Folder',
            'Nikkah Pen (نکاح قلم)',
            'Nikkah Certificate Frame',
            'Thumb Board (acrylic)',
            'Haq Mehar Envelope / Box (حق مہر)',
        ],
    },
    {
        group: 'Pakistani Ceremony Items',
        emoji: '🕌',
        description: 'Culture-specific items for Barat, Doodh Pilai, Salami, and other traditions',
        items: [
            'Doodh Pilai Glass & Tray Set (دودھ پلائی)',
            'Salami Envelope / Box (سلامی)',
            'Zamzam Bottle Stickers / Labels',
        ],
    },
    {
        group: 'Venue / On-the-Day Stationery',
        emoji: '🏛️',
        description: 'Stationery displayed at the wedding venue on the event day',
        items: [
            'Welcome Signs / Boards',
            'Seating Charts',
            'Place Cards & Table Numbers',
            'Table Menu Cards',
            'Nikkah Ceremony Programmes',
        ],
    },
    {
        group: 'Gift Packaging & Wrapping',
        emoji: '🎀',
        description: 'Decorative boxes, baskets, and tags for presenting gifts and favours',
        items: [
            'Gift Boxes (Jahez / Trousseau)',
            'Shagun Baskets / Trays (شگن)',
            'Gift Tags & Favour Tags',
            'Chocolate / Sweet Wrappers',
            'Wax Seals & Stamps',
        ],
    },
    {
        group: 'Post-Wedding Stationery',
        emoji: '💌',
        description: 'Cards and stationery sent to guests after the wedding',
        items: [
            'Thank You Cards (شکریہ کارڈ)',
            'Wedding Announcement Cards',
        ],
    },
];

const PRINTING_TYPES = [
    'Digital Printing',
    'Offset Printing',
    'Laser Cutting',
    'Letterpress',
    'Foil Stamping',
    'Embossing / Debossing',
    'Screen Printing',
    'Hand-Block Printing',
    'UV Printing',
    'Calligraphy (Hand-written)',
];

const LANGUAGES = [
    'Urdu (اردو)',
    'English',
    'Bilingual (Urdu + English)',
    'Arabic',
    'Punjabi',
];

const StationeryProfileStep = ({ errors, setErrors }: StationeryProfileStepProps) => {
    const { formData, setFormData } = useFormContext();

    const shopType = formData.subBusinessType?.[0] ?? '';
    const products = formData.expertise ?? [];
    const printingTypes = formData.amenities ?? [];
    const languages = formData.serviceProvided ?? [];

    const setShopType = (value: string) => {
        setFormData((prev) => ({ ...prev, subBusinessType: [value] }));
        setErrors((prev) => ({ ...prev, subBusinessType: '' }));
    };

    const toggleProduct = (item: string) => {
        const next = products.includes(item)
            ? products.filter((p) => p !== item)
            : [...products, item];
        setFormData((prev) => ({ ...prev, expertise: next }));
        setErrors((prev) => ({ ...prev, expertise: '' }));
    };

    const togglePrinting = (item: string) => {
        const next = printingTypes.includes(item)
            ? printingTypes.filter((p) => p !== item)
            : [...printingTypes, item];
        setFormData((prev) => ({ ...prev, amenities: next }));
    };

    const toggleLanguage = (item: string) => {
        const next = languages.includes(item)
            ? languages.filter((l) => l !== item)
            : [...languages, item];
        setFormData((prev) => ({ ...prev, serviceProvided: next }));
    };

    const groupSelectedCount = (items: string[]) =>
        items.filter((item) => products.includes(item)).length;

    const selectAllInGroup = (items: string[]) => {
        const allSelected = items.every((item) => products.includes(item));
        const next = allSelected
            ? products.filter((p) => !items.includes(p))
            : [...new Set([...products, ...items])];
        setFormData((prev) => ({ ...prev, expertise: next }));
        setErrors((prev) => ({ ...prev, expertise: '' }));
    };

    return (
        <div className="space-y-6">

            {/* Shop Type */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Shop Type</h3>
                <div>
                    <Label className="text-sm font-medium text-neutral-700 block mb-1">
                        What type of stationery business do you operate? <span className="text-red-500">*</span>
                    </Label>
                    <Select value={shopType} onValueChange={setShopType}>
                        <SelectTrigger className={errors.subBusinessType ? 'border-red-500' : 'border-neutral-300'}>
                            <SelectValue placeholder="Select shop type" />
                        </SelectTrigger>
                        <SelectContent>
                            {SHOP_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.subBusinessType && (
                        <p className="text-red-500 text-sm mt-1">{errors.subBusinessType}</p>
                    )}
                </div>
            </div>

            {/* Products Offered — grouped by category */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-neutral-800">
                        Products You Offer <span className="text-red-500">*</span>
                    </h3>
                    {products.length > 0 && (
                        <span className="text-xs font-medium bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                            {products.length} selected
                        </span>
                    )}
                </div>
                <p className="text-xs text-neutral-500 mb-5">
                    Select all stationery products you make, grouped by category. Use <strong>Select All</strong> to quickly pick an entire group.
                </p>
                {errors.expertise && (
                    <p className="text-red-500 text-sm mb-4">{errors.expertise}</p>
                )}

                <div className="space-y-5">
                    {PRODUCT_GROUPS.map(({ group, emoji, description, items }) => {
                        const selectedInGroup = groupSelectedCount(items);
                        const allSelected = selectedInGroup === items.length;

                        return (
                            <div key={group} className="border border-neutral-200 rounded-xl overflow-hidden">
                                {/* Group Header */}
                                <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">{emoji}</span>
                                        <div>
                                            <p className="text-sm font-semibold text-neutral-800">{group}</p>
                                            <p className="text-xs text-neutral-500">{description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        {selectedInGroup > 0 && (
                                            <span className="text-xs font-medium text-primary">
                                                {selectedInGroup}/{items.length}
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => selectAllInGroup(items)}
                                            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                                                allSelected
                                                    ? 'bg-primary text-white border-primary hover:bg-primary/90'
                                                    : 'bg-white text-neutral-600 border-neutral-300 hover:border-primary hover:text-primary'
                                            }`}
                                        >
                                            {allSelected ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                </div>

                                {/* Group Items */}
                                <div className="px-4 py-3 flex flex-wrap gap-2">
                                    {items.map((item) => {
                                        const isSelected = products.includes(item);
                                        return (
                                            <Badge
                                                key={item}
                                                variant={isSelected ? 'default' : 'outline'}
                                                className={`cursor-pointer text-sm px-3 py-1.5 transition-colors ${
                                                    isSelected
                                                        ? 'bg-primary hover:bg-primary/90'
                                                        : 'hover:bg-muted'
                                                }`}
                                                onClick={() => toggleProduct(item)}
                                            >
                                                {item}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Printing Types */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-800 mb-1">Printing Techniques</h3>
                <p className="text-xs text-neutral-500 mb-4">Select all printing methods you offer.</p>
                <div className="flex flex-wrap gap-2">
                    {PRINTING_TYPES.map((item) => {
                        const isSelected = printingTypes.includes(item);
                        return (
                            <Badge
                                key={item}
                                variant={isSelected ? 'default' : 'outline'}
                                className={`cursor-pointer text-sm px-3 py-1.5 transition-colors ${
                                    isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'
                                }`}
                                onClick={() => togglePrinting(item)}
                            >
                                {item}
                            </Badge>
                        );
                    })}
                </div>
            </div>

            {/* Languages */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-800 mb-1">Languages for Printing</h3>
                <p className="text-xs text-neutral-500 mb-4">Select all languages you can print invitation text in.</p>
                <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((item) => {
                        const isSelected = languages.includes(item);
                        return (
                            <Badge
                                key={item}
                                variant={isSelected ? 'default' : 'outline'}
                                className={`cursor-pointer text-sm px-3 py-1.5 transition-colors ${
                                    isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'
                                }`}
                                onClick={() => toggleLanguage(item)}
                            >
                                {item}
                            </Badge>
                        );
                    })}
                </div>
            </div>

            {/* Minimum Order Qty */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">Minimum Order</h3>
                <div className="max-w-xs">
                    <Label htmlFor="ws-min-order" className="text-sm font-medium text-neutral-700">
                        Minimum Order Quantity (cards / pieces)
                    </Label>
                    <p className="text-xs text-neutral-500 mb-2">
                        What is the smallest order you accept? (e.g. 50 cards minimum)
                    </p>
                    <Input
                        id="ws-min-order"
                        type="number"
                        placeholder="e.g. 50"
                        min={1}
                        value={formData.minCapacity || ''}
                        onKeyDown={(e) => {
                            if (['.', '-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
                        }}
                        onChange={(e) => {
                            const num = Number(e.target.value);
                            setFormData((prev) => ({ ...prev, minCapacity: isNaN(num) ? 0 : num }));
                        }}
                        className="border-neutral-300"
                    />
                </div>
            </div>
        </div>
    );
};

export default StationeryProfileStep;

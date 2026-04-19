'use client';

import { useState, useEffect } from 'react';
import { BusinessesAPI, type ApiBusiness } from '@/lib/api/dashboard';
import { type VendorTypeConfig, type TypeSpecificFieldDef } from '@/lib/vendor-type-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface TypeSpecificTabProps {
    business: ApiBusiness;
    config: VendorTypeConfig;
    onSuccess: () => void;
}

function getFieldValue(business: ApiBusiness, key: string): unknown {
    return (business as unknown as Record<string, unknown>)[key];
}

const TypeSpecificTab = ({ business, config, onSuccess }: TypeSpecificTabProps) => {
    const [values, setValues] = useState<Record<string, unknown>>(() => {
        const initial: Record<string, unknown> = {};
        for (const field of config.typeSpecificFields) {
            initial[field.key] = getFieldValue(business, field.key) ?? (field.type === 'boolean' ? false : field.type === 'multi-select' ? [] : '');
        }
        return initial;
    });
    const [saving, setSaving] = useState(false);

    // Re-sync local state when business prop changes (e.g. after save + refetch)
    useEffect(() => {
        const synced: Record<string, unknown> = {};
        for (const field of config.typeSpecificFields) {
            synced[field.key] = getFieldValue(business, field.key) ?? (field.type === 'boolean' ? false : field.type === 'multi-select' ? [] : '');
        }
        setValues(synced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [business]);

    const setValue = (key: string, val: unknown) => {
        setValues((prev) => ({ ...prev, [key]: val }));
    };

    const toggleMultiSelect = (key: string, option: string) => {
        setValues((prev) => {
            const current = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];
            const next = current.includes(option)
                ? current.filter((v) => v !== option)
                : [...current, option];
            return { ...prev, [key]: next };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updateData: Record<string, unknown> = {};
            for (const field of config.typeSpecificFields) {
                const val = values[field.key];
                if (field.type === 'number') {
                    updateData[field.key] = val ? Number(val) : null;
                } else if (field.type === 'select') {
                    // Some fields (e.g. subBusinessType) are stored as ARRAY in PostgreSQL.
                    // If the original DB value was an array, re-wrap the selected string as an array.
                    const original = (business as unknown as Record<string, unknown>)[field.key];
                    updateData[field.key] = Array.isArray(original)
                        ? (val ? [String(val)] : [])
                        : val;
                } else {
                    updateData[field.key] = val;
                }
            }
            await BusinessesAPI.update(business.id, updateData as Partial<ApiBusiness>);
            toast.success('Settings updated');
            onSuccess();
        } catch {
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const renderField = (field: TypeSpecificFieldDef) => {
        const val = values[field.key];

        switch (field.type) {
            case 'boolean':
                return (
                    <div key={field.key} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">{field.label}</Label>
                            {field.description && (
                                <p className="text-xs text-muted-foreground">{field.description}</p>
                            )}
                        </div>
                        <Switch
                            checked={!!val}
                            onCheckedChange={(checked) => setValue(field.key, checked)}
                        />
                    </div>
                );

            case 'number':
                return (
                    <div key={field.key} className="space-y-1.5">
                        <Label className="text-sm font-medium">{field.label}</Label>
                        {field.description && (
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                        <Input
                            type="number"
                            value={val?.toString() || ''}
                            onChange={(e) => setValue(field.key, e.target.value)}
                            placeholder={field.placeholder}
                        />
                    </div>
                );

            case 'text':
                return (
                    <div key={field.key} className="space-y-1.5">
                        <Label className="text-sm font-medium">{field.label}</Label>
                        {field.description && (
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                        <Input
                            value={(val as string) || ''}
                            onChange={(e) => setValue(field.key, e.target.value)}
                            placeholder={field.placeholder}
                        />
                    </div>
                );

            case 'select': {
                // subBusinessType may be stored as a single-item array from registration form
                const selectVal = Array.isArray(val) ? ((val as string[])[0] ?? '') : ((val as string) || '');
                return (
                    <div key={field.key} className="space-y-1.5">
                        <Label className="text-sm font-medium">{field.label}</Label>
                        {field.description && (
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                        <Select
                            value={selectVal}
                            onValueChange={(v) => setValue(field.key, v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
            }

            case 'multi-select': {
                const selected = Array.isArray(val) ? (val as string[]) : [];

                // Grouped rendering for fields that define option groups (e.g. stationery products)
                if (field.groups && field.groups.length > 0) {
                    const selectAllInGroup = (items: string[]) => {
                        const allOn = items.every((item) => selected.includes(item));
                        const next = allOn
                            ? selected.filter((v) => !items.includes(v))
                            : [...new Set([...selected, ...items])];
                        setValue(field.key, next);
                    };
                    return (
                        <div key={field.key} className="space-y-2 md:col-span-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">{field.label}</Label>
                                {selected.length > 0 && (
                                    <span className="text-xs text-muted-foreground">{selected.length} selected</span>
                                )}
                            </div>
                            {field.description && (
                                <p className="text-xs text-muted-foreground">{field.description}</p>
                            )}
                            <div className="space-y-3">
                                {field.groups.map(({ group, emoji, description, items }) => {
                                    const selectedInGroup = items.filter((item) => selected.includes(item)).length;
                                    const allSelected = selectedInGroup === items.length;
                                    return (
                                        <div key={group} className="border border-neutral-200 rounded-xl overflow-hidden">
                                            <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50 border-b border-neutral-200">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">{emoji}</span>
                                                    <div>
                                                        <p className="text-xs font-semibold text-neutral-800">{group}</p>
                                                        <p className="text-xs text-neutral-500">{description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                    {selectedInGroup > 0 && (
                                                        <span className="text-xs text-primary font-medium">{selectedInGroup}/{items.length}</span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => selectAllInGroup(items)}
                                                        className={`text-xs px-2 py-1 rounded-full border font-medium transition-colors ${
                                                            allSelected
                                                                ? 'bg-primary text-white border-primary hover:bg-primary/90'
                                                                : 'bg-white text-neutral-600 border-neutral-300 hover:border-primary hover:text-primary'
                                                        }`}
                                                    >
                                                        {allSelected ? 'Deselect All' : 'Select All'}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="px-4 py-3 flex flex-wrap gap-2">
                                                {items.map((opt) => {
                                                    const isSelected = selected.includes(opt);
                                                    return (
                                                        <Badge
                                                            key={opt}
                                                            variant={isSelected ? 'default' : 'outline'}
                                                            className={`cursor-pointer text-xs transition-colors ${
                                                                isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'
                                                            }`}
                                                            onClick={() => toggleMultiSelect(field.key, opt)}
                                                        >
                                                            {opt}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                }

                // Default flat rendering for other multi-select fields
                return (
                    <div key={field.key} className="space-y-1.5 md:col-span-2">
                        <Label className="text-sm font-medium">{field.label}</Label>
                        {field.description && (
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {field.options?.map((opt) => {
                                const isSelected = selected.includes(opt);
                                return (
                                    <Badge
                                        key={opt}
                                        variant={isSelected ? 'default' : 'outline'}
                                        className={`cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'bg-primary hover:bg-primary/90'
                                                : 'hover:bg-muted'
                                        }`}
                                        onClick={() => toggleMultiSelect(field.key, opt)}
                                    >
                                        {opt}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                );
            }

            default:
                return null;
        }
    };

    if (config.typeSpecificFields.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-8 text-center">
                No additional settings for this vendor type.
            </p>
        );
    }

    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h3 className="text-lg font-semibold">{config.displayName} Details</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Configure settings specific to your {config.displayName.toLowerCase()} business.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {config.typeSpecificFields.map(renderField)}
            </div>

            <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
    );
};

export default TypeSpecificTab;

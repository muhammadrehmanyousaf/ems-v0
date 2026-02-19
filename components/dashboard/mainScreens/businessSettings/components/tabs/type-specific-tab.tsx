'use client';

import { useState } from 'react';
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
    return (business as Record<string, unknown>)[key];
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

            case 'select':
                return (
                    <div key={field.key} className="space-y-1.5">
                        <Label className="text-sm font-medium">{field.label}</Label>
                        {field.description && (
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                        <Select
                            value={(val as string) || ''}
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

            case 'multi-select': {
                const selected = Array.isArray(val) ? (val as string[]) : [];
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

import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check, X } from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'

interface MultipleSelectComponent {
    label: string,
    data: { value: string, label: string }[],
    handleSelectOption: (id: string) => void,
    selectedOption: string[];
    placeholder: string;
};

const MultipleSelect: React.FC<MultipleSelectComponent> = ({
    label,
    data,
    handleSelectOption,
    selectedOption,
    placeholder,
}) => {
    if (!data || data.length === 0) return null;

    const summary =
        selectedOption.length === 0
            ? placeholder
            : selectedOption.length === 1
            ? selectedOption[0]
            : `${selectedOption.length} selected`;

    return (
        <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">
                {label}
            </p>
            <Select>
                <SelectTrigger
                    className={cn(
                        "w-full h-11 border-bridal-beige bg-bridal-cream",
                        "data-[placeholder]:text-bridal-text-label/80 hover:border-bridal-gold/60 transition-colors"
                    )}
                >
                    <SelectValue placeholder={placeholder}>
                        <span className={selectedOption.length === 0 ? "text-bridal-text-label/80" : "text-bridal-charcoal"}>
                            {summary}
                        </span>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full max-h-72 overflow-y-auto bg-bridal-cream border-bridal-beige">
                    <div className="p-1.5">
                        {data.map((item) => {
                            const isSelected = selectedOption.includes(item.value);
                            return (
                                <button
                                    type="button"
                                    key={item.value}
                                    onClick={() => handleSelectOption(item.value)}
                                    className={cn(
                                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-left transition-colors text-sm font-bridal",
                                        isSelected
                                            ? "bg-bridal-blush/60 text-bridal-charcoal"
                                            : "text-bridal-text hover:bg-bridal-blush/40"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-flex w-4 h-4 rounded-sm items-center justify-center flex-shrink-0 transition-colors",
                                            isSelected
                                                ? "bg-bridal-gold"
                                                : "border border-bridal-beige bg-bridal-ivory"
                                        )}
                                    >
                                        {isSelected && (
                                            <Check className="w-3 h-3 text-bridal-charcoal" strokeWidth={2.5} />
                                        )}
                                    </span>
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </SelectContent>
            </Select>

            {selectedOption.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    {selectedOption.map((item, i) => {
                        const opt = data.find((d) => d.value === item);
                        const display = opt?.label ?? item;
                        return (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-bridal-blush border border-bridal-gold/55 text-bridal-charcoal text-[12px] font-bridal font-medium shadow-[0_4px_12px_-8px_rgba(176,125,84,0.4)]"
                            >
                                <span>{display}</span>
                                <button
                                    type="button"
                                    onClick={() => handleSelectOption(item)}
                                    className="inline-flex w-5 h-5 items-center justify-center rounded-full text-bridal-mauve hover:bg-bridal-gold/20 hover:text-bridal-charcoal transition-colors"
                                    aria-label={`Remove ${display}`}
                                >
                                    <X className="w-3 h-3" strokeWidth={2.5} />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MultipleSelect;

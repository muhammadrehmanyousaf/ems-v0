import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultipleRadioComponent {
  label: string;
  data: { value: string; label?: string; icon?: any }[];
  handleSelect: (type: string, index: number) => void;
  selectedIndexes: number[];
}

const MultipleRadio: React.FC<MultipleRadioComponent> = ({
  label,
  data,
  handleSelect,
  selectedIndexes,
}) => {
  if (!data || data.length === 0) return null;

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">
        {label}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        {data.map((type, index) => {
          const isSelected = selectedIndexes.includes(index);
          // Heuristic: if the data row provides BOTH a `label` and an `icon`,
          // the icon is a leftover decorative bullet (e.g. <FaCircle />) the
          // original code used as a radio dot. We now render our own bridal
          // radio indicator, so the bullet is pure noise and we hide it.
          // When only `value` is provided (no `label`), the icon is treated
          // as meaningful (e.g. Male / Female / Transgender silhouettes).
          const isMeaningfulIcon = !!type.icon && !type.label;
          return (
            <button
              type="button"
              key={index}
              onClick={() => handleSelect(type.value, index)}
              aria-pressed={isSelected}
              className={cn(
                "group relative inline-flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-md border-2 transition-all duration-200 font-bridal text-[12px] tracking-[0.08em] uppercase select-none",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold/45 focus-visible:ring-offset-2 focus-visible:ring-offset-bridal-cream",
                isSelected
                  ? // SELECTED: gold border, blush background, charcoal text,
                    // soft gold drop shadow, slight upward shift.
                    "border-bridal-gold bg-bridal-blush text-bridal-charcoal shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] -translate-y-0.5"
                  : // UNSELECTED: beige border, cream surface, soft text,
                    // hover gives a gold-tinted preview.
                    "border-bridal-beige bg-bridal-cream text-bridal-text-soft hover:border-bridal-gold/55 hover:bg-bridal-blush/40 hover:text-bridal-charcoal"
              )}
            >
              {/* Selection indicator — solid gold when selected, beige ring
                  when not. This is the primary signal for "is this picked". */}
              <span
                className={cn(
                  "inline-flex w-5 h-5 rounded-full items-center justify-center flex-shrink-0 transition-all duration-200",
                  isSelected
                    ? "bg-bridal-gold ring-2 ring-bridal-gold/30 ring-offset-1 ring-offset-bridal-blush"
                    : "border-2 border-bridal-beige bg-bridal-ivory group-hover:border-bridal-gold/60"
                )}
              >
                {isSelected && (
                  <Check
                    className="w-3 h-3 text-bridal-charcoal"
                    strokeWidth={3}
                  />
                )}
              </span>

              {/* Optional meaningful icon (gender silhouettes etc.) — tinted
                  gold when selected, mauve when not. Decorative bullets are
                  filtered out. */}
              {isMeaningfulIcon && (
                <span
                  className={cn(
                    "inline-flex w-4 h-4 items-center justify-center text-[14px] leading-none transition-colors flex-shrink-0",
                    isSelected ? "text-bridal-gold-dark" : "text-bridal-text-soft"
                  )}
                >
                  {type.icon}
                </span>
              )}

              <span className="font-medium">{type.label || type.value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MultipleRadio;

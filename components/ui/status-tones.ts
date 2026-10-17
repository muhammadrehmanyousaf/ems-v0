/**
 * The semantic status set for customer and public screens (WP30).
 *
 * Meaning is fixed, colour is the brand's: success = sage, warning (pending, needs
 * attention) = gold, danger (cancelled, rejected, failed) = coral-dark, info =
 * mauve, neutral = warm stone. There is no blue and no violet in this product.
 * Every tone is defined ONCE in tailwind.config.ts (colors.status.<tone>.{DEFAULT,
 * soft,line,solid}); this file only spells the class strings out in full so
 * Tailwind generates them. scripts/brand-colour-check.mts measures the contrast of
 * every pair (text on soft >= 4.5:1) and fails if a tone goes missing.
 *
 *   chip  : a pill / badge (tinted fill, hairline border, readable text)
 *   text  : text on a light surface
 *   icon  : an icon or tick glyph (>= 3:1 as a graphic)
 *   solid : a filled dot, bar or button with a WHITE label
 *   panel : a notice box (tint + border + text)
 *
 * The vendor console has its own palette (champagne shell) and does not use this.
 */

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export const STATUS_CHIP: Record<StatusTone, string> = {
  success: "border-status-success-line bg-status-success-soft text-status-success",
  warning: "border-status-warning-line bg-status-warning-soft text-status-warning",
  danger: "border-status-danger-line bg-status-danger-soft text-status-danger",
  info: "border-status-info-line bg-status-info-soft text-status-info",
  neutral: "border-status-neutral-line bg-status-neutral-soft text-status-neutral",
};

export const STATUS_TEXT: Record<StatusTone, string> = {
  success: "text-status-success",
  warning: "text-status-warning",
  danger: "text-status-danger",
  info: "text-status-info",
  neutral: "text-status-neutral",
};

export const STATUS_ICON: Record<StatusTone, string> = {
  success: "text-status-success-solid",
  warning: "text-status-warning-solid",
  danger: "text-status-danger-solid",
  info: "text-status-info-solid",
  neutral: "text-status-neutral-solid",
};

export const STATUS_SOLID: Record<StatusTone, string> = {
  success: "bg-status-success-solid text-white",
  warning: "bg-status-warning-solid text-white",
  danger: "bg-status-danger-solid text-white",
  info: "bg-status-info-solid text-white",
  neutral: "bg-status-neutral-solid text-white",
};

export const STATUS_SOFT_BG: Record<StatusTone, string> = {
  success: "bg-status-success-soft",
  warning: "bg-status-warning-soft",
  danger: "bg-status-danger-soft",
  info: "bg-status-info-soft",
  neutral: "bg-status-neutral-soft",
};

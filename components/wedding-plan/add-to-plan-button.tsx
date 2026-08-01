"use client";

/**
 * Shaadi Plan — "Add to my wedding plan" trigger.
 *
 * Self-contained entry point dropped onto the vendor detail page and
 * search-result cards (spec §9). Sits alongside the existing Book /
 * Request-quote CTAs rather than replacing either.
 *
 * Two visual variants so it blends into either surface:
 *   - `detail` — a full-width bridal outline button for the action row.
 *   - `card`   — a compact pill for the corner of a listing card.
 *
 * On a card it stops propagation + carries `data-no-navigate` so a click
 * never triggers the card's navigate-to-vendor handler.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Loader2 } from "lucide-react";
import { AddToPlanDialog } from "@/components/wedding-plan/add-to-plan-dialog";

interface AddToPlanButtonProps {
  businessId: number | string;
  businessName: string;
  vendorType?: string;
  variant?: "detail" | "card";
  className?: string;
  /** Optional label override (defaults per variant). */
  label?: string;
}

function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!(localStorage.getItem("user_id") && localStorage.getItem("auth_token"));
}

export function AddToPlanButton({
  businessId,
  businessName,
  vendorType,
  variant = "detail",
  className = "",
  label,
}: AddToPlanButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const id = Number(businessId);

  if (!Number.isFinite(id)) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn()) {
      router.push("/login?redirect=/user/plan");
      return;
    }
    setOpen(true);
  };

  const text = label ?? (variant === "card" ? "Add to plan" : "Add to my wedding plan");

  return (
    <>
      {variant === "card" ? (
        <button
          type="button"
          data-no-navigate
          onClick={handleClick}
          title="Add to my wedding plan"
          className={`inline-flex items-center gap-1.5 rounded-full border border-bridal-gold/55 bg-bridal-cream/95 px-3 py-1 font-bridal text-[10px] uppercase tracking-[0.18em] font-medium text-bridal-gold-dark hover:bg-bridal-gold hover:text-bridal-charcoal transition-colors ${className}`}
        >
          <HeartHandshake className="h-3.5 w-3.5" />
          {text}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center justify-center gap-2 h-12 rounded-[4px] border border-bridal-gold/55 bg-bridal-cream hover:bg-bridal-gold hover:text-bridal-charcoal text-bridal-gold-dark font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-colors ${className}`}
        >
          <HeartHandshake className="w-4 h-4" />
          {text}
        </button>
      )}

      {open && (
        <AddToPlanDialog
          businessId={id}
          businessName={businessName}
          vendorType={vendorType}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}

export default AddToPlanButton;

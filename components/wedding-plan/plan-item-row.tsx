"use client";

/**
 * Shaadi Plan — one vendor line inside a function.
 *
 * Renders a single PlanItem (event × business) with its status chip, an
 * inline agreed-price editor, "Send inquiry" (unpriced path → Lead) and
 * remove. The line persists across states (shortlisted → inquiry_sent →
 * quoted → booked, spec §7); booked lines are locked from the plan side
 * (unbook = cancel the Booking from its own page).
 */

import * as React from "react";
import Link from "next/link";
import {
  Loader2,
  Send,
  Trash2,
  Check,
  X,
  Pencil,
  Building2,
  ExternalLink,
  Package as PackageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  WeddingPlansAPI,
  type PlanItem,
} from "@/lib/api/weddingPlans";
import { VendorAPI } from "@/lib/api/vendors";
import { statusMeta, fmtPKR, toNum } from "@/lib/wedding-plan-events";

interface PkgOption {
  id: number;
  name: string;
  price: number;
}

interface PlanItemRowProps {
  planId: number;
  eventId: number;
  item: PlanItem;
  onChanged?: () => void;
}

export function PlanItemRow({ planId, eventId, item, onChanged }: PlanItemRowProps) {
  const [editing, setEditing] = React.useState(false);
  const [amount, setAmount] = React.useState(
    item.agreedAmount != null ? String(toNum(item.agreedAmount)) : "",
  );
  const [saving, setSaving] = React.useState(false);
  const [inquiring, setInquiring] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);

  // Package selection — for a vendor whose price lives in packages (a
  // package-only vendor has NULL minimumPrice, so the cart can only price it
  // once the couple picks a package). Loaded lazily from the vendor's catalogue.
  const [pkgs, setPkgs] = React.useState<PkgOption[] | null>(null);
  const [loadingPkgs, setLoadingPkgs] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [choosingPkg, setChoosingPkg] = React.useState(false);

  React.useEffect(() => {
    setAmount(item.agreedAmount != null ? String(toNum(item.agreedAmount)) : "");
  }, [item.agreedAmount]);

  const loadPkgs = React.useCallback(async () => {
    if (pkgs != null || loadingPkgs) return pkgs;
    setLoadingPkgs(true);
    try {
      const biz = await VendorAPI.getBusinessById(item.businessId);
      const list: PkgOption[] = Array.isArray(biz?.packages)
        ? biz!.packages
            .map((p) => ({ id: Number((p as { id?: unknown }).id), name: String((p as { name?: unknown }).name ?? "Package"), price: Number((p as { price?: unknown }).price) || 0 }))
            .filter((p) => Number.isFinite(p.id) && p.id > 0)
        : [];
      setPkgs(list);
      return list;
    } catch {
      setPkgs([]);
      return [];
    } finally {
      setLoadingPkgs(false);
    }
  }, [item.businessId, pkgs, loadingPkgs]);

  // Resolve the selected package's name/price for display when one is set.
  React.useEffect(() => {
    if (item.packageId != null && pkgs == null && !loadingPkgs) void loadPkgs();
  }, [item.packageId, pkgs, loadingPkgs, loadPkgs]);

  const selectedPkg = React.useMemo(
    () => (item.packageId != null && pkgs ? pkgs.find((p) => p.id === Number(item.packageId)) ?? null : null),
    [item.packageId, pkgs],
  );

  const choosePackage = async (packageId: number | null) => {
    setChoosingPkg(true);
    try {
      await WeddingPlansAPI.updateItem(planId, eventId, item.id, { packageId });
      setPickerOpen(false);
      onChanged?.();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't set the package";
      toast({ title: "Couldn't set package", description: msg, variant: "destructive" });
    } finally {
      setChoosingPkg(false);
    }
  };

  const openPicker = async () => {
    setPickerOpen(true);
    await loadPkgs();
  };

  const meta = statusMeta(item.status);
  const booked = item.status === "booked";
  const businessName = item.business?.name || `Vendor #${item.businessId}`;

  const saveAmount = async () => {
    const n = amount.trim() === "" ? null : Number(amount);
    if (n != null && (!Number.isFinite(n) || n < 0)) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await WeddingPlansAPI.updateItem(planId, eventId, item.id, { agreedAmount: n });
      setEditing(false);
      onChanged?.();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't update the price";
      toast({ title: "Couldn't save", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sendInquiry = async () => {
    setInquiring(true);
    try {
      await WeddingPlansAPI.inquireItem(planId, eventId, item.id);
      toast({
        title: "Inquiry sent",
        description: `${businessName} will see your request and can send a quote.`,
      });
      onChanged?.();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't send the inquiry";
      toast({ title: "Couldn't send", description: msg, variant: "destructive" });
    } finally {
      setInquiring(false);
    }
  };

  const remove = async () => {
    if (booked) {
      toast({
        title: "Cancel the booking first",
        description:
          "This vendor is already booked. Cancel that booking from its page, then you can remove the line.",
        variant: "destructive",
      });
      return;
    }
    if (!confirm(`Remove ${businessName} from this function?`)) return;
    setRemoving(true);
    try {
      await WeddingPlansAPI.removeItem(planId, eventId, item.id);
      toast({ title: "Removed from plan" });
      onChanged?.();
    } catch (e) {
      const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
      const msg =
        data?.message === "ITEM_BOOKED"
          ? "This vendor is booked — cancel the booking first."
          : data?.message || (e as Error)?.message || "Couldn't remove the line";
      toast({ title: "Couldn't remove", description: msg, variant: "destructive" });
    } finally {
      setRemoving(false);
    }
  };

  const canInquire =
    item.status === "shortlisted" || item.status === "declined";

  return (
    <div className="rounded-md border border-bridal-beige bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-bridal-charcoal truncate inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-bridal-gold-dark shrink-0" />
              {businessName}
            </span>
            <Badge variant="outline" className={`text-[10px] ${meta.tone}`}>
              {meta.label}
            </Badge>
            {item.vendorType && (
              <span className="text-[11px] text-bridal-text-soft">{item.vendorType}</span>
            )}
          </div>

          {/* Price row */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {editing ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-bridal-text-soft">Rs.</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  autoFocus
                  className="h-8 w-32 text-sm"
                  placeholder="Agreed amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={saving}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveAmount();
                    if (e.key === "Escape") setEditing(false);
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-[#3F6B43]"
                  onClick={saveAmount}
                  disabled={saving}
                  aria-label="Save amount"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-bridal-text-soft"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  aria-label="Cancel edit"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => !booked && setEditing(true)}
                disabled={booked}
                className="inline-flex items-center gap-1.5 text-sm text-bridal-charcoal disabled:cursor-default group"
              >
                <span className="font-medium tabular-nums">
                  {item.agreedAmount != null ? fmtPKR(item.agreedAmount) : "Set price"}
                </span>
                {!booked && (
                  <Pencil className="h-3 w-3 text-bridal-text-soft group-hover:text-bridal-gold-dark" />
                )}
              </button>
            )}
            {item.quotedAmount != null && toNum(item.quotedAmount) > 0 && (
              <span className="text-[11px] text-bridal-text-soft">
                (quoted {fmtPKR(item.quotedAmount)})
              </span>
            )}
          </div>

          {/* Package selection — for a vendor whose price lives in packages (a
              package-only vendor can't be cart-priced by an agreed amount alone).
              The couple picks WHICH package; the server prices it at checkout. */}
          {!booked && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {selectedPkg ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-bridal-charcoal">
                  <PackageIcon className="h-3.5 w-3.5 text-bridal-gold-dark" />
                  <span className="font-medium">{selectedPkg.name}</span>
                  <span className="tabular-nums text-bridal-gold-dark">{fmtPKR(selectedPkg.price)}</span>
                </span>
              ) : item.packageId != null ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-bridal-text-soft">
                  <PackageIcon className="h-3.5 w-3.5" /> Package selected
                </span>
              ) : null}

              {pickerOpen ? (
                <span className="inline-flex items-center gap-1.5">
                  <select
                    autoFocus
                    aria-label="Choose a package"
                    className="h-8 rounded-md border border-bridal-beige bg-white px-2 text-xs text-bridal-charcoal max-w-[220px]"
                    defaultValue={item.packageId != null ? String(item.packageId) : ""}
                    disabled={choosingPkg || loadingPkgs}
                    onChange={(e) =>
                      choosePackage(e.target.value === "" ? null : Number(e.target.value))
                    }
                  >
                    <option value="">
                      {loadingPkgs ? "Loading packages…" : "No package"}
                    </option>
                    {(pkgs ?? []).map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name} — {fmtPKR(p.price)}
                      </option>
                    ))}
                  </select>
                  {(loadingPkgs || choosingPkg) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-bridal-text-soft" />
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-bridal-text-soft"
                    onClick={() => setPickerOpen(false)}
                    aria-label="Close package picker"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={openPicker}
                  className="inline-flex items-center gap-1 text-[11px] text-bridal-gold-dark hover:text-bridal-charcoal"
                >
                  <PackageIcon className="h-3 w-3" />
                  {item.packageId != null ? "Change package" : "Choose a package"}
                </button>
              )}
            </div>
          )}

          {booked && item.bookingId && (
            <Link
              href={`/user/bookings/${item.bookingId}`}
              className="inline-flex items-center gap-1 text-[11px] text-bridal-gold-dark hover:text-bridal-charcoal mt-1.5"
            >
              <ExternalLink className="h-3 w-3" />
              View booking #{item.bookingId}
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {canInquire && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={sendInquiry}
              disabled={inquiring}
            >
              {inquiring ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Inquire
            </Button>
          )}
          {!booked && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-neutral-400 hover:text-bridal-coral"
              onClick={remove}
              disabled={removing}
              aria-label="Remove line"
            >
              {removing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlanItemRow;

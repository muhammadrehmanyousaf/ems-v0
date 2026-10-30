"use client";

import React from "react";
import { Trash, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useFormContext, type VenueMenu } from "@/lib/context/form-context";

/**
 * Venue registration, step "Menus" (after Packages).
 *
 * Packages are what the HALL offers (decoration, sound, seating...). Menus are the FOOD: a name, a price PER HEAD, an optional
 * minimum number of guests and the dishes. They are stored as the same Menu rows the dashboard's "Packages & menus" screen
 * creates, so the booking flow prices them (price x guests) with no special case.
 *
 * A hall that serves no food says so explicitly ("hall only"): that is a valid answer, not a missing one.
 */

interface MenusStepProps {
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  errors: { [key: string]: string };
}

const emptyMenu = (): VenueMenu => ({ title: "", price: "", minGuaranteeCount: "", items: [""] });

const MenusStep = ({ setErrors, errors }: MenusStepProps) => {
  const { formData, setFormData } = useFormContext();
  // Drafts saved before this step existed have no `menus`; treat that as one empty row.
  const menus: VenueMenu[] = Array.isArray(formData.menus) && formData.menus.length > 0 ? formData.menus : [emptyMenu()];
  const noMenus = formData.noMenus === true;

  const commit = (next: VenueMenu[]) => setFormData({ ...formData, menus: next });
  const clearError = (key: string) => setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));

  const setField = (i: number, field: keyof VenueMenu, value: string) => {
    const next = menus.map((m, idx) => (idx === i ? { ...m, [field]: value } : m));
    commit(next);
    clearError(`menus[${i}].${field === "title" ? "title" : field === "price" ? "price" : "minGuaranteeCount"}`);
    clearError("menus");
  };
  const setItem = (i: number, j: number, value: string) => {
    const next = menus.map((m, idx) => (idx === i ? { ...m, items: m.items.map((d, k) => (k === j ? value : d)) } : m));
    commit(next);
    clearError(`menus[${i}].items`);
    clearError("menus");
  };
  const addItem = (i: number) => commit(menus.map((m, idx) => (idx === i ? { ...m, items: [...m.items, ""] } : m)));
  const removeItem = (i: number, j: number) =>
    commit(menus.map((m, idx) => (idx === i ? { ...m, items: m.items.length > 1 ? m.items.filter((_, k) => k !== j) : [""] } : m)));
  const addMenu = () => commit([...menus, emptyMenu()]);
  const removeMenu = (i: number) => commit(menus.length > 1 ? menus.filter((_, idx) => idx !== i) : [emptyMenu()]);

  const toggleNoMenus = (checked: boolean) => {
    // Keep what was typed: "hall only" only sets the flag (validation, preview and submit ignore the menus while it is on), so
    // un-ticking it brings the vendor's menus straight back instead of an empty form.
    setFormData({ ...formData, noMenus: checked, menus });
    setErrors((prev) => {
      const cleaned: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) cleaned[k] = k.startsWith("menus") ? "" : v;
      return cleaned;
    });
  };

  const err = (key: string) => errors[key];
  const labelCls = "text-[11px] uppercase tracking-[0.18em] font-medium text-bridal-text-label";

  return (
    <div className="space-y-5" data-testid="venue-menus-step">
      <div className="bridal-card p-4 sm:p-5 flex items-start gap-3">
        <Checkbox
          id="no-menus"
          checked={noMenus}
          onCheckedChange={(v) => toggleNoMenus(v === true)}
          className="mt-0.5"
          data-testid="no-menus-checkbox"
        />
        <div>
          <Label htmlFor="no-menus" className="text-sm font-medium text-bridal-charcoal cursor-pointer">
            My venue does not serve food (hall only)
          </Label>
          <p className="text-[12px] text-bridal-text-soft mt-0.5">
            Tick this if customers bring their own caterer. You can add menus later from your dashboard.
          </p>
        </div>
      </div>

      {err("menus") && <p className="text-bridal-coral-dark text-[13px]" role="alert">{err("menus")}</p>}

      {!noMenus &&
        menus.map((menu, i) => (
          <div key={i} className="bridal-card p-5 sm:p-6 relative" data-testid="venue-menu-card">
            <div className="flex justify-between items-start mb-5 pb-4 border-b border-bridal-beige/70">
              <div className="flex items-center gap-3">
                <span className="inline-flex w-9 h-9 rounded-full bg-bridal-gold/15 border border-bridal-gold/40 items-center justify-center font-display italic text-bridal-gold">
                  {i + 1}
                </span>
                <div>
                  <p className={labelCls}>Menu</p>
                  <h3 className="font-display italic text-[18px] sm:text-[20px] text-bridal-charcoal leading-tight">
                    {menu.title?.trim() || "Untitled menu"}
                  </h3>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeMenu(i)}
                className={`text-bridal-coral-dark hover:bg-bridal-coral/10 hover:text-bridal-coral-dark ${menus.length > 1 ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                disabled={menus.length <= 1}
                aria-label="Remove menu"
              >
                <Trash className="size-4" />
              </Button>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <Label className={labelCls}>Menu name</Label>
                <Input
                  placeholder="e.g. Deluxe Wedding Menu"
                  value={menu.title}
                  maxLength={120}
                  onChange={(e) => setField(i, "title", e.target.value)}
                  className={`h-11 ${err(`menus[${i}].title`) ? "border-bridal-coral" : "border-bridal-beige focus:border-bridal-gold"}`}
                  name={`menus[${i}].title`}
                />
                {err(`menus[${i}].title`) && <p className="text-bridal-coral-dark text-[12px]">{err(`menus[${i}].title`)}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Price per head (Rs.)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="e.g. 2500"
                  value={menu.price}
                  onChange={(e) => setField(i, "price", e.target.value)}
                  className={`h-11 ${err(`menus[${i}].price`) ? "border-bridal-coral" : "border-bridal-beige focus:border-bridal-gold"}`}
                  name={`menus[${i}].price`}
                />
                {err(`menus[${i}].price`) && <p className="text-bridal-coral-dark text-[12px]">{err(`menus[${i}].price`)}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Minimum guests (optional)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="e.g. 100"
                  value={menu.minGuaranteeCount ?? ""}
                  onChange={(e) => setField(i, "minGuaranteeCount", e.target.value)}
                  className={`h-11 ${err(`menus[${i}].minGuaranteeCount`) ? "border-bridal-coral" : "border-bridal-beige focus:border-bridal-gold"}`}
                  name={`menus[${i}].minGuaranteeCount`}
                />
                {err(`menus[${i}].minGuaranteeCount`) && <p className="text-bridal-coral-dark text-[12px]">{err(`menus[${i}].minGuaranteeCount`)}</p>}
              </div>
            </section>

            <section className="mt-5 space-y-2">
              <Label className={labelCls}>Dishes</Label>
              {menu.items.map((dish, j) => (
                <div key={j} className="flex items-center gap-2">
                  <Input
                    placeholder={j === 0 ? "e.g. Chicken karahi" : "Another dish"}
                    value={dish}
                    maxLength={120}
                    onChange={(e) => setItem(i, j, e.target.value)}
                    className="h-10 border-bridal-beige focus:border-bridal-gold"
                    aria-label={`Menu ${i + 1} dish ${j + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(i, j)}
                    className="text-bridal-coral-dark hover:bg-bridal-coral/10"
                    aria-label="Remove dish"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              {err(`menus[${i}].items`) && <p className="text-bridal-coral-dark text-[12px]">{err(`menus[${i}].items`)}</p>}
              <Button type="button" variant="outline" size="sm" onClick={() => addItem(i)} className="border-bridal-beige">
                <Plus className="size-4 mr-1" /> Add dish
              </Button>
            </section>
          </div>
        ))}

      {!noMenus && menus.length < 10 && (
        <Button type="button" variant="outline" onClick={addMenu} className="border-bridal-gold/50 text-bridal-gold-dark" data-testid="add-menu">
          <Plus className="size-4 mr-1" /> Add another menu
        </Button>
      )}
    </div>
  );
};

export default MenusStep;

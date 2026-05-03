import React from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Trash, Plus, Trash2 } from "lucide-react";
import { useFormContext } from "@/lib/context/form-context";

// Feature categories per business type
const BUSINESS_CATEGORIES: Record<string, { id: string; label: string }[]> = {
  "Photographer": [
    { id: "deliverables", label: "Deliverables" },
    { id: "photography", label: "Photography" },
    { id: "team", label: "Team" },
    { id: "videography", label: "Videography" },
  ],
  "Makeup artist": [
    { id: "services", label: "Services" },
    { id: "makeupBy", label: "Makeup By" },
    { id: "eyelashes", label: "Eyelashes" },
    { id: "hair", label: "Hair" },
    { id: "nails", label: "Nails" },
  ],
  "Decorator": [
    { id: "otherDetails", label: "Other Details" },
    { id: "stage", label: "Stage" },
    { id: "entrance", label: "Entrance" },
    { id: "seating", label: "Seating" },
    { id: "aisle", label: "Aisle / Walkway" },
  ],
  "Henna artist": [
    { id: "hands", label: "Hands" },
    { id: "feet", label: "Feet" },
  ],
  "Car rental": [
    { id: "withDecoration", label: "With Decoration" },
    { id: "withoutDecoration", label: "Without Decoration" },
  ],
  "Wedding venue": [
    { id: "hall", label: "Hall / Venue" },
    { id: "decoration", label: "Decoration" },
    { id: "seatingArrangement", label: "Seating Arrangement" },
    { id: "soundLighting", label: "Sound & Lighting" },
    { id: "catering", label: "Catering" },
    { id: "additionalServices", label: "Additional Services" },
  ],
  "Catering": [
    { id: "starter", label: "Starter" },
    { id: "mainCourse", label: "Main Course" },
    { id: "desserts", label: "Desserts" },
    { id: "drinks", label: "Drinks" },
  ],
  "Bridal wearing": [],
  "Wedding Invitations and Stationery": [],
};

const MENU_TYPES = ["Catering"];

interface PackagesProps {
    setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
    errors: { [key: string]: string };
}

const Packages = ({ setErrors, errors }: PackagesProps) => {
    const { setFormData, formData, businessType } = useFormContext();

    const categories = BUSINESS_CATEGORIES[businessType as string] ?? [];
    const isMenuType = MENU_TYPES.includes(businessType as string);
    const itemLabel = isMenuType ? "Menu" : "Package";

    const handlePackageChange = (index: number, field: string, value: any) => {
        const newPackages = [...formData.packages];
        newPackages[index] = { ...newPackages[index], [field]: value };
        setFormData({ ...formData, packages: newPackages });
        setErrors((prevErrors) => ({
            ...prevErrors,
            packages: "",
            [`packages[${index}].${field}`]: ""
        }));
    };

    const handleFeatureToggle = (pkgIndex: number, categoryId: string, checked: boolean) => {
        const newPackages = [...formData.packages];
        const pkgFeatures = { ...(newPackages[pkgIndex].features || {}) };

        if (checked) {
            pkgFeatures[categoryId] = [""];
        } else {
            pkgFeatures[categoryId] = [];
            setErrors((prevErrors) => ({
                ...prevErrors,
                [`packages[${pkgIndex}].features.${categoryId}`]: ""
            }));
        }
        newPackages[pkgIndex].features = pkgFeatures;
        setFormData({ ...formData, packages: newPackages });
    };

    const handleFeatureItemChange = (pkgIndex: number, categoryId: string, itemIndex: number, value: string) => {
        const newPackages = [...formData.packages];
        const pkgFeatures = { ...(newPackages[pkgIndex].features || {}) };
        pkgFeatures[categoryId] = [...(pkgFeatures[categoryId] || [])];
        pkgFeatures[categoryId][itemIndex] = value;
        newPackages[pkgIndex].features = pkgFeatures;
        setFormData({ ...formData, packages: newPackages });
        // Only clear the error once all items in this feature are filled
        const allFilled = pkgFeatures[categoryId].every((item: string) => item.trim() !== "");
        if (allFilled) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [`packages[${pkgIndex}].features.${categoryId}`]: ""
            }));
        }
    };

    const addFeatureItem = (pkgIndex: number, categoryId: string) => {
        const newPackages = [...formData.packages];
        const pkgFeatures = { ...(newPackages[pkgIndex].features || {}) };
        pkgFeatures[categoryId] = [...(pkgFeatures[categoryId] || []), ""];
        newPackages[pkgIndex].features = pkgFeatures;
        setFormData({ ...formData, packages: newPackages });
    };

    const removeFeatureItem = (pkgIndex: number, categoryId: string, itemIndex: number) => {
        const newPackages = [...formData.packages];
        const pkgFeatures = { ...(newPackages[pkgIndex].features || {}) };
        pkgFeatures[categoryId] = pkgFeatures[categoryId].filter((_, i) => i !== itemIndex);
        newPackages[pkgIndex].features = pkgFeatures;
        setFormData({ ...formData, packages: newPackages });
    };

    const addPackage = () => {
        setFormData({
            ...formData,
            packages: [
                ...formData.packages,
                { name: "", price: 0, features: {} },
            ],
        });
    };

    const removePackage = (pkgIndex: number) => {
        const newPackages = [...formData.packages];
        newPackages.splice(pkgIndex, 1);
        setFormData({ ...formData, packages: newPackages });
    };

    return (
        <div className="space-y-5">
            {formData.packages.map((pkg, index) => (
                <div key={index} className="bridal-card p-5 sm:p-6 relative">
                    <div className="flex justify-between items-start mb-5 pb-4 border-b border-bridal-beige/70">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex w-9 h-9 rounded-full bg-bridal-gold/15 border border-bridal-gold/40 items-center justify-center font-display italic text-bridal-gold">
                                {index + 1}
                            </span>
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.18em] text-bridal-text-label font-medium">
                                    {itemLabel}
                                </p>
                                <h3 className="font-display italic text-[18px] sm:text-[20px] text-bridal-charcoal leading-tight">
                                    {pkg.name?.trim() || `Untitled ${itemLabel.toLowerCase()}`}
                                </h3>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePackage(index)}
                            className={`text-bridal-coral hover:bg-bridal-coral/10 hover:text-bridal-coral ${formData.packages.length > 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                            disabled={formData.packages.length <= 1}
                            aria-label={`Remove ${itemLabel.toLowerCase()}`}
                        >
                            <Trash className="size-4" />
                        </Button>
                    </div>

                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">
                                {itemLabel} Name
                            </Label>
                            <Input
                                placeholder={`Enter ${itemLabel.toLowerCase()} name`}
                                value={pkg.name}
                                onChange={(e) => handlePackageChange(index, "name", e.target.value)}
                                className={`h-11 ${errors[`packages[${index}].name`] ? "border-bridal-coral" : "border-bridal-beige focus:border-bridal-gold"}`}
                            />
                            {errors[`packages[${index}].name`] && (
                                <p className="text-bridal-coral text-[12px]">{errors[`packages[${index}].name`]}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">
                                Price (Rs.)
                            </Label>
                            <Input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="Enter price"
                                value={pkg.price || ""}
                                onKeyDown={(e) => {
                                    if (['.', '-', 'e', 'E', '+'].includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                onChange={(e) => handlePackageChange(index, "price", e.target.value ? Math.abs(parseInt(e.target.value, 10)) : "")}
                                className={`h-11 ${errors[`packages[${index}].price`] ? "border-bridal-coral" : "border-bridal-beige focus:border-bridal-gold"}`}
                            />
                            {errors[`packages[${index}].price`] && (
                                <p className="text-bridal-coral text-[12px]">{errors[`packages[${index}].price`]}</p>
                            )}
                        </div>
                    </section>

                    {categories.length > 0 && (
                        <section className="space-y-3 mt-6">
                            <div className="flex items-center gap-3">
                                <span className="bridal-label">What&apos;s included</span>
                                <span className="flex-1 h-px bg-gradient-to-r from-bridal-beige via-bridal-beige/40 to-transparent" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {categories.map((category) => {
                                    const featuresList = pkg.features?.[category.id] || [];
                                    const isActive = featuresList.length > 0;

                                    return (
                                        <div
                                            key={category.id}
                                            className={`rounded-md border p-3.5 transition-colors ${
                                                isActive
                                                    ? "border-bridal-gold/50 bg-bridal-blush/40"
                                                    : "border-bridal-beige bg-bridal-ivory/40"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={isActive}
                                                    onCheckedChange={(checked) => handleFeatureToggle(index, category.id, checked as boolean)}
                                                    id={`category-${index}-${category.id}`}
                                                    className="data-[state=checked]:bg-bridal-gold data-[state=checked]:border-bridal-gold border-bridal-beige"
                                                />
                                                <label
                                                    htmlFor={`category-${index}-${category.id}`}
                                                    className="text-sm font-medium cursor-pointer text-bridal-charcoal"
                                                >
                                                    {category.label}
                                                </label>
                                            </div>

                                            {isActive && (
                                                <div className="space-y-2 mt-3 pl-6">
                                                    {featuresList.map((item: string, itemIdx: number) => (
                                                        <div key={itemIdx} className="flex items-center gap-2">
                                                            <Input
                                                                value={item}
                                                                onChange={(e) => handleFeatureItemChange(index, category.id, itemIdx, e.target.value)}
                                                                placeholder={`${category.label} item`}
                                                                className={`h-9 text-sm ${
                                                                    errors[`packages[${index}].features.${category.id}`] && !item.trim()
                                                                        ? "border-bridal-coral"
                                                                        : "border-bridal-beige focus:border-bridal-gold"
                                                                }`}
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-bridal-coral hover:bg-bridal-coral/10 hover:text-bridal-coral flex-shrink-0"
                                                                onClick={() => removeFeatureItem(index, category.id, itemIdx)}
                                                                aria-label="Remove item"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    {errors[`packages[${index}].features.${category.id}`] && (
                                                        <p className="text-bridal-coral text-[12px]">
                                                            {errors[`packages[${index}].features.${category.id}`]}
                                                        </p>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full text-[12px] tracking-wide text-bridal-mauve hover:bg-bridal-blush/60 hover:text-bridal-charcoal h-8"
                                                        onClick={() => addFeatureItem(index, category.id)}
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" /> Add another
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
            ))}

            {errors.packages && (
                <p className="text-bridal-coral text-[13px]">{errors.packages}</p>
            )}

            <Button
                variant="outline"
                onClick={addPackage}
                className="w-full sm:w-auto flex items-center gap-2 border-dashed border-bridal-gold/55 bg-bridal-cream hover:bg-bridal-blush/60 text-bridal-mauve hover:text-bridal-charcoal hover:border-bridal-gold transition-colors"
            >
                <Plus size={16} />
                Add another {itemLabel.toLowerCase()}
            </Button>
        </div>
    );
};

export default Packages;

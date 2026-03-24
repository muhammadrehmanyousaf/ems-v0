import React from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Trash, Plus, Trash2 } from "lucide-react";
import { useFormContext } from "@/lib/context/form-context";

const availableCategories = [
  { id: "deliverables", label: "Deliverables" },
  { id: "photography", label: "Photography" },
  { id: "team", label: "Team" },
  { id: "videography", label: "Videography" },
];

type FeatureKey = "deliverables" | "photography" | "team" | "videography";

interface PackagesProps {
    setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
    errors: { [key: string]: string };
}

const Packages = ({
    setErrors,
    errors
}: PackagesProps) => {
    const { setFormData, formData } = useFormContext();

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
        const pkgFeatures = newPackages[pkgIndex].features || {
            deliverables: [], photography: [], team: [], videography: []
        };

        if (checked) {
            pkgFeatures[categoryId as FeatureKey] = [""];
        } else {
            pkgFeatures[categoryId as FeatureKey] = [];
            
            // Clear specific error when category is unchecked
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
        newPackages[pkgIndex].features[categoryId as FeatureKey][itemIndex] = value;
        setFormData({ ...formData, packages: newPackages });
        
        // Clear specific error on type
        setErrors((prevErrors) => ({
            ...prevErrors,
            [`packages[${pkgIndex}].features.${categoryId}`]: ""
        }));
    };

    const addFeatureItem = (pkgIndex: number, categoryId: string) => {
        const newPackages = [...formData.packages];
        newPackages[pkgIndex].features[categoryId as FeatureKey].push("");
        setFormData({ ...formData, packages: newPackages });
    };

    const removeFeatureItem = (pkgIndex: number, categoryId: string, itemIndex: number) => {
        const newPackages = [...formData.packages];
        newPackages[pkgIndex].features[categoryId as FeatureKey].splice(itemIndex, 1);
        setFormData({ ...formData, packages: newPackages });
    };

    const addPackage = () => {
        setFormData({
            ...formData,
            packages: [
                ...formData.packages,
                {
                    name: "",
                    price: 0,
                    features: {
                        deliverables: [],
                        photography: [],
                        team: [],
                        videography: [],
                    },
                },
            ],
        });
    };

    const removePackage = (pkgIndex: number) => {
        const newPackages = [...formData.packages];
        newPackages.splice(pkgIndex, 1);
        setFormData({ ...formData, packages: newPackages });
    };

    return (
        <div className="space-y-6">
            {formData.packages.map((pkg, index) => (
                <div key={index} className="border p-5 space-y-4 rounded-xl relative">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Package {index + 1}</h3>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removePackage(index)}
                            className={`text-roze-default hover:bg-red-100 hover:text-roze-default ${formData.packages.length > 1 ? 'opacity-100' : 'opacity-0'}`}
                            disabled={formData.packages.length <= 1}
                        >
                            <Trash className="size-5" />
                        </Button>
                    </div>

                    <section className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label>Package Name</Label>
                            <Input
                                placeholder="Enter package name"
                                value={pkg.name}
                                onChange={(e) => handlePackageChange(index, "name", e.target.value)}
                                className={errors[`packages[${index}].name`] ? "border-red-500" : ""}
                            />
                            {errors[`packages[${index}].name`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`packages[${index}].name`]}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Price</Label>
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
                                className={errors[`packages[${index}].price`] ? "border-red-500" : ""}
                            />
                            {errors[`packages[${index}].price`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`packages[${index}].price`]}</p>
                            )}
                        </div>
                    </section>

                    <section className="space-y-3">
                        <Label>Features</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {availableCategories.map((category) => {
                                const featuresList = pkg.features?.[category.id as keyof typeof pkg.features] || [];
                                const isActive = featuresList.length > 0;

                                return (
                                    <div key={category.id} className="space-y-2 border p-3 rounded-md bg-gray-50">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={isActive}
                                                onCheckedChange={(checked) => handleFeatureToggle(index, category.id, checked as boolean)}
                                                id={`category-${index}-${category.id}`}
                                            />
                                            <label htmlFor={`category-${index}-${category.id}`} className="text-sm font-medium cursor-pointer">
                                                {category.label}
                                            </label>
                                        </div>

                                        {isActive && (
                                            <div className="space-y-2 mt-2 pl-6">
                                                {featuresList.map((item: string, itemIdx: number) => (
                                                    <div key={itemIdx} className="flex items-center gap-2">
                                                        <Input
                                                            value={item}
                                                            onChange={(e) => handleFeatureItemChange(index, category.id, itemIdx, e.target.value)}
                                                            placeholder={`Enter ${category.label.toLowerCase()} item`}
                                                            className={`h-8 text-sm ${errors[`packages[${index}].features.${category.id}`] && !item.trim() ? "border-red-500" : ""}`}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:text-red-700"
                                                            onClick={() => removeFeatureItem(index, category.id, itemIdx)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                {errors[`packages[${index}].features.${category.id}`] && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {errors[`packages[${index}].features.${category.id}`]}
                                                    </p>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full text-xs"
                                                    onClick={() => addFeatureItem(index, category.id)}
                                                >
                                                    <Plus className="w-3 h-3 mr-1" /> Add More
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            ))}

            {errors.packages && <p className="text-red-500 text-sm mt-1">{errors.packages}</p>}
            <Button
                variant="outline"
                onClick={addPackage}
                className="flex items-center gap-2 text-roze-default border-roze-default hover:bg-roze-default hover:text-white"
            >
                <Plus size={18} />
                Add Package
            </Button>
        </div>
    );
};

export default Packages;

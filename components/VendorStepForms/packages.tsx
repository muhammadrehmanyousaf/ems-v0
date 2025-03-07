import React, { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Trash, Plus } from "lucide-react";
import { useFormContext } from "@/lib/context/form-context";

const Packages = () => {
    const { setFormData, formData } = useFormContext();
    const [id, setId] = useState(1);

    const [packages, setPackages] = useState<{ id: number; name: string; price: string; services: string }[]>(
        formData.packages?.length > 0 
            ? formData.packages.map((pkg, index) => ({ id: index + 1, ...pkg })) 
            : [{ id: 1, name: "", price: "", services: "" }]
    );

    useEffect(() => {
        setFormData((prevData) => ({
            ...prevData,
            packages: packages.map(({ id, ...rest }) => rest),
        }));
    }, [packages, setFormData]);

    const addPackage = () => {
        const newId = id + 1;
        setPackages([...packages, { id: newId, name: "", price: "", services: "" }]);
        setId(newId);
    };

    const removePackage = (packageId: number) => {
        setPackages(packages.filter((pkg) => pkg.id !== packageId));
    };

    const handleInputChange = (packageId: number, field: string, value: string | number) => {
        setPackages((prevPackages) =>
            prevPackages.map((pkg) =>
                pkg.id === packageId ? { ...pkg, [field]: value } : pkg
            )
        );
    };

    return (
        <div className="space-y-6">
            {packages.map((pkg, index) => (
                <div key={pkg.id} className="border p-5 space-y-4 rounded-xl relative">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Package {index + 1}</h3>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removePackage(pkg.id)}
                            className={`text-roze-default hover:bg-red-100 hover:text-roze-default ${packages.length > 1 ? 'opacity-100' : 'opacity-0'}`}
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
                                onChange={(e) => handleInputChange(pkg.id, "name", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Price</Label>
                            <Input
                                type="number"
                                placeholder="Enter price"
                                value={pkg.price}
                                onChange={(e) => handleInputChange(pkg.id, "price", e.target.value)}
                            />
                        </div>
                    </section>

                    <section>
                        <div className="space-y-2">
                            <Label>Services</Label>
                            <Textarea
                                placeholder="Enter provided services details"
                                value={pkg.services}
                                onChange={(e) => handleInputChange(pkg.id, "services", e.target.value)}
                            />
                        </div>
                    </section>
                </div>
            ))}

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

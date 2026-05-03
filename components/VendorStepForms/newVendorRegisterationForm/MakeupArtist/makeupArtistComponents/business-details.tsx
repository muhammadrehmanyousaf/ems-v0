import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import MultipleRadio from '@/components/VendorStepForms/components/multiple-radio'
import MultipleSelect from '@/components/VendorStepForms/components/multiple-select'
import { useFormContext } from '@/lib/context/form-context'
import React, { useEffect, useState } from 'react'
import { BiFemale } from 'react-icons/bi'
import { FaCircle, FaFemale, FaMale } from 'react-icons/fa'

interface Errors {
    subBusinessType?: string;
    [key: string]: any;
}

interface BusinessDetails {
    errors: Errors;
    setErrors: React.Dispatch<React.SetStateAction<Errors>>;
}

// SectionCard must live at module scope — defining it inside the component
// would create a new function reference on every render and force React to
// unmount/remount the inputs (blowing away focus on every keystroke).
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bridal-card p-5 sm:p-6">
        <h3 className="font-display italic text-[18px] sm:text-[20px] text-bridal-charcoal mb-4">{title}</h3>
        {children}
    </div>
);

const BusinessDetails = ({ errors, setErrors }: BusinessDetails) => {
    const { setFormData, formData } = useFormContext()

    const staff = [
        { value: 'Male', icon: <FaMale /> },
        { value: 'Female', icon: <FaFemale /> },
        { value: 'Transgender', icon: <BiFemale /> },
    ];

    const Expertise = [
        { value: "Bridal Makeup", label: "Bridal Makeup" },
        { value: "Groom Makeup", label: "Groom Makeup" },
        { value: "Party Makeup", label: "Party Makeup" },
        { value: "Engagement Makeup", label: "Engagement Makeup" },
        { value: "Fashion Show", label: "Fashion Show" },
        { value: "Photoshoot", label: "Photoshoot" },
        { value: "Hair Styling", label: "Hair Styling" },
    ];

    const types = [
        { value: "Bridal", label: "Bridal Makeup", icon: <FaCircle /> },
        { value: "Party", label: "Party Makeup", icon: <FaCircle /> },
        { value: "Fashion", label: "Fashion Makeup", icon: <FaCircle /> },
        { value: "Commercial", label: "Commercial Makeup", icon: <FaCircle /> },
        { value: "Hair", label: "Hair Styling", icon: <FaCircle /> },
    ];

    const amenitiesData = [
        { value: "Hair Styling", label: "Hair Styling" },
        { value: "Nail Art", label: "Nail Art" },
        { value: "Hair Extensions", label: "Hair Extensions" },
        { value: "Makeup Trial", label: "Makeup Trial" },
        { value: "Touch-ups", label: "Touch-ups" },
        { value: "Travel Service", label: "Travel Service" },
        { value: "Premium Products", label: "Premium Products" },
    ];

    const cancellationPolicies = [
        { id: "Refundable", label: "Refundable" },
        { id: "Partially Refundable", label: "Partially Refundable" },
        { id: "Non-refundable", label: "Non-refundable" },
    ];

    const downPaymentTypes = [
        { id: "Percentage", label: "Percentage" },
        { id: "Fixed Amount", label: "Fixed Amount" },
    ];

    const [selectedTypes, setSelectedTypes] = useState<string[]>(
        Array.isArray(formData.subBusinessType) ? formData.subBusinessType : []
    );
    const [selectedTypeIndexes, setSelectedTypeIndexes] = useState<number[]>([]);
    const [selectedExpertise, setSelectedExpertise] = useState<string[]>(formData.expertise || []);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(formData.amenities || []);
    const [selectedstaff, setSelectedstaff] = useState<string[]>(formData.staff || []);
    const [selectedStaffIndexes, setSelectedStaffIndexes] = useState<number[]>(() => {
        if (formData.staff) {
            return formData.staff.map((s: string) => staff.findIndex(item => item.value === s)).filter((i: number) => i !== -1);
        }
        return [];
    });
    const [cancellation, setCancellation] = useState<string>(formData.cancelationPolicy || '');
    const [downPaymentType, setDownPaymentType] = useState<string>(formData.downPaymentType || 'Percentage');

    useEffect(() => {
        setFormData((prevData) => ({
            ...prevData,
            staff: selectedstaff,
            expertise: selectedExpertise,
            subBusinessType: selectedTypes,
            cancelationPolicy: cancellation,
            amenities: selectedAmenities,
            downPaymentType: downPaymentType,
        }));
    }, [selectedstaff, selectedExpertise, cancellation, selectedTypes, selectedAmenities, downPaymentType, setFormData]);

    const handleSelectStaff = (type: string, index: number) => {
        if (selectedStaffIndexes.includes(index)) {
            setSelectedStaffIndexes(selectedStaffIndexes.filter(i => i !== index));
            setSelectedstaff(selectedstaff.filter(t => t !== type));
        } else {
            setSelectedStaffIndexes([...selectedStaffIndexes, index]);
            setSelectedstaff([...selectedstaff, type]);
        }
    };

    const handleSelectSubBusinessType = (type: string, index: number) => {
        if (selectedTypeIndexes.includes(index)) {
            setSelectedTypeIndexes(selectedTypeIndexes.filter(i => i !== index));
            setSelectedTypes(selectedTypes.filter(t => t !== type));
        } else {
            setSelectedTypeIndexes([...selectedTypeIndexes, index]);
            setSelectedTypes([...selectedTypes, type]);
        }
    };

    return (
        <div className="space-y-5">
            <SectionCard title="Basic Information">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name" className="text-[11px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">Business Name</Label>
                        <Input
                            id="name"
                            placeholder="Enter your business name"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            className={`mt-1.5 h-11 ${errors.name ? "border-bridal-coral" : "border-bridal-beige focus:border-bridal-gold"}`}
                        />
                        {errors.name && <p className="text-bridal-coral text-[12px] mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <Label htmlFor="description" className="text-[11px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">Business Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe your makeup services"
                            value={formData.description}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            className={`mt-1.5 min-h-[110px] ${errors.description ? "border-bridal-coral" : "border-bridal-beige focus:border-bridal-gold"}`}
                        />
                        {errors.description && <p className="text-bridal-coral text-[12px] mt-1">{errors.description}</p>}
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Business Specialization">
                <div className="space-y-6">
                    <div>
                        <MultipleRadio
                            label="Makeup Type"
                            data={types}
                            handleSelect={(value: string, index: number) => {
                                handleSelectSubBusinessType(value, index);
                                setErrors((prevErrors) => ({ ...prevErrors, subBusinessType: [] }));
                            }}
                            selectedIndexes={selectedTypeIndexes}
                        />
                        {errors.subBusinessType && <p className="text-bridal-coral text-[12px] mt-1">{errors.subBusinessType}</p>}
                    </div>
                    <div>
                        <MultipleSelect
                            label="Expertise"
                            placeholder="Select Expertise"
                            data={Expertise}
                            handleSelectOption={(value: string) => {
                                setSelectedExpertise((prev) =>
                                    prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
                                );
                                setErrors((prevErrors) => ({ ...prevErrors, expertise: "" }));
                            }}
                            selectedOption={selectedExpertise}
                        />
                        {errors.expertise && <p className="text-bridal-coral text-[12px] mt-1">{errors.expertise}</p>}
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Services & Staff">
                <div className="space-y-6">
                    <div>
                        <MultipleSelect
                            label="Services & Amenities"
                            placeholder="Select Services & Amenities"
                            data={amenitiesData}
                            handleSelectOption={(value: string) => {
                                setSelectedAmenities((prev) =>
                                    prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
                                );
                                setErrors((prevErrors) => ({ ...prevErrors, amenities: "" }));
                            }}
                            selectedOption={selectedAmenities}
                        />
                        {errors.amenities && <p className="text-bridal-coral text-[12px] mt-1">{errors.amenities}</p>}
                    </div>
                    <div>
                        <MultipleRadio
                            label="Staff Gender"
                            data={staff}
                            handleSelect={(type: string, index: number) => {
                                handleSelectStaff(type, index);
                                setErrors((prevErrors) => ({ ...prevErrors, staff: [] }));
                            }}
                            selectedIndexes={selectedStaffIndexes}
                        />
                        {errors.staff && <p className="text-bridal-coral text-[12px] mt-1">{errors.staff}</p>}
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Pricing & Policies">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <Label htmlFor="downPayment" className="text-[11px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">Down Payment</Label>
                        <div className="flex gap-2.5 mt-1.5">
                            <Select
                                value={downPaymentType}
                                onValueChange={(value) => {
                                    setDownPaymentType(value);
                                    setFormData((prev) => ({ ...prev, downPaymentType: value }));
                                    let errorMsg = "";
                                    if (!formData.downPayment || formData.downPayment <= 0) {
                                        errorMsg = "Please enter a valid amount";
                                    } else if (value === "Percentage" && formData.downPayment > 100) {
                                        errorMsg = "Percentage must be between 0 and 100";
                                    }
                                    setErrors((prevErrors) => ({ ...prevErrors, downPaymentType: "", downPayment: errorMsg }));
                                }}
                            >
                                <SelectTrigger className="w-[120px] h-11 border-bridal-beige">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {downPaymentTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                id="downPayment"
                                type="number"
                                placeholder="Amount"
                                value={formData.downPayment || ""}
                                onKeyDown={(e) => { if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault(); }}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const numValue = Number(value);
                                    setFormData((prev) => ({ ...prev, downPayment: isNaN(numValue) ? 0 : numValue }));
                                    let errorMsg = "";
                                    if (value !== "" && (isNaN(numValue) || numValue <= 0)) {
                                        errorMsg = "Please enter a valid amount";
                                    } else if (downPaymentType === "Percentage" && numValue > 100) {
                                        errorMsg = "Percentage must be between 0 and 100";
                                    }
                                    setErrors((prev) => ({ ...prev, downPayment: errorMsg }));
                                }}
                                className={`flex-1 h-11 ${errors.downPayment ? "border-bridal-coral" : "border-bridal-beige focus:border-bridal-gold"}`}
                                min={1}
                            />
                        </div>
                        {errors.downPayment && <p className="text-bridal-coral text-[12px] mt-1">{errors.downPayment}</p>}
                    </div>
                    <div>
                        <Label className="text-[11px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">Cancellation Policy</Label>
                        <Select value={cancellation} onValueChange={setCancellation}>
                            <SelectTrigger className={`mt-1.5 h-11 ${errors.cancelationPolicy ? "border-bridal-coral" : "border-bridal-beige"}`}>
                                <SelectValue placeholder="Select cancellation policy" />
                            </SelectTrigger>
                            <SelectContent>
                                {cancellationPolicies.map((policy) => (
                                    <SelectItem key={policy.id} value={policy.id}>{policy.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.cancelationPolicy && <p className="text-bridal-coral text-[12px] mt-1">{errors.cancelationPolicy}</p>}
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};

export default BusinessDetails;

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import MultipleRadio from '@/components/VendorStepForms/components/multiple-radio'
import MultipleSelect from '@/components/VendorStepForms/components/multiple-select'
import RadioButton from '@/components/VendorStepForms/components/radio-button'
import { useFormContext } from '@/lib/context/form-context'
import React, { useEffect, useState } from 'react'
import { BiFemale } from 'react-icons/bi'
import { FaFemale, FaMale } from 'react-icons/fa'

interface Errors {
    subBusinessType?: string;
    [key: string]: any;
}

interface BusinessDetails {
    errors: Errors;
    setErrors: React.Dispatch<React.SetStateAction<Errors>>;
};

const BusinessDetails = ({ errors, setErrors }: BusinessDetails) => {
    const { businessType, setFormData, formData } = useFormContext()
    const [selectedTypes, setSelectedTypes] = useState<string>('');
    const [selectedTypeIndexes, setSelectedTypeIndexes] = useState<number[]>([]);
    const [selectedExpertise, setSelectedExpertise] = useState<string[]>(formData.expertise || []);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(formData.amenities || []);
    const [selectedstaff, setSelectedstaff] = useState<string[]>([]);
    const [selectedStaffIndexes, setSelectedStaffIndexes] = useState<number[]>([]);
    const [cancellation, setCancellation] = useState<string>(formData.cancelationPolicy || '');
    const [downPaymentType, setDownPaymentType] = useState<string>(formData.downPaymentType || "");

    useEffect(() => {
        setFormData((prevData) => ({
            ...prevData,
            staff: selectedstaff,
            expertise: selectedExpertise,
            subBusinessType: selectedTypes,
            cancelationPolicy: cancellation,
            amenities: selectedAmenities,
            downPaymentType: downPaymentType
        }));
    }, [
        selectedstaff,
        selectedExpertise,
        cancellation,
        selectedTypes,
        selectedAmenities,
        downPaymentType,
        setFormData
    ]);

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
        { id: "Bridal", label: 'Bridal Makeup' },
        { id: "Party", label: 'Party Makeup' },
        { id: "Fashion", label: 'Fashion Makeup' },
        { id: "Commercial", label: 'Commercial Makeup' },
        { id: "Hair", label: 'Hair Styling' },
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

    const handleSelectStaff = (type: string, index: number) => {
        if (selectedStaffIndexes.includes(index)) {
            setSelectedStaffIndexes(selectedStaffIndexes.filter(i => i !== index));
            setSelectedstaff(selectedstaff.filter(t => t !== type));
        } else {
            setSelectedStaffIndexes([...selectedStaffIndexes, index]);
            setSelectedstaff([...selectedstaff, type]);
        }
    };

    const handleSelectExpertise = (expertise: string) => {
        if (selectedExpertise.includes(expertise)) {
            setSelectedExpertise(selectedExpertise.filter(e => e !== expertise));
        } else {
            setSelectedExpertise([...selectedExpertise, expertise]);
        }
    };

    const handleSelectAmenities = (amenity: string) => {
        if (selectedAmenities.includes(amenity)) {
            setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
        } else {
            setSelectedAmenities([...selectedAmenities, amenity]);
        }
    };

    const handleSelectType = (type: string, index: number) => {
        if (selectedTypeIndexes.includes(index)) {
            setSelectedTypeIndexes(selectedTypeIndexes.filter(i => i !== index));
            setSelectedTypes('');
        } else {
            setSelectedTypeIndexes([index]);
            setSelectedTypes(type);
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Information */}
                <div className="space-y-6">
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Basic Information</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name" className="text-sm font-medium text-neutral-700">Business Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter your business name"
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    className={`mt-1 ${errors.name ? "border-red-500" : "border-neutral-300"}`}
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="description" className="text-sm font-medium text-neutral-700">Business Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe your makeup services"
                                    value={formData.description}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                    className={`mt-1 min-h-[100px] ${errors.description ? "border-red-500" : "border-neutral-300"}`}
                                />
                                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Pricing Information</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="minimumPrice" className="text-sm font-medium text-neutral-700">Starting Price (PKR)</Label>
                                <Input
                                    id="minimumPrice"
                                    type="number"
                                    placeholder="Enter starting price"
                                    value={formData.minimumPrice}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, minimumPrice: parseInt(e.target.value) }))}
                                    className={`mt-1 ${errors.minimumPrice ? "border-red-500" : "border-neutral-300"}`}
                                />
                                {errors.minimumPrice && <p className="text-red-500 text-sm mt-1">{errors.minimumPrice}</p>}
                            </div>

                            <div>
                                <Label htmlFor="downPayment" className="text-sm font-medium text-neutral-700">Down Payment</Label>
                                <div className="flex gap-3 mt-1">
                                    <Input
                                        id="downPayment"
                                        type="number"
                                        placeholder="Amount"
                                        value={formData.downPayment}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, downPayment: parseInt(e.target.value) }))}
                                        className={`flex-1 ${errors.downPayment ? "border-red-500" : "border-neutral-300"}`}
                                    />
                                    <Select value={downPaymentType} onValueChange={(value) => {
                                        setDownPaymentType(value);
                                        setFormData((prev) => ({ ...prev, downPaymentType: value }));
                                        setErrors((prevErrors) => ({ ...prevErrors, downPaymentType: "" }));
                                    }}>
                                        <SelectTrigger className="w-32 border-neutral-300">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {downPaymentTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {errors.downPayment && <p className="text-red-500 text-sm mt-1">{errors.downPayment}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Business Details */}
                <div className="space-y-6">
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Business Specialization</h3>
                        <div className="space-y-6">
                            <div>
                                <Label className="text-sm font-medium text-neutral-700 mb-2 block">Makeup Type</Label>
                                <RadioButton
                                    data={types}
                                    selectedOption={selectedTypes}
                                    setSelectedOption={(value: string) => {
                                        setSelectedTypes(value);
                                        setErrors((prevErrors) => ({
                                            ...prevErrors,
                                            subBusinessType: "",
                                        }));
                                    }}
                                />
                                {errors.subBusinessType && <p className="text-red-500 text-sm mt-1">{errors.subBusinessType}</p>}
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
                                        setErrors((prevErrors) => ({
                                            ...prevErrors,
                                            expertise: "",
                                        }));
                                    }}
                                    selectedOption={selectedExpertise}
                                />
                                {errors.expertise && <p className="text-red-500 text-sm mt-1">{errors.expertise}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Services & Staff</h3>
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
                                        setErrors((prevErrors) => ({
                                            ...prevErrors,
                                            amenities: "",
                                        }));
                                    }}
                                    selectedOption={selectedAmenities}
                                />
                                {errors.amenities && <p className="text-red-500 text-sm mt-1">{errors.amenities}</p>}
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-neutral-700 mb-2 block">Staff Gender</Label>
                                <MultipleRadio
                                    label="Staff Gender"
                                    data={staff}
                                    handleSelect={(type: string, index: number) => {
                                        handleSelectStaff(type, index);
                                        setErrors((prevErrors) => ({
                                            ...prevErrors,
                                            staff: "",
                                        }));
                                    }}
                                    selectedIndexes={selectedStaffIndexes}
                                />
                                {errors.staff && <p className="text-red-500 text-sm mt-1">{errors.staff}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-neutral-200">
                        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Business Policies</h3>
                        <div>
                            <Label className="text-sm font-medium text-neutral-700 mb-2 block">Cancellation Policy</Label>
                            <Select value={cancellation} onValueChange={setCancellation}>
                                <SelectTrigger className="border-neutral-300">
                                    <SelectValue placeholder="Select cancellation policy" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cancellationPolicies.map((policy) => (
                                        <SelectItem key={policy.id} value={policy.id}>
                                            {policy.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.cancelationPolicy && <p className="text-red-500 text-sm mt-1">{errors.cancelationPolicy}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BusinessDetails 
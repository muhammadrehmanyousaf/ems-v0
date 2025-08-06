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
            amenities: selectedAmenities
        }));
    }, [
        selectedstaff,
        selectedExpertise,
        cancellation,
        selectedTypes,
        selectedAmenities,
        setFormData
    ]);

    const staff = [
        { value: 'Male', icon: <FaMale /> },
        { value: 'Female', icon: <FaFemale /> },
        { value: 'Transgender', icon: <BiFemale /> },
    ];

    const Expertise = [
        { value: "Wedding Catering", label: "Wedding Catering" },
        { value: "Corporate Events", label: "Corporate Events" },
        { value: "Birthday Parties", label: "Birthday Parties" },
        { value: "Engagement Parties", label: "Engagement Parties" },
        { value: "Outdoor Events", label: "Outdoor Events" },
        { value: "Indoor Events", label: "Indoor Events" },
        { value: "Buffet Service", label: "Buffet Service" },
        { value: "Plated Service", label: "Plated Service" },
    ];

    const types = [
        { id: "Wedding", label: 'Wedding Catering' },
        { id: "Corporate", label: 'Corporate Catering' },
        { id: "Events", label: 'Event Catering' },
        { id: "Buffet", label: 'Buffet Service' },
        { id: "Plated", label: 'Plated Service' },
    ];

    const amenitiesData = [
        { value: "Buffet Service", label: "Buffet Service" },
        { value: "Plated Service", label: "Plated Service" },
        { value: "Wait Staff", label: "Wait Staff" },
        { value: "Table Setup", label: "Table Setup" },
        { value: "Dishware", label: "Dishware" },
        { value: "Cutlery", label: "Cutlery" },
        { value: "Glassware", label: "Glassware" },
        { value: "Table Linens", label: "Table Linens" },
        { value: "Food Transportation", label: "Food Transportation" },
        { value: "Kitchen Setup", label: "Kitchen Setup" },
    ];

    const cancellationPolicies = [
        { id: "Refundable", label: "Refundable" },
        { id: "Partially Refundable", label: "Partially Refundable" },
        { id: "Non-refundable", label: "Non-refundable" },
    ];

    const downPaymentTypes = [
        { id: "Percentage", label: "Percentage" },
        { id: "Fixed", label: "Fixed Amount" },
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
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">Business Name</Label>
                        <Input
                            id="name"
                            placeholder="Enter your business name"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                    </div>

                    <div>
                        <Label htmlFor="description">Business Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe your catering services"
                            value={formData.description}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            className={errors.description ? "border-red-500" : ""}
                        />
                        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                    </div>

                    <div>
                        <Label htmlFor="minimumPrice">Starting Price (PKR)</Label>
                        <Input
                            id="minimumPrice"
                            type="number"
                            placeholder="Enter starting price"
                            value={formData.minimumPrice}
                            onChange={(e) => setFormData((prev) => ({ ...prev, minimumPrice: parseInt(e.target.value) }))}
                            className={errors.minimumPrice ? "border-red-500" : ""}
                        />
                        {errors.minimumPrice && <p className="text-red-500 text-sm">{errors.minimumPrice}</p>}
                    </div>

                    <div>
                        <Label htmlFor="downPayment">Down Payment</Label>
                        <div className="flex gap-2">
                            <Input
                                id="downPayment"
                                type="number"
                                placeholder="Amount"
                                value={formData.downPayment}
                                onChange={(e) => setFormData((prev) => ({ ...prev, downPayment: parseInt(e.target.value) }))}
                                className={errors.downPayment ? "border-red-500" : ""}
                            />
                            <Select value={downPaymentType} onValueChange={setDownPaymentType}>
                                <SelectTrigger className="w-32">
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
                        {errors.downPayment && <p className="text-red-500 text-sm">{errors.downPayment}</p>}
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <Label>Catering Type</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                            {types.map((type, index) => (
                                <RadioButton
                                    key={type.id}
                                    label={type.label}
                                    isSelected={selectedTypeIndexes.includes(index)}
                                    onClick={() => handleSelectType(type.id, index)}
                                />
                            ))}
                        </div>
                        {errors.subBusinessType && <p className="text-red-500 text-sm">{errors.subBusinessType}</p>}
                    </div>

                    <div>
                        <Label>Expertise</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                            {Expertise.map((expertise) => (
                                <MultipleSelect
                                    key={expertise.value}
                                    label={expertise.label}
                                    isSelected={selectedExpertise.includes(expertise.value)}
                                    onClick={() => handleSelectExpertise(expertise.value)}
                                />
                            ))}
                        </div>
                        {errors.expertise && <p className="text-red-500 text-sm">{errors.expertise}</p>}
                    </div>

                    <div>
                        <Label>Services & Amenities</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                            {amenitiesData.map((amenity) => (
                                <MultipleSelect
                                    key={amenity.value}
                                    label={amenity.label}
                                    isSelected={selectedAmenities.includes(amenity.value)}
                                    onClick={() => handleSelectAmenities(amenity.value)}
                                />
                            ))}
                        </div>
                        {errors.amenities && <p className="text-red-500 text-sm">{errors.amenities}</p>}
                    </div>

                    <div>
                        <Label>Staff Gender</Label>
                        <div className="flex gap-4 mt-2">
                            {staff.map((staffMember, index) => (
                                <MultipleRadio
                                    key={staffMember.value}
                                    label={staffMember.value}
                                    icon={staffMember.icon}
                                    isSelected={selectedStaffIndexes.includes(index)}
                                    onClick={() => handleSelectStaff(staffMember.value, index)}
                                />
                            ))}
                        </div>
                        {errors.staff && <p className="text-red-500 text-sm">{errors.staff}</p>}
                    </div>

                    <div>
                        <Label>Cancellation Policy</Label>
                        <Select value={cancellation} onValueChange={setCancellation}>
                            <SelectTrigger>
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
                        {errors.cancelationPolicy && <p className="text-red-500 text-sm">{errors.cancelationPolicy}</p>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BusinessDetails 
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
import { IoMdMail } from 'react-icons/io'

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
    const [selectedCatering, setSelectedCatering] = useState<string>(formData.catering || 'external');
    const [parking, setParking] = useState<string>(formData.parking ? 'yes' : 'no');
    const [covid, setCovid] = useState<string>(formData.covidComplaint ? 'yes' : 'no');
    const [cancellation, setCancellation] = useState<string>(formData.cancelationPolicy || '');
    const [downPaymentType, setDownPaymentType] = useState<string>(formData.downPaymentType || "");

    useEffect(() => {
        setFormData((prevData) => ({
            ...prevData,
            staff: selectedstaff,
            expertise: selectedExpertise,
            subBusinessType: selectedTypes,
            cancelationPolicy: cancellation,
            covidComplaint: covid === 'yes',
            parking: parking === 'yes',
            catering: selectedCatering,
            amenities: selectedAmenities,
            downPaymentType: downPaymentType
        }));
    }, [
        selectedstaff,
        selectedExpertise,
        cancellation,
        selectedTypes,
        covid,
        selectedAmenities,
        parking,
        selectedCatering,
        downPaymentType,
        setFormData
    ]);

    const staff = [
        { value: 'Male', icon: <FaMale /> },
        { value: 'Female', icon: <FaFemale /> },
        { value: 'Transgender', icon: <BiFemale /> },
    ];

    const Expertise = [
        { value: "Engagement", label: "Engagement" },
        { value: "Wedding", label: "Wedding" },
        { value: "Parties", label: "Parties" },
        { value: "Fashion Show", label: "Fashion Show" },
        { value: "Dinner", label: "Dinner" },
    ];
    // const types = [
    //     { value: 'Marquee', icon: <IoMdMail /> },
    //     { value: 'Hall', icon: <IoMdMail /> },
    //     { value: 'Outdoor', icon: <IoMdMail /> },
    //     { value: 'Others', icon: <IoMdMail /> }
    // ];
    const types = [
        { id: "Marquee", label: 'Marquee' },
        { id: "Hall",label: 'Hall', },
        { id: "Outdoor",label: 'Outdoor', },
        { id: "Others",label: 'Others', }
    ];

    const amenitiesData = [
        { value: "Air Condition", label: "Air Condition" },
        { value: "Wheelchair", label: "Wheelchair" },
        { value: "Wifi", label: "Wifi" },
    ];

    const catering = [
        { id: "external", label: "External" },
        { id: "internal", label: "Internal" },
    ];

    const parkingData = [
        { id: "yes", label: "Yes" },
        { id: "no", label: "No" },
    ];

    const covidCompliant = [
        { id: "yes", label: "Yes" },
        { id: "no", label: "No" },
    ];

    const cancellationData = [
        { id: "refundable", label: "Refundable" },
        { id: "non_refundable", label: "Non-Refundable" },
        { id: "partially_refundable", label: "Partially Refundable" },
    ];

    // const handleSelectType = (type: string, index: number) => {
    //     setSelectedTypes((prev) =>
    //         prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    //     );
    //     setSelectedTypeIndexes((prev) =>
    //         prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    //     );

    //     setFormData((prevData) => ({
    //         ...prevData,
    //         subBusinessType: selectedTypes.includes(type)
    //             ? selectedTypes.filter((t) => t !== type)
    //             : [...selectedTypes, type],
    //     }));

    //     setErrors((prevErrors) => ({ ...prevErrors, subBusinessType: "" }));
    // };


    const handleSelectStaff = (type: string, index: number) => {
        setSelectedstaff((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
        setSelectedStaffIndexes((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );

        // ✅ Ensure changes persist in formData
        setFormData((prevData) => ({
            ...prevData,
            staff: selectedstaff.includes(type)
                ? selectedstaff.filter((t) => t !== type)
                : [...selectedstaff, type],
        }));

        setErrors((prevErrors) => ({ ...prevErrors, staff: "" }));
    };


    return (
        <div className='space-y-6'>
            <div>
                {/* <MultipleRadio
                    label="Type of Venue"
                    data={types}
                    handleSelect={handleSelectType}
                    selectedIndexes={selectedTypeIndexes}
                /> */}
                {/* {errors.subBusinessType && <p className="text-xs text-red-500">{errors.subBusinessType}</p>} */}
                <Label>Type of Venue</Label>
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
                {errors.subBusinessType && <p className="text-xs text-red-500">{errors.subBusinessType}</p>}
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
                {errors.expertise && <p className="text-xs text-red-500">{errors.expertise}</p>}
            </div>

            <div className="space-y-8">
                <section>
                    <MultipleSelect
                        label="Amenities"
                        placeholder="Select Amenities"
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
                    {errors.amenities && <p className="text-xs text-red-500">{errors.amenities}</p>}
                </section>
                <section className="space-y-3">
                    <Label>Maximum People Capacity</Label>
                    <Input
                        type="number"
                        placeholder="Enter maximum people capacity"
                        value={formData.maxCapacity || ""}
                        onChange={(e) => {
                            setFormData((prevData) => ({
                                ...prevData,
                                maxCapacity: String(e.target.value),
                            }))
                            setErrors((prevErrors) => ({
                                ...prevErrors,
                                maxCapacity: "",
                            }));
                        }
                        }
                    />
                    {errors.maxCapacity && <p className="text-xs text-red-500">{errors.maxCapacity}</p>}
                </section>
                <section>
                    <Label>Catering</Label>
                    <RadioButton
                        data={catering}
                        selectedOption={selectedCatering}
                        setSelectedOption={(value: string) => {
                            setSelectedCatering(value);
                            setErrors((prevErrors) => ({
                                ...prevErrors,
                                parking: "",
                            }));
                        }}
                    />
                    {errors.catering && <p className="text-xs text-red-500">{errors.catering}</p>}
                </section>
                <section>
                    <Label>Parking</Label>
                    <RadioButton
                        data={parkingData}
                        selectedOption={parking}
                        setSelectedOption={(value: string) => {
                            setParking(value);
                            setErrors((prevErrors) => ({
                                ...prevErrors,
                                parking: "",
                            }));
                        }}
                    />
                    {errors.parking && <p className="text-xs text-red-500">{errors.parking}</p>}
                </section>
            </div>
            <section>
                <MultipleRadio
                    label="Staff"
                    data={staff}
                    handleSelect={handleSelectStaff}
                    selectedIndexes={selectedStaffIndexes}
                />
                {errors.staff && <p className="text-xs text-red-500">{errors.staff}</p>}
            </section>
            <section className="space-y-3">
                <Label>Description</Label>
                <Textarea
                    placeholder="Enter Description"
                    name="description"
                    value={formData.description || ''}
                    onChange={(e) => {
                        setFormData((prevData) => ({
                            ...prevData,
                            description: e.target.value,
                        }));
                        setErrors((prevErrors) => ({ ...prevErrors, description: "" }));
                    }}
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            </section>
            <section className="space-y-3">
                <Label>Aditional Information</Label>
                <Textarea
                    placeholder="Enter Aditional Information"
                    value={formData.additionalInfo || ''}
                    name="additionalInfo"
                    onChange={(e) =>
                        setFormData((prevData) => ({
                            ...prevData,
                            additionalInfo: e.target.value,
                        }))
                    }
                />
            </section>
            <section className="space-y-3">
                <Label>Down Payment Type</Label>
                <Select
                    value={downPaymentType}
                    onValueChange={(value) => {
                        setDownPaymentType(value);
                        setFormData((prevData) => ({
                            ...prevData,
                            downPaymentType: value,
                        }));
                        setErrors((prevErrors) => ({ ...prevErrors, downPaymentType: "" }));
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Fixed Amount">Fixed Amount</SelectItem>
                        <SelectItem value="Percentage">Percentage</SelectItem>
                    </SelectContent>
                </Select>
                {errors.downPaymentType && <p className="text-xs text-red-500">{errors.downPaymentType}</p>}
            </section>

            <section className="space-y-3">
                <Label>Down Payment</Label>
                <Input
                    type="number"
                    placeholder="Enter Down Payment"
                    value={formData.downPayment || ''}
                    name="downPayment"
                    onChange={(e) => {
                        setFormData((prevData) => ({
                            ...prevData,
                            downPayment: Number(e.target.value),
                        }));
                        setErrors((prevErrors) => ({ ...prevErrors, downPayment: "" }));
                    }}
                />
                {errors.downPayment && <p className="text-xs text-red-500">{errors.downPayment}</p>}
            </section>
            <section>
                <Label>Covid Compliant</Label>
                <RadioButton
                    data={covidCompliant}
                    selectedOption={covid}
                    setSelectedOption={setCovid}
                />
            </section>
            <section>
                <Label>Cancellation Policy</Label>
                <RadioButton
                    data={cancellationData}
                    selectedOption={cancellation}
                    setSelectedOption={(value: string) => {
                        setCancellation(value);
                        setErrors((prevErrors) => ({
                            ...prevErrors,
                            cancelationPolicy: "",
                        }));
                    }}
                />
                {errors.cancelationPolicy && <p className="text-xs text-red-500">{errors.cancelationPolicy}</p>}
            </section>

        </div>
    )
}

export default BusinessDetails
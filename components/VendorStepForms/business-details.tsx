"use client";

import React, { useEffect, useState } from "react";
import { IoMdMail } from "react-icons/io";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { FaMale } from "react-icons/fa";
import { FaFemale } from "react-icons/fa";
import { BiFemale } from "react-icons/bi";
import RadioButton from "./components/radio-button";
import MultipleSelect from "./components/multiple-select";
import MultipleRadio from "./components/multiple-radio";
import { useFormContext } from "@/lib/context/form-context";

const BusinessDetails = () => {
    const { businessType, setFormData, formData } = useFormContext()
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedTypeIndexes, setSelectedTypeIndexes] = useState<number[]>([]);
    const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [selectedstaff, setSelectedstaff] = useState<string[]>([]);
    const [selectedStaffIndexes, setSelectedStaffIndexes] = useState<number[]>([]);
    const [selectedCatering, setSelectedCatering] = useState<string>('external');
    const [parking, setParking] = useState<string>('no');
    const [covid, setCovid] = useState<string>('no');
    const [cancellation, setCancellation] = useState<string>('refundable');
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [selectServiceFor, setSelectedServiceFor] = useState<string[]>([]);
    const [selectServiceForIndex, setSelectedServiceForIndex] = useState<number[]>([]);
    const [hasTeam, setHasTeam] = useState<string>('no');
    const [travelsToHome, setTravelsToHome] = useState<string>('no');
    const [sellMehndi, setSellMehndi] = useState<string>('no');
    const [decoritems, setDecoritems] = useState<string>('no');
    const [salonType, setSalonType] = useState<string>('salon');

    useEffect(() => {
        setFormData((prevData) => ({
            ...prevData,
            cityCovered: selectedCities,
            staff: selectedstaff,
            hasTeam: hasTeam === 'yes',
            expertise: selectedExpertise,
            serviceProvided: selectServiceFor,
            subBusinessType: businessType === 'MAKEUP_ARTIST' ? [salonType] : selectedTypes,
            cancelationPolicy: cancellation,
            covidComplaint: covid === 'yes',
            sellMehndi: sellMehndi === 'yes',
            parking: parking === 'yes',
            catering: selectedCatering,
        }));
    }, [
        selectedCities,
        selectedstaff,
        selectServiceFor,
        selectedExpertise,
        hasTeam,
        salonType,
        cancellation,
        covid,
        parking,
        businessType,
        selectedCatering,
        setFormData
    ]);


    const types = [
        { value: 'Marquee', icon: <IoMdMail /> },
        { value: 'Hall', icon: <IoMdMail /> },
        { value: 'Outdoor', icon: <IoMdMail /> },
        { value: 'Others', icon: <IoMdMail /> }
    ];

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

    const hinaExpertise = [
        { value: "arabic", label: "Arabic" },
        { value: "indian", label: "Indian" },
        { value: "modern", label: "Modern" },
    ];

    const decorExpertise = [
        { value: "Wedding", label: "Wedding" },
        { value: "Mehndi", label: "Mehndi" },
        { value: "Valima", label: "Valima" },
        { value: "Dholki", label: "Dholki" },
        { value: "Birthday Party", label: "Birthday Party" },
        { value: "Bridal Shower", label: "Bridal Shower" },
        { value: "Anniversary", label: "Anniversary" },
        { value: "Aqeeqa", label: "Aqeeqa" },
    ];

    const cateringExpertise = [
        { value: "Pakistani", label: "Pakistani" },
        { value: "Continental", label: "Continental" },
        { value: "Chinese", label: "Chinese" },
        { value: "Turkish", label: "Turkish" },
        { value: "Arabic", label: "Arabic" },
    ];

    const makeupExpertise = [
        { value: "Pakistani", label: "Pakistani" },
        { value: "Continental", label: "Continental" },
        { value: "Chinese", label: "Chinese" },
        { value: "Turkish", label: "Turkish" },
        { value: "Arabic", label: "Arabic" },
    ];

    const cities = [
        { value: "Lahore", label: "Lahore" },
        { value: "Karachi", label: "Karachi" },
        { value: "Islamabad", label: "Islamabad" },
        { value: "Rawalpindi", label: "Rawalpindi" },
        { value: "Major Cities", label: "Major Cities" },
        { value: "All Pakistan", label: "All Pakistan" },
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

    const salonData = [
        { id: "solo", label: "Solo" },
        { id: "salon", label: "Salon" },
        { id: "home_based_salon", label: "Home Based Salon" },
    ];

    const handleSelectType = (type: string, index: number) => {
        setSelectedTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
        setSelectedTypeIndexes((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    const handleSelectExpertise = (value: string) => {
        setSelectedExpertise((prev) =>
            prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
        );
    };

    const handleSelectCities = (value: string) => {
        setSelectedCities((prev) =>
            prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
        );
    };

    const handleSelectAmenities = (value: string) => {
        setSelectedAmenities((prev) =>
            prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
        );
    };

    const handleSelectStaff = (type: string, index: number) => {
        setSelectedstaff((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
        setSelectedStaffIndexes((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    const handleSelectServiceFor = (type: string, index: number) => {
        setSelectedServiceFor((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
        setSelectedServiceForIndex((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    return (
        <div className="space-y-8">
            {businessType === 'MAKEUP_ARTIST' &&
                <section>
                    <Label>Type of Salon</Label>
                    <RadioButton
                        data={salonData}
                        selectedOption={salonType}
                        setSelectedOption={setSalonType}
                    />
                </section>}
            {businessType === 'WEDDING_VENUE' ?
                <section>
                    <MultipleRadio
                        label="Type of Venue"
                        data={types}
                        handleSelect={handleSelectType}
                        selectedIndexes={selectedTypeIndexes}
                    />
                </section> :
                <section>
                    <MultipleSelect
                        label="Coverd Cities"
                        placeholder="Select Cities"
                        data={cities}
                        handleSelectOption={handleSelectCities}
                        selectedOption={selectedCities}
                    />
                </section>
            }

            {(businessType === 'WEDDING_VENUE' || businessType === 'HENNA_ARTIST' || businessType === 'DECOR' || businessType === 'CATERING' || businessType === 'MAKEUP_ARTIST') && <section>
                <MultipleSelect
                    label="Expertise"
                    placeholder="Select Expertise"
                    data={businessType === 'HENNA_ARTIST' ?
                        hinaExpertise :
                        businessType === 'DECOR' ?
                            decorExpertise :
                            businessType === 'CATERING' ?
                                cateringExpertise :
                                businessType === 'MAKEUP_ARTIST' ?
                                    makeupExpertise :
                                    Expertise
                    }
                    handleSelectOption={handleSelectExpertise}
                    selectedOption={selectedExpertise}
                />
            </section>}

            {
                businessType === 'CATERING' &&
                <div className="space-y-8">
                    <section>
                        <Label>Do you provide food testing?</Label>
                        <RadioButton
                            data={covidCompliant}
                            selectedOption={formData.provideFoodTesting ? "true" : "false"}
                            setSelectedOption={(id) =>
                                setFormData((previous) => ({
                                    ...previous,
                                    provideFoodTesting: id === "true",
                                }))
                            }
                        />
                    </section>
                    <section>
                        <Label>Do you provide decoration?</Label>
                        <RadioButton
                            data={covidCompliant}
                            selectedOption={formData.provideDecorationItem ? "true" : "false"}
                            setSelectedOption={(id) =>
                                setFormData((previous) => ({
                                    ...previous,
                                    provideDecorationItem: id === "true",
                                }))}
                        />
                    </section>
                    <section>
                        <Label>Do you provide sound system?</Label>
                        <RadioButton
                            data={covidCompliant}
                            selectedOption={formData.provideSounSystem ? "true" : "false"}
                            setSelectedOption={(id) =>
                                setFormData((previous) => ({
                                    ...previous,
                                    provideSounSystem: id === "true",
                                }))}
                        />
                    </section>
                    <section>
                        <Label>Do you provide seating arrangement?</Label>
                        <RadioButton
                            data={covidCompliant}
                            selectedOption={formData.provideSeatingArrangement ? "true" : "false"}
                            setSelectedOption={(id) =>
                                setFormData((previous) => ({
                                    ...previous,
                                    provideSeatingArrangement: id === "true",
                                }))}
                        />
                    </section>
                    <section>
                        <Label>Do you provide waiters?</Label>
                        <RadioButton
                            data={covidCompliant}
                            selectedOption={formData.provideWaiter ? "true" : "false"}
                            setSelectedOption={(id) =>
                                setFormData((previous) => ({
                                    ...previous,
                                    provideWaiter: id === "true",
                                }))}
                        />
                    </section>
                    <section>
                        <Label>Do you provide cutlery and plates?</Label>
                        <RadioButton
                            data={covidCompliant}
                            selectedOption={formData.providePlate ? "true" : "false"}
                            setSelectedOption={(id) =>
                                setFormData((previous) => ({
                                    ...previous,
                                    providePlate: id === "true",
                                }))}
                        />
                    </section>
                </div>
            }
            {(businessType === 'HENNA_ARTIST' || businessType === 'MAKEUP_ARTIST') &&
                <MultipleRadio
                    label="Services Provided for"
                    data={staff}
                    handleSelect={handleSelectServiceFor}
                    selectedIndexes={selectServiceForIndex}
                />
            }
            {businessType === 'WEDDING_VENUE' &&
                <div className="space-y-8">
                    <section>
                        <MultipleSelect
                            label="Amenities"
                            placeholder="Select Amenities"
                            data={amenitiesData}
                            handleSelectOption={handleSelectAmenities}
                            selectedOption={selectedAmenities}
                        />
                    </section>
                    <section className="space-y-3">
                        <Label>Maximum People Capacity</Label>
                        <Input
                            type="number"
                            placeholder="Enter maximum people capacity"
                            value={formData.maxCapacity || ""}
                            onChange={(e) =>
                                setFormData((prevData) => ({
                                    ...prevData,
                                    maxCapacity: String(e.target.value),
                                }))
                            }
                        />
                    </section>
                    <section>
                        <Label>Catering</Label>
                        <RadioButton
                            data={catering}
                            selectedOption={selectedCatering}
                            setSelectedOption={setSelectedCatering}
                        />
                    </section>
                    <section>
                        <Label>Parking</Label>
                        <RadioButton
                            data={parkingData}
                            selectedOption={parking}
                            setSelectedOption={setParking}
                        />
                    </section>
                </div>
            }
            <section>
                <MultipleRadio
                    label="Staff"
                    data={staff}
                    handleSelect={handleSelectStaff}
                    selectedIndexes={selectedStaffIndexes}
                />
            </section>
            {
                businessType === 'DECOR' &&
                <section className="space-y-4">
                    <Label>Do you provide Decor Items?</Label>
                    <RadioButton
                        data={covidCompliant}
                        selectedOption={decoritems}
                        setSelectedOption={setDecoritems}
                    />
                </section>
            }
            {
                businessType === 'HENNA_ARTIST' &&
                <section className="space-y-4">
                    <Label>Has Team</Label>
                    <RadioButton
                        data={covidCompliant}
                        selectedOption={hasTeam}
                        setSelectedOption={setHasTeam}
                    />
                </section>
            }
            {
                (businessType === 'HENNA_ARTIST' || businessType === 'MAKEUP_ARTIST') &&
                <section className="space-y-4">
                    <Label>Travels to Home?</Label>
                    <RadioButton
                        data={covidCompliant}
                        selectedOption={travelsToHome}
                        setSelectedOption={setTravelsToHome}
                    />
                </section>}
            {businessType === 'HENNA_ARTIST' &&
                <section className="space-y-4">
                    <Label>Sells Mehndi?</Label>
                    <RadioButton
                        data={covidCompliant}
                        selectedOption={sellMehndi}
                        setSelectedOption={setSellMehndi}
                    />
                </section>
            }
            {businessType === 'WEDDING_VENUE' &&
                <section className="space-y-3">
                    <Label>Car Parking Capacity</Label>
                    <Input
                        type="number"
                        placeholder="Enter Car Parking capacity"
                        value={formData.carParkingCapacity || ""}
                        onChange={(e) =>
                            setFormData((prevData) => ({
                                ...prevData,
                                carParkingCapacity: String(e.target.value),
                            }))
                        }
                    />
                </section>}
            <section className="space-y-3">
                <Label>Minimum Price</Label>
                <Input
                    type="number"
                    placeholder="Enter Minimum Price"
                    value={formData.minimumPrice || ""}
                    onChange={(e) =>
                        setFormData((prevData) => ({
                            ...prevData,
                            minimumPrice: Number(e.target.value),
                        }))
                    }
                />

            </section>
            <section className="space-y-3">
                <Label>Description</Label>
                <Textarea
                    placeholder="Enter Description"
                    name="description"
                    value={formData.description || ''}
                    onChange={(e) =>
                        setFormData((prevData) => ({
                            ...prevData,
                            description: e.target.value,
                        }))
                    }
                />
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
                <Select onValueChange={(value) => setFormData((prevData) => ({
                    ...prevData,
                    downPaymentType: value,
                }))}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Fixed Amount">Fixed Amount</SelectItem>
                        <SelectItem value="Percentage">Percentage</SelectItem>
                    </SelectContent>
                </Select>
            </section>
            <section className="space-y-3">
                <Label>Down Payment</Label>
                <Input
                    type="number"
                    placeholder="Enter Down Payment"
                    value={formData.downPayment || ''}
                    name="downPayment"
                    onChange={(e) =>
                        setFormData((prevData) => ({
                            ...prevData,
                            downPayment: Number(e.target.value),
                        }))
                    }
                />
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
                    setSelectedOption={setCancellation}
                />
            </section>
        </div>
    );
};

export default BusinessDetails;

import { FormType } from '@/lib/context/form-context';

function fleetMaxUnits(pkg: { features: Record<string, string[]> }): number {
    const raw = pkg.features?.unitsAvailable?.[0] ?? '';
    const num = parseInt(raw.replace(' Units', '').trim(), 10);
    return isNaN(num) || num < 1 ? 999 : num;
}

interface ValidationArgs {
    currentStep: number;
    formData: FormType;
    currentErrors: Record<string, string>;
}

export const CarRentalValidations = ({ currentStep, formData, currentErrors }: ValidationArgs) => {
    if (currentStep === 1) {
        if (!formData.fullName) currentErrors.fullName = 'Full Name is required';
        if (!formData.email) {
            currentErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            currentErrors.email = 'Invalid email address';
        }
        if (!formData.phoneNumber) {
            currentErrors.phoneNumber = 'Phone number is required';
        } else if (!/^3\d{9}$/.test(String(formData.phoneNumber))) {
            currentErrors.phoneNumber = 'Enter a valid 10-digit number starting with 3 (e.g. 3001234567)';
        }
        if (!formData.password) {
            currentErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            currentErrors.password = 'Password must be at least 8 characters';
        }
        if (!formData.re_enterPassword) {
            currentErrors.re_enterPassword = 'Re-enter your password';
        } else if (formData.password !== formData.re_enterPassword) {
            currentErrors.re_enterPassword = 'Passwords do not match';
        }
    } else if (currentStep === 2) {
        if (!formData.name) currentErrors.name = 'Business Name is required';
        if (formData.secondaryContactNumber) {
            if (!/^3\d{9}$/.test(String(formData.secondaryContactNumber))) {
                currentErrors.secondaryContactNumber = 'Enter a valid 10-digit number starting with 3 (e.g. 3001234567)';
            } else if (String(formData.secondaryContactNumber) === String(formData.phoneNumber)) {
                currentErrors.secondaryContactNumber = 'Secondary number must be different from your primary phone number';
            }
        }
        if (!formData.city) {
            currentErrors.city = 'City is required';
        } else if (!/^[a-zA-Z\s\-]+$/.test(formData.city)) {
            currentErrors.city = 'City must contain letters only';
        }
        if (!formData.officeAddress) {
            currentErrors.officeAddress = 'Office Address is required';
        } else if (formData.officeAddress.trim().length < 5) {
            currentErrors.officeAddress = 'Office Address is too short';
        }
        if (formData.instagram && !/^https?:\/\/(www\.)?instagram\.com\/.+/i.test(formData.instagram)) {
            currentErrors.instagram = 'Must be a valid Instagram link';
        }
        if (formData.facebook && !/^https?:\/\/(www\.)?facebook\.com\/.+/i.test(formData.facebook)) {
            currentErrors.facebook = 'Must be a valid Facebook link';
        }
        if (formData.officeGoogleLink && !/google\.com\/maps|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl/i.test(formData.officeGoogleLink)) {
            currentErrors.officeGoogleLink = 'Must be a valid Google Maps link';
        }
    } else if (currentStep === 3) {
        if (!formData.description) currentErrors.description = 'Business description is required';
        if (!formData.downPaymentType) currentErrors.downPaymentType = 'Down payment type is required';
        if (!formData.downPayment || Number(formData.downPayment) <= 0) {
            currentErrors.downPayment = 'Down payment amount is required';
        } else if (formData.downPaymentType === 'Percentage' && Number(formData.downPayment) > 100) {
            currentErrors.downPayment = 'Percentage must be between 1 and 100';
        }
        if (!formData.cancelationPolicy) currentErrors.cancelationPolicy = 'Cancellation policy is required';
    } else if (currentStep === 4) {
        const validCars = formData.packages?.filter((pkg) => pkg.name?.trim() && pkg.price) ?? [];
        if (validCars.length === 0) {
            currentErrors.packages = 'Please add at least one car with make/model and price';
        }
        formData.packages?.forEach((pkg, index) => {
            if (!pkg.name?.trim()) {
                currentErrors[`packages[${index}].name`] = 'Car make and model are required';
            }
            if (!pkg.price) {
                currentErrors[`packages[${index}].price`] = 'Price per event is required';
            }
        });
    } else if (currentStep === 5) {
        // Images temporarily optional — storage backend not wired up.
        // 20-cap still enforced. See business-registration-form
        // IMAGE_UPLOADS_ENABLED constant for the platform-wide flag.
        const imageCount = formData.imageFiles?.length ?? 0;
        if (imageCount > 20) {
            currentErrors.images = `Maximum 20 images allowed. Remove ${imageCount - 20} image(s).`;
        }
    } else if (currentStep === 6) {
        // Package screen is optional — only validate entries that exist
        const pkgs = formData.carRentalPackages ?? [];
        const fleet = formData.packages.filter((p) => p.name?.trim());

        pkgs.forEach((pkg, i) => {
            if (!pkg.name?.trim()) {
                currentErrors[`crPkg[${i}].name`] = 'Package name is required';
            }
            if (!pkg.totalPrice || Number(pkg.totalPrice) <= 0) {
                currentErrors[`crPkg[${i}].price`] = 'Total price is required';
            }
            const validCars = pkg.cars?.filter((c) => c.carIndex >= 0) ?? [];
            if (validCars.length === 0) {
                currentErrors[`crPkg[${i}].cars`] = 'Select at least one car';
            }
            pkg.cars?.forEach((c, ci) => {
                if (c.carIndex >= 0) {
                    const fleetCar = fleet[c.carIndex];
                    if (fleetCar) {
                        const max = fleetMaxUnits(fleetCar);
                        if (!c.quantity || c.quantity < 1) {
                            currentErrors[`crPkg[${i}].car[${ci}].qty`] = 'Quantity must be at least 1';
                        } else if (c.quantity > max) {
                            currentErrors[`crPkg[${i}].car[${ci}].qty`] = `Only ${max} unit(s) available`;
                        }
                    }
                }
            });
            if (!pkg.citiesCovered?.length) {
                currentErrors[`crPkg[${i}].cities`] = 'Select at least one city';
            }
        });
    }
};

import { FormType } from '@/lib/context/form-context';

interface ValidationArgs {
    currentStep: number;
    formData: FormType;
    currentErrors: Record<string, string>;
}

export const BridalWearValidations = ({ currentStep, formData, currentErrors }: ValidationArgs) => {
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
        if (!formData.subBusinessType || formData.subBusinessType.length === 0) {
            currentErrors.subBusinessType = 'Please select a store type';
        }
    } else if (currentStep === 5) {
        if (!formData.instruction) currentErrors.instruction = 'Lead time is required';
    } else if (currentStep === 6) {
        const imageCount = formData.imageFiles?.length ?? 0;
        if (imageCount === 0) {
            currentErrors.images = 'Please upload at least one image of your store / outfits';
        } else if (imageCount > 20) {
            currentErrors.images = `Maximum 20 images allowed. Remove ${imageCount - 20} image(s).`;
        }
    } else if (currentStep === 7) {
        // Outfit listings are optional — only validate entries that exist
        const listings = formData.packages ?? [];
        const validListings = listings.filter((p) => p.name?.trim() || p.price > 0);
        validListings.forEach((pkg, i) => {
            if (!pkg.name?.trim()) {
                currentErrors[`packages[${i}].name`] = 'Outfit name is required';
            }
            if (!pkg.price || pkg.price <= 0) {
                currentErrors[`packages[${i}].price`] = 'Price is required';
            }
        });
    }
};

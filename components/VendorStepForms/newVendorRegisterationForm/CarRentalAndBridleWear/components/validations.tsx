import { FormType } from "@/lib/context/form-context";

type ValidationTypes = {
    currentStep: number;
    formData: FormType;
    currentErrors: {
        [key: string]: string;
    };
};

export const CarRentalOrBridleWearValidations = ({currentStep, formData, currentErrors }: ValidationTypes) => {
    if (currentStep === 1) {
        if (!formData.fullName) currentErrors.fullName = "Full Name is required";
        if (!formData.email) {
          currentErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          currentErrors.email = "Invalid email address";
        }
        if (!formData.phoneNumber) {
          currentErrors.phoneNumber = "Phone number is required";
        } else if (!/^3\d{9}$/.test(String(formData.phoneNumber))) {
          currentErrors.phoneNumber = "Enter a valid 10-digit number starting with 3 (e.g. 3001234567)";
        }
        if (!formData.password) {
          currentErrors.password = "Password is required";
        } else if (formData.password.length < 8) {
          currentErrors.password = "Password must be at least 8 characters";
        }
        if (!formData.re_enterPassword) {
          currentErrors.re_enterPassword = "Re-Enter your Password";
        } else if (formData.password !== formData.re_enterPassword) {
          currentErrors.re_enterPassword = "Password do not match";
        }
      } else if (currentStep === 2) {
        if (!formData.name) currentErrors.name = "Brand Name is required";
        if (formData.secondaryContactNumber) {
          if (!/^3\d{9}$/.test(String(formData.secondaryContactNumber))) {
            currentErrors.secondaryContactNumber = "Enter a valid 10-digit number starting with 3 (e.g. 3001234567)";
          } else if (String(formData.secondaryContactNumber) === String(formData.phoneNumber)) {
            currentErrors.secondaryContactNumber = "Secondary number must be different from your primary phone number";
          }
        }
        if (!formData.city) {
          currentErrors.city = "City is required";
        } else if (!/^[a-zA-Z\s\-]+$/.test(formData.city)) {
          currentErrors.city = "City must contain letters only";
        }
        if (!formData.officeAddress) {
          currentErrors.officeAddress = "Office Address is required";
        } else if (formData.officeAddress.includes("@") || /^https?:\/\//i.test(formData.officeAddress)) {
          currentErrors.officeAddress = "Please enter a valid office address";
        } else if (formData.officeAddress.trim().length < 5) {
          currentErrors.officeAddress = "Office Address is too short";
        }

        if (formData.instagram && !/^https?:\/\/(www\.)?instagram\.com\/.+/i.test(formData.instagram)) {
          currentErrors.instagram = "Must be a valid Instagram link (e.g. https://instagram.com/youraccount)";
        }

        if (formData.facebook && !/^https?:\/\/(www\.)?facebook\.com\/.+/i.test(formData.facebook)) {
          currentErrors.facebook = "Must be a valid Facebook link (e.g. https://facebook.com/yourpage)";
        }

        if (formData.officeGoogleLink && !/google\.com\/maps|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl/i.test(formData.officeGoogleLink)) {
          currentErrors.officeGoogleLink = "Must be a valid Google Maps link";
        }
      }
  }

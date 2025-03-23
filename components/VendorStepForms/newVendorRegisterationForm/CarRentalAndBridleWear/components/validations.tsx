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
        if (!formData.email) currentErrors.email = "Email is required";
        if (!formData.phoneNumber) currentErrors.phoneNumber = "Phone number is required";
        if (!formData.password) currentErrors.password = "Password is required";
        if (!formData.re_enterPassword) {
          currentErrors.re_enterPassword = "Re-Enter your Password";
        } else if (formData.password !== formData.re_enterPassword) {
          currentErrors.re_enterPassword = "Password do not match";
        }
      } else if (currentStep === 2) {
        if (!formData.name) currentErrors.name = "Brand Name is required";
        if (!formData.secondaryContactNumber) {
          currentErrors.secondaryContactNumber = "Secondary Contact Number is required";
        } else if (!/^\d+$/.test(formData.secondaryContactNumber)) {
          currentErrors.secondaryContactNumber = "Invalid phone number format";
        }
        if (!formData.city) currentErrors.city = "City is required";
        if (!formData.officeAddress) currentErrors.officeAddress = "Office Address is required";
    
        const urlPattern = /^(https?:\/\/)/;
        if (!formData.instagram) {
          currentErrors.instagram = "Instagram Link is required";
        } else if (!urlPattern.test(formData.instagram)) {
          currentErrors.instagram = "Invalid Instagram link";
        }
    
        if (!formData.officeGoogleLink) {
          currentErrors.officeGoogleLink = "Google Maps link is required";
        } else if (!urlPattern.test(formData.officeGoogleLink)) {
          currentErrors.officeGoogleLink = "Invalid Google Maps link";
        }
      }
  }

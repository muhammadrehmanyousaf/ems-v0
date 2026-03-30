import { FormType } from "@/lib/context/form-context";

type ValidationTypes = {
    currentStep: number;
    formData: FormType;
    currentErrors: {
        [key: string]: string;
    };
};

export const vanueValidations = ({currentStep, formData, currentErrors }: ValidationTypes) => {
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
      else if (currentStep == 3) {
        if (formData.subBusinessType.length === 0) currentErrors.subBusinessType = "Venue Type is required";
        if (formData.expertise.length === 0) currentErrors.expertise = "Expertise is required";
        if (formData.amenities.length === 0) currentErrors.amenities = "Amenities is required";
        if (formData.staff.length === 0) currentErrors.staff = "Staff is required";
        if (!formData.maxCapacity) currentErrors.maxCapacity = "Maximum Capacity is required";
if (!formData.description) currentErrors.description = "Description is required";
        if (!formData.downPaymentType) currentErrors.downPaymentType = "Down Payment Type is required";
        if (!formData.downPayment) currentErrors.downPayment = "Down Payment is required";
        if (!formData.cancelationPolicy) currentErrors.cancelationPolicy = "Cancelation Policy is required";
        if (formData.parking !== false && formData.parking !== true) currentErrors.parking = "Parking is required";
      }
      else if (currentStep === 4) {
        if (formData.packages && formData.packages.length > 0) {
          const hasEmptyFields = formData.packages.some(pkg =>
            !pkg.name?.trim() || !pkg.price || isNaN(Number(pkg.price)) || !pkg.services?.trim()
          );
    
          if (hasEmptyFields) {
            currentErrors.packages = "Please fill all the required fields";
          }
        }
      }
      else if (currentStep === 5) {
        if (formData.images.length < 1) currentErrors.images = "Images are required";
      }
  }

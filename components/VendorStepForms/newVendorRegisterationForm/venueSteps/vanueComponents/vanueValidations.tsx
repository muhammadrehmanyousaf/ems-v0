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
        if (!formData.email) {
          currentErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          currentErrors.email = "Invalid email address";
        }
        if (!formData.phoneNumber) currentErrors.phoneNumber = "Phone number is required";
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
        if (!formData.secondaryContactNumber) {
          currentErrors.secondaryContactNumber = "Secondary Contact Number is required";
        } else if (!/^\d+$/.test(String(formData.secondaryContactNumber))) {
          currentErrors.secondaryContactNumber = "Invalid phone number format";
        }
        if (!formData.city) currentErrors.city = "City is required";
        if (!formData.subArea) currentErrors.subArea = "Sub Area is required";
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
        if (!Array.isArray(formData.subBusinessType) || formData.subBusinessType.length === 0) currentErrors.subBusinessType = "Venue Type is required";
        if (!Array.isArray(formData.expertise) || formData.expertise.length === 0) currentErrors.expertise = "Expertise is required";
        if (!Array.isArray(formData.amenities) || formData.amenities.length === 0) currentErrors.amenities = "Amenities is required";
        if (!Array.isArray(formData.staff) || formData.staff.length === 0) currentErrors.staff = "Staff is required";
        if (!formData.maxCapacity) currentErrors.maxCapacity = "Maximum Capacity is required";
        if (!formData.description) currentErrors.description = "Description is required";
        if (!formData.downPaymentType) currentErrors.downPaymentType = "Down Payment Type is required";
        if (!formData.downPayment || Number(formData.downPayment) <= 0) currentErrors.downPayment = "Down Payment is required";
        else if (formData.downPaymentType === "Percentage" && Number(formData.downPayment) > 100) currentErrors.downPayment = "Percentage must be between 0 and 100";
        if (!formData.cancelationPolicy) currentErrors.cancelationPolicy = "Cancelation Policy is required";
        if (formData.parking !== false && formData.parking !== true) currentErrors.parking = "Parking is required";
      }
      else if (currentStep === 4) {
        const validPackages = formData.packages?.filter(pkg => pkg.name?.trim() && pkg.price) ?? [];
        if (validPackages.length === 0) {
          currentErrors.packages = "At least one package with a name and price is required";
        }
        formData.packages?.forEach((pkg, index) => {
          if (!pkg.name?.trim()) {
            currentErrors[`packages[${index}].name`] = "Package name is required";
          }
          if (!pkg.price || isNaN(Number(pkg.price))) {
            currentErrors[`packages[${index}].price`] = "Package price is required";
          }
          if (pkg.features && typeof pkg.features === "object" && !Array.isArray(pkg.features)) {
            Object.keys(pkg.features).forEach((feature) => {
              const items = (pkg.features as Record<string, string[]>)[feature];
              if (items && items.length > 0) {
                const hasEmptyItem = items.some((item: string) => item.trim() === "");
                if (hasEmptyItem) {
                  currentErrors[`packages[${index}].features.${feature}`] = `All ${feature} fields must be filled in`;
                }
              }
            });
          }
        });
      }
      else if (currentStep === 5) {
        if (formData.images.length < 1) currentErrors.images = "Images are required";
      }
  }

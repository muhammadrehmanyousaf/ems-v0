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
        if (!formData.subArea) {
          currentErrors.subArea = "Sub Area is required";
        } else if (!/^[a-zA-Z0-9\s\-]+$/.test(formData.subArea)) {
          currentErrors.subArea = "Sub Area must contain letters, numbers, or hyphens only";
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
      else if (currentStep == 3) {
        if (!formData.subBusinessType || (Array.isArray(formData.subBusinessType) ? formData.subBusinessType.length === 0 : formData.subBusinessType.trim() === '')) currentErrors.subBusinessType = "Venue Type is required";
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
      // VR-050 — venue flow inserted a "Specialty & Trust" step at 4, so
      // Packages is now 5 and Images is now 6. Step 4 is fully optional
      // (no validation required).
      else if (currentStep === 5) {
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
      else if (currentStep === 6) {
        // Images temporarily optional — storage backend not wired up.
        // See business-registration-form IMAGE_UPLOADS_ENABLED for the
        // platform-wide flag; venue can complete registration without
        // photos for now.
      }
  }

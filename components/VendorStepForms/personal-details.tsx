import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Flag } from "lucide-react";
import { useFormContext } from "@/lib/context/form-context";

const PersonalDetails = ({
  errors,
  setErrors,
}: {
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}) => {
  const { setFormData, formData } = useFormContext();

  console.log("error:", errors);

  const formFields = [
    {
      label: "Full Name",
      place: "Enter your full name here",
      name: "fullName",
    },
    {
      label: "Email",
      place: "Enter your email here",
      type: "email",
      name: "email",
    },
    {
      label: "Phone Number",
      place: "+92 123xxxxxx",
      type: "number",
      name: "phoneNumber",
    },
    {
      label: "Password",
      place: "***********",
      type: "password",
      name: "password",
    },
    {
      label: "Re-enter Password",
      place: "***********",
      type: "password",
      name: "reEnterPassword",
    },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const { value, type } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: type === "number" ? Number(value) : value,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: "",
    }));

    if (fieldName === "reEnterPassword") {
      if (value !== formData.password) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          reEnterPassword: "Passwords do not match",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          reEnterPassword: "",
        }));
      }
    }
  };

  return (
    <div className="space-y-6">
      {formFields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label>{field.label}</Label>
          {field.name === "phoneNumber" ? (
            <div className="flex">
              <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-gray-50">
                <Flag className="w-4 h-4 text-gray-500" />
                <span className="ml-2 text-sm text-gray-500">+92</span>
              </div>
              <Input
                type={field.type}
                placeholder={field.place}
                className="rounded-l-none"
                value={String(formData[field.name as keyof typeof formData] ?? "")}
                onChange={(e) => handleChange(e, field.name)}
              />
            </div>
          ) : (
            <Input
              type={field.type || "text"}
              placeholder={field.place}
              value={String(formData[field.name as keyof typeof formData] ?? "")}
              onChange={(e) => handleChange(e, field.name)}
            />
          )}

          {/* ✅ Display error message if it exists */}
          {errors[field.name] && (
            <p className="text-xs text-red-500">{errors[field.name]}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default PersonalDetails;

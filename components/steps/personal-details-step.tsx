"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormData, formSchema } from "@/lib/formSchema/vendor-schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Flag } from "lucide-react";

interface FormInterface {
  onSubmit: (data: Partial<FormData>) => void;
}

export function PersonalDetailsStep({ onSubmit }: FormInterface) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: 0,
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Enter your full name"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="Enter your email address"
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
      </div>

      {/* Contact Number */}
      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Contact Number *</Label>
        <div className="flex">
          <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-gray-50">
            <Flag className="w-4 h-4 text-gray-500" />
            <span className="ml-2 text-sm text-gray-500">+92</span>
          </div>
          <Input
            id="phoneNumber"
            type="tel"
            {...register("phoneNumber")}
            placeholder="Enter your phone number"
            className="rounded-l-none"
          />
        </div>
        {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          placeholder="Enter your password"
        />
        {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Retype Password *</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword")}
          placeholder="Confirm your password"
        />
        {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
      </div>

      {/* Terms Agreement Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox id="agreeToTerms" />
        <Label htmlFor="agreeToTerms" className="text-sm text-gray-700">
          Agree to{" "}
          <Link href="/terms" className="text-rose-600 hover:underline">
            Terms & Conditions
          </Link>
        </Label>
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}

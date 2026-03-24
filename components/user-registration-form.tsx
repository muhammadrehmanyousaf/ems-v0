"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { BACKEND_URL } from "@/lib/backend-url";
import { toast } from "./ui/use-toast";
import { useRouter } from "next/navigation";
import { Heart, Sparkles, Users, Calendar } from "lucide-react";
import { usePlatformStats } from "@/hooks/use-platform-stats";

const formSchema = z
  .object({
    fullName: z
      .string()
      .min(2, { message: "Name must be at least 2 characters" })
      .refine((value) => /^[A-Z]/.test(value), {
        message: "First letter must be capitalized",
      }),
    email: z.string().email({ message: "Invalid email address" }),
    phoneNumber: z
      .string()
      .length(11, { message: "Phone number must be exactly 11 digits" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

export function UserRegistrationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { data: stats, isLoading: isLoadingStats } = usePlatformStats();
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const router = useRouter();

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}api/v1/auth/signup`, {
        ...data,
        roleIds: [3],
      });

      if (response.status === 200) {
        reset();
        toast({
          title: "Account Created!",
          description:
            "Your account has been successfully registered. You can now log in.",
        });
        router.push("/login");
      }
    } catch (error: any) {
      // Extract error message from backend response
      const errorMessage =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";

      toast({
        title: "Sign-Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative panel (hidden on mobile) */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 overflow-hidden"
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-16 w-32 h-32 border border-gold-500/20 rounded-full" />
        <div className="absolute top-1/4 left-20 w-20 h-20 border border-purple-400/20 rounded-full" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto shadow-xl border border-gold-500/20">
              <Sparkles className="w-8 h-8 text-gold-400" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-white">
              Begin Your Journey
            </h2>
            <p className="text-purple-200 text-lg leading-relaxed">
              Join thousands of couples who found their dream wedding vendors on
              our platform.
            </p>

            {/* Stats cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-10 grid grid-cols-2 gap-4"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
                <Users className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                {isLoadingStats ? (
                  <Icons.spinner className="w-6 h-6 text-white animate-spin mx-auto" />
                ) : (
                  <p className="text-2xl font-bold text-white">
                    {stats ? `${stats.couplesServed}+` : "10K+"}
                  </p>
                )}
                <p className="text-xs text-purple-200">Happy Couples</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
                <Heart className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                {isLoadingStats ? (
                  <Icons.spinner className="w-6 h-6 text-white animate-spin mx-auto" />
                ) : (
                  <p className="text-2xl font-bold text-white">
                    {stats ? `${stats.vendors}+` : "500+"}
                  </p>
                )}
                <p className="text-xs text-purple-200">Vendors</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
                <Calendar className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                {isLoadingStats ? (
                  <Icons.spinner className="w-6 h-6 text-white animate-spin mx-auto" />
                ) : (
                  <p className="text-2xl font-bold text-white">
                    {stats ? `${stats.cities}+` : "50+"}
                  </p>
                )}
                <p className="text-xs text-purple-200">Cities</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
                <Sparkles className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                {isLoadingStats ? (
                  <Icons.spinner className="w-6 h-6 text-white animate-spin mx-auto" />
                ) : (
                  <p className="text-2xl font-bold text-white">4.8</p>
                )}
                <p className="text-xs text-purple-200">Avg Rating</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Right side - Form */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50/30 to-white px-4 py-8"
      >
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-gold-400" />
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-heading font-bold text-neutral-900">
              Create an account
            </h1>
            <p className="text-neutral-500">
              Enter your details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="relative">
              <Input
                id="name"
                placeholder=" "
                type="text"
                autoCapitalize="words"
                autoComplete="name"
                autoCorrect="off"
                {...register("fullName")}
                className={cn(
                  "peer h-12 w-full rounded-xl border bg-white px-4 pt-4 pb-1 text-sm placeholder-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200",
                  errors.fullName ? "border-red-400" : "border-neutral-200",
                )}
              />
              <Label
                htmlFor="name"
                className="absolute left-4 top-1 text-[10px] text-neutral-400 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-purple-600"
              >
                Full Name
              </Label>
              {errors.fullName && (
                <p className="text-xs text-red-500 mt-1 ml-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="relative">
              <Input
                id="email"
                placeholder=" "
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                {...register("email")}
                className={cn(
                  "peer h-12 w-full rounded-xl border bg-white px-4 pt-4 pb-1 text-sm placeholder-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200",
                  errors.email ? "border-red-400" : "border-neutral-200",
                )}
              />
              <Label
                htmlFor="email"
                className="absolute left-4 top-1 text-[10px] text-neutral-400 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-purple-600"
              >
                Email address
              </Label>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 ml-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="relative">
              <Input
                id="phoneNumber"
                placeholder=" "
                autoCapitalize="none"
                autoCorrect="off"
                {...register("phoneNumber")}
                className={cn(
                  "peer h-12 w-full rounded-xl border bg-white px-4 pt-4 pb-1 text-sm placeholder-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200",
                  errors.phoneNumber ? "border-red-400" : "border-neutral-200",
                )}
              />
              <Label
                htmlFor="phoneNumber"
                className="absolute left-4 top-1 text-[10px] text-neutral-400 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-purple-600"
              >
                Phone Number
              </Label>
              {errors.phoneNumber && (
                <p className="text-xs text-red-500 mt-1 ml-1">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <Input
                id="password"
                placeholder=" "
                type="password"
                autoCapitalize="none"
                autoComplete="new-password"
                {...register("password")}
                className={cn(
                  "peer h-12 w-full rounded-xl border bg-white px-4 pt-4 pb-1 text-sm placeholder-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200",
                  errors.password ? "border-red-400" : "border-neutral-200",
                )}
              />
              <Label
                htmlFor="password"
                className="absolute left-4 top-1 text-[10px] text-neutral-400 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-purple-600"
              >
                Password
              </Label>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1 ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Input
                id="confirmPassword"
                placeholder=" "
                type="password"
                autoCapitalize="none"
                autoComplete="new-password"
                {...register("confirmPassword")}
                className={cn(
                  "peer h-12 w-full rounded-xl border bg-white px-4 pt-4 pb-1 text-sm placeholder-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200",
                  errors.confirmPassword
                    ? "border-red-400"
                    : "border-neutral-200",
                )}
              />
              <Label
                htmlFor="confirmPassword"
                className="absolute left-4 top-1 text-[10px] text-neutral-400 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-purple-600"
              >
                Confirm Password
              </Label>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1 ml-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg shadow-purple-200/50 hover:shadow-xl transition-all duration-300"
            >
              {isLoading && (
                <Icons.spinner className="w-4 h-4 mr-2 animate-spin" />
              )}
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 bg-gradient-to-br from-purple-50/30 to-white text-neutral-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              type="button"
              className="h-11 rounded-xl border-neutral-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
            >
              <Icons.google className="w-4 h-4 mr-2" />
              Google
            </Button>
            <Button
              variant="outline"
              type="button"
              className="h-11 rounded-xl border-neutral-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
            >
              <Icons.facebook className="w-4 h-4 mr-2" />
              Facebook
            </Button>
          </div>

          {/* Footer links */}
          <div className="space-y-2 text-center">
            <p className="text-sm text-neutral-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                Sign in
              </Link>
            </p>
            <p className="text-sm">
              <Link
                href="/business-registration"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Register your business
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

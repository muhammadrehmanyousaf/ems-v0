"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from 'axios';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { BACKEND_URL } from "@/lib/backend-url"
import { toast } from "./ui/use-toast"
import { useRouter } from "next/navigation"

const formSchema = z
  .object({
    fullName: z.string().min(2, { message: "Name must be at least 2 characters" })
    .refine((value) => /^[A-Z]/.test(value), {
      message: 'First letter must be capitalized'
    }),
    email: z.string().email({ message: "Invalid email address" }),
    phoneNumber: z.string().length(11, { message: "Phone number must be exactly 11 digits" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  })

type FormData = z.infer<typeof formSchema>

export function UserRegistrationForm() {
  const [isLoading, setIsLoading] = useState(false)
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const router = useRouter()

  async function onSubmit(data: FormData) {
    setIsLoading(true);
  
    try {
      const response = await axios.post(`${BACKEND_URL}api/v1/auth/signup`, {
        ...data,
        roleIds: [3],
      });

      if (response.status === 200) {
        // console.log("Success:", response.data);
        reset();
        toast({
          title: "Account Created!",
          description: "Your account has been successfully registered. You can now log in.",
        });
        router.push('/login');
      }
    } catch (error: any) {
      // console.error("Error:", error);
  
      // Extract error message from backend response
      const errorMessage =
        error.response?.data?.message || "Something went wrong. Please try again.";
  
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
    <div className=" min-h-screen bg-gray-50">
      <div className="flex flex-col justify-center w-full max-w-md px-4 py-12 mx-auto sm:px-6 lg:px-8">
        {/* <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/placeholder.svg" alt="EMS Logo" width={48} height={48} className="w-12 h-12" />
            <span className="text-3xl font-bold text-gray-900">EMS</span>
          </Link>
        </div> */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full p-8 bg-white rounded-xl shadow-lg space-y-6"
        >
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create an account</h1>
            <p className="text-sm text-gray-500">Enter your details to register</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                type="text"
                autoCapitalize="words"
                autoComplete="name"
                autoCorrect="off"
                {...register("fullName")}
                className={cn("w-full px-3 py-2 border rounded-md", errors.fullName && "border-red-500")}
              />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="m@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                {...register("email")}
                className={cn("w-full px-3 py-2 border rounded-md", errors.email && "border-red-500")}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Phone Number</Label>
              <Input
                id="phoneNumber"
                placeholder="03xxxxxxxxx"
                // type="number"
                autoCapitalize="none"
                autoCorrect="off"
                {...register("phoneNumber")}
                className={cn("w-full px-3 py-2 border rounded-md", errors.email && "border-red-500")}
              />
              {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoCapitalize="none"
                autoComplete="new-password"
                {...register("password")}
                className={cn("w-full px-3 py-2 border rounded-md", errors.password && "border-red-500")}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoCapitalize="none"
                autoComplete="new-password"
                {...register("confirmPassword")}
                className={cn("w-full px-3 py-2 border rounded-md", errors.confirmPassword && "border-red-500")}
              />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white" disabled={isLoading}>
              {isLoading && <Icons.spinner className="w-4 h-4 mr-2 animate-spin" />}
              Register
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" type="button">
              <Icons.google className="w-4 h-4 mr-2" />
              Google
            </Button>
            <Button variant="outline" type="button">
              <Icons.facebook className="w-4 h-4 mr-2" />
              Facebook
            </Button>
          </div>
          <p className="text-sm text-center text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-rose-600 hover:underline">
              Sign in
            </Link>
          </p>
          <div className="text-sm text-center">
            <Link href="/business-registration" className="text-rose-600 hover:underline">
              Register your business
            </Link>
          </div>
        </motion.div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1">
        <Image
          className="absolute inset-0 h-full w-full object-cover"
          src="/wedding-illustration.png"
          alt="Wedding Celebration Illustration"
          layout="fill"
        />
      </div>
    </div>
  )
}
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
import { useUser } from "@/context/UserContext"

const formSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  })

type FormData = z.infer<typeof formSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { setUser } = useUser()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const router = useRouter()

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${BACKEND_URL}api/v1/auth/login`, data);
      console.log('Login response:', response); // Log the response for debugging
      if (response.status === 200) {
        const userData = response.data;
        console.log('User data:', userData); // Log the user data for debugging
        localStorage.setItem('profile', JSON.stringify(userData));
        setUser(userData.data.user); // Set user data in context
        console.log("User data saved to local storage:", userData.data.user.roles[0].id); // Log the user data for debugging
        if ( userData.data.user.roles[0].id===3) {
          router.push('/');
          console.log('Login successful', userData);
        } else {
          toast({
            title: "Login Failed",
            description: "You do not have the required permissions.",
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: "Login Failed",
          description: response.data.message || "Something went wrong. Please try again.",
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error("Login error:", error); // Add this line to log the error
      toast({
        title: "Network Error",
        description: "Check your internet connection and try again.",
        variant: 'destructive'
      });      
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col justify-center w-full max-w-md px-4 py-12 mx-auto sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full p-8 bg-white rounded-xl shadow-lg space-y-6"
        >
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Sign in to your account</h1>
            <p className="text-sm text-gray-500">Enter your details to login</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoCapitalize="none"
                autoComplete="current-password"
                {...register("password")}
                className={cn("w-full px-3 py-2 border rounded-md", errors.password && "border-red-500")}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white" disabled={isLoading}>
              {isLoading && <Icons.spinner className="w-4 h-4 mr-2 animate-spin" />}
              Sign In
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
            Don't have an account?{" "}
            <Link href="/register" className="text-rose-600 hover:underline">
              Sign up
            </Link>
          </p>
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


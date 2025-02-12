"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import axios from "axios"
import { BACKEND_URL } from "@/lib/backend-url"
import { useRouter } from "next/navigation"
import { toast } from "./ui/use-toast"
import Cookies from "js-cookie"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
})

type FormData = z.infer<typeof formSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const router = useRouter()
  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}api/v1/auth/login`, data);
      
      if (response.status === 200) {
        const resData = response.data;
        const {user, token} = resData.data
        console.log('response', response);
        
        
        localStorage.setItem("user", JSON.stringify(user.id));
        localStorage.setItem("token", token)
        Cookies.set("user", user.id);
        Cookies.set("token",token);
        
        toast({
          title:'Logged in successfully',
          description: 'You are logged in successfully'
        });
        reset()
        if(user.roles[0].id === 1 || user.roles[0].id === 2) {
          router.push('/dashboard')
        }else if(user.roles[0].id === 3) {
          router.push('/')
        } else{
          toast({
            title: 'No role found'
          })
        }
      }else{
        toast({
          title: 'Login failed',
          description: `Error: ${response?.data.message}`
        })
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message
      console.error("Login error:", error);
      toast({
        title: 'Login failed',
        description: `error: ${errorMessage || 'Something went wrong. Please try again later.'}`
        });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" min-h-screen bg-gray-50 ">
      <div className="flex flex-col justify-center w-full max-w-md px-4 py-12 mx-auto sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full p-8 bg-white rounded-xl shadow-lg space-y-6"
        >
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome to EMS</h1>
            <p className="text-sm text-gray-500">Enter your email to sign in to your account</p>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-rose-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
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
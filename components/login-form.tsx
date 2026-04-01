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
import Link from "next/link"
import axiosInstance from "@/lib/axiosConfig"
import { useRouter } from "next/navigation"
import { toast } from "./ui/use-toast"
import { useUser } from "@/context/UserContext"
import { Heart, Star, Quote, Eye, EyeOff } from "lucide-react"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
})

type FormData = z.infer<typeof formSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useUser()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const router = useRouter()

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)

      const response = await axiosInstance.post('/api/v1/auth/login', {
        email: data.email,
        password: data.password,
      })

      if (response.status === 200) {
        const resData = response.data;
        const {user, token} = resData.data

        // Use the UserContext login function
        login(user, token);

        toast({
          title: 'Login successful',
          description: 'Welcome back!',
        })
        reset()

        // Route based on user role — vendors and admins go to dashboard
        const isAdmin = user.roles?.some(
          (role: any) =>
            role.id === 1 ||
            role.name?.toLowerCase() === 'super admin' ||
            role.name?.toLowerCase() === 'admin'
        )
        const isVendor =
          user.isVendor === true ||
          user.roles?.some(
            (role: any) =>
              role.id === 2 ||
              role.name?.toLowerCase() === 'vendor'
          )

        if (isAdmin || isVendor) {
          router.push('/dashboard')
        } else {
          router.push('/')
        }
      }else{
        toast({
          title: 'Login failed',
          description: 'Invalid credentials',
        })
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message
      toast({
        title: 'Login failed',
        description: errorMessage || 'Something went wrong',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative panel (hidden on mobile) */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 overflow-hidden"
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-700/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-10 w-40 h-40 border border-purple-500/20 rounded-full" />
        <div className="absolute bottom-1/4 left-16 w-24 h-24 border border-gold-500/20 rounded-full" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto shadow-xl border border-gold-500/20">
              <Heart className="w-8 h-8 text-gold-400" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-white">
              Welcome Back
            </h2>
            <p className="text-purple-200 text-lg leading-relaxed">
              Continue planning your perfect wedding with the best vendors and venues.
            </p>

            {/* Testimonial card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-10 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-left"
            >
              <Quote className="w-8 h-8 text-gold-400/60 mb-3" />
              <p className="text-purple-100 text-sm leading-relaxed italic">
                &ldquo;This platform made our wedding planning journey so much easier. Found the perfect photographers and venue in just a few days!&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold text-sm">
                  S
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Sarah & Ahmed</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-gold-400 fill-gold-400" />
                    ))}
                  </div>
                </div>
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
        className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50/30 to-white px-4 py-12"
      >
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-gold-400" />
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-heading font-bold text-neutral-900">Sign in</h1>
            <p className="text-neutral-500">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email field with floating label */}
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
                  errors.email ? "border-red-400" : "border-neutral-200"
                )}
              />
              <Label
                htmlFor="email"
                className="absolute left-4 top-1 text-[10px] text-neutral-400 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-purple-600"
              >
                Email address
              </Label>
              {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>}
            </div>

            {/* Password field with floating label */}
            <div className="relative">
              <Input
                id="password"
                placeholder=" "
                type={showPassword ? "text" : "password"}
                autoCapitalize="none"
                autoComplete="current-password"
                {...register("password")}
                className={cn(
                  "peer h-12 w-full rounded-xl border bg-white px-4 pt-4 pb-1 pr-10 text-sm placeholder-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200",
                  errors.password ? "border-red-400" : "border-neutral-200"
                )}
              />
              <Label
                htmlFor="password"
                className="absolute left-4 top-1 text-[10px] text-neutral-400 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-purple-600"
              >
                Password
              </Label>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-[22px] -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <div className="flex justify-end mt-1">
                <Link href="/forgot-password" className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg shadow-purple-200/50 hover:shadow-xl transition-all duration-300"
            >
              {isLoading && <Icons.spinner className="w-4 h-4 mr-2 animate-spin" />}
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 bg-gradient-to-br from-purple-50/30 to-white text-neutral-400">Or continue with</span>
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
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-purple-600 hover:text-purple-700 font-semibold">
                Sign up
              </Link>
            </p>
            <p className="text-sm">
              <Link href="/business-registration" className="text-purple-600 hover:text-purple-700 font-medium">
                Register your business
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

export default function VendorLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const storedVendors = localStorage.getItem('vendors')

      if (!storedVendors) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "No registered vendors found.",
        })
        return
      }

      const vendors = JSON.parse(storedVendors)
      const vendor = vendors.find(
        (v: any) => v.email.toLowerCase() === email.toLowerCase() && v.password === password
      )

      if (vendor) {
        // Set auth state
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('currentVendor', JSON.stringify(vendor))
        document.cookie = `isAuthenticated=true; path=/`
        
        // Show toast
        toast({
          title: "Login successful",
          description: "Welcome back!",
        })

        // Use Next.js router for client-side navigation
        await router.push('/dashboard')
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      })
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Vendor Login</CardTitle>
          <CardDescription>Login to manage your business</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <div className="text-sm text-gray-500">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="text-sm text-gray-500">
            Don't have an account?{" "}
            <Link href="/vendor/register" className="text-primary hover:underline">
              Register as a vendor
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 
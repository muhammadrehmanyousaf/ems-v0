"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

// Add dummy credentials
const DUMMY_CREDENTIALS = {
  email: "admin@example.com",
  password: "password123"
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check against dummy credentials
    if (email === DUMMY_CREDENTIALS.email && password === DUMMY_CREDENTIALS.password) {
      // Clear any previous errors
      setError("")
      // Redirect to dashboard on successful login
      router.push("/dashboard")
    } else {
      setError("Invalid email or password")
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Use email: admin@example.com and password: password123
          </CardDescription>
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
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
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


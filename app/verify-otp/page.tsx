"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the OTP verification request to your backend
    console.log("OTP submitted:", otp)
    // Redirect to dashboard or password reset page on successful verification
    router.push("/dashboard")
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Verify OTP</CardTitle>
          <CardDescription>Enter the one-time password sent to your email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="otp">One-Time Password</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} className="w-full">
            Verify OTP
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}


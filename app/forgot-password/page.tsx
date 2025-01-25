"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send a password reset request to your backend
    console.log("Password reset requested for:", email)
    setIsSubmitted(true)
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Enter your email to reset your password</CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Check your email</AlertTitle>
              <AlertDescription>We've sent a password reset link to your email address.</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter>
          {!isSubmitted && (
            <Button onClick={handleSubmit} className="w-full">
              Reset Password
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}


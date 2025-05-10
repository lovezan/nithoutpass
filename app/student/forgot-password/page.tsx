"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft, Mail, Lock, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  generateOTP,
  validateEmail,
  validatePassword,
  getPasswordStrength,
  storeOTP,
  simulateSendOTPEmail,
} from "@/lib/utils/auth-utils"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordStrength, setPasswordStrength] = useState<{
    strength: "weak" | "medium" | "strong"
    message: string
  }>({ strength: "weak", message: "" })
  const [resetComplete, setResetComplete] = useState(false)
  // Add state to store the generated OTP
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null)

  // Update the handleSendOTP function to use the new email service
  const handleSendOTP = async () => {
    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Check if email exists in our "database"
      const studentsStr = localStorage.getItem("students")
      const students = studentsStr ? JSON.parse(studentsStr) : []

      const student = students.find((s: any) => s.email.toLowerCase() === email.toLowerCase())

      if (!student) {
        toast({
          title: "Account Not Found",
          description: "No account found with this email address",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Generate OTP
      const newOTP = generateOTP(6)

      // Store OTP in localStorage with 10 minutes expiry
      storeOTP(email, newOTP)

      // Send OTP via email with the student's name
      const result = await simulateSendOTPEmail(email, newOTP, student.name)

      // Store the OTP to display in UI
      setGeneratedOtp(result.otp)

      setOtpSent(true)
      toast({
        title: "OTP Sent",
        description: `A verification code has been sent to ${email}`,
      })
    } catch (error) {
      console.error("Error sending OTP:", error)
      toast({
        title: "Failed to Send OTP",
        description: "There was an error sending the verification code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = () => {
    if (!otp.trim()) {
      toast({
        title: "OTP Required",
        description: "Please enter the verification code sent to your email",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Verify OTP
      const isValid = verifyOTP(email, otp)

      if (!isValid) {
        toast({
          title: "Invalid OTP",
          description: "The verification code is incorrect or has expired",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Move to reset password step
      setStep(2)
    } catch (error) {
      console.error("Error verifying OTP:", error)
      toast({
        title: "Verification Failed",
        description: "There was an error verifying the code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordStrength(getPasswordStrength(newPassword))
  }

  const handleResetPassword = () => {
    if (!validatePassword(password)) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters and include uppercase, lowercase, and numbers",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Get students from localStorage
      const studentsStr = localStorage.getItem("students")
      const students = studentsStr ? JSON.parse(studentsStr) : []

      // Find and update student password
      const updatedStudents = students.map((student: any) => {
        if (student.email === email) {
          return { ...student, password }
        }
        return student
      })

      // Save back to localStorage
      localStorage.setItem("students", JSON.stringify(updatedStudents))

      // Show success message
      setResetComplete(true)

      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset successfully",
      })
    } catch (error) {
      console.error("Error resetting password:", error)
      toast({
        title: "Reset Failed",
        description: "There was an error resetting your password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/student/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              {step === 1 ? "Enter your email to receive a verification code" : "Create a new password"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resetComplete ? (
              <div className="text-center py-6">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h3 className="text-xl font-medium mb-2">Password Reset Complete</h3>
                <p className="text-muted-foreground mb-6">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
                <Button asChild className="w-full">
                  <Link href="/student/login">Go to Login</Link>
                </Button>
              </div>
            ) : step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {otpSent && (
                  <>
                    <Alert className="bg-muted border-primary/20">
                      <Mail className="h-4 w-4" />
                      <AlertTitle>Check your email</AlertTitle>
                      <AlertDescription>We've sent a verification code to {email}</AlertDescription>
                    </Alert>
                    {generatedOtp && (
                      <div className="border rounded-md p-4 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="border-b pb-2 mb-2">
                          <div className="text-sm text-muted-foreground">From: no-reply@hosteloutpass.com</div>
                          <div className="text-sm text-muted-foreground">To: {email}</div>
                          <div className="text-sm font-medium">Subject: Password Reset Verification Code</div>
                        </div>
                        <div className="py-2">
                          <p className="text-sm mb-4">Hello,</p>
                          <p className="text-sm mb-4">Your verification code for password reset is:</p>
                          <div className="bg-muted p-4 text-center rounded-md mb-4">
                            <span className="text-2xl font-bold tracking-widest">{generatedOtp}</span>
                          </div>
                          <p className="text-sm mb-1">This code will expire in 10 minutes.</p>
                          <p className="text-sm text-muted-foreground">
                            If you didn't request this code, please ignore this email.
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                          This is a simulated email for demonstration purposes only.
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="otp">Verification Code</Label>
                      <Input
                        id="otp"
                        placeholder="Enter 6-digit code"
                        className="text-center text-lg tracking-widest placeholder:text-muted-foreground/40 placeholder:text-sm placeholder:tracking-normal"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        required
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="p-0 h-auto"
                      >
                        Resend Code
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>This is a simulated email for demonstration purposes.</p>
                      <p>In a real application, the code would be sent to your actual email.</p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong password"
                      className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
                      value={password}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  {password && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs">Password Strength</span>
                        <span
                          className={`text-xs ${
                            passwordStrength.strength === "strong"
                              ? "text-green-500"
                              : passwordStrength.strength === "medium"
                                ? "text-yellow-500"
                                : "text-red-500"
                          }`}
                        >
                          {passwordStrength.strength === "strong"
                            ? "Strong"
                            : passwordStrength.strength === "medium"
                              ? "Medium"
                              : "Weak"}
                        </span>
                      </div>
                      <Progress
                        value={
                          passwordStrength.strength === "strong"
                            ? 100
                            : passwordStrength.strength === "medium"
                              ? 66
                              : 33
                        }
                        className={`h-1 ${
                          passwordStrength.strength === "strong"
                            ? "bg-green-500"
                            : passwordStrength.strength === "medium"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{passwordStrength.message}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            {!resetComplete &&
              (step === 1 ? (
                otpSent ? (
                  <Button className="w-full" onClick={handleVerifyOTP} disabled={loading}>
                    {loading ? "Verifying..." : "Verify & Continue"}
                  </Button>
                ) : (
                  <Button className="w-full" onClick={handleSendOTP} disabled={loading}>
                    {loading ? "Sending..." : "Send Verification Code"}
                  </Button>
                )
              ) : (
                <Button className="w-full" onClick={handleResetPassword} disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              ))}
          </CardFooter>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}

// Helper function to verify OTP (moved here for simplicity)
function verifyOTP(email: string, otp: string): boolean {
  const otpDataString = localStorage.getItem(`otp_${email}`)
  if (!otpDataString) return false

  const otpData = JSON.parse(otpDataString)
  const now = new Date().getTime()

  // Check if OTP is expired
  if (now > otpData.expiry) {
    localStorage.removeItem(`otp_${email}`)
    return false
  }

  // Check if OTP matches
  if (otpData.otp !== otp) {
    return false
  }

  // OTP verified successfully, remove it
  localStorage.removeItem(`otp_${email}`)
  return true
}

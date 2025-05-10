"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Lock, Mail, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateOTP, validateEmail, storeOTP, simulateSendOTPEmail } from "@/lib/utils/auth-utils"

export default function StudentLoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("password")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerificationStep, setOtpVerificationStep] = useState(false)
  // Add state to store the generated OTP
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null)

  // Check if student is already logged in
  useEffect(() => {
    const studentUser = localStorage.getItem("studentUser")
    if (studentUser) {
      router.push("/student/dashboard")
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Update the handleSendOTP function to use the new email service
  const handleSendOTP = async () => {
    if (!validateEmail(formData.email)) {
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

      const student = students.find((s: any) => s.email.toLowerCase() === formData.email.toLowerCase())

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
      storeOTP(formData.email, newOTP)

      // Send OTP via email with the student's name
      const result = await simulateSendOTPEmail(formData.email, newOTP, student.name)

      // Store the OTP to display in UI
      setGeneratedOtp(result.otp)

      setOtpSent(true)
      setOtpVerificationStep(true)
      toast({
        title: "OTP Sent",
        description: `A verification code has been sent to ${formData.email}`,
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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get students from localStorage
      const studentsStr = localStorage.getItem("students")
      const students = studentsStr ? JSON.parse(studentsStr) : []

      // Find student by email and password
      const student = students.find(
        (s: any) => s.email.toLowerCase() === formData.email.toLowerCase() && s.password === formData.password,
      )

      if (!student) {
        throw new Error("Invalid email or password")
      }

      // Set student info in localStorage for persistence
      localStorage.setItem("studentUser", JSON.stringify(student))

      toast({
        title: "Login Successful",
        description: `Welcome back, ${student.name}!`,
      })

      // Redirect to dashboard
      setTimeout(() => router.push("/student/dashboard"), 1500)
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login Failed",
        description: "Invalid email or password.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault()

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
      const isValid = verifyOTP(formData.email, otp)

      if (!isValid) {
        toast({
          title: "Invalid OTP",
          description: "The verification code is incorrect or has expired",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Get students from localStorage
      const studentsStr = localStorage.getItem("students")
      const students = studentsStr ? JSON.parse(studentsStr) : []

      // Find student by email
      const student = students.find((s: any) => s.email.toLowerCase() === formData.email.toLowerCase())

      if (!student) {
        throw new Error("Account not found")
      }

      // Set student info in localStorage for persistence
      localStorage.setItem("studentUser", JSON.stringify(student))

      toast({
        title: "Login Successful",
        description: `Welcome back, ${student.name}!`,
      })

      // Redirect to dashboard
      setTimeout(() => router.push("/student/dashboard"), 1500)
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login Failed",
        description: "Account not found or verification failed.",
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
            <Link href="/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login Options
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Student Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the student portal
            </CardDescription>
          </CardHeader>

          <Tabs defaultValue="password" onValueChange={setActiveTab} className="w-full">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="otp">OTP</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="password">
              <form onSubmit={handlePasswordLogin}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your.email@example.com"
                        className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link href="/student/forgot-password" className="text-xs text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="otp">
              {!otpVerificationStep ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendOTP()
                  }}
                >
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-otp">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email-otp"
                          name="email"
                          type="email"
                          placeholder="your.email@example.com"
                          className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" type="submit" disabled={loading}>
                      {loading ? "Sending OTP..." : "Send OTP"}
                    </Button>
                  </CardFooter>
                </form>
              ) : (
                <form onSubmit={handleOTPLogin}>
                  <CardContent className="space-y-4 pt-4">
                    <Alert className="bg-muted border-primary/20">
                      <Mail className="h-4 w-4" />
                      <AlertTitle>Check your email</AlertTitle>
                      <AlertDescription>We've sent a verification code to {formData.email}</AlertDescription>
                    </Alert>
                    {generatedOtp && (
                      <div className="border rounded-md p-4 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="border-b pb-2 mb-2">
                          <div className="text-sm text-muted-foreground">From: no-reply@hosteloutpass.com</div>
                          <div className="text-sm text-muted-foreground">To: {formData.email}</div>
                          <div className="text-sm font-medium">Subject: Your Login Verification Code</div>
                        </div>
                        <div className="py-2">
                          <p className="text-sm mb-4">Hello,</p>
                          <p className="text-sm mb-4">Your verification code for Hostel Outpass System login is:</p>
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
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full" type="submit" disabled={loading}>
                      {loading ? "Verifying..." : "Verify & Login"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setOtpVerificationStep(false)}
                    >
                      Back
                    </Button>
                  </CardFooter>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </Card>
        <div className="text-center mt-4 text-sm text-muted-foreground">
          <p>
            Don't have an account?{" "}
            <Link href="/student/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
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

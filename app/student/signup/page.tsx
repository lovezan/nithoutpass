"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft, Mail, Lock, User } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  generateOTP,
  validateEmail,
  validatePassword,
  getPasswordStrength,
  storeOTP,
  simulateSendOTPEmail,
} from "@/lib/utils/auth-utils"
import { formatIndianPhoneNumber } from "@/lib/utils/notification-service"

// List of available hostels
const hostels = [
  "Kailash Boys Hostel",
  "Himadri Boys Hostel",
  "Himgiri Boys Hostel",
  "Udaygiri Boys Hostel",
  "Neelkanth Boys Hostel",
  "Dhauladhar Boys Hostel",
  "Vindhyachal Boys Hostel",
  "Ambika Girls Hostel",
  "Parvati Girls Hostel",
  "Manimahesh Girls Hostel",
  "Aravali Girls Hostel",
  "Satpura Hostel",
]

export default function StudentSignup() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    rollNo: "",
    roomNo: "",
    hostel: "",
    contact: "",
    parentContact: "",
  })
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{
    strength: "weak" | "medium" | "strong"
    message: string
  }>({ strength: "weak", message: "" })
  // Update the state to store the generated OTP
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Check password strength
    if (name === "password") {
      setPasswordStrength(getPasswordStrength(value))
    }
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, hostel: value }))
  }

  // Update the handleSendOTP function to pass the name
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
      // Generate OTP
      const newOTP = generateOTP(6)

      // Store OTP in localStorage with 10 minutes expiry
      storeOTP(formData.email, newOTP)

      // Send OTP via email with the student's name
      const result = await simulateSendOTPEmail(formData.email, newOTP, formData.name)

      // Store the OTP to display in UI
      setGeneratedOtp(result.otp)

      setOtpSent(true)
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

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name",
        variant: "destructive",
      })
      return false
    }

    if (!validateEmail(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return false
    }

    if (!validatePassword(formData.password)) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters and include uppercase, lowercase, and numbers",
        variant: "destructive",
      })
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const validateStep2 = () => {
    if (!formData.rollNo.trim()) {
      toast({
        title: "Roll Number Required",
        description: "Please enter your roll number",
        variant: "destructive",
      })
      return false
    }

    if (!formData.hostel) {
      toast({
        title: "Hostel Required",
        description: "Please select your hostel",
        variant: "destructive",
      })
      return false
    }

    if (!formData.roomNo.trim()) {
      toast({
        title: "Room Number Required",
        description: "Please enter your room number",
        variant: "destructive",
      })
      return false
    }

    if (!formData.contact.trim() || formData.contact.replace(/\D/g, "").length !== 10) {
      toast({
        title: "Valid Contact Required",
        description: "Please enter a valid 10-digit contact number",
        variant: "destructive",
      })
      return false
    }

    if (!formData.parentContact.trim() || formData.parentContact.replace(/\D/g, "").length !== 10) {
      toast({
        title: "Valid Parent Contact Required",
        description: "Please enter a valid 10-digit parent contact number",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
      // Send OTP automatically when reaching step 3
      handleSendOTP()
    }
  }

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
      // In a real app, verify OTP with server
      // For demo, we'll use our local verification
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

      // Format phone numbers with Indian country code
      const formattedContact = formatIndianPhoneNumber(formData.contact)
      const formattedParentContact = formatIndianPhoneNumber(formData.parentContact)

      // Generate a unique student ID
      const studentId = `ST-${Date.now().toString(36).toUpperCase()}`

      // Create student object
      const newStudent = {
        id: studentId,
        name: formData.name,
        email: formData.email,
        password: formData.password, // In a real app, this would be hashed
        rollNo: formData.rollNo,
        roomNo: formData.roomNo,
        hostel: formData.hostel,
        contact: formattedContact,
        parentContact: formattedParentContact,
        firstLogin: false,
        isNewStudent: false,
        profileCompleted: true,
        emailVerified: true,
      }

      // In a real app, send to server
      // For demo, store in localStorage

      // Get existing students array or create new one
      const existingStudentsStr = localStorage.getItem("students")
      const existingStudents = existingStudentsStr ? JSON.parse(existingStudentsStr) : []

      // Add new student
      existingStudents.push(newStudent)

      // Save back to localStorage
      localStorage.setItem("students", JSON.stringify(existingStudents))

      // Also save as current user
      localStorage.setItem("studentUser", JSON.stringify(newStudent))

      toast({
        title: "Account Created",
        description: "Your account has been created successfully!",
      })

      // Redirect to dashboard after successful signup
      setTimeout(() => {
        router.push("/student/dashboard")
      }, 1500)
    } catch (error) {
      console.error("Error creating account:", error)
      toast({
        title: "Signup Failed",
        description: "There was an error creating your account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getProgressValue = () => {
    return step * 33.33
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Create Account</h1>
        </div>

        <Progress value={getProgressValue()} className="mb-8" />

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">
              {step === 1 && "Account Information"}
              {step === 2 && "Personal Details"}
              {step === 3 && "Verify Email"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Create your account credentials"}
              {step === 2 && "Tell us about yourself"}
              {step === 3 && "Verify your email address to complete signup"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        placeholder="Enter your full name"
                        className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email address"
                        className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">We'll send a verification code to this email</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Create a strong password"
                        className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {formData.password && (
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
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    {formData.password &&
                      formData.confirmPassword &&
                      formData.password !== formData.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                      )}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="rollNo">Roll Number</Label>
                    <Input
                      id="rollNo"
                      name="rollNo"
                      placeholder="Enter your roll number (e.g., 21BCS122)"
                      className="placeholder:text-muted-foreground/40 placeholder:text-sm"
                      value={formData.rollNo}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hostel">Hostel</Label>
                    <Select onValueChange={handleSelectChange} value={formData.hostel} required>
                      <SelectTrigger id="hostel" className="placeholder:text-muted-foreground/40">
                        <SelectValue placeholder="Select your hostel" />
                      </SelectTrigger>
                      <SelectContent>
                        {hostels.map((hostel) => (
                          <SelectItem key={hostel} value={hostel}>
                            {hostel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roomNo">Room Number</Label>
                    <Input
                      id="roomNo"
                      name="roomNo"
                      placeholder="Enter your room number"
                      className="placeholder:text-muted-foreground/40 placeholder:text-sm"
                      value={formData.roomNo}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact">Your Contact Number</Label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-muted px-3 border border-r-0 rounded-l-md">
                        +91
                      </div>
                      <Input
                        id="contact"
                        name="contact"
                        placeholder="Enter your 10-digit number"
                        className="rounded-l-none placeholder:text-muted-foreground/40 placeholder:text-sm"
                        value={formData.contact}
                        onChange={handleChange}
                        required
                        maxLength={10}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Enter 10-digit number without country code</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentContact">Parent's Contact Number</Label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-muted px-3 border border-r-0 rounded-l-md">
                        +91
                      </div>
                      <Input
                        id="parentContact"
                        name="parentContact"
                        placeholder="Enter your parent's 10-digit number"
                        className="rounded-l-none placeholder:text-muted-foreground/40 placeholder:text-sm"
                        value={formData.parentContact}
                        onChange={handleChange}
                        required
                        maxLength={10}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This number will be used for notifications about your outpass status.
                    </p>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <Alert className="bg-muted border-primary/20">
                    <Mail className="h-4 w-4" />
                    <AlertTitle>Check your email</AlertTitle>
                    <AlertDescription>We've sent a verification code to {formData.email}</AlertDescription>
                  </Alert>

                  {/* Add simulated email display */}
                  {generatedOtp && (
                    <div className="border rounded-md p-4 bg-white dark:bg-slate-900 shadow-sm">
                      <div className="border-b pb-2 mb-2">
                        <div className="text-sm text-muted-foreground">From: no-reply@hosteloutpass.com</div>
                        <div className="text-sm text-muted-foreground">To: {formData.email}</div>
                        <div className="text-sm font-medium">Subject: Your Verification Code</div>
                      </div>
                      <div className="py-2">
                        <p className="text-sm mb-4">Hello {formData.name},</p>
                        <p className="text-sm mb-4">Your verification code for Hostel Outpass System is:</p>
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
                      disabled={loading || !otpSent}
                      className="p-0 h-auto"
                    >
                      Resend Code
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={handlePrevStep}>
                  Previous
                </Button>
              ) : (
                <Button type="button" variant="outline" asChild>
                  <Link href="/login">Cancel</Link>
                </Button>
              )}

              {step < 3 ? (
                <Button type="button" onClick={handleNextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating Account..." : "Complete Signup"}
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>

        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/student/login" className="text-primary hover:underline">
              Sign in
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

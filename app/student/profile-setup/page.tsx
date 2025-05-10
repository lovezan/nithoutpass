"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { formatIndianPhoneNumber } from "@/lib/utils/notification-service"

// Mock student data (replace with your actual data source)
const mockStudents = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    rollNo: "21BCS100",
    roomNo: "101",
    hostel: "Kailash Boys Hostel",
    contact: "+919876543210",
    parentContact: "+919876543210",
    isNewStudent: false,
    firstLogin: false,
    profileCompleted: true,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    isNewStudent: true,
    firstLogin: true,
  },
]

export default function ProfileSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [student, setStudent] = useState<any>(null)
  const [formData, setFormData] = useState({
    rollNo: "",
    roomNo: "",
    hostel: "",
    contact: "",
    parentContact: "",
  })

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

  // Check if student is logged in
  useEffect(() => {
    const checkAuth = () => {
      const studentData = localStorage.getItem("studentUser")

      if (!studentData) {
        // Redirect to login if not logged in
        router.push("/login")
        return
      }

      const parsedData = JSON.parse(studentData)

      // If student already has profile data, redirect to dashboard
      // Check for actual profile data rather than just the isNewStudent flag
      if (parsedData.rollNo && parsedData.hostel && parsedData.roomNo && parsedData.contact) {
        router.push("/student/dashboard")
        return
      }

      setStudent(parsedData)
    }

    checkAuth()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, hostel: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!formData.rollNo || !formData.roomNo || !formData.hostel || !formData.contact || !formData.parentContact) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // Validate phone numbers
    if (!/^\d{10}$/.test(formData.contact.replace(/\D/g, ""))) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit contact number",
        variant: "destructive",
      })
      return
    }

    if (!/^\d{10}$/.test(formData.parentContact.replace(/\D/g, ""))) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit parent contact number",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Format phone numbers with Indian country code
      const formattedContact = formatIndianPhoneNumber(formData.contact)
      const formattedParentContact = formatIndianPhoneNumber(formData.parentContact)

      // In a real app, this would be an API call to update the student profile
      // For this demo, we'll just update the localStorage

      // Create updated student data
      const updatedStudent = {
        ...student,
        ...formData,
        contact: formattedContact,
        parentContact: formattedParentContact,
        isNewStudent: false, // Important: Mark that profile setup is complete
        firstLogin: false,
        profileCompleted: true, // Add an explicit flag to indicate profile completion
      }

      // Update localStorage with new student data
      localStorage.setItem("studentUser", JSON.stringify(updatedStudent))

      // In a real app, we would also update the server
      // For now, let's simulate an API call to update the student data
      try {
        // This would be a real API call in a production app
        console.log("Updating student profile on server:", updatedStudent)

        // Update the mockStudents array to simulate server update
        // This is just for the demo - in a real app, this would be a server-side update
        const studentIndex = mockStudents.findIndex((s) => s.id === student.id)
        if (studentIndex !== -1) {
          mockStudents[studentIndex] = updatedStudent
        }
      } catch (apiError) {
        console.error("Error updating profile on server:", apiError)
      }

      toast({
        title: "Profile Setup Complete",
        description: "Your profile has been set up successfully!",
      })

      // Redirect to student dashboard
      setTimeout(() => {
        router.push("/student/dashboard")
      }, 1500)
    } catch (error) {
      console.error("Error setting up profile:", error)
      toast({
        title: "Error",
        description: "Failed to set up profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!student) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-center">
          <p>Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>
              Welcome to the Hostel Outpass System! Please complete your profile to continue.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={student.name} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={student.email} disabled className="bg-muted" />
              </div>

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

              <div className="grid grid-cols-2 gap-4">
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
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Complete Profile Setup"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatIndianPhoneNumber } from "@/lib/utils/notification-service"

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [student, setStudent] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    rollNo: "",
    roomNo: "",
    hostel: "",
    contact: "",
    parentContact: "",
  })

  // Check if student is logged in and can edit profile
  useEffect(() => {
    const checkAuth = () => {
      const studentData = localStorage.getItem("studentUser")

      if (!studentData) {
        // Redirect to login if not logged in
        router.push("/login")
        return
      }

      const parsedData = JSON.parse(studentData)

      // Check if profile editing is enabled for this student's hostel
      const editingStatus = localStorage.getItem(`profileEditing_${parsedData.hostel}`)
      if (editingStatus !== "enabled") {
        toast({
          title: "Access Denied",
          description: "Profile editing is not currently enabled for your hostel.",
          variant: "destructive",
        })
        router.push("/student/dashboard")
        return
      }

      setStudent(parsedData)

      // Initialize form data with current student info
      // Remove +91 prefix if present for display in the form
      const contactDisplay = parsedData.contact ? parsedData.contact.replace("+91", "") : ""
      const parentContactDisplay = parsedData.parentContact ? parsedData.parentContact.replace("+91", "") : ""

      setFormData({
        name: parsedData.name || "",
        rollNo: parsedData.rollNo || "",
        roomNo: parsedData.roomNo || "",
        hostel: parsedData.hostel || "",
        contact: contactDisplay,
        parentContact: parentContactDisplay,
      })
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
    if (!formData.name || !formData.rollNo || !formData.roomNo || !formData.contact || !formData.parentContact) {
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

      // Prepare data with formatted phone numbers
      const updatedData = {
        ...formData,
        contact: formattedContact,
        parentContact: formattedParentContact,
      }

      // Update student profile
      const response = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const data = await response.json()

      // Update local storage with new student data
      localStorage.setItem(
        "studentUser",
        JSON.stringify({
          ...student,
          ...data.student,
        }),
      )

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      })

      // Redirect to student dashboard
      setTimeout(() => {
        router.push("/student/dashboard")
      }, 1500)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
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
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push("/student/dashboard")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Update Your Profile</CardTitle>
            <CardDescription>Make changes to your profile information</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="placeholder:text-muted-foreground/40 placeholder:text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={student.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rollNo">Roll Number</Label>
                <Input
                  id="rollNo"
                  name="rollNo"
                  value={formData.rollNo}
                  onChange={handleChange}
                  placeholder="Enter your roll number"
                  className="placeholder:text-muted-foreground/40 placeholder:text-sm"
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
                    {[
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
                    ].map((hostel) => (
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
                  value={formData.roomNo}
                  onChange={handleChange}
                  placeholder="Enter your room number"
                  className="placeholder:text-muted-foreground/40 placeholder:text-sm"
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
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="Enter your 10-digit number"
                    className="rounded-l-none placeholder:text-muted-foreground/40 placeholder:text-sm"
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
                    value={formData.parentContact}
                    onChange={handleChange}
                    placeholder="Enter your parent's 10-digit number"
                    className="rounded-l-none placeholder:text-muted-foreground/40 placeholder:text-sm"
                    required
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This number will be used for notifications about your outpass status.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.push("/student/dashboard")}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}

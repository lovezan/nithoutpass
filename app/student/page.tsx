"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft, Calendar, Clock } from "lucide-react"
import Link from "next/link"

export default function StudentOutpassRequest() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [student, setStudent] = useState<any>(null)
  const [formData, setFormData] = useState({
    type: "",
    purpose: "",
    place: "",
    date: "",
    returnTime: "",
  })

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

      // Only redirect to profile setup if this is a completely new student
      // AND they haven't completed their profile yet
      if (
        (parsedData.isNewStudent === true || !parsedData.profileCompleted) &&
        (!parsedData.rollNo || !parsedData.hostel || !parsedData.roomNo || !parsedData.contact)
      ) {
        router.push("/student/profile-setup")
        return
      }

      setStudent(parsedData)
    }

    checkAuth()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!formData.type || !formData.purpose || !formData.place || !formData.date || !formData.returnTime) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Create outpass request
      const response = await fetch("/api/outpass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          studentId: student.id,
          student: {
            name: student.name,
            rollNo: student.rollNo,
            roomNo: student.roomNo,
            hostel: student.hostel,
            contact: student.contact,
            parentContact: student.parentContact,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create outpass request")
      }

      const data = await response.json()

      toast({
        title: "Outpass Requested",
        description: "Your outpass request has been submitted successfully!",
      })

      // Redirect to dashboard after successful submission
      setTimeout(() => {
        router.push("/student/dashboard")
      }, 1500)
    } catch (error: any) {
      console.error("Error creating outpass request:", error)
      toast({
        title: "Request Failed",
        description: error.message || "There was an error submitting your outpass request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split("T")[0]

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
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/student/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Request Outpass</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Outpass Request</CardTitle>
            <CardDescription>Fill in the details to request a new outpass</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Outpass Type</Label>
                <Select onValueChange={(value) => handleSelectChange("type", value)} value={formData.type} required>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select outpass type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Market">Market Outpass</SelectItem>
                    <SelectItem value="Home">Home Outpass</SelectItem>
                    <SelectItem value="Medical">Medical Outpass</SelectItem>
                    <SelectItem value="Academic">Academic Outpass</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  name="purpose"
                  placeholder="Enter the purpose of your visit"
                  className="min-h-[80px] placeholder:text-muted-foreground/40 placeholder:text-sm"
                  value={formData.purpose}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="place">Place of Visit</Label>
                <Input
                  id="place"
                  name="place"
                  placeholder="Enter the place you will be visiting"
                  className="placeholder:text-muted-foreground/40 placeholder:text-sm"
                  value={formData.place}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      className="pl-10"
                      value={formData.date}
                      onChange={handleChange}
                      min={today}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="returnTime">Expected Return Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="returnTime"
                      name="returnTime"
                      type="time"
                      className="pl-10"
                      value={formData.returnTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-md text-sm">
                <p className="font-medium mb-2">Important Notes:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Outpass requests must be submitted at least 2 hours before departure.</li>
                  <li>For home visits, requests should be made at least 24 hours in advance.</li>
                  <li>You must return to the hostel before the specified return time.</li>
                  <li>Late returns may result in disciplinary action.</li>
                  <li>For medical outpasses, please bring documentation upon return.</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Outpass Request"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}

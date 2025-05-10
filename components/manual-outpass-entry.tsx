"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Calendar, Clock } from "lucide-react"

interface ManualOutpassEntryProps {
  hostel?: string
  onSuccess?: (outpass: any) => void
}

export function ManualOutpassEntry({ hostel = "", onSuccess }: ManualOutpassEntryProps) {
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [formData, setFormData] = useState({
    studentId: "",
    type: "",
    purpose: "",
    place: "",
    date: "",
    returnTime: "",
    status: "Approved", // Default to approved for manual entries
  })

  // Fetch students for the hostel
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // Construct query parameters based on hostel
        const queryParams = hostel ? `?hostel=${encodeURIComponent(hostel)}` : ""
        const response = await fetch(`/api/students${queryParams}`)

        if (!response.ok) {
          throw new Error("Failed to fetch students")
        }

        const data = await response.json()
        setStudents(data.students || [])
      } catch (error) {
        console.error("Error fetching students:", error)
        toast({
          title: "Error",
          description: "Failed to load students. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchStudents()
  }, [hostel])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === "studentId") {
      const student = students.find((s) => s.id === value)
      setSelectedStudent(student)
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (
      !formData.studentId ||
      !formData.type ||
      !formData.purpose ||
      !formData.place ||
      !formData.date ||
      !formData.returnTime
    ) {
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
          student: selectedStudent,
          approvedAt: new Date().toISOString(),
          approvedBy: JSON.parse(localStorage.getItem("adminUser") || "{}").id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create outpass")
      }

      const data = await response.json()

      toast({
        title: "Outpass Created",
        description: "The manual outpass entry has been created successfully!",
      })

      // Reset form
      setFormData({
        studentId: "",
        type: "",
        purpose: "",
        place: "",
        date: "",
        returnTime: "",
        status: "Approved",
      })
      setSelectedStudent(null)

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data.outpass)
      }
    } catch (error: any) {
      console.error("Error creating outpass:", error)
      toast({
        title: "Creation Failed",
        description: error.message || "There was an error creating the outpass. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split("T")[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="studentId">Student</Label>
        <Select onValueChange={(value) => handleSelectChange("studentId", value)} value={formData.studentId} required>
          <SelectTrigger id="studentId">
            <SelectValue placeholder="Select a student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name} ({student.rollNo}) - {student.hostel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedStudent && (
        <div className="bg-muted p-3 rounded-md text-sm">
          <p>
            <strong>Room:</strong> {selectedStudent.roomNo}
          </p>
          <p>
            <strong>Contact:</strong> {selectedStudent.contact}
          </p>
          <p>
            <strong>Parent Contact:</strong> {selectedStudent.parentContact}
          </p>
        </div>
      )}

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
          placeholder="Enter the purpose of the visit"
          className="min-h-[80px]"
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
          placeholder="Enter the place of visit"
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

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select onValueChange={(value) => handleSelectChange("status", value)} value={formData.status} required>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          For manual entries, typically "Approved" is selected as these are outpasses that were already processed.
        </p>
      </div>

      <Button type="submit" className="w-full mt-4" disabled={loading}>
        {loading ? "Creating..." : "Create Manual Outpass"}
      </Button>
    </form>
  )
}

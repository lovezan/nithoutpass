"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Edit, LogOut, Calendar } from "lucide-react"
import "jspdf-autotable"
import { SortableTable } from "@/components/ui/sortable-table"
import { setupPdfDocument, addPdfFooter } from "@/lib/utils/pdf-utils"

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [admin, setAdmin] = useState<any>(null)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newHostel, setNewHostel] = useState("")
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false)
  const [editingEnabled, setEditingEnabled] = useState(false)

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

  // Check if admin is logged in
  useEffect(() => {
    const checkAuth = () => {
      const adminData = localStorage.getItem("adminUser")

      if (!adminData) {
        // Redirect to login if not logged in
        router.push("/login")
        return
      }

      setAdmin(JSON.parse(adminData))
    }

    checkAuth()
  }, [router])

  // Check if profile editing is enabled for this hostel
  useEffect(() => {
    if (admin) {
      const editingStatus = localStorage.getItem(`profileEditing_${admin.hostel}`)
      setEditingEnabled(editingStatus === "enabled")
    }
  }, [admin])

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      if (!admin) return

      setIsLoading(true)
      try {
        // If super_admin, fetch all students
        // If hostel_admin, fetch only students from their hostel
        const queryParams = admin.role === "hostel_admin" ? `?hostel=${encodeURIComponent(admin.hostel)}` : ""

        const response = await fetch(`/api/students${queryParams}`)
        if (!response.ok) {
          throw new Error("Failed to fetch students")
        }

        const data = await response.json()
        setStudents(data.students || [])
        setFilteredStudents(data.students || [])
      } catch (error) {
        console.error("Error fetching students:", error)
        toast({
          title: "Error",
          description: "Failed to load students. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (admin) {
      fetchStudents()
    }
  }, [admin])

  const handleLogout = () => {
    // Clear all user data
    localStorage.removeItem("studentUser")
    localStorage.removeItem("adminUser")
    localStorage.removeItem("securityUser")

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("app-logout"))

    router.push("/login")
  }

  const openChangeHostelDialog = (student) => {
    setSelectedStudent(student)
    setNewHostel(student.hostel)
    setDialogOpen(true)
  }

  const handleChangeHostel = async () => {
    if (!selectedStudent || newHostel === selectedStudent.hostel) {
      setDialogOpen(false)
      return
    }

    try {
      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostel: newHostel,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update student hostel")
      }

      const data = await response.json()

      // Update local state
      setStudents((prev) =>
        prev.map((student) => (student.id === selectedStudent.id ? { ...student, hostel: newHostel } : student)),
      )

      toast({
        title: "Hostel Updated",
        description: `${selectedStudent.name}'s hostel has been changed to ${newHostel}.`,
      })

      // If the admin is a hostel_admin and the student is moved to a different hostel,
      // remove them from the filtered list
      if (admin.role === "hostel_admin" && newHostel !== admin.hostel) {
        setFilteredStudents((prev) => prev.filter((student) => student.id !== selectedStudent.id))
      }

      setDialogOpen(false)
    } catch (error) {
      console.error("Error updating student hostel:", error)
      toast({
        title: "Update Failed",
        description: "There was an error updating the student's hostel. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleProfileEditing = (enabled) => {
    setEditingEnabled(enabled)

    // Store the setting in localStorage
    if (enabled) {
      localStorage.setItem(`profileEditing_${admin.hostel}`, "enabled")
      toast({
        title: "Profile Editing Enabled",
        description: `Students in ${admin.hostel} can now edit their profiles.`,
      })
    } else {
      localStorage.setItem(`profileEditing_${admin.hostel}`, "disabled")
      toast({
        title: "Profile Editing Disabled",
        description: `Students in ${admin.hostel} can no longer edit their profiles.`,
      })
    }
  }

  const handleGeneratePDF = () => {
    if (!admin || !students.length) {
      toast({
        title: "Error",
        description: "No student data available to generate report.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create a new PDF document using our utility function
      const { doc, currentDate } = setupPdfDocument(
        "Student Report",
        `Hostel: ${admin.role === "hostel_admin" ? admin.hostel : "All Hostels"}`,
        admin.name,
      )

      // Create the table
      const tableColumn = ["Name", "Roll Number", "Room Number", "Hostel", "Contact", "Parent Contact"]
      const tableRows = []

      // Add student data to the table
      filteredStudents.forEach((student) => {
        const studentData = [
          student.name,
          student.rollNo,
          student.roomNo,
          student.hostel,
          student.contact,
          student.parentContact,
        ]
        tableRows.push(studentData)
      })

      // Generate the table
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 66, 66] },
      })

      // Add footer
      addPdfFooter(doc)

      // Save the PDF
      doc.save(
        `Student_Report_${admin.role === "hostel_admin" ? admin.hostel.replace(/\s+/g, "_") : "All_Hostels"}_${currentDate.replace(/\//g, "-")}.pdf`,
      )

      toast({
        title: "PDF Generated",
        description: "Student report has been generated successfully.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate student report. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!admin) {
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground">
            {admin.role === "hostel_admin" ? `Manage students in ${admin.hostel}` : "Manage all students"}
          </p>
        </div>
        <Button variant="outline" onClick={handleGeneratePDF} className="w-full sm:w-auto mr-2">
          <Calendar className="mr-2 h-4 w-4" />
          Generate PDF Report
        </Button>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {admin.role === "hostel_admin" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Hostel Settings</CardTitle>
            <CardDescription>Configure settings for your hostel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium">Allow Profile Editing</h3>
                <p className="text-sm text-muted-foreground">
                  When enabled, students can edit their profile information
                </p>
              </div>
              <Switch checked={editingEnabled} onCheckedChange={handleToggleProfileEditing} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            {admin.role === "hostel_admin"
              ? `View and manage students in ${admin.hostel}`
              : "View and manage all students"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <p>Loading students...</p>
            </div>
          ) : (
            <SortableTable
              columns={[
                {
                  key: "name",
                  title: "Name",
                  sortable: true,
                  render: (value) => <div className="font-medium">{value}</div>,
                },
                {
                  key: "rollNo",
                  title: "Roll Number",
                  sortable: true,
                },
                {
                  key: "roomNo",
                  title: "Room Number",
                  sortable: true,
                },
                {
                  key: "hostel",
                  title: "Hostel",
                  sortable: true,
                },
                {
                  key: "contact",
                  title: "Contact",
                  sortable: true,
                },
                {
                  key: "actions",
                  title: "Actions",
                  render: (_, student) => (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => openChangeHostelDialog(student)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Change Hostel</span>
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={filteredStudents}
              searchable={true}
              searchPlaceholder="Search by name, roll number, or room number"
              searchKeys={["name", "rollNo", "roomNo", "hostel", "contact"]}
              emptyMessage="No students found."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Hostel</DialogTitle>
            <DialogDescription>Update the hostel for {selectedStudent?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Current Hostel: {selectedStudent?.hostel}</p>
              <Select onValueChange={setNewHostel} value={newHostel}>
                <SelectTrigger className="placeholder:text-muted-foreground/40">
                  <SelectValue placeholder="Select new hostel" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeHostel}>Update Hostel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}

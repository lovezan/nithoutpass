"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  CheckCircle,
  Clock,
  Eye,
  Home,
  LogOut,
  ThumbsDown,
  User,
  Users,
  CalendarIcon,
  LogIn,
  Bell,
  Cog,
  FileText,
} from "lucide-react"
import "jspdf-autotable"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ManualOutpassEntry } from "@/components/manual-outpass-entry"
import { SortableTable } from "@/components/ui/sortable-table"
import { setupPdfDocument, addPdfFooter } from "@/lib/utils/pdf-utils"

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("pending")
  const [outpasses, setOutpasses] = useState([])
  const [rejectReason, setRejectReason] = useState("")
  const [selectedOutpass, setSelectedOutpass] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [manualEntryOpen, setManualEntryOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [admin, setAdmin] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    exited: 0,
    returned: 0,
    total: 0,
    students: 0,
  })

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

  // Fetch outpasses for the admin's hostel
  useEffect(() => {
    const fetchOutpasses = async () => {
      if (!admin) return

      setIsLoading(true)
      try {
        // Construct query parameters based on activeTab and admin's hostel
        let queryParams = ""

        // If super_admin, show all outpasses
        if (admin.role === "super_admin") {
          if (activeTab !== "all") {
            queryParams = `?status=${activeTab}`
          }
        }
        // If hostel_admin, only show outpasses from their hostel
        else if (admin.role === "hostel_admin") {
          if (activeTab !== "all") {
            queryParams = `?status=${activeTab}&hostel=${encodeURIComponent(admin.hostel)}`
          } else {
            queryParams = `?hostel=${encodeURIComponent(admin.hostel)}`
          }
        }

        const response = await fetch(`/api/outpass${queryParams}`)
        if (!response.ok) {
          throw new Error("Failed to fetch outpasses")
        }

        const data = await response.json()
        console.log("Fetched outpasses:", data.outpasses)
        setOutpasses(data.outpasses || [])

        // Calculate stats
        if (admin.role === "hostel_admin") {
          // Fetch all outpasses for this hostel to calculate stats
          const allResponse = await fetch(`/api/outpass?hostel=${encodeURIComponent(admin.hostel)}`)
          const allData = await allResponse.json()
          const allOutpasses = allData.outpasses || []

          const pendingCount = allOutpasses.filter((o) => o.status === "Pending").length
          const approvedCount = allOutpasses.filter((o) => o.status === "Approved").length
          const rejectedCount = allOutpasses.filter((o) => o.status === "Rejected").length
          const cancelledCount = allOutpasses.filter((o) => o.status === "Cancelled").length
          const exitedCount = allOutpasses.filter((o) => o.status === "Exited").length
          const returnedCount = allOutpasses.filter((o) => o.status === "Returned").length

          // Fetch student count for this hostel
          const studentsResponse = await fetch(`/api/students?hostel=${encodeURIComponent(admin.hostel)}`)
          const studentsData = await studentsResponse.json()

          setStats({
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount,
            cancelled: cancelledCount,
            exited: exitedCount,
            returned: returnedCount,
            total: allOutpasses.length,
            students: studentsData.students?.length || 0,
          })
        }
      } catch (error) {
        console.error("Error fetching outpasses:", error)
        toast({
          title: "Error",
          description: "Failed to load outpass requests. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (admin) {
      fetchOutpasses()
    }
  }, [admin, activeTab])

  const handleLogout = () => {
    // Clear all user data
    localStorage.removeItem("studentUser")
    localStorage.removeItem("adminUser")
    localStorage.removeItem("securityUser")

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("app-logout"))

    router.push("/login")
  }

  const handleApprove = async (id: string) => {
    setLoading(true)

    try {
      const response = await fetch("/api/outpass", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status: "Approved",
          approvedBy: admin.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve outpass")
      }

      const data = await response.json()

      // Update local state
      setOutpasses((prev) => prev.map((outpass) => (outpass.id === id ? data.outpass : outpass)))

      // Update stats
      setStats((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        approved: prev.approved + 1,
      }))

      toast({
        title: "Outpass Approved",
        description: `Outpass #${id} has been approved successfully.`,
      })
    } catch (error) {
      console.error("Error approving outpass:", error)
      toast({
        title: "Approval Failed",
        description: "There was an error approving the outpass. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedOutpass) return

    setLoading(true)

    try {
      const response = await fetch("/api/outpass", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedOutpass,
          status: "Rejected",
          rejectReason,
          approvedBy: admin.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reject outpass")
      }

      const data = await response.json()

      // Update local state
      setOutpasses((prev) => prev.map((outpass) => (outpass.id === selectedOutpass ? data.outpass : outpass)))

      // Update stats
      setStats((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        rejected: prev.rejected + 1,
      }))

      toast({
        title: "Outpass Rejected",
        description: `Outpass #${selectedOutpass} has been rejected.`,
      })

      setDialogOpen(false)
      setSelectedOutpass(null)
      setRejectReason("")
    } catch (error) {
      console.error("Error rejecting outpass:", error)
      toast({
        title: "Rejection Failed",
        description: "There was an error rejecting the outpass. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualOutpassSuccess = (newOutpass) => {
    // Close the dialog
    setManualEntryOpen(false)

    // Refresh the outpass list
    if (admin) {
      // Construct query parameters based on activeTab and admin's hostel
      let queryParams = ""
      if (admin.role === "hostel_admin") {
        if (activeTab !== "all") {
          queryParams = `?status=${activeTab}&hostel=${encodeURIComponent(admin.hostel)}`
        } else {
          queryParams = `?hostel=${encodeURIComponent(admin.hostel)}`
        }
      }

      fetch(`/api/outpass${queryParams}`)
        .then((response) => response.json())
        .then((data) => {
          setOutpasses(data.outpasses || [])

          // Update stats
          const allOutpasses = data.outpasses || []
          const pendingCount = allOutpasses.filter((o) => o.status === "Pending").length
          const approvedCount = allOutpasses.filter((o) => o.status === "Approved").length
          const rejectedCount = allOutpasses.filter((o) => o.status === "Rejected").length
          const cancelledCount = allOutpasses.filter((o) => o.status === "Cancelled").length
          const exitedCount = allOutpasses.filter((o) => o.status === "Exited").length
          const returnedCount = allOutpasses.filter((o) => o.status === "Returned").length

          setStats((prev) => ({
            ...prev,
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount,
            cancelled: cancelledCount,
            exited: exitedCount,
            returned: returnedCount,
            total: allOutpasses.length,
          }))
        })
        .catch((error) => {
          console.error("Error refreshing outpasses:", error)
        })
    }
  }

  const openRejectDialog = (id: string) => {
    setSelectedOutpass(id)
    setDialogOpen(true)
  }

  // Filter outpasses based on the active tab
  const filteredOutpasses = outpasses.filter((outpass) => {
    if (activeTab === "all") {
      return true
    }
    return outpass.status.toLowerCase() === activeTab.toLowerCase()
  })

  const handleGeneratePDF = async () => {
    if (!admin) return

    setLoading(true)

    try {
      // Fetch students for the admin's hostel
      const queryParams = admin.role === "hostel_admin" ? `?hostel=${encodeURIComponent(admin.hostel)}` : ""
      const response = await fetch(`/api/students${queryParams}`)

      if (!response.ok) {
        throw new Error("Failed to fetch students")
      }

      const data = await response.json()
      const students = data.students || []

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
      students.forEach((student) => {
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
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateDailyReport = async () => {
    if (!admin || !selectedDate) {
      toast({
        title: "Error",
        description: "Please select a date to generate the report.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Format the selected date
      const formattedDate = format(selectedDate, "yyyy-MM-dd")

      // Fetch outpasses for the selected date
      const queryParams =
        admin.role === "hostel_admin"
          ? `?date=${formattedDate}&hostel=${encodeURIComponent(admin.hostel)}`
          : `?date=${formattedDate}`

      const response = await fetch(`/api/outpass${queryParams}`)

      if (!response.ok) {
        throw new Error("Failed to fetch outpasses")
      }

      const data = await response.json()
      const dateOutpasses = data.outpasses || []

      // Create a new PDF document using our utility function
      const { doc, currentDate } = setupPdfDocument(
        "Daily Outpass Report",
        `Hostel: ${admin.role === "hostel_admin" ? admin.hostel : "All Hostels"}`,
        admin.name,
      )

      // Add additional information
      doc.text(`For Date: ${format(selectedDate, "MMMM d, yyyy")}`, 14, 48)
      doc.text(`Total Outpasses: ${dateOutpasses.length}`, 14, 54)

      // Create the table
      const tableColumn = ["Student Name", "Roll No", "Type", "Purpose", "Status", "Exit Time", "Return Time"]
      const tableRows = []

      // Add outpass data to the table
      dateOutpasses.forEach((outpass) => {
        const outpassData = [
          outpass.student?.name || "Unknown",
          outpass.student?.rollNo || "Unknown",
          outpass.type,
          outpass.purpose,
          outpass.status,
          outpass.exitTime ? new Date(outpass.exitTime).toLocaleTimeString() : "N/A",
          outpass.returnTime && outpass.status === "Returned"
            ? new Date(outpass.returnTime).toLocaleTimeString()
            : "N/A",
        ]
        tableRows.push(outpassData)
      })

      // Generate the table
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 66, 66] },
      })

      // Add footer
      addPdfFooter(doc)

      // Save the PDF
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      doc.save(
        `Daily_Outpass_Report_${admin.role === "hostel_admin" ? admin.hostel.replace(/\s+/g, "_") : "All_Hostels"}_${dateStr}.pdf`,
      )

      toast({
        title: "Daily Report Generated",
        description: `Outpass report for ${format(selectedDate, "MMMM d, yyyy")} has been generated successfully.`,
      })
    } catch (error) {
      console.error("Error generating daily report:", error)
      toast({
        title: "Error",
        description: "Failed to generate daily outpass report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-500 hover:bg-green-600"
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "rejected":
        return "bg-red-500 hover:bg-red-600"
      case "exited":
        return "bg-blue-500 hover:bg-blue-600"
      case "returned":
        return "bg-purple-500 hover:bg-purple-600"
      case "late":
        return "bg-orange-500 hover:bg-orange-600"
      case "cancelled":
        return "bg-gray-500 hover:bg-gray-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
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
      {/* Update the admin dashboard header to be responsive */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            {admin.role === "hostel_admin"
              ? `Welcome, ${admin.name} (${admin.hostel} Admin)`
              : `Welcome, ${admin.name}`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={handleGenerateDailyReport} className="w-full sm:w-auto">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="whitespace-normal sm:whitespace-nowrap">Daily Report</span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/admin/students">
                <User className="mr-2 h-4 w-4" />
                Students
              </Link>
            </Button>
            <Button variant="outline" onClick={handleGeneratePDF} className="w-full sm:w-auto">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Student Report
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/admin/notifications">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/admin/setup-email">
                <Cog className="mr-2 h-4 w-4" />
                Email Setup
              </Link>
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Make the stats cards responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 md:gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting your approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved Outpasses</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Ready for gate exit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Exited</CardTitle>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.exited}</div>
            <p className="text-xs text-muted-foreground">Currently outside</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Returned</CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.returned}</div>
            <p className="text-xs text-muted-foreground">Completed outpasses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <ThumbsDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Denied requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.students}</div>
            <p className="text-xs text-muted-foreground">
              In {admin.role === "hostel_admin" ? admin.hostel : "all hostels"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Outpasses</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Processed this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Manual Outpass Entry Button */}
      <div className="flex justify-end mb-4">
        <Dialog open={manualEntryOpen} onOpenChange={setManualEntryOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <FileText className="mr-2 h-4 w-4" />
              Manual Outpass Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Manual Outpass Entry</DialogTitle>
              <DialogDescription>
                Use this form to manually enter outpass requests that were processed on paper during system downtime.
              </DialogDescription>
            </DialogHeader>
            <ManualOutpassEntry
              hostel={admin.role === "hostel_admin" ? admin.hostel : ""}
              onSuccess={handleManualOutpassSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outpass Requests</CardTitle>
          <CardDescription>
            {admin.role === "hostel_admin"
              ? `Manage outpass requests for ${admin.hostel} students`
              : "Manage all outpass requests"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
            {/* Fix the congested tabs for mobile view */}
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex w-auto min-w-full md:grid md:grid-cols-7 mb-4">
                <TabsTrigger value="pending" className="px-4 flex-1">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="approved" className="px-4 flex-1">
                  Approved
                </TabsTrigger>
                <TabsTrigger value="rejected" className="px-4 flex-1">
                  Rejected
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="px-4 flex-1">
                  Cancelled
                </TabsTrigger>
                <TabsTrigger value="exited" className="px-4 flex-1">
                  Exited
                </TabsTrigger>
                <TabsTrigger value="returned" className="px-4 flex-1">
                  Returned
                </TabsTrigger>
                <TabsTrigger value="all" className="px-4 flex-1">
                  All
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <p>Loading outpass requests...</p>
                </div>
              ) : (
                <SortableTable
                  columns={[
                    {
                      key: "id",
                      title: "ID",
                      sortable: true,
                      render: (value) => (
                        <div className="truncate" title={value}>
                          {value}
                        </div>
                      ),
                    },
                    {
                      key: "student.name",
                      title: "Student",
                      sortable: true,
                      render: (_, outpass) => (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[100px]" title={outpass.student?.name}>
                            {outpass.student?.name || "Unknown"}
                          </span>
                        </div>
                      ),
                    },
                    {
                      key: "type",
                      title: "Type",
                      sortable: true,
                    },
                    {
                      key: "purpose",
                      title: "Purpose",
                      sortable: true,
                      render: (value) => (
                        <div className="truncate max-w-[150px]" title={value}>
                          {value}
                        </div>
                      ),
                    },
                    {
                      key: "date",
                      title: "Date",
                      sortable: true,
                    },
                    {
                      key: "status",
                      title: "Status",
                      sortable: true,
                      render: (value) => <Badge className={getStatusColor(value)}>{value}</Badge>,
                    },
                    {
                      key: "actions",
                      title: "Actions",
                      render: (_, outpass) => (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" asChild>
                            <Link href={`/admin/outpass/${outpass.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>

                          {outpass.status === "Pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                                onClick={() => handleApprove(outpass.id)}
                                disabled={loading}
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span className="sr-only">Approve</span>
                              </Button>

                              <Button
                                variant="outline"
                                size="icon"
                                className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                                onClick={() => openRejectDialog(outpass.id)}
                                disabled={loading}
                              >
                                <ThumbsDown className="h-4 w-4" />
                                <span className="sr-only">Reject</span>
                              </Button>
                            </>
                          )}
                        </div>
                      ),
                    },
                  ]}
                  data={filteredOutpasses}
                  searchable={true}
                  searchPlaceholder="Search outpasses..."
                  searchKeys={["id", "student.name", "student.rollNo", "type", "purpose", "date", "status"]}
                  emptyMessage="No outpass requests found."
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Outpass</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this outpass request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || loading}>
              {loading ? "Rejecting..." : "Reject Outpass"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Download, Eye, LogOut, Plus, UserCog, X, Bell } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SortableTable } from "@/components/ui/sortable-table"
import { generateOutpassPdf } from "@/lib/utils/pdf-utils"

export default function StudentDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [outpasses, setOutpasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)
  const [canEditProfile, setCanEditProfile] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedOutpassId, setSelectedOutpassId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

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

      // Check if profile editing is enabled for this student's hostel
      const editingStatus = localStorage.getItem(`profileEditing_${parsedData.hostel}`)
      setCanEditProfile(editingStatus === "enabled")
    }

    checkAuth()
  }, [router])

  // Fetch outpasses for the logged-in student
  useEffect(() => {
    const fetchOutpasses = async () => {
      if (!student) return

      setIsLoading(true)
      try {
        // Fetch outpasses for this student only
        const response = await fetch(`/api/outpass?studentId=${student.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch outpasses")
        }

        const data = await response.json()
        setOutpasses(data.outpasses || [])
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

    if (student) {
      fetchOutpasses()
    }
  }, [student])

  // Function to check if student has any approved outpasses
  const hasActiveOutpass = () => {
    return outpasses.some((outpass) => outpass.status === "Approved" || outpass.status === "Pending")
  }

  const handleLogout = () => {
    // Clear all user data
    localStorage.removeItem("studentUser")
    localStorage.removeItem("adminUser")
    localStorage.removeItem("securityUser")

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("app-logout"))

    router.push("/login")
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

  const filteredOutpasses =
    activeTab === "all"
      ? outpasses
      : outpasses.filter((outpass) => outpass.status.toLowerCase() === activeTab.toLowerCase())

  const handleDownload = async (id: string) => {
    const outpassToDownload = outpasses.find((outpass) => outpass.id === id)

    if (!outpassToDownload) {
      toast({
        title: "Error",
        description: "Outpass not found",
        variant: "destructive",
      })
      return
    }

    try {
      // Generate PDF using our utility function
      const doc = generateOutpassPdf(outpassToDownload, student.name)

      // Save the PDF
      doc.save(`Outpass_${outpassToDownload.id}.pdf`)

      toast({
        title: "Outpass Downloaded",
        description: `Outpass #${id} has been downloaded successfully.`,
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Download Failed",
        description: "Failed to generate outpass PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openCancelDialog = (id: string) => {
    setSelectedOutpassId(id)
    setCancelDialogOpen(true)
  }

  const handleCancelOutpass = async () => {
    if (!selectedOutpassId) return

    setIsCancelling(true)

    try {
      const response = await fetch("/api/outpass", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedOutpassId,
          status: "Cancelled",
          cancelledAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to cancel outpass")
      }

      const data = await response.json()

      // Update local state
      setOutpasses((prev) =>
        prev.map((outpass) => (outpass.id === selectedOutpassId ? { ...outpass, status: "Cancelled" } : outpass)),
      )

      toast({
        title: "Outpass Cancelled",
        description: `Outpass #${selectedOutpassId} has been cancelled successfully.`,
      })
    } catch (error) {
      console.error("Error cancelling outpass:", error)
      toast({
        title: "Cancellation Failed",
        description: "There was an error cancelling your outpass. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
      setCancelDialogOpen(false)
      setSelectedOutpassId(null)
    }
  }

  if (!student) {
    return (
      <div className="responsive-container flex justify-center items-center min-h-[50vh]">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <div className="responsive-container">
      {/* Responsive dashboard header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {student.name}</p>
          <p className="text-sm text-muted-foreground">
            {student.rollNo} | {student.hostel} | Room {student.roomNo}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-4">
          {canEditProfile && (
            <Button
              variant="outline"
              asChild
              className="w-full sm:w-auto border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary"
            >
              <Link href="/student/edit-profile">
                <UserCog className="mr-2 h-4 w-4" /> Edit Profile
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/student/notifications">
              <Bell className="mr-2 h-4 w-4" /> Notifications
            </Link>
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full sm:w-auto">
                  <Button
                    asChild={!hasActiveOutpass()}
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={hasActiveOutpass()}
                  >
                    {!hasActiveOutpass() ? (
                      <Link href="/student">
                        <Plus className="mr-2 h-4 w-4" /> New Outpass
                      </Link>
                    ) : (
                      <span>
                        <Plus className="mr-2 h-4 w-4" /> New Outpass
                      </span>
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              {hasActiveOutpass() && (
                <TooltipContent className="max-w-xs bg-background border-primary/20">
                  <p>
                    You already have an active outpass (pending or approved). Please wait for admin action or cancel
                    your approved outpass before requesting a new one.
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive/10"
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">My Outpasses</CardTitle>
          <CardDescription>View and manage all your outpass requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            {/* Fix the congested tabs for mobile view */}
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex w-auto min-w-full md:grid md:grid-cols-7 mb-4">
                <TabsTrigger value="all" className="px-4 flex-1">
                  All
                </TabsTrigger>
                <TabsTrigger value="pending" className="px-4 flex-1">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="approved" className="px-4 flex-1">
                  Approved
                </TabsTrigger>
                <TabsTrigger value="rejected" className="px-4 flex-1">
                  Rejected
                </TabsTrigger>
                <TabsTrigger value="exited" className="px-4 flex-1">
                  Exited
                </TabsTrigger>
                <TabsTrigger value="returned" className="px-4 flex-1">
                  Returned
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="px-4 flex-1">
                  Cancelled
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
                      key: "returnTime",
                      title: "Return Time",
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
                          <Button
                            variant="outline"
                            size="icon"
                            asChild
                            className="border-primary/20 hover:border-primary/50"
                          >
                            <Link href={`/student/outpass/${outpass.id}`}>
                              <Eye className="h-4 w-4 text-primary" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                          {outpass.status === "Approved" && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDownload(outpass.id)}
                                className="border-primary/20 hover:border-primary/50"
                              >
                                <Download className="h-4 w-4 text-primary" />
                                <span className="sr-only">Download</span>
                              </Button>
                            </>
                          )}
                          {outpass.status === "Approved" && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                              onClick={() => openCancelDialog(outpass.id)}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Cancel</span>
                            </Button>
                          )}
                        </div>
                      ),
                    },
                  ]}
                  data={filteredOutpasses}
                  searchable={true}
                  searchPlaceholder="Search outpasses..."
                  searchKeys={["id", "type", "purpose", "date", "returnTime", "status"]}
                  emptyMessage={
                    outpasses.length === 0 ? (
                      <div className="p-4 text-center">
                        <p>You haven't created any outpass requests yet.</p>
                        <Button asChild className="mt-4 bg-primary hover:bg-primary/90" disabled={hasActiveOutpass()}>
                          {!hasActiveOutpass() ? (
                            <Link href="/student">
                              <Plus className="mr-2 h-4 w-4" /> Create Your First Outpass
                            </Link>
                          ) : (
                            <span>
                              <Plus className="mr-2 h-4 w-4" /> Create Your First Outpass
                            </span>
                          )}
                        </Button>
                        {hasActiveOutpass() && (
                          <p className="mt-2 text-xs text-red-500">
                            You already have an active outpass (pending or approved). Please wait for admin action or
                            cancel your approved outpass before requesting a new one.
                          </p>
                        )}
                      </div>
                    ) : (
                      "No outpass requests found with this status."
                    )
                  }
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Outpass</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this outpass? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOutpass}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? "Cancelling..." : "Yes, Cancel Outpass"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </div>
  )
}

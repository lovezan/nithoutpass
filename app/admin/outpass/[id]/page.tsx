"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft, CheckCircle, ThumbsDown } from "lucide-react"

export default function AdminOutpassDetails() {
  const params = useParams()
  const router = useRouter()
  const { id } = params

  const [outpass, setOutpass] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [admin, setAdmin] = useState<any>(null)
  const [unauthorized, setUnauthorized] = useState(false)

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

  // Fetch outpass details
  useEffect(() => {
    const fetchOutpassDetails = async () => {
      if (!admin || !id) return

      setIsLoading(true)
      try {
        const response = await fetch(`/api/outpass?id=${id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch outpass details")
        }

        const data = await response.json()

        if (data.outpasses && data.outpasses.length > 0) {
          const fetchedOutpass = data.outpasses[0]

          // Check if admin has access to this outpass
          if (admin.role === "hostel_admin" && fetchedOutpass.student?.hostel !== admin.hostel) {
            setUnauthorized(true)
            toast({
              title: "Access Denied",
              description: "You don't have permission to view outpasses from other hostels.",
              variant: "destructive",
            })
          } else {
            setOutpass(fetchedOutpass)
          }
        } else {
          toast({
            title: "Error",
            description: "Outpass not found",
            variant: "destructive",
          })
          router.push("/admin/dashboard")
        }
      } catch (error) {
        console.error("Error fetching outpass details:", error)
        toast({
          title: "Error",
          description: "Failed to load outpass details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (admin && id) {
      fetchOutpassDetails()
    }
  }, [admin, id, router])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-500 hover:bg-green-600"
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "rejected":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const handleApprove = async () => {
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
      setOutpass(data.outpass)

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
    // Open a dialog to get rejection reason
    const reason = prompt("Please provide a reason for rejecting this outpass:")

    if (!reason) return // User cancelled

    setLoading(true)

    try {
      const response = await fetch("/api/outpass", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status: "Rejected",
          rejectReason: reason,
          approvedBy: admin.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reject outpass")
      }

      const data = await response.json()

      // Update local state
      setOutpass(data.outpass)

      toast({
        title: "Outpass Rejected",
        description: `Outpass #${id} has been rejected.`,
      })
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href="/admin/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Loading Outpass Details...</h1>
          </div>
        </div>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href="/admin/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Access Denied</h1>
          </div>
          <Card>
            <CardContent className="py-8">
              <p className="text-center">You don't have permission to view outpasses from other hostels.</p>
              <div className="flex justify-center mt-4">
                <Button asChild>
                  <Link href="/admin/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!outpass) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href="/admin/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Outpass Not Found</h1>
          </div>
          <Card>
            <CardContent className="py-8">
              <p className="text-center">The requested outpass could not be found.</p>
              <div className="flex justify-center mt-4">
                <Button asChild>
                  <Link href="/admin/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Outpass Details</h1>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Outpass #{id}</CardTitle>
              <CardDescription>Created on {new Date(outpass.createdAt).toLocaleDateString()}</CardDescription>
            </div>
            <Badge className={getStatusColor(outpass.status)}>{outpass.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Student Name</h3>
                <p>{outpass.student.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Roll Number</h3>
                <p>{outpass.student.rollNo}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Room Number</h3>
                <p>{outpass.student.roomNo}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Hostel</h3>
                <p>{outpass.student.hostel}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact</h3>
                <p>{outpass.student.contact}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Parent Contact</h3>
                <p>{outpass.student.parentContact}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Outpass Type</h3>
                  <p>{outpass.type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Purpose</h3>
                  <p>{outpass.purpose}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Place of Visit</h3>
                  <p>{outpass.place}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Expected Date</h3>
                  <p>{outpass.date}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Expected Return Time</h3>
                  <p>{outpass.returnTime}</p>
                </div>
              </div>
            </div>

            {outpass.status === "Rejected" && outpass.rejectReason && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Rejection Reason</h3>
                <p>{outpass.rejectReason}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {outpass.status === "Pending" ? (
              <>
                <Button
                  variant="outline"
                  className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                  onClick={handleReject}
                  disabled={loading}
                >
                  <ThumbsDown className="mr-2 h-4 w-4" />
                  {loading ? "Processing..." : "Reject"}
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={loading}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {loading ? "Processing..." : "Approve"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
                Back to Dashboard
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}

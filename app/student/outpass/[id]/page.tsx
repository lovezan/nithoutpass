"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft, Download, X } from "lucide-react"
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
import { jsPDF } from "jspdf"
import BarcodeGenerator from "@/components/barcode-generator"
import { OutpassFeedbackForm } from "@/components/outpass-feedback-form"

export default function OutpassDetails() {
  const params = useParams()
  const router = useRouter()
  const { id } = params

  const [outpass, setOutpass] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  // Fetch outpass details on component mount
  useEffect(() => {
    const fetchOutpassDetails = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/outpass?id=${id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch outpass details")
        }

        const data = await response.json()

        if (data.outpasses && data.outpasses.length > 0) {
          setOutpass(data.outpasses[0])
        } else {
          toast({
            title: "Error",
            description: "Outpass not found",
            variant: "destructive",
          })
          router.push("/student/dashboard")
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

    if (id) {
      fetchOutpassDetails()
    }
  }, [id, router])

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const handleDownload = async () => {
    setLoading(true)

    try {
      // Create a new PDF document
      const doc = new jsPDF()

      // Add title and header
      doc.setFontSize(18)
      doc.text("HOSTEL OUTPASS", 105, 20, { align: "center" })

      // Get the barcode SVG element if it exists
      const barcodeElement = document.querySelector('svg[data-testid="barcode-svg"]')

      if (barcodeElement && outpass.student?.rollNo) {
        try {
          // Convert SVG to data URL
          const svgData = new XMLSerializer().serializeToString(barcodeElement)
          const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
          const DOMURL = window.URL || window.webkitURL || window
          const url = DOMURL.createObjectURL(svgBlob)

          // Create an image from the SVG
          const img = new Image()
          img.crossOrigin = "anonymous"

          // Wait for the image to load
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = url
          })

          // Create a canvas to convert SVG to PNG
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")

          if (ctx) {
            // Draw white background first
            ctx.fillStyle = "white"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            // Draw the image
            ctx.drawImage(img, 0, 0)

            // Convert to data URL and add to PDF
            const imgData = canvas.toDataURL("image/png")
            doc.addImage(imgData, "PNG", 55, 30, 100, 40)

            // Add roll number text below barcode
            doc.setFontSize(12)
            doc.text(`Roll Number: ${outpass.student.rollNo}`, 105, 75, { align: "center" })
          }

          // Clean up
          DOMURL.revokeObjectURL(url)
        } catch (error) {
          console.error("Error adding barcode to PDF:", error)
          // If barcode conversion fails, add a text placeholder
          doc.setFontSize(14)
          doc.text(`Roll Number: ${outpass.student.rollNo}`, 105, 50, { align: "center" })
        }
      } else {
        // If no barcode element, just add text
        doc.setFontSize(14)
        doc.text(`Roll Number: ${outpass.student?.rollNo || "N/A"}`, 105, 50, { align: "center" })
      }

      // Add outpass details
      doc.setFontSize(12)
      doc.text("OUTPASS DETAILS", 20, 80)

      // Add horizontal line
      doc.setLineWidth(0.5)
      doc.line(20, 85, 190, 85)

      // Student details
      doc.setFontSize(10)
      doc.text(`Outpass ID: ${outpass.id}`, 20, 95)
      doc.text(`Student Name: ${outpass.student?.name}`, 20, 105)
      doc.text(`Roll Number: ${outpass.student?.rollNo}`, 20, 115)
      doc.text(`Room Number: ${outpass.student?.roomNo}`, 20, 125)
      doc.text(`Hostel: ${outpass.student?.hostel}`, 20, 135)

      // Outpass details
      doc.text(`Type: ${outpass.type}`, 120, 95)
      doc.text(`Purpose: ${outpass.purpose}`, 120, 105)
      doc.text(`Place: ${outpass.place}`, 120, 115)
      doc.text(`Date: ${outpass.date}`, 120, 125)
      doc.text(`Return Time: ${outpass.returnTime}`, 120, 135)

      // Status and approval
      doc.text(`Status: ${outpass.status}`, 20, 150)
      doc.text(`Approved By: ${outpass.approvedBy ? `Admin #${outpass.approvedBy}` : "Pending"}`, 20, 160)
      doc.text(
        `Approved On: ${outpass.approvedAt ? new Date(outpass.approvedAt).toLocaleString() : "Pending"}`,
        20,
        170,
      )

      // Add instructions
      doc.setFontSize(9)
      doc.text("Instructions:", 20, 185)
      doc.text("1. This outpass must be presented at the gate for exit and entry.", 20, 195)
      doc.text("2. Students must return to the hostel before the specified return time.", 20, 205)
      doc.text("3. Violation of hostel rules may result in disciplinary action.", 20, 215)

      // Add footer
      doc.setFontSize(8)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 230)
      doc.text("This is an electronically generated document and does not require signature.", 20, 240)

      // Save the PDF
      doc.save(`Outpass_${outpass.id}.pdf`)

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
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOutpass = async () => {
    if (!outpass) return

    setIsCancelling(true)

    try {
      const response = await fetch("/api/outpass", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: outpass.id,
          status: "Cancelled",
          cancelledAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to cancel outpass")
      }

      const data = await response.json()

      // Update local state
      setOutpass({ ...outpass, status: "Cancelled" })

      toast({
        title: "Outpass Cancelled",
        description: `Outpass #${outpass.id} has been cancelled successfully.`,
      })

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/student/dashboard")
      }, 2000)
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
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Loading Outpass Details...</h1>
          </div>
        </div>
      </div>
    )
  }

  if (!outpass) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Outpass Not Found</h1>
          </div>
          <Card>
            <CardContent className="py-8">
              <p className="text-center">The requested outpass could not be found.</p>
              <div className="flex justify-center mt-4">
                <Button asChild>
                  <Link href="/student/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Check if barcode should be displayed
  const showBarcode = outpass.status === "Approved" || outpass.status === "Exited"
  // Check if cancel button should be displayed
  const showCancelButton = outpass.status === "Approved"

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Make the outpass details page responsive */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-0 md:mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Outpass Details</h1>
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
                <p>{outpass.student?.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Roll Number</h3>
                <p>{outpass.student?.rollNo}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Room Number</h3>
                <p>{outpass.student?.roomNo}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Hostel</h3>
                <p>{outpass.student?.hostel}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact</h3>
                <p>{outpass.student?.contact}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Parent Contact</h3>
                <p>{outpass.student?.parentContact}</p>
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

            {(outpass.status === "Approved" || outpass.status === "Exited") && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Approved By</h3>
                    <p>{outpass.approvedBy ? `Admin #${outpass.approvedBy}` : "System"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Approved On</h3>
                    <p>{outpass.approvedAt ? new Date(outpass.approvedAt).toLocaleString() : "N/A"}</p>
                  </div>
                </div>

                {showBarcode && outpass.student?.rollNo && (
                  <div className="flex flex-col items-center">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Outpass Barcode</h3>
                    <div className="border p-4 rounded-md w-full max-w-md">
                      <BarcodeGenerator value={outpass.student.rollNo} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Present this barcode at the gate for scanning</p>
                  </div>
                )}
              </div>
            )}

            {outpass.status === "Rejected" && (
              <div className="border-t pt-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Rejection Reason</h3>
                  <p>{outpass.rejectReason || "No reason provided"}</p>
                </div>
              </div>
            )}

            {outpass.status === "Cancelled" && (
              <div className="border-t pt-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Cancelled On</h3>
                  <p>{outpass.cancelledAt ? new Date(outpass.cancelledAt).toLocaleString() : "N/A"}</p>
                </div>
              </div>
            )}

            {outpass.exitTime && (
              <div className="border-t pt-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Exit Time</h3>
                  <p>{new Date(outpass.exitTime).toLocaleString()}</p>
                </div>
              </div>
            )}

            {outpass.returnTime && outpass.status === "Returned" && (
              <div className="border-t pt-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Return Time</h3>
                  <p>{new Date(outpass.returnTime).toLocaleString()}</p>
                </div>
              </div>
            )}
          </CardContent>
          {outpass.status === "Rejected" && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Provide Feedback on Rejection</h3>
              <OutpassFeedbackForm outpassId={outpass.id} studentId={outpass.student?.id} />
            </div>
          )}
          <CardFooter className="flex justify-between">
            <div></div> {/* Empty div to maintain spacing */}
            <div className="flex gap-2">
              {showCancelButton && (
                <Button
                  variant="outline"
                  className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Outpass
                </Button>
              )}
              {(outpass.status === "Approved" || outpass.status === "Exited") && (
                <Button onClick={handleDownload} disabled={loading}>
                  <Download className="mr-2 h-4 w-4" />
                  {loading ? "Downloading..." : "Download PDF"}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

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

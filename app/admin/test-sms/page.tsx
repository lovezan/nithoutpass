"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, LogOut, LogIn, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendOutpassStatusSMS } from "@/app/actions/send-status-sms"

// Status types
type OutpassStatus = "pending" | "approved" | "exited" | "returned" | "rejected" | "late"

export default function TestSMSPage() {
  const [status, setStatus] = useState<OutpassStatus>("pending")
  const [loading, setLoading] = useState<OutpassStatus | null>(null)
  const [result, setResult] = useState<{
    success?: boolean
    error?: string
    messageId?: string
  } | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [studentName, setStudentName] = useState("John Doe")

  // Function to handle status change and send SMS
  async function handleStatusChange(newStatus: OutpassStatus) {
    if (!phoneNumber) {
      setResult({
        success: false,
        error: "Please enter a phone number",
      })
      return
    }

    if (status === newStatus) return

    setLoading(newStatus)
    setResult(null)

    try {
      const response = await sendOutpassStatusSMS(phoneNumber, newStatus, studentName, "OP-TEST123", {
        rejectReason: newStatus === "rejected" ? "Past curfew time" : undefined,
      })

      setResult(response)

      if (response.success) {
        setStatus(newStatus)
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Failed to send notification",
      })
    } finally {
      setLoading(null)
    }
  }

  // Get status badge color
  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "approved":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "exited":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100"
      case "returned":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "late":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100"
      default:
        return ""
    }
  }

  // Get status display text
  const getStatusText = () => {
    switch (status) {
      case "pending":
        return "Pending Approval"
      case "approved":
        return "Outpass Approved"
      case "exited":
        return "Student Exited"
      case "returned":
        return "Student Returned"
      case "rejected":
        return "Outpass Rejected"
      case "late":
        return "Student Late"
      default:
        return ""
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test SMS Notifications</CardTitle>
          <CardDescription>Test sending SMS notifications for different outpass statuses</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Parent Phone Number</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+917006809343"
              required
            />
            <p className="text-xs text-muted-foreground">Enter a phone number in E.164 format (e.g., +917006809343)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentName">Student Name</Label>
            <Input
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="flex flex-col items-center space-y-2 py-4">
            <Badge className={`text-sm px-3 py-1 ${getStatusColor()}`}>{getStatusText()}</Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Parent will be notified at: {phoneNumber || "Please enter a phone number"}
            </p>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Notification Sent" : "Error"}</AlertTitle>
              <AlertDescription>
                {result.success
                  ? "SMS notification was sent successfully to parent."
                  : `Failed to send notification: ${result.error}`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="grid grid-cols-3 gap-2 w-full">
            <Button
              variant="outline"
              className="flex items-center justify-center"
              disabled={status === "approved" || loading !== null}
              onClick={() => handleStatusChange("approved")}
            >
              {loading === "approved" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center"
              disabled={status !== "approved" || loading !== null}
              onClick={() => handleStatusChange("exited")}
            >
              {loading === "exited" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Exit
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center"
              disabled={status !== "exited" || loading !== null}
              onClick={() => handleStatusChange("returned")}
            >
              {loading === "returned" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Return
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full mt-2">
            <Button
              variant="outline"
              className="flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
              disabled={status === "rejected" || loading !== null}
              onClick={() => handleStatusChange("rejected")}
            >
              {loading === "rejected" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700"
              disabled={status !== "exited" || loading !== null}
              onClick={() => handleStatusChange("late")}
            >
              {loading === "late" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark Late"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

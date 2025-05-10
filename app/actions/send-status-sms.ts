"use server"

import { sendSMS } from "./send-sms"
import { formatIndianPhoneNumber } from "@/lib/utils/notification-service"

// Function to get message based on status and student details
function getStatusMessage(status: string, studentName: string, outpassId: string, details: any = {}): string {
  // For exit and return statuses, use the timestamps from the outpass record if available
  const exitTime = details.exitTime
    ? new Date(details.exitTime).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })

  const returnTime = details.returnTime
    ? new Date(details.returnTime).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })

  switch (status.toLowerCase()) {
    case "approved":
      return `HOSTEL OUTPASS: Your ward ${studentName}'s outpass #${outpassId} has been APPROVED. They are permitted to leave campus as per the requested time.`

    case "exited":
      return `HOSTEL OUTPASS: Your ward ${studentName} has EXITED the campus at ${exitTime} using outpass #${outpassId}.`

    case "returned":
      return `HOSTEL OUTPASS: Your ward ${studentName} has safely RETURNED to campus at ${returnTime} with outpass #${outpassId}.`

    case "rejected":
      const reason = details.rejectReason ? ` Reason: ${details.rejectReason}` : ""
      return `HOSTEL OUTPASS: Your ward ${studentName}'s outpass #${outpassId} has been REJECTED.${reason}`

    case "late":
      return `URGENT - HOSTEL OUTPASS: Your ward ${studentName} is LATE to return to campus. Their outpass #${outpassId} return time has passed. Please contact them immediately.`

    default:
      return `HOSTEL OUTPASS: Update on your ward ${studentName}'s outpass #${outpassId} status: ${status}.`
  }
}

export async function sendOutpassStatusSMS(
  phoneNumber: string,
  status: string,
  studentName: string,
  outpassId: string,
  details: any = {},
) {
  try {
    // Format the phone number to ensure it has the Indian country code
    const formattedNumber = formatIndianPhoneNumber(phoneNumber)

    // Get the appropriate message for this status
    const message = getStatusMessage(status, studentName, outpassId, details)

    // Send the SMS
    return await sendSMS(formattedNumber, message)
  } catch (error) {
    console.error("Error sending outpass status SMS:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    }
  }
}

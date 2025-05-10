// Enhanced notification service with Indian phone number support

export type NotificationType = "sms" | "email" | "push"
export type RecipientType = "parent" | "admin" | "student"

export interface NotificationOptions {
  type?: NotificationType
  recipientType: RecipientType
  recipientId: string
  outpassId: string
  subject?: string
  message: string
  priority?: "low" | "normal" | "high"
}

/**
 * Format a phone number to ensure it has the Indian country code
 * @param phoneNumber The phone number to format
 * @returns Formatted phone number with +91 prefix
 */
export function formatIndianPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, "")

  // If it's a 10-digit number without country code, add +91
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`
  }

  // If it already has +91 or other format, return as is
  if (phoneNumber.includes("+91")) {
    return phoneNumber
  }

  // Default case: add +91 if not already present
  return `+91${digitsOnly}`
}

// Update the sendSMS function to use our new server action
export async function sendSMS(phoneNumber: string, message: string) {
  // Format the phone number to ensure it has the Indian country code
  const formattedNumber = formatIndianPhoneNumber(phoneNumber)

  // In a real implementation, this would send an SMS using our server action
  console.log(`[SMS] Sending to ${formattedNumber}: ${message}`)

  try {
    // Import the server action dynamically to avoid issues with "use server" directive
    const { sendSMS } = await import("@/app/actions/send-sms")
    return await sendSMS(formattedNumber, message)
  } catch (error) {
    console.error("Error sending SMS:", error)
    // Mock implementation - return success
    return {
      success: true,
      messageId: `sms_${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient: formattedNumber,
    }
  }
}

/**
 * Send an email notification
 * @param email The recipient's email address
 * @param subject The email subject
 * @param message The email body
 * @returns Promise with the result of the operation
 */
export async function sendEmail(email: string, subject: string, message: string) {
  // In a real implementation, this would send an email using a service like SendGrid
  console.log(`[EMAIL] Sending to ${email}: ${subject}`)

  // Mock implementation - return success
  return {
    success: true,
    messageId: `email_${Date.now()}`,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Send a push notification
 * @param userId The recipient's user ID
 * @param title The notification title
 * @param message The notification message
 * @returns Promise with the result of the operation
 */
export async function sendPushNotification(userId: string, title: string, message: string) {
  // In a real implementation, this would send a push notification using a service like Firebase
  console.log(`[PUSH] Sending to ${userId}: ${title}`)

  // Mock implementation - return success
  return {
    success: true,
    messageId: `push_${Date.now()}`,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Send a notification through the appropriate channel
 * @param options The notification options
 * @returns Promise with the result of the operation
 */
export async function sendNotification(options: NotificationOptions) {
  try {
    // Log the notification request
    console.log(`Sending notification: ${JSON.stringify(options)}`)

    // Store the notification in the database via API
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      throw new Error("Failed to store notification")
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending notification:", error)
    throw error
  }
}

// Update the formatStatusChangeMessage function to include more details
export function formatStatusChangeMessage(
  status: string,
  studentName: string,
  rollNo: string,
  outpassId: string,
  details: any = {},
): string {
  // Use the actual timestamps from the outpass record if available
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
      return `HOSTEL OUTPASS: Your ward ${studentName} (${rollNo}) has been APPROVED for outpass #${outpassId}. They are permitted to leave campus as per the requested time.`

    case "exited":
      return `HOSTEL OUTPASS: Your ward ${studentName} (${rollNo}) has EXITED the campus at ${exitTime} using outpass #${outpassId}.`

    case "returned":
      return `HOSTEL OUTPASS: Your ward ${studentName} (${rollNo}) has safely RETURNED to campus at ${returnTime} with outpass #${outpassId}.`

    case "rejected":
      const reason = details.rejectReason ? ` Reason: ${details.rejectReason}` : ""
      return `HOSTEL OUTPASS: Your ward ${studentName} (${rollNo})'s outpass #${outpassId} has been REJECTED.${reason}`

    case "late":
      return `URGENT - HOSTEL OUTPASS: Your ward ${studentName} (${rollNo}) is LATE to return to campus. Their outpass #${outpassId} return time has passed. Please contact them immediately.`

    default:
      return `HOSTEL OUTPASS: Update on your ward ${studentName} (${rollNo})'s outpass #${outpassId} status: ${status}.`
  }
}

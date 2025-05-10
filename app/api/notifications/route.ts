import { NextResponse } from "next/server"
import { sendEmail, sendSMS, formatIndianPhoneNumber } from "@/lib/utils/notification-service"

// Mock database
const notifications = [
  {
    id: "NOT-001",
    type: "parent",
    recipientId: "ST-001",
    outpassId: "OP-CS12345",
    message: "Your child John Doe has been approved for a home outpass from 2023-04-10 to 2023-04-12.",
    status: "sent",
    sentAt: "2023-04-09T14:30:00Z",
    channel: "sms",
    phoneNumber: "+919876543211",
  },
  {
    id: "NOT-002",
    type: "admin",
    recipientId: "AD-001",
    outpassId: "OP-CS12345",
    message:
      "Student John Doe (CS12345) is late for return. Expected: 2023-04-10 18:00, Current time: 2023-04-10 19:30.",
    status: "sent",
    sentAt: "2023-04-10T19:30:00Z",
    channel: "email",
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const recipientId = searchParams.get("recipientId")
  const type = searchParams.get("type")
  const types = searchParams.get("types")
  const outpassId = searchParams.get("outpassId")
  const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : undefined

  let result = [...notifications]

  if (recipientId) {
    result = result.filter((notification) => notification.recipientId === recipientId)
  }

  if (type) {
    result = result.filter((notification) => notification.type === type)
  }

  if (types) {
    const typeArray = types.split(",")
    result = result.filter((notification) => typeArray.includes(notification.type))
  }

  if (outpassId) {
    result = result.filter((notification) => notification.outpassId === outpassId)
  }

  // Sort by most recent first
  result.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())

  // Apply limit if specified
  if (limit && limit > 0) {
    result = result.slice(0, limit)
  }

  return NextResponse.json({ notifications: result })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["type", "recipientId", "outpassId", "message"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Generate a new notification ID
    const newId = `NOT-${String(notifications.length + 1).padStart(3, "0")}`

    // Determine the notification channel (sms, email, push)
    const channel = body.channel || "sms"

    // Format phone number if it's an SMS notification
    if (channel === "sms" && body.phoneNumber) {
      body.phoneNumber = formatIndianPhoneNumber(body.phoneNumber)
    }

    const newNotification = {
      id: newId,
      ...body,
      status: "sent",
      sentAt: new Date().toISOString(),
      channel,
    }

    // Add to our mock database
    notifications.push(newNotification)

    // In a real app, this would send an actual SMS or email
    console.log(`Sending notification via ${channel}: ${body.message}`)

    // Simulate sending the notification through the appropriate channel
    if (channel === "sms" && body.phoneNumber) {
      await sendSMS(body.phoneNumber, body.message)
    } else if (channel === "email" && body.email) {
      await sendEmail(body.email, body.subject || "Hostel Outpass Notification", body.message)
    }

    return NextResponse.json({ notification: newNotification }, { status: 201 })
  } catch (error) {
    console.error("Failed to send notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { formatStatusChangeMessage, formatIndianPhoneNumber } from "@/lib/utils/notification-service"

// Import the sendOutpassStatusSMS action
import { sendOutpassStatusSMS } from "@/app/actions/send-status-sms"

// Mock database
const outpasses = [
  {
    id: "OP-CS12345",
    studentId: "ST-001",
    type: "Market",
    purpose: "Shopping",
    place: "City Market",
    date: "2023-04-10",
    returnTime: "18:00",
    status: "Approved",
    createdAt: "2023-04-08T10:30:00Z",
    approvedBy: "AD-001",
    approvedAt: "2023-04-09T14:20:00Z",
    exitTime: null,
    returnTime: null,
    rejectReason: null,
    barcode: "/api/barcode?token=OP-CS12345-1681047600000",
    barcodeToken: "OP-CS12345-1681047600000",
    cancelledAt: null,
    student: {
      name: "John Doe",
      rollNo: "CS12345",
      roomNo: "A-101",
      hostel: "A Block",
      contact: "9876543210",
      parentContact: "9876543211",
    },
    notificationSent: false, // Track if notification was sent
  },
  {
    id: "OP-CS12346",
    studentId: "ST-002",
    type: "Home",
    purpose: "Family function",
    place: "Hometown",
    date: "2023-04-15",
    returnTime: "20:00",
    status: "Pending",
    createdAt: "2023-04-09T14:20:00Z",
    approvedBy: null,
    approvedAt: null,
    exitTime: null,
    returnTime: null,
    rejectReason: null,
    barcode: null,
    barcodeToken: null,
    cancelledAt: null,
    student: {
      name: "Alice Johnson",
      rollNo: "CS12346",
      roomNo: "A-102",
      hostel: "A Block",
      contact: "+91 9876543212",
      parentContact: "+91 9876543213",
    },
    notificationSent: false,
  },
  {
    id: "OP-CS12347",
    studentId: "ST-003",
    type: "Market",
    purpose: "Groceries",
    place: "Local Market",
    date: "2023-04-05",
    returnTime: "19:30",
    status: "Rejected",
    createdAt: "2023-04-03T09:15:00Z",
    approvedBy: "AD-001",
    approvedAt: "2023-04-04T10:00:00Z",
    exitTime: null,
    returnTime: null,
    rejectReason: "Past curfew time",
    barcode: null,
    barcodeToken: null,
    cancelledAt: null,
    student: {
      name: "Bob Smith",
      rollNo: "CS12347",
      roomNo: "A-103",
      hostel: "A Block",
      contact: "+91 9876543214",
      parentContact: "+91 9876543215",
    },
    notificationSent: true,
  },
  {
    id: "OP-CS12348",
    studentId: "ST-004",
    type: "Market",
    purpose: "Stationary",
    place: "Book Store",
    date: "2023-04-02",
    returnTime: "17:00",
    status: "Returned",
    createdAt: "2023-04-01T11:45:00Z",
    approvedBy: "AD-002",
    approvedAt: "2023-04-01T15:30:00Z",
    exitTime: "2023-04-02T14:00:00Z",
    returnTime: "2023-04-02T16:45:00Z",
    rejectReason: null,
    barcode: null, // Barcode removed after return
    barcodeToken: null, // Token removed after return
    cancelledAt: null,
    student: {
      name: "Charlie Davis",
      rollNo: "CS12348",
      roomNo: "B-101",
      hostel: "B Block",
      contact: "+91 9876543216",
      parentContact: "+91 9876543217",
    },
    notificationSent: true,
  },
  {
    id: "OP-CS12349",
    studentId: "ST-005",
    type: "Home",
    purpose: "Wedding",
    place: "Home Town",
    date: "2023-04-20",
    returnTime: "21:00",
    status: "Pending",
    createdAt: "2023-04-18T08:30:00Z",
    approvedBy: null,
    approvedAt: null,
    exitTime: null,
    returnTime: null,
    rejectReason: null,
    barcode: null,
    barcodeToken: null,
    cancelledAt: null,
    student: {
      name: "Diana Evans",
      rollNo: "CS12349",
      roomNo: "B-102",
      hostel: "B Block",
      contact: "+91 9876543218",
      parentContact: "+91 9876543219",
    },
    notificationSent: false,
  },
]

// Update the sendStatusNotifications function to prevent duplicate notifications
async function sendStatusNotifications(outpass, oldStatus) {
  if (!outpass || !outpass.student) return

  const { id, status, student } = outpass
  const { name, rollNo, parentContact } = student

  // Format the parent's contact number with Indian country code
  const formattedParentContact = formatIndianPhoneNumber(parentContact)

  // Only send notifications for specific status changes and if notification hasn't been sent
  if (oldStatus === status || outpass.notificationSent) return

  try {
    // Format the notification message
    const message = formatStatusChangeMessage(status, name, rollNo, id, outpass)

    // Send SMS notification to parent for all status changes
    if (parentContact) {
      await sendOutpassStatusSMS(formattedParentContact, status, name, id, outpass)
    }

    // Determine who should receive the notification
    if (status === "Approved") {
      // Notify parent for approved outpasses
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "parent",
          recipientId: outpass.studentId,
          outpassId: id,
          message,
          phoneNumber: formattedParentContact, // Use the formatted number
          channel: "sms",
        }),
      })

      // Also notify student about approval
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "student",
          recipientId: outpass.studentId,
          outpassId: id,
          message: `Your outpass request #${id} has been approved. You can now exit the campus using this outpass.`,
          channel: "app",
        }),
      })
    } else if (status === "Rejected") {
      // Notify parent for rejected outpasses
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "parent",
          recipientId: outpass.studentId,
          outpassId: id,
          message,
          phoneNumber: formattedParentContact,
          channel: "sms",
        }),
      })

      // Also send a notification to the student directly
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "student",
          recipientId: outpass.studentId,
          outpassId: id,
          message: `Your outpass request #${id} has been rejected. Reason: ${outpass.rejectReason || "No reason provided"}.`,
          channel: "app",
          priority: "high",
        }),
      })
    } else if (status === "Exited") {
      // Notify hostel admin when student exits
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "admin",
          recipientId: outpass.approvedBy || "AD-001", // Default to first admin if none specified
          outpassId: id,
          message,
          channel: "email",
          subject: `Student Exit: ${name} (${rollNo})`,
        }),
      })

      // Also notify parent when student exits
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "parent",
          recipientId: outpass.studentId,
          outpassId: id,
          message,
          phoneNumber: formattedParentContact, // Use the formatted number
          channel: "sms",
        }),
      })
    } else if (status === "Returned") {
      // Notify hostel admin when student returns
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "admin",
          recipientId: outpass.approvedBy || "AD-001", // Default to first admin if none specified
          outpassId: id,
          message,
          channel: "email",
          subject: `Student Return: ${name} (${rollNo})`,
        }),
      })

      // Also notify parent when student returns
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "parent",
          recipientId: outpass.studentId,
          outpassId: id,
          message,
          phoneNumber: formattedParentContact, // Use the formatted number
          channel: "sms",
        }),
      })
    } else if (status === "Late") {
      // Notify both parent and hostel admin when student is late
      // Notify parent
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "parent",
          recipientId: outpass.studentId,
          outpassId: id,
          message,
          phoneNumber: formattedParentContact, // Use the formatted number
          channel: "sms",
          priority: "high",
        }),
      })

      // Notify admin
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "admin",
          recipientId: outpass.approvedBy || "AD-001", // Default to first admin if none specified
          outpassId: id,
          message,
          channel: "email",
          subject: `URGENT: Student Late Return - ${name} (${rollNo})`,
          priority: "high",
        }),
      })
    }

    // Mark notification as sent to prevent duplicates
    outpass.notificationSent = true

    console.log(`Notifications sent for outpass ${id} status change to ${status}`)
  } catch (error) {
    console.error("Error sending status notifications:", error)
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const studentId = searchParams.get("studentId")
  const status = searchParams.get("status")
  const hostel = searchParams.get("hostel")
  const date = searchParams.get("date")
  const token = searchParams.get("token")
  const rollNo = searchParams.get("rollNo")

  let result = [...outpasses]

  // If no filters are provided, return all outpasses
  if (!id && !studentId && !status && !hostel && !date && !token && !rollNo) {
    return NextResponse.json({ outpasses: result })
  }

  // Filter by exact ID match
  if (id) {
    result = result.filter((outpass) => outpass.id === id)

    // If no results and ID might be partial, try partial matching
    if (result.length === 0) {
      result = outpasses.filter((outpass) => outpass.id.toLowerCase().includes(id.toLowerCase()))
    }
  }

  // Filter by student ID
  if (studentId) {
    result = result.filter((outpass) => outpass.studentId === studentId)
  }

  // Filter by roll number - enhanced to be more flexible
  if (rollNo) {
    // First try exact match on student roll number
    const exactMatches = result.filter((outpass) => outpass.student?.rollNo === rollNo)

    if (exactMatches.length > 0) {
      result = exactMatches
    } else {
      // Try to match by ID (which now contains roll number)
      const idMatches = outpasses.filter((outpass) => outpass.id === `OP-${rollNo}`)

      if (idMatches.length > 0) {
        result = idMatches
      } else {
        // Try partial match on roll number
        result = outpasses.filter(
          (outpass) =>
            outpass.student?.rollNo.toLowerCase().includes(rollNo.toLowerCase()) ||
            outpass.id.toLowerCase().includes(rollNo.toLowerCase()),
        )
      }
    }
  }

  // Filter by status
  if (status) {
    result = result.filter((outpass) => outpass.status.toLowerCase() === status.toLowerCase())
  }

  // Filter by hostel - this is crucial for hostel admins
  if (hostel) {
    result = result.filter((outpass) => outpass.student?.hostel === hostel)
  }

  // Filter by date - new filter for daily reports
  if (date) {
    result = result.filter((outpass) => outpass.date === date)
  }

  // Filter by barcode token - important for gate security
  if (token) {
    // First try exact match
    const exactMatches = result.filter((outpass) => outpass.barcodeToken === token)

    if (exactMatches.length > 0) {
      result = exactMatches
    } else {
      // Try to extract roll number from token
      const rollNoMatch = token.match(/OP-([A-Z0-9]+)-/)
      if (rollNoMatch && rollNoMatch[1]) {
        const extractedRollNo = rollNoMatch[1]
        const rollNoMatches = outpasses.filter(
          (outpass) => outpass.student?.rollNo === extractedRollNo || outpass.id === `OP-${extractedRollNo}`,
        )

        if (rollNoMatches.length > 0) {
          result = rollNoMatches
        }
      } else {
        // Try partial match if token contains outpass ID
        const partialMatches = outpasses.filter(
          (outpass) => token.includes(outpass.id) || (outpass.barcodeToken && outpass.barcodeToken.includes(token)),
        )

        if (partialMatches.length > 0) {
          result = partialMatches
        }
      }
    }
  }

  return NextResponse.json({ outpasses: result })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["type", "purpose", "place", "date", "returnTime"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Check if student roll number is available
    if (!body.student?.rollNo) {
      return NextResponse.json({ error: "Student roll number is required" }, { status: 400 })
    }

    // Generate a simple ID using student roll number
    const studentRollNo = body.student.rollNo
    const newId = `OP-${studentRollNo}`

    // Check if an outpass with this ID already exists
    const existingOutpass = outpasses.find(
      (o) => o.id === newId && o.status !== "Returned" && o.status !== "Rejected" && o.status !== "Cancelled",
    )
    if (existingOutpass) {
      return NextResponse.json(
        {
          error:
            "Student already has an active outpass. Please cancel or complete the existing outpass before creating a new one.",
        },
        { status: 400 },
      )
    }

    const newOutpass = {
      id: newId,
      studentId: body.studentId || `ST-${Math.random().toString(36).substring(2, 10)}`,
      type: body.type,
      purpose: body.purpose,
      place: body.place,
      date: body.date,
      returnTime: body.returnTime,
      status: "Pending",
      createdAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
      exitTime: null,
      returnTime: null,
      rejectReason: null,
      barcode: null,
      barcodeToken: null,
      cancelledAt: null,
      student: body.student || {
        name: "Unknown Student",
        rollNo: "Unknown",
        roomNo: "Unknown",
        hostel: "Unknown",
        contact: "Unknown",
        parentContact: "Unknown",
      },
      notificationSent: false,
    }

    // Add to our mock database
    outpasses.push(newOutpass)

    // Log for debugging
    console.log("New outpass created:", newOutpass)

    // Send notification to hostel admin about new outpass request
    try {
      const message = `New outpass request from ${newOutpass.student.name} (${newOutpass.student.rollNo}) for ${newOutpass.type} outpass on ${newOutpass.date}.`

      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "admin",
          recipientId: "AD-001", // Default to first admin
          outpassId: newOutpass.id,
          message,
          channel: "email",
          subject: `New Outpass Request: ${newOutpass.student.name}`,
        }),
      })
    } catch (notifyError) {
      console.error("Error sending admin notification:", notifyError)
    }

    return NextResponse.json({ outpass: newOutpass }, { status: 201 })
  } catch (error) {
    console.error("Error creating outpass:", error)
    return NextResponse.json({ error: "Failed to create outpass" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: "Missing outpass ID" }, { status: 400 })
    }

    const outpassIndex = outpasses.findIndex((o) => o.id === body.id)

    if (outpassIndex === -1) {
      return NextResponse.json({ error: "Outpass not found" }, { status: 404 })
    }

    const oldStatus = outpasses[outpassIndex].status

    // Reset notification flag if status is changing
    if (body.status && body.status !== oldStatus) {
      outpasses[outpassIndex].notificationSent = false
    }

    // Update the outpass
    outpasses[outpassIndex] = {
      ...outpasses[outpassIndex],
      ...body,
    }

    // If status is being updated to "Approved", generate barcode and set approvedAt
    if (body.status === "Approved" && oldStatus !== "Approved") {
      // Use the student's roll number directly for the barcode
      const rollNo = outpasses[outpassIndex].student?.rollNo || "UNKNOWN"

      // We don't need to generate a barcode URL anymore since we'll use the BarcodeGenerator component
      // Just store the roll number as the barcode token
      outpasses[outpassIndex].barcodeToken = rollNo
      outpasses[outpassIndex].approvedAt = new Date().toISOString()

      console.log(`Generating barcode for outpass ${body.id} using roll number: ${rollNo}`)
    }

    // If status is being updated to "Cancelled", set cancelledAt
    if (body.status === "Cancelled" && oldStatus !== "Cancelled") {
      outpasses[outpassIndex].cancelledAt = new Date().toISOString()

      // Remove barcode when cancelled
      outpasses[outpassIndex].barcode = null
      outpasses[outpassIndex].barcodeToken = null

      console.log(`Outpass ${body.id} has been cancelled by student`)
    }

    // If status is being updated to "Returned", remove barcode
    if (body.status === "Returned" && oldStatus !== "Returned") {
      // Only remove barcode and token when student has returned
      outpasses[outpassIndex].barcode = null
      outpasses[outpassIndex].barcodeToken = null
    }

    // Send notifications for status changes
    await sendStatusNotifications(outpasses[outpassIndex], oldStatus)

    return NextResponse.json({ outpass: outpasses[outpassIndex] })
  } catch (error) {
    console.error("Error updating outpass:", error)
    return NextResponse.json({ error: "Failed to update outpass" }, { status: 500 })
  }
}

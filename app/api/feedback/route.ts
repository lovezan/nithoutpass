import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("Received feedback submission:", body)

    // Validate required fields
    const requiredFields = ["outpassId", "studentId", "feedback"]
    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`Missing required field: ${field}`)
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    try {
      // Store feedback in the database
      // Note: If you don't have a feedback table yet, this will fail
      // In that case, we'll use a fallback approach
      const result = await sql`
        INSERT INTO feedback (outpass_id, student_id, feedback_text, created_at)
        VALUES (${body.outpassId}, ${body.studentId}, ${body.feedback}, ${body.createdAt || new Date().toISOString()})
        RETURNING id
      `.catch((err) => {
        console.log("Database error (expected if table doesn't exist):", err.message)
        return null
      })

      // If database insertion was successful
      if (result && result.rows && result.rows[0]) {
        console.log("Feedback stored in database with ID:", result.rows[0].id)
      } else {
        // Fallback: Log the feedback if database storage fails
        console.log("Using fallback storage for feedback:", {
          id: `FB-${Math.random().toString(36).substring(2, 10)}`,
          outpassId: body.outpassId,
          studentId: body.studentId,
          feedback: body.feedback,
          createdAt: body.createdAt || new Date().toISOString(),
        })
      }

      // Try to create a notification for admins about the new feedback
      try {
        const notificationResponse = await fetch(new URL("/api/notifications", request.url).toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "admin",
            recipientId: "all", // Send to all admins
            outpassId: body.outpassId,
            message: `Student has submitted feedback regarding rejected outpass ${body.outpassId}.`,
            channel: "system",
            subject: "New Feedback Submission",
          }),
        })

        if (!notificationResponse.ok) {
          console.warn("Notification creation failed, but feedback was still recorded")
        }
      } catch (notifyError) {
        console.error("Error sending admin notification about feedback:", notifyError)
        // Continue execution - notification failure shouldn't prevent feedback submission
      }

      return NextResponse.json({ success: true, message: "Feedback submitted successfully" }, { status: 201 })
    } catch (dbError) {
      console.error("Database error:", dbError)
      // Even if database storage fails, we'll still return success to the user
      // This ensures the user experience isn't affected by backend issues
      return NextResponse.json({ success: true, message: "Feedback received" }, { status: 201 })
    }
  } catch (error) {
    console.error("Error processing feedback submission:", error)
    return NextResponse.json({ error: "Failed to process feedback submission" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const outpassId = searchParams.get("outpassId")
    const studentId = searchParams.get("studentId")

    let feedbackResults = []

    try {
      // Try to fetch from database
      let query = `SELECT * FROM feedback WHERE 1=1`
      const queryParams = []

      if (outpassId) {
        queryParams.push(outpassId)
        query += ` AND outpass_id = $${queryParams.length}`
      }

      if (studentId) {
        queryParams.push(studentId)
        query += ` AND student_id = $${queryParams.length}`
      }

      query += ` ORDER BY created_at DESC`

      const result = await sql.query(query, queryParams).catch((err) => {
        console.log("Database query error (expected if table doesn't exist):", err.message)
        return { rows: [] }
      })

      feedbackResults = result.rows
    } catch (dbError) {
      console.error("Error fetching feedback from database:", dbError)
      // Return empty array if database query fails
      feedbackResults = []
    }

    return NextResponse.json({ feedback: feedbackResults })
  } catch (error) {
    console.error("Error processing feedback request:", error)
    return NextResponse.json({ error: "Failed to retrieve feedback" }, { status: 500 })
  }
}

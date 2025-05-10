import { NextResponse } from "next/server"
import { students } from "../../students/shared-data"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate login credentials
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find student by email and password
    const student = students.find((s) => s.email === body.email && s.password === body.password)

    if (!student) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Don't send the password back
    const { password, ...studentData } = student

    return NextResponse.json({ student: studentData })
  } catch (error) {
    console.error("Student login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}

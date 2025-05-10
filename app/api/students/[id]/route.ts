import { NextResponse } from "next/server"
import { students } from "../shared-data"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    // Find the student
    const studentIndex = students.findIndex((s) => s.id === id)

    if (studentIndex === -1) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Update the student's profile
    const updatedStudent = {
      ...students[studentIndex],
      ...body,
    }

    // Save the updated student
    students[studentIndex] = updatedStudent

    // Return the updated student (without password)
    const { password, ...studentData } = students[studentIndex]

    return NextResponse.json({ student: studentData })
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 })
  }
}

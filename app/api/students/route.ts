import { NextResponse } from "next/server"
import { students } from "./shared-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const rollNo = searchParams.get("rollNo")
  const hostel = searchParams.get("hostel")
  const email = searchParams.get("email")

  let result = [...students]

  if (id) {
    result = result.filter((student) => student.id === id)
  }

  if (rollNo) {
    result = result.filter((student) => student.rollNo === rollNo)
  }

  if (hostel) {
    result = result.filter((student) => student.hostel === hostel)
  }

  if (email) {
    result = result.filter((student) => student.email === email)
  }

  // Remove passwords before sending the response
  const sanitizedResult = result.map(({ password, ...rest }) => rest)

  return NextResponse.json({ students: sanitizedResult })
}

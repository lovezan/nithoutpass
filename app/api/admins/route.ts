import { NextResponse } from "next/server"

// Mock database
const admins = [
  {
    id: "AD-001",
    username: "admin",
    password: "password", // In a real app, this would be hashed
    name: "Admin User",
    hostel: "A Block",
    role: "hostel_admin",
  },
  {
    id: "AD-002",
    username: "bblock",
    password: "password", // In a real app, this would be hashed
    name: "B Block Admin",
    hostel: "B Block",
    role: "hostel_admin",
  },
  {
    id: "AD-003",
    username: "security",
    password: "password", // In a real app, this would be hashed
    name: "Security Officer",
    hostel: null,
    role: "security",
  },
]

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate login credentials
    if (!body.username || !body.password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const admin = admins.find((a) => a.username === body.username && a.password === body.password)

    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Don't send the password back
    const { password, ...adminData } = admin

    return NextResponse.json({ admin: adminData })
  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}

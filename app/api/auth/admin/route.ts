import { NextResponse } from "next/server"

// Mock admin database
export const admins = [
  {
    id: "AD-001",
    username: "kailash_admin",
    password: "password", // In a real app, this would be hashed
    name: "Kailash Hostel Admin",
    hostel: "Kailash Boys Hostel",
    role: "hostel_admin",
  },
  {
    id: "AD-002",
    username: "himadri_admin",
    password: "password", // In a real app, this would be hashed
    name: "Himadri Hostel Admin",
    hostel: "Himadri Boys Hostel",
    role: "hostel_admin",
  },
  {
    id: "AD-003",
    username: "himgiri_admin",
    password: "password", // In a real app, this would be hashed
    name: "Himgiri Hostel Admin",
    hostel: "Himgiri Boys Hostel",
    role: "hostel_admin",
  },
  {
    id: "AD-004",
    username: "udaygiri_admin",
    password: "password", // In a real app, this would be hashed
    name: "Udaygiri Hostel Admin",
    hostel: "Udaygiri Boys Hostel",
    role: "hostel_admin",
  },
  {
    id: "AD-005",
    username: "neelkanth_admin",
    password: "password", // In a real app, this would be hashed
    name: "Neelkanth Hostel Admin",
    hostel: "Neelkanth Boys Hostel",
    role: "hostel_admin",
  },
  {
    id: "AD-006",
    username: "dhauladhar_admin",
    password: "password", // In a real app, this would be hashed
    name: "Dhauladhar Hostel Admin",
    hostel: "Dhauladhar Boys Hostel",
    role: "hostel_admin",
  },
  {
    id: "AD-007",
    username: "vindhyachal_admin",
    password: "password", // In a real app, this would be hashed
    name: "Vindhyachal Hostel Admin",
    hostel: "Vindhyachal Boys Hostel",
    role: "hostel_admin",
  },
  {
    id: "AD-008",
    username: "ambika_admin",
    password: "password", // In a real app, this would be hashed
    name: "Ambika Hostel Admin",
    hostel: "Ambika Girls Hostel",
    role: "hostel_admin",
  },
  {
    id: "AD-009",
    username: "parvati_admin",
    password: "password", // In a real app, this would be hashed
    name: "Parvati Hostel Admin",
    hostel: "Parvati Girls Hostel",
    role: "hostel_admin",
  },
  {
    id: "AD-010",
    username: "manimahesh_admin",
    password: "password", // In a real app, this would be hashed
    name: "Manimahesh Hostel Admin",
    hostel: "Manimahesh Girls Hostel",
    role: "hostel_admin",
  },
  {
    id: "AD-011",
    username: "aravali_admin",
    password: "password", // In a real app, this would be hashed
    name: "Aravali Hostel Admin",
    hostel: "Aravali Girls Hostel",
    role: "hostel_admin",
  },
  {
    id: "AD-012",
    username: "satpura_admin",
    password: "password", // In a real app, this would be hashed
    name: "Satpura Hostel Admin",
    hostel: "Satpura Hostel",
    role: "hostel_admin",
  },
  {
    id: "AD-013",
    username: "gate1_security",
    password: "password", // In a real app, this would be hashed
    name: "Gate 1 Security Officer",
    hostel: null,
    role: "security",
    gate: "Gate 1",
  },
  {
    id: "AD-014",
    username: "gate2_security",
    password: "password", // In a real app, this would be hashed
    name: "Gate 2 Security Officer",
    hostel: null,
    role: "security",
    gate: "Gate 2",
  },
  {
    id: "AD-015",
    username: "superadmin",
    password: "password", // In a real app, this would be hashed
    name: "Super Admin",
    hostel: null,
    role: "super_admin",
  },
]

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate login credentials
    if (!body.username || !body.password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Find admin by username and password
    const admin = admins.find((a) => a.username === body.username && a.password === body.password)

    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // For hostel admins, verify the hostel matches
    if (admin.role === "hostel_admin" && body.hostel && admin.hostel !== body.hostel) {
      return NextResponse.json({ error: "Invalid credentials for the selected hostel" }, { status: 401 })
    }

    // Don't send the password back
    const { password, ...adminData } = admin

    return NextResponse.json({ admin: adminData })
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { admins } from "../admin/route"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate login credentials
    if (!body.username || !body.password || !body.gate) {
      return NextResponse.json({ error: "Username, password, and gate are required" }, { status: 400 })
    }

    // Find security personnel by username and password
    const security = admins.find(
      (a) => a.username === body.username && a.password === body.password && a.role === "security",
    )

    if (!security) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if the security personnel is assigned to the selected gate
    if (security.gate !== body.gate) {
      return NextResponse.json({ error: "You are not authorized for the selected gate" }, { status: 401 })
    }

    // Don't send the password back
    const { password, ...securityData } = security

    return NextResponse.json({ security: securityData })
  } catch (error) {
    console.error("Gate security login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}

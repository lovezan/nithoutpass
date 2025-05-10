import { NextResponse } from "next/server"

// Mock database
const gateLogs = [
  {
    id: "GL-001",
    outpassId: "OP-001",
    studentId: "ST-001",
    action: "exit",
    timestamp: "2023-04-10T14:30:00Z",
  },
  {
    id: "GL-002",
    outpassId: "OP-002",
    studentId: "ST-002",
    action: "exit",
    timestamp: "2023-04-10T15:45:00Z",
  },
  {
    id: "GL-003",
    outpassId: "OP-002",
    studentId: "ST-002",
    action: "return",
    timestamp: "2023-04-10T17:30:00Z",
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const outpassId = searchParams.get("outpassId")
  const studentId = searchParams.get("studentId")
  const action = searchParams.get("action")

  let result = [...gateLogs]

  if (outpassId) {
    result = result.filter((log) => log.outpassId === outpassId)
  }

  if (studentId) {
    result = result.filter((log) => log.studentId === studentId)
  }

  if (action) {
    result = result.filter((log) => log.action === action)
  }

  return NextResponse.json({ logs: result })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["outpassId", "studentId", "action"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Validate action
    if (!["exit", "return"].includes(body.action)) {
      return NextResponse.json({ error: "Action must be either 'exit' or 'return'" }, { status: 400 })
    }

    // Generate a new log ID
    const newId = `GL-${String(gateLogs.length + 1).padStart(3, "0")}`

    const newLog = {
      id: newId,
      ...body,
      gate: body.gate || "Unknown Gate",
      securityId: body.securityId || "Unknown",
      timestamp: new Date().toISOString(),
    }

    gateLogs.push(newLog)

    // Log for debugging
    console.log(`Gate log created: ${body.action} for outpass ${body.outpassId} at ${body.gate}`)

    return NextResponse.json({ log: newLog }, { status: 201 })
  } catch (error) {
    console.error("Error creating gate log:", error)
    return NextResponse.json({ error: "Failed to create gate log" }, { status: 500 })
  }
}

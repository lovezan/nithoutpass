import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Missing token parameter" }, { status: 400 })
  }

  try {
    // Extract roll number from token for display
    const rollNoMatch = token.match(/OP-([A-Z0-9]+)/)
    const rollNo = rollNoMatch ? rollNoMatch[1] : "UNKNOWN"

    // Generate a Code 128-like barcode
    const svgWidth = 300
    const svgHeight = 100

    // Start SVG with white background
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <rect width="100%" height="100%" fill="white"/>
    `

    // Draw the barcode - simplified to make roll number more prominent
    // Create a pattern of bars that encodes the roll number
    const barWidth = 3
    const barGap = 2
    let x = 20

    // Draw start pattern
    svg += `<rect x="${x}" y="10" width="${barWidth * 2}" height="60" fill="black"/>`
    x += barWidth * 2 + barGap * 2

    // Draw roll number pattern - each character becomes a bar with varying width
    for (let i = 0; i < rollNo.length; i++) {
      const char = rollNo.charAt(i)
      const charCode = char.charCodeAt(0)

      // Vary width based on character (but keep it reasonable)
      const width = barWidth + (charCode % 3)
      const height = 60 - (i % 3) * 5 // Vary height slightly for visual distinction

      svg += `<rect x="${x}" y="10" width="${width}" height="${height}" fill="black"/>`
      x += width + barGap
    }

    // Draw end pattern
    svg += `<rect x="${x}" y="10" width="${barWidth * 2}" height="60" fill="black"/>`

    // Add text below barcode - display the roll number prominently
    svg += `<text x="${svgWidth / 2}" y="85" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle">${rollNo}</text>`
    svg += "</svg>"

    // Return the SVG as an image
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=31536000",
      },
    })
  } catch (error) {
    console.error("Error generating barcode:", error)
    return NextResponse.json({ error: "Failed to generate barcode" }, { status: 500 })
  }
}

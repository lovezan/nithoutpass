// Barcode generator utility

/**
 * Generates a barcode for an outpass
 * @param outpassId The ID of the outpass
 * @param studentId The ID of the student
 * @param rollNo The roll number of the student
 * @returns An object containing the barcode data URL and token
 */
export function generateBarcode(outpassId: string, studentId: string, rollNo: string) {
  // Create a unique token for the barcode that includes the roll number
  // Format: OP-ROLLNO-TIMESTAMP
  const token = `OP-${rollNo}-${Date.now()}`

  // In a real application, we would use a library like jsbarcode or bwip-js
  // to generate an actual barcode image. For this demo, we'll create a
  // data URL that represents a barcode-like image.

  // Create a canvas element to draw the barcode
  const canvas = document.createElement("canvas")
  canvas.width = 300
  canvas.height = 100

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  // Fill with white background
  ctx.fillStyle = "white"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw barcode-like lines
  ctx.fillStyle = "black"

  // Use the roll number to generate a unique pattern
  const rollNoChars = rollNo.split("")
  const barWidth = 3
  const spacing = 2
  let x = 10

  // Draw start pattern
  ctx.fillRect(x, 10, barWidth * 2, 60)
  x += barWidth * 2 + spacing * 2

  // Draw roll number pattern
  rollNoChars.forEach((char, index) => {
    const charCode = char.charCodeAt(0)
    const height = 50 + (charCode % 20) // Vary height based on character

    ctx.fillRect(x, 10, barWidth, height)
    x += barWidth + spacing
  })

  // Draw end pattern
  ctx.fillRect(x, 10, barWidth * 2, 60)

  // Add the roll number as text
  ctx.font = "14px Arial"
  ctx.fillText(rollNo, 10, 90)

  // Convert canvas to data URL
  const dataUrl = canvas.toDataURL("image/png")

  return {
    barcodeUrl: dataUrl,
    token,
  }
}

/**
 * Validates a barcode token
 * @param token The token to validate
 * @param rollNo The expected roll number
 * @returns True if the token is valid for the given roll number
 */
export function validateBarcodeToken(token: string, rollNo: string) {
  // Check if the token contains the roll number
  return token.includes(rollNo)
}

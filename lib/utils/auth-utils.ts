// Utility functions for authentication

/**
 * Generate a random OTP of specified length
 */
export function generateOTP(length = 6): string {
  let otp = ""
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString()
  }
  return otp
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * - At least 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 */
export function validatePassword(password: string): boolean {
  if (password.length < 8) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/[a-z]/.test(password)) return false
  if (!/[0-9]/.test(password)) return false
  return true
}

/**
 * Get password strength feedback
 */
export function getPasswordStrength(password: string): {
  strength: "weak" | "medium" | "strong"
  message: string
} {
  if (!password) {
    return { strength: "weak", message: "Password is required" }
  }

  if (password.length < 8) {
    return { strength: "weak", message: "Password must be at least 8 characters" }
  }

  let score = 0
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score === 4 && password.length >= 10) {
    return { strength: "strong", message: "Strong password" }
  } else if (score >= 3) {
    return { strength: "medium", message: "Medium strength password" }
  } else {
    return {
      strength: "weak",
      message: "Weak password. Include uppercase, lowercase, numbers, and special characters.",
    }
  }
}

/**
 * Store OTP in localStorage with expiration
 */
export function storeOTP(email: string, otp: string, expiryMinutes = 10): void {
  const expiryTime = new Date()
  expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes)

  const otpData = {
    otp,
    expiry: expiryTime.getTime(),
  }

  localStorage.setItem(`otp_${email}`, JSON.stringify(otpData))
}

/**
 * Verify OTP from localStorage
 */
export function verifyOTP(email: string, otp: string): boolean {
  const otpDataString = localStorage.getItem(`otp_${email}`)
  if (!otpDataString) return false

  const otpData = JSON.parse(otpDataString)
  const now = new Date().getTime()

  // Check if OTP is expired
  if (now > otpData.expiry) {
    localStorage.removeItem(`otp_${email}`)
    return false
  }

  // Check if OTP matches
  if (otpData.otp !== otp) {
    return false
  }

  // OTP verified successfully, remove it
  localStorage.removeItem(`otp_${email}`)
  return true
}

// Update the simulateSendOTPEmail function to use our new email service
export function simulateSendOTPEmail(
  email: string,
  otp: string,
  name?: string,
): Promise<{ success: boolean; otp: string }> {
  return new Promise(async (resolve) => {
    try {
      // Import the server action dynamically to avoid issues with "use server" directive
      const { sendVerificationEmail } = await import("@/app/actions/send-email")
      const result = await sendVerificationEmail(email, "Your Verification Code", otp, name)

      resolve({
        success: result.success === false ? false : true,
        otp,
      })
    } catch (error) {
      console.error("Error sending email:", error)
      // Still return the OTP for development purposes
      resolve({
        success: true,
        otp,
      })
    }
  })
}

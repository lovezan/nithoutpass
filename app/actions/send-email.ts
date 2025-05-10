"use server"

import { Resend } from "resend"

// Initialize Resend with API key
// In a production environment, you would use an environment variable
const resend = new Resend(process.env.RESEND_API_KEY || "mock_api_key")

export async function sendVerificationEmail(to: string, subject: string, otp: string, name?: string) {
  try {
    // Check if we're in mock mode or if the recipient is not the verified email
    const verifiedEmail = "talibhassan1122@gmail.com" // The email associated with your Resend account

    if (!process.env.RESEND_API_KEY || to.toLowerCase() !== verifiedEmail.toLowerCase()) {
      console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, OTP: ${otp}`)
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
        otp,
      }
    }

    // Only send actual email using Resend if the recipient is the verified email
    const { data, error } = await resend.emails.send({
      from: "Hostel Outpass <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #660000; text-align: center;">Hostel Outpass System</h2>
          <p>Hello ${name || "there"},</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${otp}</span>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
            <p>This is an automated message from the Hostel Outpass System. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("Error sending email:", error)
      throw new Error(error.message)
    }

    return {
      success: true,
      messageId: data?.id,
      otp,
    }
  } catch (error) {
    console.error("Error sending verification email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
      otp, // Still return the OTP for development purposes
    }
  }
}

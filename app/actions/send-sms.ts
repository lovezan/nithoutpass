"use server"

export async function sendSMS(to: string, message: string) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

    if (!accountSid || !authToken || (!twilioPhoneNumber && !messagingServiceSid)) {
      throw new Error("Twilio credentials are not properly configured")
    }

    // Use fetch to call Twilio API directly
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    // Create form data for the request
    const urlencoded = new URLSearchParams()
    urlencoded.append("To", to)

    // Use either messaging service or phone number
    if (messagingServiceSid) {
      urlencoded.append("MessagingServiceSid", messagingServiceSid)
    } else {
      urlencoded.append("From", twilioPhoneNumber)
    }

    urlencoded.append("Body", message)

    // Create authorization header
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64")

    // Check if we should use mock mode
    if (process.env.MOCK_SMS === "true") {
      console.log(`[MOCK SMS] To: ${to}, Message: ${message}`)
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
        status: "mock-delivered",
      }
    }

    const response = await fetch(twilioEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: urlencoded,
    })

    const result = await response.json()

    if (!response.ok) {
      // Check for specific Twilio error codes
      if (result.code === 21608) {
        throw new Error(`The number ${to} is unverified. Please verify it in your Twilio account.`)
      }
      throw new Error(result.message || "Failed to send SMS")
    }

    return {
      success: true,
      messageId: result.sid,
      status: result.status,
    }
  } catch (error) {
    console.error("Error sending SMS:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    }
  }
}

// Enhanced cron jobs implementation with better notification support
import { formatIndianPhoneNumber } from "./notification-service"
import { sendOutpassStatusSMS } from "@/app/actions/send-status-sms"
import { sendSMS } from "@/app/actions/send-sms"

export function setupCronJobs() {
  // In a real implementation, this would set up cron jobs to run at specific intervals
  console.log("Setting up cron jobs for the outpass system")

  // Check for late returns every 5 minutes
  const lateReturnsInterval = setInterval(
    () => {
      checkLateReturns()
    },
    5 * 60 * 1000, // Every 5 minutes
  )

  // Check for upcoming outpasses every morning
  const dailyReminderInterval = setInterval(
    () => {
      sendDailyReminders()
    },
    24 * 60 * 60 * 1000, // Every 24 hours
  )
  // Immediately run the first check
  setTimeout(checkLateReturns, 5000)

  return {
    success: true,
    jobs: ["check-late-returns", "daily-reminders"],
    intervals: [lateReturnsInterval, dailyReminderInterval],
  }
}

// Update the checkLateReturns function to use our SMS service
export async function checkLateReturns() {
  // In a real implementation, this would check for students who are late to return
  // and send notifications to hostel admins and parents
  console.log("Checking for late returns")

  try {
    // Fetch all outpasses with status "Exited"
    const response = await fetch("/api/outpass?status=Exited")
    const data = await response.json()

    const now = new Date()
    let lateReturns = 0

    // Check each outpass
    for (const outpass of data.outpasses || []) {
      // Parse expected return time
      const [hours, minutes] = outpass.returnTime.split(":").map(Number)
      const expectedReturn = new Date(outpass.date)
      expectedReturn.setHours(hours, minutes, 0, 0)

      // If current time is past expected return time, mark as late
      if (now > expectedReturn) {
        lateReturns++

        // Update outpass status to "Late"
        await fetch("/api/outpass", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: outpass.id,
            status: "Late",
          }),
        })

        // Send SMS notification directly to parent
        if (outpass.student?.parentContact) {
          await sendOutpassStatusSMS(outpass.student.parentContact, "late", outpass.student.name, outpass.id, {
            expectedReturn: outpass.returnTime,
          })
        }
      }
    }

    console.log(`Found ${lateReturns} late returns`)

    return {
      lateReturns,
      notificationsSent: lateReturns,
    }
  } catch (error) {
    console.error("Error checking for late returns:", error)
    return {
      error: "Failed to check for late returns",
      lateReturns: 0,
      notificationsSent: 0,
    }
  }
}

// Update the sendDailyReminders function to use our SMS service
export async function sendDailyReminders() {
  // In a real implementation, this would send daily reminders about upcoming outpasses
  console.log("Sending daily reminders")

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    // Fetch all outpasses for today
    const response = await fetch(`/api/outpass?date=${todayStr}`)
    const data = await response.json()

    let remindersSent = 0

    // Send reminders for each outpass
    for (const outpass of data.outpasses || []) {
      if (outpass.status === "Approved") {
        remindersSent++

        // Format phone numbers
        const studentContact = formatIndianPhoneNumber(outpass.student.contact)
        const parentContact = formatIndianPhoneNumber(outpass.student.parentContact)

        // Send reminder to parent via SMS
        if (parentContact) {
          await sendOutpassStatusSMS(parentContact, "reminder", outpass.student.name, outpass.id, {
            type: outpass.type,
            returnTime: outpass.returnTime,
          })
        }

        // Send reminder to student via SMS
        if (studentContact) {
          const studentMessage = `HOSTEL OUTPASS REMINDER: You have an approved ${outpass.type} outpass for today. Return time: ${outpass.returnTime}.`
          await sendSMS(studentContact, studentMessage)
        }

        // Send reminder to hostel admin
        await fetch("/api/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "admin",
            recipientId: outpass.approvedBy || "AD-001",
            outpassId: outpass.id,
            message: `${outpass.student.name} (${outpass.student.rollNo}) has an approved ${outpass.type} outpass for today. Return time: ${outpass.returnTime}.`,
            channel: "email",
            subject: "Daily Outpass Reminder",
          }),
        })
      }
    }

    console.log(`Sent ${remindersSent} daily reminders`)

    return {
      remindersSent,
    }
  } catch (error) {
    console.error("Error sending daily reminders:", error)
    return {
      error: "Failed to send daily reminders",
      remindersSent: 0,
    }
  }
}

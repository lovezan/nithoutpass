// Fallback in-memory storage for feedback when database operations fail
// This ensures the application remains functional even if the database is unavailable

const inMemoryFeedback: any[] = []

export const FeedbackService = {
  // Add feedback to in-memory storage
  addFeedback: (feedback: any) => {
    const newFeedback = {
      id: `FB-${Math.random().toString(36).substring(2, 10)}`,
      ...feedback,
      createdAt: feedback.createdAt || new Date().toISOString(),
      status: "pending",
    }

    inMemoryFeedback.push(newFeedback)
    console.log("Feedback stored in memory:", newFeedback)
    return newFeedback
  },

  // Get feedback from in-memory storage
  getFeedback: ({ outpassId, studentId }: { outpassId?: string; studentId?: string }) => {
    let results = [...inMemoryFeedback]

    if (outpassId) {
      results = results.filter((f) => f.outpassId === outpassId)
    }

    if (studentId) {
      results = results.filter((f) => f.studentId === studentId)
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },
}

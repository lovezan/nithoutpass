"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ThumbsUp, ThumbsDown, Minus } from "lucide-react"

interface OutpassFeedbackFormProps {
  outpassId: string
  studentId: string
  studentName: string
  rejectReason?: string
}

export function OutpassFeedbackForm({ outpassId, studentId, studentName, rejectReason }: OutpassFeedbackFormProps) {
  const [feedback, setFeedback] = useState("")
  const [satisfaction, setSatisfaction] = useState<string>("neutral")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please provide some feedback before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outpassId,
          studentId,
          feedback,
          satisfaction,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      setIsSubmitted(true)
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback. It helps us improve our services.",
      })
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thank You!</CardTitle>
          <CardDescription>Your feedback has been submitted successfully.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>We appreciate your input and will use it to improve our outpass system.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provide Feedback</CardTitle>
        <CardDescription>Your outpass was rejected. Please share your thoughts to help us improve.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {rejectReason && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium">Rejection Reason:</p>
              <p className="text-sm">{rejectReason}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="satisfaction">How do you feel about this decision?</Label>
            <RadioGroup
              id="satisfaction"
              value={satisfaction}
              onValueChange={setSatisfaction}
              className="flex space-x-4"
            >
              <div className="flex flex-col items-center space-y-1">
                <RadioGroupItem value="dissatisfied" id="dissatisfied" className="sr-only" />
                <Label
                  htmlFor="dissatisfied"
                  className={`cursor-pointer p-2 rounded-full ${
                    satisfaction === "dissatisfied" ? "bg-red-100 text-red-600" : "text-muted-foreground"
                  }`}
                >
                  <ThumbsDown className="h-5 w-5" />
                </Label>
                <span className="text-xs">Dissatisfied</span>
              </div>

              <div className="flex flex-col items-center space-y-1">
                <RadioGroupItem value="neutral" id="neutral" className="sr-only" />
                <Label
                  htmlFor="neutral"
                  className={`cursor-pointer p-2 rounded-full ${
                    satisfaction === "neutral" ? "bg-yellow-100 text-yellow-600" : "text-muted-foreground"
                  }`}
                >
                  <Minus className="h-5 w-5" />
                </Label>
                <span className="text-xs">Neutral</span>
              </div>

              <div className="flex flex-col items-center space-y-1">
                <RadioGroupItem value="satisfied" id="satisfied" className="sr-only" />
                <Label
                  htmlFor="satisfied"
                  className={`cursor-pointer p-2 rounded-full ${
                    satisfaction === "satisfied" ? "bg-green-100 text-green-600" : "text-muted-foreground"
                  }`}
                >
                  <ThumbsUp className="h-5 w-5" />
                </Label>
                <span className="text-xs">Satisfied</span>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Your Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Please share your thoughts on why your outpass was rejected and how we can improve..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

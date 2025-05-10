"use client"

import { AddResendKey } from "@/app/components/add-resend-key"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function SetupEmailPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Email Configuration</h1>
        <p className="text-muted-foreground mb-8">
          Configure email settings for the Hostel Outpass System. This is required for sending verification emails and
          notifications.
        </p>

        <AddResendKey />

        <div className="mt-8 p-4 bg-muted rounded-md">
          <h3 className="font-medium mb-2">About Resend</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Resend is an email API for developers. It provides a simple way to send emails from your application.
          </p>
          <p className="text-sm text-muted-foreground">
            If you don't have a Resend account, you can{" "}
            <a
              href="https://resend.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              sign up for free
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

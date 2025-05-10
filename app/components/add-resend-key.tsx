"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export function AddResendKey() {
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Resend API key",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // In a real app, this would be stored securely
      // For demo purposes, we'll store it in localStorage
      localStorage.setItem("RESEND_API_KEY", apiKey)

      // Set environment variable (this is just for demo purposes)
      // In a real app, this would be handled differently
      // @ts-ignore
      process.env.RESEND_API_KEY = apiKey

      setAdded(true)
      toast({
        title: "API Key Added",
        description: "Your Resend API key has been added successfully",
      })
    } catch (error) {
      console.error("Error adding API key:", error)
      toast({
        title: "Failed to Add API Key",
        description: "There was an error adding your API key. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (added) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Resend API Key Added</CardTitle>
          <CardDescription>Your API key has been added successfully.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">You can now use Resend to send verification emails.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Add Resend API Key</CardTitle>
        <CardDescription>To send verification emails, you need to add your Resend API key.</CardDescription>
      </CardHeader>
      <form onSubmit={handleAddKey}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Resend API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="re_1234567890abcdefghijklmnopqrstuvwxyz"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              You can get your API key from the{" "}
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Resend dashboard
              </a>
              .
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add API Key"}
          </Button>
        </CardFooter>
      </form>
      <Toaster />
    </Card>
  )
}

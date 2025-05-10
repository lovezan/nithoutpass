"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Lock, User } from "lucide-react"

export default function GateLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    gate: "",
  })

  // Check if already logged in
  useEffect(() => {
    const securityUser = localStorage.getItem("securityUser")
    if (securityUser) {
      router.push("/gate/dashboard")
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gate: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.gate) {
      toast({
        title: "Error",
        description: "Please select a gate",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      // For demo purposes, let's use hardcoded credentials
      // In a real app, this would be an API call
      if (
        (formData.username === "gate1_security" && formData.password === "password" && formData.gate === "Gate 1") ||
        (formData.username === "gate2_security" && formData.password === "password" && formData.gate === "Gate 2")
      ) {
        // Create security user object
        const securityUser = {
          id: formData.username === "gate1_security" ? "AD-013" : "AD-014",
          username: formData.username,
          name: formData.username === "gate1_security" ? "Gate 1 Security Officer" : "Gate 2 Security Officer",
          role: "security",
          gate: formData.gate,
        }

        // Store security user info in localStorage
        localStorage.setItem("securityUser", JSON.stringify(securityUser))

        toast({
          title: "Login Successful",
          description: `Welcome, ${securityUser.name}!`,
        })

        // Redirect to gate dashboard
        setTimeout(() => router.push("/gate/dashboard"), 1500)
      } else {
        throw new Error("Invalid credentials for the selected gate")
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid username or password for the selected gate",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Gate Security Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the gate security portal
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gate">Select Gate</Label>
                <Select onValueChange={handleSelectChange} value={formData.gate} required>
                  <SelectTrigger id="gate" className="placeholder:text-muted-foreground/40">
                    <SelectValue placeholder="Select gate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gate 1">Gate 1</SelectItem>
                    <SelectItem value="Gate 2">Gate 2</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Note: Each security officer is assigned to a specific gate
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    name="username"
                    placeholder="Enter your username"
                    className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        <div className="text-center mt-4 text-sm text-muted-foreground">
          <p>Demo credentials:</p>
          <p>Gate 1: username: gate1_security, password: password</p>
          <p>Gate 2: username: gate2_security, password: password</p>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

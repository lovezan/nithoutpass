"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Lock, User, ArrowLeft } from "lucide-react"

// List of available hostels
const hostels = [
  "Kailash Boys Hostel",
  "Himadri Boys Hostel",
  "Himgiri Boys Hostel",
  "Udaygiri Boys Hostel",
  "Neelkanth Boys Hostel",
  "Dhauladhar Boys Hostel",
  "Vindhyachal Boys Hostel",
  "Ambika Girls Hostel",
  "Parvati Girls Hostel",
  "Manimahesh Girls Hostel",
  "Aravali Girls Hostel",
  "Satpura Hostel",
]

export default function AdminLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    adminUsername: "",
    adminPassword: "",
    selectedHostel: "",
  })

  // Check if admin is already logged in
  useEffect(() => {
    const adminUser = localStorage.getItem("adminUser")
    if (adminUser) {
      router.push("/admin/dashboard")
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, selectedHostel: value }))
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.adminUsername || !formData.adminPassword) {
        toast({
          title: "Login Failed",
          description: "Username and password are required.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // For hostel admins, hostel selection is required
      if (formData.adminUsername !== "superadmin" && !formData.selectedHostel) {
        toast({
          title: "Login Failed",
          description: "Please select a hostel.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Find the matching admin in our predefined list
      const adminMatch = [
        {
          username: "kailash_admin",
          password: "password",
          hostel: "Kailash Boys Hostel",
          role: "hostel_admin",
          id: "AD-001",
          name: "Kailash Hostel Admin",
        },
        {
          username: "himadri_admin",
          password: "password",
          hostel: "Himadri Boys Hostel",
          role: "hostel_admin",
          id: "AD-002",
          name: "Himadri Hostel Admin",
        },
        {
          username: "superadmin",
          password: "password",
          hostel: null,
          role: "super_admin",
          id: "AD-015",
          name: "Super Admin",
        },
      ].find(
        (admin) =>
          admin.username === formData.adminUsername &&
          admin.password === formData.adminPassword &&
          (admin.role === "super_admin" || admin.hostel === formData.selectedHostel),
      )

      if (!adminMatch) {
        toast({
          title: "Login Failed",
          description: "Invalid username or password for the selected hostel.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Set admin info in localStorage for persistence
      localStorage.setItem(
        "adminUser",
        JSON.stringify({
          id: adminMatch.id,
          username: adminMatch.username,
          name: adminMatch.name,
          hostel: adminMatch.hostel,
          role: adminMatch.role,
        }),
      )

      toast({
        title: "Admin Login Successful",
        description: `Welcome, ${adminMatch.name}!`,
      })

      // Redirect to admin dashboard
      setTimeout(() => router.push("/admin/dashboard"), 1500)
    } catch (error) {
      console.error("Admin login error:", error)
      toast({
        title: "Login Failed",
        description: "Invalid username or password.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login Options
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAdminLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="selectedHostel">Select Hostel</Label>
                <Select onValueChange={handleSelectChange} value={formData.selectedHostel}>
                  <SelectTrigger className="placeholder:text-muted-foreground/40">
                    <SelectValue placeholder="Select a hostel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hostels.map((hostel) => (
                      <SelectItem key={hostel} value={hostel}>
                        {hostel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Note: Super Admin can leave this empty</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminUsername">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminUsername"
                    name="adminUsername"
                    placeholder="admin"
                    className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
                    value={formData.adminUsername}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminPassword"
                    name="adminPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
                    value={formData.adminPassword}
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
          <p>Demo credentials for different hostels:</p>
          <p>Kailash: username: kailash_admin, password: password</p>
          <p>Himadri: username: himadri_admin, password: password</p>
          <p>Super Admin: username: superadmin, password: password</p>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Shield, Home } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const studentUser = localStorage.getItem("studentUser")
    const adminUser = localStorage.getItem("adminUser")

    if (studentUser) {
      router.push("/student/dashboard")
    } else if (adminUser) {
      router.push("/admin/dashboard")
    }
  }, [router])

  return (
    <div className="responsive-container flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <div className="w-full max-w-md">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">Hostel Outpass System</CardTitle>
            <CardDescription>Please select your login type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full h-16 text-lg justify-start bg-primary hover:bg-primary/90">
              <Link href="/student/login">
                <User className="mr-4 h-6 w-6" />
                Student Login
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full h-16 text-lg justify-start border-secondary text-secondary hover:text-secondary hover:bg-secondary/10"
            >
              <Link href="/admin/login">
                <Shield className="mr-4 h-6 w-6" />
                Admin Login
              </Link>
            </Button>

            <Button asChild variant="ghost" className="w-full h-12 text-base justify-start">
              <Link href="/">
                <Home className="mr-4 h-5 w-5" />
                Back to Home
              </Link>
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                New student?{" "}
                <Link href="/student/signup" className="text-primary hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

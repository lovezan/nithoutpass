"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"

export default function GatePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if security is already logged in
    const securityUser = localStorage.getItem("securityUser")
    if (securityUser) {
      router.push("/gate/dashboard")
    }
  }, [router])

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">Gate Security Portal</CardTitle>
            <CardDescription>Authorized access only. Please login to continue.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button size="lg" onClick={() => router.push("/gate/login")}>
              Login to Gate Security
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

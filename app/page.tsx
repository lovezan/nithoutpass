"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BookOpen, CheckCircle, Clock, Home, UserCheck, Bell, ShieldCheck } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const studentUser = localStorage.getItem("studentUser")
    const adminUser = localStorage.getItem("adminUser")

    if (studentUser) {
      router.push("/student/dashboard")
    } else if (adminUser) {
      router.push("/admin/dashboard")
    }
  }, [router])

  return (
    <div className="responsive-container">
      <div className="flex flex-col items-center justify-center text-center mb-6 md:mb-10">
        <h1 className="page-title text-primary">Hostel Outpass Management System</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
          A digital solution for managing student outpasses in university hostels
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
        <Card className="border-primary/20 hover:border-primary/50 transition-colors">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl md:text-2xl text-primary">Student Portal</CardTitle>
            <CardDescription>Request and manage your outpasses</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Home className="h-16 w-16 md:h-20 md:w-20 text-primary/30 dark:text-foreground/70" />
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <Link href="/login">
                Access Portal <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-secondary/20 hover:border-secondary/50 transition-colors">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl md:text-2xl text-secondary">Admin Dashboard</CardTitle>
            <CardDescription>Manage outpass requests and approvals</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <UserCheck className="h-16 w-16 md:h-20 md:w-20 text-secondary/30 dark:text-foreground/70" />
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-secondary hover:bg-secondary/90">
              <Link href="/login">
                Admin Login <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1 border-accent/20 hover:border-accent/50 transition-colors">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl md:text-2xl text-darkRed">Gate Security</CardTitle>
            <CardDescription>Scan outpasses for entry and exit</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ShieldCheck className="h-16 w-16 md:h-20 md:w-20 text-darkRed/30 dark:text-foreground/70" />
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-darkRed hover:bg-darkRed/90">
              <Link href="/gate">
                Gate Portal <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-subtleYellow border-gold/20 hover:border-gold/50 transition-colors dark:bg-subtleYellow/80">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="flex items-center text-darkRed dark:text-darkRed">
              <BookOpen className="mr-2 h-4 w-4 text-darkRed dark:text-darkRed" /> Easy Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground dark:text-darkRed/80">
              Simple form to request market or home outpasses with all required details
            </p>
          </CardContent>
        </Card>

        <Card className="bg-subtleYellow border-gold/20 hover:border-gold/50 transition-colors dark:bg-subtleYellow/80">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="flex items-center text-darkRed dark:text-darkRed">
              <CheckCircle className="mr-2 h-4 w-4 text-darkRed dark:text-darkRed" /> Quick Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground dark:text-darkRed/80">
              Hostel admins can quickly review and approve outpass requests
            </p>
          </CardContent>
        </Card>

        <Card className="bg-subtleYellow border-gold/20 hover:border-gold/50 transition-colors dark:bg-subtleYellow/80">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="flex items-center text-darkRed dark:text-darkRed">
              <Clock className="mr-2 h-4 w-4 text-darkRed dark:text-darkRed" /> Real-time Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground dark:text-darkRed/80">
              Track exit and entry times with barcode scanning at security gates
            </p>
          </CardContent>
        </Card>

        <Card className="bg-subtleYellow border-gold/20 hover:border-gold/50 transition-colors dark:bg-subtleYellow/80">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="flex items-center text-darkRed dark:text-darkRed">
              <Bell className="mr-2 h-4 w-4 text-darkRed dark:text-darkRed" /> Automated Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground dark:text-darkRed/80">
              Automatic notifications for parents and admins about outpass status
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

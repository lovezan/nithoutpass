"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft, Bell, Eye, LogOut } from "lucide-react"

export default function AdminNotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [admin, setAdmin] = useState<any>(null)

  // Check if admin is logged in
  useEffect(() => {
    const checkAuth = () => {
      const adminData = localStorage.getItem("adminUser")

      if (!adminData) {
        // Redirect to login if not logged in
        router.push("/login")
        return
      }

      setAdmin(JSON.parse(adminData))
    }

    checkAuth()
  }, [router])

  // Fetch notifications for the admin
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!admin) return

      setIsLoading(true)
      try {
        // Fetch notifications for this admin
        const response = await fetch(`/api/notifications?recipientId=${admin.id}&type=admin`)
        if (!response.ok) {
          throw new Error("Failed to fetch notifications")
        }

        const data = await response.json()
        setNotifications(data.notifications || [])
      } catch (error) {
        console.error("Error fetching notifications:", error)
        toast({
          title: "Error",
          description: "Failed to load notifications. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (admin) {
      fetchNotifications()
    }
  }, [admin])

  const handleLogout = () => {
    // Clear all user data
    localStorage.removeItem("studentUser")
    localStorage.removeItem("adminUser")
    localStorage.removeItem("securityUser")

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("app-logout"))

    router.push("/login")
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (!admin) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-center">
          <p>Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            View all notifications for {admin.role === "hostel_admin" ? admin.hostel : "all hostels"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" /> Notification History
          </CardTitle>
          <CardDescription>Recent notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <p>Loading notifications...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex flex-col md:flex-row justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          className={
                            notification.priority === "high"
                              ? "bg-red-500"
                              : notification.channel === "sms"
                                ? "bg-blue-500"
                                : "bg-green-500"
                          }
                        >
                          {notification.priority === "high"
                            ? "Urgent"
                            : notification.channel === "sms"
                              ? "SMS"
                              : "Email"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{formatDate(notification.sentAt)}</span>
                      </div>
                      <p className="mb-2">{notification.message}</p>
                      <div className="text-sm text-muted-foreground">Outpass ID: {notification.outpassId}</div>
                    </div>
                    <div className="mt-2 md:mt-0 md:ml-4 flex items-center">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/outpass/${notification.outpassId}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Outpass
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                  <h3 className="text-lg font-medium">No notifications yet</h3>
                  <p className="text-muted-foreground">
                    You'll receive notifications here when there are updates to outpasses
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}

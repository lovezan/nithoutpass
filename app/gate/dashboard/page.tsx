"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, LogIn, LogOut, QrCode, Search } from "lucide-react"
import { SortableTable } from "@/components/ui/sortable-table"

export default function GateDashboardPage() {
  const router = useRouter()
  const [barcode, setBarcode] = useState("")
  const [searchResult, setSearchResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("scan")
  const [gateActivity, setGateActivity] = useState([])
  const [securityUser, setSecurityUser] = useState<any>(null)

  // Check if security is logged in
  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem("securityUser")

      if (!userData) {
        // Redirect to login if not logged in
        router.push("/gate/login")
        return
      }

      setSecurityUser(JSON.parse(userData))
    }

    checkAuth()
  }, [router])

  // Fetch recent gate activity
  useEffect(() => {
    const fetchActivity = async () => {
      if (!securityUser) return

      try {
        // In a real app, this would fetch from the API
        // For now, we'll use mock data
        setGateActivity([
          {
            id: "OP-CS12346",
            name: "Alice Johnson",
            rollNo: "CS12346",
            action: "exit",
            time: new Date().toLocaleString(),
          },
          {
            id: "OP-CS12347",
            name: "Bob Smith",
            rollNo: "CS12347",
            action: "return",
            time: new Date(Date.now() - 30 * 60000).toLocaleString(),
          },
        ])
      } catch (error) {
        console.error("Error fetching gate activity:", error)
      }
    }

    if (securityUser) {
      fetchActivity()
    }
  }, [securityUser])

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value)
    setError(null)
    setSearchResult(null)
  }

  // Enhanced scan function to work with roll numbers directly
  const handleScan = async () => {
    if (!barcode.trim()) {
      setError("Please enter a roll number or scan a barcode")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const rollNo = barcode.trim()

      // Try to find by roll number directly
      const response = await fetch(`/api/outpass?rollNo=${rollNo}`)
      const data = await response.json()

      if (data.outpasses && data.outpasses.length > 0) {
        // Find the most relevant outpass - prioritize active ones
        const activeOutpasses = data.outpasses.filter((op: any) => op.status === "Approved" || op.status === "Exited")

        const outpass = activeOutpasses.length > 0 ? activeOutpasses[0] : data.outpasses[0]

        // Check if outpass is in a valid state for gate operations
        if (outpass.status !== "Approved" && outpass.status !== "Exited") {
          setError(`Outpass is in ${outpass.status} state. Only Approved or Exited outpasses can be processed.`)
          setSearchResult(null)
        } else {
          setSearchResult(outpass)
          setError(null)

          toast({
            title: "Outpass Found",
            description: `Found outpass for ${outpass.student.name} (${outpass.student.rollNo})`,
          })
        }
      } else {
        setError("No active outpass found for this roll number.")
        setSearchResult(null)
      }
    } catch (error) {
      console.error("Error scanning outpass:", error)
      setError("Failed to scan outpass. Please try again.")
      setSearchResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleExit = async () => {
    if (!searchResult) return

    setLoading(true)

    try {
      // Get the current timestamp for exit time
      const exitTime = new Date().toISOString()

      // Update outpass status to Exited
      const response = await fetch("/api/outpass", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: searchResult.id,
          status: "Exited",
          exitTime: exitTime,
          exitGate: securityUser.gate,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update outpass")
      }

      const data = await response.json()

      // Create gate log
      await fetch("/api/gate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outpassId: searchResult.id,
          studentId: searchResult.studentId,
          action: "exit",
          gate: securityUser.gate,
          securityId: securityUser.id,
          timestamp: exitTime,
        }),
      })

      // Update local state
      setSearchResult(data.outpass)

      // Add to gate activity
      const newActivity = {
        id: searchResult.id,
        name: searchResult.student.name,
        rollNo: searchResult.student.rollNo,
        action: "exit",
        time: new Date().toLocaleString(),
      }

      setGateActivity([newActivity, ...gateActivity])

      toast({
        title: "Exit Recorded",
        description: `${searchResult.student.name} has exited the campus through ${securityUser.gate}.`,
      })
    } catch (error) {
      console.error("Error recording exit:", error)
      toast({
        title: "Error",
        description: "Failed to record exit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = async () => {
    if (!searchResult) return

    setLoading(true)

    try {
      // Get the current timestamp for return time
      const returnTime = new Date().toISOString()

      // Update outpass status to Returned
      const response = await fetch("/api/outpass", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: searchResult.id,
          status: "Returned",
          returnTime: returnTime,
          returnGate: securityUser.gate,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update outpass")
      }

      const data = await response.json()

      // Create gate log
      await fetch("/api/gate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outpassId: searchResult.id,
          studentId: searchResult.studentId,
          action: "return",
          gate: securityUser.gate,
          securityId: securityUser.id,
          timestamp: returnTime,
        }),
      })

      // Update local state
      setSearchResult(data.outpass)

      // Add to gate activity
      const newActivity = {
        id: searchResult.id,
        name: searchResult.student.name,
        rollNo: searchResult.student.rollNo,
        action: "return",
        time: new Date().toLocaleString(),
      }

      setGateActivity([newActivity, ...gateActivity])

      toast({
        title: "Return Recorded",
        description: `${searchResult.student.name} has returned to the campus through ${securityUser.gate}.`,
      })
    } catch (error) {
      console.error("Error recording return:", error)
      toast({
        title: "Error",
        description: "Failed to record return. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    // Clear all user data
    localStorage.removeItem("studentUser")
    localStorage.removeItem("adminUser")
    localStorage.removeItem("securityUser")

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("app-logout"))

    router.push("/gate/login")
  }

  if (!securityUser) {
    return (
      <div className="responsive-container flex justify-center items-center min-h-[50vh]">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <div className="responsive-container">
      {/* Make the gate dashboard responsive */}
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">Gate Security Portal</h1>
            <p className="text-muted-foreground">
              {securityUser.gate} - {securityUser.name}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="scan" className="w-full" onValueChange={setActiveTab}>
          {/* Fix the congested tabs for mobile view */}
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto min-w-full md:grid md:grid-cols-2 mb-4">
              <TabsTrigger value="scan" className="px-4 flex-1">
                Scan Outpass
              </TabsTrigger>
              <TabsTrigger value="activity" className="px-4 flex-1">
                Recent Activity
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="scan" className="mt-0">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Scan Outpass Barcode</CardTitle>
                <CardDescription>Scan or enter the roll number to verify student outpass</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <QrCode className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter student roll number or scan barcode"
                      className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
                      value={barcode}
                      onChange={handleBarcodeChange}
                      onKeyDown={(e) => e.key === "Enter" && handleScan()}
                    />
                  </div>
                  <Button
                    onClick={handleScan}
                    disabled={loading}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {loading ? "Scanning..." : "Scan"}
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>You can enter:</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Student roll number (e.g., "21BCS001")</li>
                    <li>Scan the barcode directly</li>
                  </ul>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {searchResult && (
                  <div className="border rounded-md p-4 space-y-4 border-primary/20">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-lg text-primary">{searchResult.student.name}</h3>
                      <Badge
                        className={
                          searchResult.status === "Approved"
                            ? "bg-green-500 hover:bg-green-600"
                            : searchResult.status === "Exited"
                              ? "bg-blue-500 hover:bg-blue-600"
                              : "bg-purple-500 hover:bg-purple-600"
                        }
                      >
                        {searchResult.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Outpass ID</p>
                        <p>{searchResult.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Roll Number</p>
                        <p>{searchResult.student.rollNo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Hostel</p>
                        <p>{searchResult.student.hostel}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Outpass Type</p>
                        <p>{searchResult.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Purpose</p>
                        <p>{searchResult.purpose}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expected Date</p>
                        <p>{searchResult.date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expected Return</p>
                        <p>{searchResult.returnTime}</p>
                      </div>
                    </div>

                    {searchResult.exitTime && (
                      <div>
                        <p className="text-sm text-muted-foreground">Exit Time</p>
                        <p>{new Date(searchResult.exitTime).toLocaleString()}</p>
                      </div>
                    )}

                    {searchResult.exitGate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Exit Gate</p>
                        <p>{searchResult.exitGate}</p>
                      </div>
                    )}

                    {searchResult.returnTime && searchResult.status === "Returned" && (
                      <div>
                        <p className="text-sm text-muted-foreground">Return Time</p>
                        <p>{new Date(searchResult.returnTime).toLocaleString()}</p>
                      </div>
                    )}

                    {searchResult.returnGate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Return Gate</p>
                        <p>{searchResult.returnGate}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      {searchResult.status === "Approved" && (
                        <Button onClick={handleExit} disabled={loading} className="bg-primary hover:bg-primary/90">
                          <LogOut className="mr-2 h-4 w-4" />
                          {loading ? "Processing..." : "Record Exit"}
                        </Button>
                      )}

                      {searchResult.status === "Exited" && (
                        <Button
                          onClick={handleReturn}
                          disabled={loading}
                          className="bg-secondary hover:bg-secondary/90"
                        >
                          <LogIn className="mr-2 h-4 w-4" />
                          {loading ? "Processing..." : "Record Return"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Recent Gate Activity</CardTitle>
                <CardDescription>Recent entry and exit records at {securityUser.gate}</CardDescription>
              </CardHeader>
              <CardContent>
                <SortableTable
                  columns={[
                    {
                      key: "name",
                      title: "Student",
                      sortable: true,
                    },
                    {
                      key: "rollNo",
                      title: "Roll No",
                      sortable: true,
                    },
                    {
                      key: "action",
                      title: "Action",
                      sortable: true,
                      render: (value) => (
                        <Badge
                          className={
                            value === "exit" ? "bg-blue-500 hover:bg-blue-600" : "bg-purple-500 hover:bg-purple-600"
                          }
                        >
                          {value === "exit" ? "Exit" : "Return"}
                        </Badge>
                      ),
                    },
                    {
                      key: "time",
                      title: "Time",
                      sortable: true,
                    },
                  ]}
                  data={gateActivity}
                  searchable={true}
                  searchPlaceholder="Search gate activity..."
                  searchKeys={["name", "rollNo", "action", "time"]}
                  emptyMessage="No recent gate activity found."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}

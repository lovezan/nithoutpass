"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Home, LogOut, Shield, User, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [studentUser, setStudentUser] = useState<any>(null)
  const [adminUser, setAdminUser] = useState<any>(null)
  const [securityUser, setSecurityUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Function to update user states from localStorage
    const updateUserStates = () => {
      const studentData = localStorage.getItem("studentUser")
      const adminData = localStorage.getItem("adminUser")
      const securityData = localStorage.getItem("securityUser")

      setStudentUser(studentData ? JSON.parse(studentData) : null)
      setAdminUser(adminData ? JSON.parse(adminData) : null)
      setSecurityUser(securityData ? JSON.parse(securityData) : null)
    }

    // Initial check
    updateUserStates()

    // Listen for storage events (when localStorage changes in other tabs/components)
    const handleStorageChange = () => {
      updateUserStates()
    }

    window.addEventListener("storage", handleStorageChange)

    // Create a custom event for in-app logout
    const handleLogoutEvent = () => {
      updateUserStates()
    }

    window.addEventListener("app-logout", handleLogoutEvent)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("app-logout", handleLogoutEvent)
    }
  }, [pathname])

  const isActive = (path: string) => {
    return pathname === path
  }

  const handleLogout = () => {
    // Clear all user data from localStorage
    localStorage.removeItem("studentUser")
    localStorage.removeItem("adminUser")
    localStorage.removeItem("securityUser")

    // Update state
    setStudentUser(null)
    setAdminUser(null)
    setSecurityUser(null)

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("app-logout"))

    // Redirect to login page
    router.push("/login")
  }

  const navLinks = [
    ...(studentUser
      ? [{ href: "/student/dashboard", label: "Dashboard", active: isActive("/student/dashboard") }]
      : []),
    ...(adminUser
      ? [
          { href: "/admin/dashboard", label: "Admin", active: isActive("/admin/dashboard") },
          { href: "/admin/students", label: "Students", active: isActive("/admin/students") },
        ]
      : []),
    ...(securityUser
      ? [{ href: "/gate/dashboard", label: "Gate Security", active: isActive("/gate/dashboard") }]
      : [{ href: "/gate/login", label: "Gate Login", active: isActive("/gate/login") }]),
  ]

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Home className="h-5 w-5 text-primary" />
            <span className="text-primary">Outpass System</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 ml-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  link.active ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />

          {/* User Menu - Desktop */}
          {studentUser || adminUser || securityUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="hidden md:flex">
                  {securityUser ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  <span className="sr-only">User Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {studentUser && (
                  <>
                    <DropdownMenuItem disabled className="font-medium">
                      {studentUser.name}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/student/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                  </>
                )}
                {adminUser && (
                  <>
                    <DropdownMenuItem disabled className="font-medium">
                      {adminUser.name}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  </>
                )}
                {securityUser && (
                  <>
                    <DropdownMenuItem disabled className="font-medium">
                      {securityUser.name}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      {securityUser.gate}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/gate/dashboard">Gate Dashboard</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="icon" asChild className="hidden md:flex">
              <Link href="/login">
                <User className="h-4 w-4" />
                <span className="sr-only">Login</span>
              </Link>
            </Button>
          )}

          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col h-full">
                <div className="py-4 border-b">
                  {studentUser && <p className="font-medium">{studentUser.name}</p>}
                  {adminUser && <p className="font-medium">{adminUser.name}</p>}
                  {securityUser && (
                    <>
                      <p className="font-medium">{securityUser.name}</p>
                      <p className="text-xs text-muted-foreground">{securityUser.gate}</p>
                    </>
                  )}
                  {!studentUser && !adminUser && !securityUser && <p className="font-medium">Hostel Outpass System</p>}
                </div>
                <nav className="flex flex-col py-4 gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-4 py-2 rounded-md ${
                        link.active ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {!studentUser && !adminUser && !securityUser && (
                    <Link href="/login" className="px-4 py-2 rounded-md text-foreground hover:bg-muted">
                      Login
                    </Link>
                  )}
                </nav>
                <div className="mt-auto border-t py-4">
                  {(studentUser || adminUser || securityUser) && (
                    <Button variant="destructive" className="w-full" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

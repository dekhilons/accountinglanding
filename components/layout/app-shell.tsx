"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Calculator,
  Menu,
  X,
  Search,
  Bell,
  MessageSquare,
  User,
  ChevronDown,
  Home,
  FileText,
  BookOpen,
  BarChart3,
  DollarSign,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatWidget } from "@/components/chat/chat-widget"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  children?: NavItem[]
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [notifications, setNotifications] = useState(3)
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Load user data on component mount
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      // Redirect to login if no user data
      router.push("/auth/login")
    }
  }, [router])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Responsive sidebar handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const navItems: NavItem[] = [
    {
      title: "Home",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Transactions",
      href: "#",
      icon: <FileText className="h-5 w-5" />,
      children: [
        {
          title: "Accounts Payable",
          href: "/transactions/accounts-payable",
          icon: <ChevronRight className="h-4 w-4" />,
        },
        {
          title: "Accounts Receivable",
          href: "/transactions/accounts-receivable",
          icon: <ChevronRight className="h-4 w-4" />,
        },
        {
          title: "Invoices (AP & AR)",
          href: "/transactions/invoices",
          icon: <ChevronRight className="h-4 w-4" />,
        },
        {
          title: "Transactions Reconciliation",
          href: "/transactions/bank-reconciliation",
          icon: <ChevronRight className="h-4 w-4" />,
        },
        {
          title: "Manual Upload",
          href: "/transactions/manual-upload",
          icon: <ChevronRight className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Record-to-Report",
      href: "#",
      icon: <BookOpen className="h-5 w-5" />,
      children: [
        {
          title: "General Ledger",
          href: "/record-to-report/general-ledger",
          icon: <ChevronRight className="h-4 w-4" />,
        },
        {
          title: "Month-End Close",
          href: "/record-to-report/month-end-close",
          icon: <ChevronRight className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Planning & Insights",
      href: "#",
      icon: <BarChart3 className="h-5 w-5" />,
      children: [
        {
          title: "Forecasting & FP&A",
          href: "/planning/forecasting",
          icon: <ChevronRight className="h-4 w-4" />,
        },
        {
          title: "Variance Analysis",
          href: "/planning/variance-analysis",
          icon: <ChevronRight className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Liquidity & Treasury",
      href: "#",
      icon: <DollarSign className="h-5 w-5" />,
      children: [
        {
          title: "Cash Management",
          href: "/liquidity/cash-management",
          icon: <ChevronRight className="h-4 w-4" />,
        },
        {
          title: "Treasury Operations",
          href: "/liquidity/treasury-operations",
          icon: <ChevronRight className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Compliance & Audit",
      href: "#",
      icon: <Shield className="h-5 w-5" />,
      children: [
        {
          title: "Tax & Compliance",
          href: "/compliance/tax",
          icon: <ChevronRight className="h-4 w-4" />,
        },
        {
          title: "Risk & Controls",
          href: "/compliance/risk",
          icon: <ChevronRight className="h-4 w-4" />,
        },
        {
          title: "Audit & Reporting",
          href: "/compliance/audit",
          icon: <ChevronRight className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Settings",
      href: "#",
      icon: <Settings className="h-5 w-5" />,
      children: [
        {
          title: "Integrations",
          href: "/settings/integrations",
          icon: <ChevronRight className="h-4 w-4" />,
        },
        {
          title: "User & Access",
          href: "/settings/users",
          icon: <ChevronRight className="h-4 w-4" />,
        },
        {
          title: "System Logs",
          href: "/settings/logs",
          icon: <ChevronRight className="h-4 w-4" />,
        },
      ],
    },
  ]

  // Get current page title from path
  const getPageTitle = () => {
    const path = pathname.split("/")
    if (path.length > 1) {
      const segment = path[1]
      if (segment === "dashboard") return "Dashboard"
      if (segment === "profile") return "Profile Settings"
      if (segment === "transactions") {
        if (path.length > 2) {
          if (path[2] === "accounts-payable") return "Accounts Payable"
          if (path[2] === "accounts-receivable") return "Accounts Receivable"
          if (path[2] === "invoices") return "Invoices (AP & AR)"
          if (path[2] === "bank-reconciliation") return "Transactions Reconciliation"
          if (path[2] === "manual-upload") return "Manual Upload"
        }
        return "Transactions"
      }
      if (segment === "record-to-report") {
        if (path.length > 2) {
          if (path[2] === "general-ledger") return "General Ledger"
          if (path[2] === "month-end-close") return "Month-End Close"
        }
        return "Record-to-Report"
      }
      if (segment === "planning") {
        if (path.length > 2) {
          if (path[2] === "forecasting") return "Forecasting & FP&A"
          if (path[2] === "variance-analysis") return "Variance Analysis"
        }
        return "Planning & Insights"
      }
      if (segment === "liquidity") {
        if (path.length > 2) {
          if (path[2] === "cash-management") return "Cash Management"
          if (path[2] === "treasury-operations") return "Treasury Operations"
        }
        return "Liquidity & Treasury"
      }
      if (segment === "compliance") {
        if (path.length > 2) {
          if (path[2] === "tax") return "Tax & Compliance"
          if (path[2] === "risk") return "Risk & Controls"
          if (path[2] === "audit") return "Audit & Reporting"
        }
        return "Compliance & Audit"
      }
      if (segment === "settings") {
        if (path.length > 2) {
          if (path[2] === "integrations") return "Integrations"
          if (path[2] === "users") return "User & Access"
          if (path[2] === "logs") return "System Logs"
        }
        return "Settings"
      }
      return segment.charAt(0).toUpperCase() + segment.slice(1)
    }
    return "Dashboard"
  }

  // Show loading state if user is not loaded yet
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calculator className="h-12 w-12 text-teal-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left Section: Logo and Menu Toggle */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex mr-2"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </Button>

            <Link href="/dashboard" className="flex items-center">
              <Calculator className="h-8 w-8 text-teal-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:inline-block">AccountingAI</span>
            </Link>

            <div className="ml-4 text-lg font-medium text-gray-700 hidden md:block">{getPageTitle()}</div>
          </div>

          {/* Right Section: Search, Notifications, Chat, User */}
          <div className="flex items-center space-x-2">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="search" placeholder="Search..." className="pl-8 bg-gray-50 border-gray-200 focus:bg-white" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
                      {notifications}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-2">
                  <p className="font-medium">Notifications</p>
                  <Button variant="link" size="sm" onClick={() => setNotifications(0)}>
                    Mark all as read
                  </Button>
                </div>
                <DropdownMenuSeparator />
                {notifications === 0 ? (
                  <p className="p-4 text-sm text-gray-500 text-center">No new notifications</p>
                ) : (
                  <ScrollArea className="h-48">
                    <DropdownMenuItem className="flex flex-col items-start p-2 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm font-medium">New invoice #123 from Acme Corp.</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start p-2 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm font-medium">Payment received from Jane Doe</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start p-2 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm font-medium">Your report is ready for review.</p>
                      <p className="text-xs text-gray-500">3 days ago</p>
                    </DropdownMenuItem>
                  </ScrollArea>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center justify-center p-2">
                  <Link href="/notifications" className="text-sm text-teal-600 hover:underline">
                    View all notifications
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(!isChatOpen)}>
              <MessageSquare className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/integrations" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50">
            <ScrollArea className="h-full py-4">
              <div className="px-3 py-2">
                {navItems.map((item, index) => (
                  <div key={index} className="mb-2">
                    {item.children ? (
                      <div>
                        <div className="flex items-center px-3 py-2 text-gray-700 font-medium rounded-md">
                          {item.icon}
                          <span className="ml-3">{item.title}</span>
                        </div>
                        <div className="ml-4 pl-3 border-l border-gray-200">
                          {item.children.map((child, childIndex) => (
                            <Link
                              key={childIndex}
                              href={child.href}
                              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-teal-600 rounded-md"
                            >
                              <span className="ml-2">{child.title}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={`flex items-center px-3 py-2 rounded-md ${
                          pathname === item.href ? "bg-teal-50 text-teal-600" : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {item.icon}
                        <span className="ml-3 font-medium">{item.title}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 bg-white border-r border-gray-200 z-30 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-64" : "w-16"
        } hidden lg:block`}
      >
        <ScrollArea className="h-full pt-16">
          <div className="px-3 py-4">
            {navItems.map((item, index) => (
              <div key={index} className="mb-2">
                {item.children ? (
                  <div>
                    <div
                      className={`flex items-center px-3 py-2 text-gray-700 font-medium rounded-md ${
                        isSidebarOpen ? "" : "justify-center"
                      }`}
                    >
                      {item.icon}
                      {isSidebarOpen && <span className="ml-3">{item.title}</span>}
                    </div>
                    {isSidebarOpen && (
                      <div className="ml-4 pl-3 border-l border-gray-200">
                        {item.children.map((child, childIndex) => (
                          <Link
                            key={childIndex}
                            href={child.href}
                            className={`flex items-center px-3 py-2 text-sm rounded-md ${
                              pathname === child.href ? "text-teal-600 bg-teal-50" : "text-gray-600 hover:text-teal-600"
                            }`}
                          >
                            <span className="ml-2">{child.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md ${isSidebarOpen ? "" : "justify-center"} ${
                      pathname === item.href ? "bg-teal-50 text-teal-600" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.icon}
                    {isSidebarOpen && <span className="ml-3 font-medium">{item.title}</span>}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "lg:pl-64" : "lg:pl-16"
        }`}
      >
        <div className="p-4 md:p-6">{children}</div>
      </main>

      {/* Chat Widget */}
      {isChatOpen && <ChatWidget onClose={() => setIsChatOpen(false)} />}
    </div>
  )
}

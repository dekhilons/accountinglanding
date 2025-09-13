"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Download, RefreshCw, AlertCircle, Info, CheckCircle, XCircle } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { canAccessScreen } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { useToast } from "@/hooks/use-toast"

// Define types
type SystemLog = {
  id: string
  timestamp: string
  level: "info" | "warning" | "error" | "success"
  category: "system" | "security" | "integration" | "user" | "performance"
  message: string
  details?: string
  source: string
}

export default function SystemLogsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null)
  const [filterLevel, setFilterLevel] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Check permissions on component mount
  useEffect(() => {
    if (!canAccessScreen('/settings/logs')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [toast])

  // Sample system logs data
  const systemLogs: SystemLog[] = [
    {
      id: "log-1001",
      timestamp: "2024-05-20T14:30:15",
      level: "error",
      category: "integration",
      message: "Failed to sync with QuickBooks Online",
      details: "Connection timeout after 30 seconds. Error code: QB_TIMEOUT_001",
      source: "Integration Service",
    },
    {
      id: "log-1002",
      timestamp: "2024-05-20T14:25:30",
      level: "success",
      category: "user",
      message: "User login successful",
      details: "User: jane.smith@company.com, IP: 192.168.1.101",
      source: "Authentication Service",
    },
    {
      id: "log-1003",
      timestamp: "2024-05-20T14:20:45",
      level: "warning",
      category: "security",
      message: "Multiple failed login attempts detected",
      details: "5 failed attempts from IP: 203.0.113.42 for user: admin@company.com",
      source: "Security Monitor",
    },
    {
      id: "log-1004",
      timestamp: "2024-05-20T14:15:20",
      level: "info",
      category: "system",
      message: "Database backup completed successfully",
      details: "Backup size: 2.3GB, Duration: 45 minutes",
      source: "Backup Service",
    },
    {
      id: "log-1005",
      timestamp: "2024-05-20T14:10:10",
      level: "error",
      category: "performance",
      message: "High memory usage detected",
      details: "Memory usage: 92%, Threshold: 85%",
      source: "Performance Monitor",
    },
    {
      id: "log-1006",
      timestamp: "2024-05-20T14:05:30",
      level: "info",
      category: "integration",
      message: "Bank transaction sync completed",
      details: "Processed 150 transactions from Bank of America",
      source: "Banking Integration",
    },
    {
      id: "log-1007",
      timestamp: "2024-05-20T14:00:15",
      level: "warning",
      category: "system",
      message: "Disk space running low",
      details: "Available space: 8.2GB (12% remaining)",
      source: "System Monitor",
    },
    {
      id: "log-1008",
      timestamp: "2024-05-20T13:55:45",
      level: "success",
      category: "user",
      message: "Invoice approval workflow completed",
      details: "Invoice INV-1234 approved by mike.johnson@company.com",
      source: "Workflow Engine",
    },
  ]

  // Handle refresh logs
  const handleRefreshLogs = () => {
    setIsRefreshing(true)
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false)
      toast({
        title: "Logs Refreshed",
        description: "System logs have been refreshed with the latest data.",
      })
    }, 1500)
  }

  // Handle row click to show details
  const handleRowClick = (log: SystemLog) => {
    setSelectedLog(log)
    setIsDetailsModalOpen(true)
  }

  // Handle export logs
  const handleExportLogs = () => {
    toast({
      title: "Export Started",
      description: "System logs are being exported. You'll receive a download link shortly.",
    })
  }

  // Level badge component
  const LevelBadge = ({ level }: { level: SystemLog["level"] }) => {
    switch (level) {
      case "info":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Info className="mr-1 h-3 w-3" />
            Info
          </Badge>
        )
      case "warning":
        return (
          <Badge className="bg-amber-100 text-amber-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            Warning
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        )
      case "success":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Success
          </Badge>
        )
      default:
        return null
    }
  }

  // Category badge component
  const CategoryBadge = ({ category }: { category: SystemLog["category"] }) => {
    switch (category) {
      case "system":
        return <Badge className="bg-gray-100 text-gray-800">System</Badge>
      case "security":
        return <Badge className="bg-purple-100 text-purple-800">Security</Badge>
      case "integration":
        return <Badge className="bg-teal-100 text-teal-800">Integration</Badge>
      case "user":
        return <Badge className="bg-blue-100 text-blue-800">User</Badge>
      case "performance":
        return <Badge className="bg-orange-100 text-orange-800">Performance</Badge>
      default:
        return null
    }
  }

  // Filter logs based on selected filters
  const filteredLogs = systemLogs.filter((log) => {
    const matchesLevel = filterLevel === "" || log.level === filterLevel
    const matchesCategory = filterCategory === "" || log.category === filterCategory
    return matchesLevel && matchesCategory
  })

  // Table columns
  const columns = [
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      cell: ({ row }: any) => {
        return new Date(row.getValue("timestamp")).toLocaleString()
      },
    },
    {
      accessorKey: "level",
      header: "Level",
      cell: ({ row }: any) => {
        return <LevelBadge level={row.getValue("level")} />
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }: any) => {
        return <CategoryBadge category={row.getValue("category")} />
      },
    },
    {
      accessorKey: "message",
      header: "Message",
    },
    {
      accessorKey: "source",
      header: "Source",
    },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Logs</h1>
            <p className="text-muted-foreground">Monitor system activities and troubleshoot issues</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleRefreshLogs} disabled={isRefreshing}>
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleExportLogs}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Log Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Log Filters</CardTitle>
            <CardDescription>Filter system logs by level and category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Log Level</label>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setFilterLevel("all")
                    setFilterCategory("all")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Logs */}
        <Card>
          <CardHeader>
            <CardTitle>System Activity Logs</CardTitle>
            <CardDescription>Real-time system logs and events</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={filteredLogs} searchColumn="message" onRowClick={handleRowClick} />
          </CardContent>
        </Card>
      </div>

      {/* Log Details Modal */}
      <ModalDialog
        title="Log Details"
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Timestamp</h3>
                <p className="mt-1">{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Source</h3>
                <p className="mt-1">{selectedLog.source}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Level</h3>
                <div className="mt-1">
                  <LevelBadge level={selectedLog.level} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <div className="mt-1">
                  <CategoryBadge category={selectedLog.category} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Message</h3>
              <p className="mt-1">{selectedLog.message}</p>
            </div>

            {selectedLog.details && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Details</h3>
                <div className="mt-1 bg-gray-50 p-3 rounded-md border border-gray-200">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{selectedLog.details}</pre>
                </div>
              </div>
            )}

            {selectedLog.level === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-medium text-red-800">Error Information</h3>
                    <p className="text-sm text-red-700 mt-1">
                      This error may require immediate attention. Consider checking the system status and contacting
                      support if the issue persists.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedLog.level === "warning" && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-medium text-amber-800">Warning Information</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      This warning indicates a potential issue that should be monitored. Consider taking preventive
                      action if this warning occurs frequently.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ModalDialog>
    </AppShell>
  )
}

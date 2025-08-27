"use client"

import { useState } from "react"
import { Download, FileText, Calendar, Search } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { useToast } from "@/hooks/use-toast"

// Define types
type AuditTrail = {
  id: string
  timestamp: string
  user: string
  action: string
  entity: string
  entityId: string
  oldValue?: string
  newValue?: string
  ipAddress: string
}

type ComplianceReport = {
  id: string
  name: string
  type: "sox" | "gaap" | "internal" | "external"
  period: string
  status: "draft" | "review" | "approved" | "filed"
  dueDate: string
  assignee: string
}

export default function AuditReportingPage() {
  const { toast } = useToast()
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedAuditItem, setSelectedAuditItem] = useState<AuditTrail | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterUser, setFilterUser] = useState("all")
  const [filterAction, setFilterAction] = useState("all")

  // Sample audit trail data
  const auditTrail: AuditTrail[] = [
    {
      id: "audit-1001",
      timestamp: "2024-05-20T14:30:15",
      user: "john.doe@company.com",
      action: "UPDATE",
      entity: "Invoice",
      entityId: "INV-1234",
      oldValue: "Status: Pending",
      newValue: "Status: Approved",
      ipAddress: "192.168.1.100",
    },
    {
      id: "audit-1002",
      timestamp: "2024-05-20T14:25:30",
      user: "jane.smith@company.com",
      action: "CREATE",
      entity: "Journal Entry",
      entityId: "JE-5678",
      newValue: "Amount: $5,000.00, Account: Office Expenses",
      ipAddress: "192.168.1.101",
    },
    {
      id: "audit-1003",
      timestamp: "2024-05-20T14:20:45",
      user: "mike.johnson@company.com",
      action: "DELETE",
      entity: "Vendor",
      entityId: "VEN-9012",
      oldValue: "Vendor: Old Supplier Inc.",
      ipAddress: "192.168.1.102",
    },
    {
      id: "audit-1004",
      timestamp: "2024-05-20T14:15:20",
      user: "sarah.williams@company.com",
      action: "LOGIN",
      entity: "System",
      entityId: "AUTH-001",
      ipAddress: "192.168.1.103",
    },
    {
      id: "audit-1005",
      timestamp: "2024-05-20T14:10:10",
      user: "admin@company.com",
      action: "UPDATE",
      entity: "User Permissions",
      entityId: "USER-456",
      oldValue: "Role: User",
      newValue: "Role: Manager",
      ipAddress: "192.168.1.104",
    },
  ]

  // Sample compliance reports
  const complianceReports: ComplianceReport[] = [
    {
      id: "report-1001",
      name: "SOX 404 Internal Controls Assessment",
      type: "sox",
      period: "Q1 2024",
      status: "approved",
      dueDate: "2024-05-31",
      assignee: "Sarah Williams",
    },
    {
      id: "report-1002",
      name: "GAAP Compliance Review",
      type: "gaap",
      period: "May 2024",
      status: "review",
      dueDate: "2024-06-15",
      assignee: "Mike Johnson",
    },
    {
      id: "report-1003",
      name: "Internal Audit Report",
      type: "internal",
      period: "Q2 2024",
      status: "draft",
      dueDate: "2024-07-01",
      assignee: "Jane Smith",
    },
    {
      id: "report-1004",
      name: "External Auditor Requests",
      type: "external",
      period: "FY 2024",
      status: "filed",
      dueDate: "2024-04-30",
      assignee: "John Doe",
    },
  ]

  // Handle row click for audit trail
  const handleAuditRowClick = (auditItem: AuditTrail) => {
    setSelectedAuditItem(auditItem)
    setIsDetailsModalOpen(true)
  }

  // Handle generate report
  const handleGenerateReport = () => {
    toast({
      title: "Report Generated",
      description: "The audit report has been generated and is ready for download.",
    })
  }

  // Action badge component
  const ActionBadge = ({ action }: { action: string }) => {
    switch (action) {
      case "CREATE":
        return <Badge className="bg-green-100 text-green-800">CREATE</Badge>
      case "UPDATE":
        return <Badge className="bg-blue-100 text-blue-800">UPDATE</Badge>
      case "DELETE":
        return <Badge className="bg-red-100 text-red-800">DELETE</Badge>
      case "LOGIN":
        return <Badge className="bg-purple-100 text-purple-800">LOGIN</Badge>
      case "LOGOUT":
        return <Badge className="bg-gray-100 text-gray-800">LOGOUT</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{action}</Badge>
    }
  }

  // Status badge component for reports
  const ReportStatusBadge = ({ status }: { status: ComplianceReport["status"] }) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-amber-100 text-amber-800">Draft</Badge>
      case "review":
        return <Badge className="bg-blue-100 text-blue-800">In Review</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "filed":
        return <Badge className="bg-purple-100 text-purple-800">Filed</Badge>
      default:
        return null
    }
  }

  // Type badge component for reports
  const ReportTypeBadge = ({ type }: { type: ComplianceReport["type"] }) => {
    switch (type) {
      case "sox":
        return <Badge className="bg-red-100 text-red-800">SOX</Badge>
      case "gaap":
        return <Badge className="bg-blue-100 text-blue-800">GAAP</Badge>
      case "internal":
        return <Badge className="bg-green-100 text-green-800">Internal</Badge>
      case "external":
        return <Badge className="bg-purple-100 text-purple-800">External</Badge>
      default:
        return null
    }
  }

  // Filter audit trail data
  const filteredAuditTrail = auditTrail.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesUser = filterUser === "all" || item.user === filterUser
    const matchesAction = filterAction === "all" || item.action === filterAction

    return matchesSearch && matchesUser && matchesAction
  })

  // Audit trail columns
  const auditColumns = [
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      cell: ({ row }: any) => {
        return new Date(row.getValue("timestamp")).toLocaleString()
      },
    },
    {
      accessorKey: "user",
      header: "User",
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }: any) => {
        return <ActionBadge action={row.getValue("action")} />
      },
    },
    {
      accessorKey: "entity",
      header: "Entity",
    },
    {
      accessorKey: "entityId",
      header: "Entity ID",
    },
    {
      accessorKey: "ipAddress",
      header: "IP Address",
    },
  ]

  // Reports columns
  const reportsColumns = [
    {
      accessorKey: "name",
      header: "Report Name",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: any) => {
        return <ReportTypeBadge type={row.getValue("type")} />
      },
    },
    {
      accessorKey: "period",
      header: "Period",
    },
    {
      accessorKey: "assignee",
      header: "Assignee",
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }: any) => {
        return new Date(row.getValue("dueDate")).toLocaleDateString()
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        return <ReportStatusBadge status={row.getValue("status")} />
      },
    },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit & Reporting</h1>
            <p className="text-muted-foreground">Audit trails and compliance reporting</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Date Range
            </Button>
            <Button variant="outline" onClick={handleGenerateReport}>
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        <Tabs defaultValue="audit-trail" className="w-full">
          <TabsList>
            <TabsTrigger value="audit-trail">Audit Trail</TabsTrigger>
            <TabsTrigger value="compliance-reports">Compliance Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="audit-trail" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail Filters</CardTitle>
                <CardDescription>Filter audit trail entries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Search</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search entities, IDs, users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">User</label>
                    <Select value={filterUser} onValueChange={setFilterUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All users</SelectItem>
                        <SelectItem value="john.doe@company.com">John Doe</SelectItem>
                        <SelectItem value="jane.smith@company.com">Jane Smith</SelectItem>
                        <SelectItem value="mike.johnson@company.com">Mike Johnson</SelectItem>
                        <SelectItem value="sarah.williams@company.com">Sarah Williams</SelectItem>
                        <SelectItem value="admin@company.com">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Action</label>
                    <Select value={filterAction} onValueChange={setFilterAction}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All actions</SelectItem>
                        <SelectItem value="CREATE">CREATE</SelectItem>
                        <SelectItem value="UPDATE">UPDATE</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="LOGIN">LOGIN</SelectItem>
                        <SelectItem value="LOGOUT">LOGOUT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSearchTerm("")
                        setFilterUser("all")
                        setFilterAction("all")
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Trail */}
            <Card>
              <CardHeader>
                <CardTitle>System Audit Trail</CardTitle>
                <CardDescription>Complete log of all system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={auditColumns}
                  data={filteredAuditTrail}
                  searchColumn="entity"
                  onRowClick={handleAuditRowClick}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance-reports" className="space-y-6">
            {/* Compliance Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Reports</CardTitle>
                <CardDescription>Manage compliance and regulatory reports</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable columns={reportsColumns} data={complianceReports} searchColumn="name" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Audit Details Modal */}
      <ModalDialog
        title="Audit Trail Details"
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        size="lg"
      >
        {selectedAuditItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Timestamp</h3>
                <p className="mt-1">{new Date(selectedAuditItem.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">User</h3>
                <p className="mt-1">{selectedAuditItem.user}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Action</h3>
                <div className="mt-1">
                  <ActionBadge action={selectedAuditItem.action} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">IP Address</h3>
                <p className="mt-1">{selectedAuditItem.ipAddress}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Entity</h3>
                <p className="mt-1">{selectedAuditItem.entity}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Entity ID</h3>
                <p className="mt-1">{selectedAuditItem.entityId}</p>
              </div>
            </div>

            {(selectedAuditItem.oldValue || selectedAuditItem.newValue) && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Changes</h3>
                <div className="space-y-2">
                  {selectedAuditItem.oldValue && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <h4 className="text-sm font-medium text-red-800">Old Value</h4>
                      <p className="text-sm text-red-700 mt-1">{selectedAuditItem.oldValue}</p>
                    </div>
                  )}
                  {selectedAuditItem.newValue && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <h4 className="text-sm font-medium text-green-800">New Value</h4>
                      <p className="text-sm text-green-700 mt-1">{selectedAuditItem.newValue}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4 flex justify-end">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Export Details
              </Button>
            </div>
          </div>
        )}
      </ModalDialog>
    </AppShell>
  )
}

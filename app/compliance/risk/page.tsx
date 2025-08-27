"use client"

import { useState } from "react"
import { Filter, Download, Check, AlertCircle, FileText } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

// Define column types
type ControlViolation = {
  id: string
  date: string
  description: string
  rule: string
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "overridden" | "resolved"
  department: string
}

export default function RiskControlsPage() {
  const { toast } = useToast()
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false)
  const [selectedViolation, setSelectedViolation] = useState<ControlViolation | null>(null)
  const [overrideReason, setOverrideReason] = useState("")

  // Sample data for control violations
  const controlViolations: ControlViolation[] = [
    {
      id: "cv-1001",
      date: "2024-05-20",
      description: "Invoice approved without secondary review",
      rule: "AP-001: Invoices over $5,000 require two-level approval",
      severity: "medium",
      status: "open",
      department: "Accounts Payable",
    },
    {
      id: "cv-1002",
      date: "2024-05-18",
      description: "User accessed system outside of business hours",
      rule: "SEC-003: System access restricted to business hours",
      severity: "low",
      status: "open",
      department: "IT",
    },
    {
      id: "cv-1003",
      date: "2024-05-15",
      description: "Payment made to unapproved vendor",
      rule: "VEN-002: Payments only to approved vendors",
      severity: "high",
      status: "open",
      department: "Accounts Payable",
    },
    {
      id: "cv-1004",
      date: "2024-05-12",
      description: "Journal entry posted without supporting documentation",
      rule: "GL-005: All journal entries require documentation",
      severity: "medium",
      status: "overridden",
      department: "Accounting",
    },
    {
      id: "cv-1005",
      date: "2024-05-10",
      description: "User granted admin privileges without approval",
      rule: "SEC-001: Admin privileges require CIO approval",
      severity: "critical",
      status: "resolved",
      department: "IT",
    },
  ]

  // Handle row click to show details
  const handleRowClick = (violation: ControlViolation) => {
    setSelectedViolation(violation)
    setIsDetailsModalOpen(true)
  }

  // Handle view policy
  const handleViewPolicy = () => {
    if (!selectedViolation) return
    setIsPolicyModalOpen(true)
  }

  // Handle approve override
  const handleApproveOverride = () => {
    if (!selectedViolation || !overrideReason) return

    toast({
      title: "Override Approved",
      description: `Control violation ${selectedViolation.id} has been overridden.`,
    })
    setIsDetailsModalOpen(false)
  }

  // Severity badge component
  const SeverityBadge = ({ severity }: { severity: ControlViolation["severity"] }) => {
    switch (severity) {
      case "low":
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>
      case "medium":
        return <Badge className="bg-amber-100 text-amber-800">Medium</Badge>
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>
      case "critical":
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>
      default:
        return null
    }
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: ControlViolation["status"] }) => {
    switch (status) {
      case "open":
        return <Badge className="bg-red-100 text-red-800">Open</Badge>
      case "overridden":
        return <Badge className="bg-purple-100 text-purple-800">Overridden</Badge>
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>
      default:
        return null
    }
  }

  // Table columns
  const columns = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }: any) => {
        return new Date(row.getValue("date")).toLocaleDateString()
      },
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "rule",
      header: "Control Rule",
    },
    {
      accessorKey: "department",
      header: "Department",
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }: any) => {
        return <SeverityBadge severity={row.getValue("severity")} />
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        return <StatusBadge status={row.getValue("status")} />
      },
    },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Risk & Controls</h1>
            <p className="text-muted-foreground">Monitor and manage internal control violations</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Control Violations */}
        <Card>
          <CardHeader>
            <CardTitle>Control Violations</CardTitle>
            <CardDescription>Review and manage internal control violations</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={controlViolations}
              searchColumn="description"
              onRowClick={handleRowClick}
            />
          </CardContent>
        </Card>
      </div>

      {/* Violation Details Modal */}
      <ModalDialog
        title="Control Violation Details"
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        size="lg"
      >
        {selectedViolation && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                <p className="mt-1">{new Date(selectedViolation.date).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Department</h3>
                <p className="mt-1">{selectedViolation.department}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1">{selectedViolation.description}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Control Rule</h3>
                <div className="flex items-center mt-1">
                  <p>{selectedViolation.rule}</p>
                  <Button variant="ghost" size="sm" className="ml-2" onClick={handleViewPolicy}>
                    <FileText className="h-4 w-4 mr-1" />
                    View Policy
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Severity</h3>
                <div className="mt-1">
                  <SeverityBadge severity={selectedViolation.severity} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <StatusBadge status={selectedViolation.status} />
                </div>
              </div>
            </div>

            {selectedViolation.status === "open" && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Override Reason</h3>
                </div>
                <Textarea
                  placeholder="Enter reason for override..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end mt-4">
                  <Button
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={handleApproveOverride}
                    disabled={!overrideReason}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve Override
                  </Button>
                </div>
              </div>
            )}

            {selectedViolation.status === "overridden" && (
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-medium text-purple-800">Override Information</h3>
                      <p className="text-sm text-purple-700 mt-1">
                        This control violation was overridden by Jane Smith on May 12, 2024.
                      </p>
                      <p className="text-sm text-purple-700 mt-2">
                        <strong>Reason:</strong> Month-end close process required expedited posting. Supporting
                        documentation was provided after the fact and verified.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedViolation.status === "resolved" && (
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-medium text-green-800">Resolution Information</h3>
                      <p className="text-sm text-green-700 mt-1">
                        This control violation was resolved by Mike Johnson on May 11, 2024.
                      </p>
                      <p className="text-sm text-green-700 mt-2">
                        <strong>Resolution:</strong> Admin privileges were revoked and proper approval process was
                        followed to reinstate necessary access.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ModalDialog>

      {/* Policy Modal */}
      <ModalDialog
        title="Control Policy"
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        size="lg"
      >
        {selectedViolation && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="font-medium mb-2">{selectedViolation.rule.split(":")[0]}</h3>
              <p className="text-sm text-gray-700 mb-4">{selectedViolation.rule.split(":")[1].trim()}</p>

              {selectedViolation.rule.startsWith("AP-001") && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    <strong>Policy Details:</strong> All invoices with a total amount exceeding $5,000 must be reviewed
                    and approved by two separate authorized individuals before payment can be processed.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> This control ensures proper oversight of significant expenditures and
                    reduces the risk of fraud or error.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Procedure:</strong>
                  </p>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 pl-4">
                    <li>Initial review by department manager or authorized approver</li>
                    <li>Secondary review by finance manager or authorized approver</li>
                    <li>Documentation of both approvals in the accounting system</li>
                    <li>Processing of payment only after both approvals are recorded</li>
                  </ol>
                </div>
              )}

              {selectedViolation.rule.startsWith("SEC-003") && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    <strong>Policy Details:</strong> Access to financial and accounting systems is restricted to
                    standard business hours (6:00 AM to 8:00 PM local time) unless specific after-hours access has been
                    approved.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> This control helps detect unusual system access that may indicate
                    unauthorized use or suspicious activity.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Exceptions:</strong> After-hours access may be granted during month-end close periods or for
                    specific business needs with proper approval from department head and IT security.
                  </p>
                </div>
              )}

              {selectedViolation.rule.startsWith("VEN-002") && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    <strong>Policy Details:</strong> Payments may only be made to vendors that have completed the vendor
                    approval process and are listed in the approved vendor master file.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> This control ensures that payments are only made to legitimate, verified
                    vendors and reduces the risk of fraud or improper payments.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Procedure:</strong>
                  </p>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 pl-4">
                    <li>New vendors must complete vendor application form</li>
                    <li>Verification of vendor legitimacy (tax ID, business registration)</li>
                    <li>Review of potential conflicts of interest</li>
                    <li>Approval by procurement and finance departments</li>
                    <li>Addition to approved vendor master file</li>
                  </ol>
                </div>
              )}

              {selectedViolation.rule.startsWith("GL-005") && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    <strong>Policy Details:</strong> All journal entries must include supporting documentation that
                    provides evidence of the transaction and justification for the accounting treatment.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> This control ensures that all accounting entries are properly
                    substantiated and can be verified during internal or external audits.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Required Documentation:</strong>
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 pl-4">
                    <li>Original source documents (invoices, contracts, receipts)</li>
                    <li>Calculation worksheets (if applicable)</li>
                    <li>Explanation of business purpose</li>
                    <li>Reference to accounting policies applied</li>
                  </ul>
                </div>
              )}

              {selectedViolation.rule.startsWith("SEC-001") && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    <strong>Policy Details:</strong> Administrative privileges for financial and accounting systems may
                    only be granted with explicit approval from the Chief Information Officer (CIO) or designated
                    deputy.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Purpose:</strong> This control limits the number of users with elevated system access to
                    reduce the risk of unauthorized changes to system configurations, security settings, or data.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Procedure:</strong>
                  </p>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 pl-4">
                    <li>Submission of admin access request form with business justification</li>
                    <li>Review and approval by department head</li>
                    <li>Security review by IT security team</li>
                    <li>Final approval by CIO or designated deputy</li>
                    <li>Documentation of approval and regular review of admin access</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </ModalDialog>
    </AppShell>
  )
}

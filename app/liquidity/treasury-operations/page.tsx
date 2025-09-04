"use client"

import { useState, useEffect } from "react"
import { Download, FileText, Calendar, DollarSign, ArrowRight } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// Define column types
type CreditLine = {
  id: string
  name: string
  type: "line-of-credit" | "term-loan" | "credit-card"
  limit: number
  balance: number
  rate: number
  dueDate: string
  status: "active" | "inactive"
}

export default function TreasuryOperationsPage() {
  const { toast } = useToast()
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false) // New state for terms modal
  const [termsContent, setTermsContent] = useState<string>("") // New state for terms content
  const [selectedCreditLine, setSelectedCreditLine] = useState<CreditLine | null>(null)
  const [transferAmount, setTransferAmount] = useState("")
  const [transferAccount, setTransferAccount] = useState("")
  const [rowSelection, setRowSelection] = useState({}) // Add rowSelection state
  const [creditLines, setCreditLines] = useState<CreditLine[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddCreditLineModalOpen, setIsAddCreditLineModalOpen] = useState(false)
  const [newCreditLine, setNewCreditLine] = useState<Omit<CreditLine, "id" | "createdAt" | "updatedAt">>({
    name: "",
    type: "line-of-credit", // Default type
    limit: 0,
    balance: 0,
    rate: 0,
    dueDate: new Date().toISOString().split("T")[0], // Default to today's date
    status: "active", // Default status
  })

  // Handle export to CSV
  const handleExport = () => {
    if (creditLines.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no credit lines to export.",
        variant: "default"
      })
      return
    }

    const headers = ["ID", "Name", "Type", "Limit", "Balance", "Interest Rate", "Due Date", "Status"]
    const rows = creditLines.map(line => [
      line.id,
      line.name,
      line.type,
      line.limit,
      line.balance,
      line.rate,
      line.dueDate,
      line.status
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) { // Feature detection for download attribute
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", "credit_lines.csv")
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast({
        title: "Export Successful",
        description: "Credit lines exported to credit_lines.csv",
      })
    } else {
      toast({
        title: "Export Failed",
        description: "Your browser does not support downloading files directly.",
        variant: "destructive"
      })
    }
  }

  // Handle adding a new credit line
  const handleAddCreditLine = async () => {
    try {
      const response = await fetch('http://localhost:8004/treasury/credit-lines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newCreditLine,
          tenantId: 'default_tenant_id', // Assuming a default tenant_id
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Credit Line Added",
          description: result.message,
        })
        setIsAddCreditLineModalOpen(false)
        // Reset form
        setNewCreditLine({
          name: "",
          type: "line-of-credit",
          limit: 0,
          balance: 0,
          rate: 0,
          dueDate: new Date().toISOString().split("T")[0],
          status: "active",
        })
        // Refresh credit lines
        const refreshResponse = await fetch('http://localhost:8004/treasury/credit-lines?tenant_id=default_tenant_id')
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          setCreditLines(data)
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to add credit line",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add credit line",
        variant: "destructive"
      })
    }
  }

  // Fetch credit lines from API
  useEffect(() => {
    const fetchCreditLines = async () => {
      try {
        const response = await fetch('http://localhost:8004/treasury/credit-lines?tenant_id=default_tenant_id')
        if (response.ok) {
          const data = await response.json()
          setCreditLines(data)
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch credit lines",
            variant: "destructive"
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch credit lines",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    fetchCreditLines()
  }, [toast])

  // Sample bank accounts
  const bankAccounts = [
    { value: "acct-1001", label: "Operating Account" },
    { value: "acct-1002", label: "Payroll Account" },
    { value: "acct-1003", label: "Tax Reserve Account" },
  ]

  // Handle row click to show details
  const handleRowClick = (creditLine: CreditLine) => {
    setSelectedCreditLine(creditLine)
    setIsDetailsModalOpen(true)
  }

  // Handle schedule transfer
  const handleScheduleTransfer = () => {
    if (!selectedCreditLine) return
    setIsDetailsModalOpen(false)
    setIsTransferModalOpen(true)
  }

  // Handle confirm transfer
  const handleConfirmTransfer = async () => {
    if (!selectedCreditLine || !transferAmount || !transferAccount) return

    try {
      const response = await fetch('http://localhost:8004/treasury/schedule-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credit_line_id: selectedCreditLine.id,
          tenant_id: 'default_tenant_id',
          amount: parseFloat(transferAmount),
          account_id: transferAccount,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Transfer Scheduled",
          description: result.message,
        })
        setIsTransferModalOpen(false)
        setTransferAmount("")
        setTransferAccount("")
        // Refresh credit lines
        const refreshResponse = await fetch('http://localhost:8004/treasury/credit-lines?tenant_id=default_tenant_id')
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          setCreditLines(data)
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to schedule transfer",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule transfer",
        variant: "destructive"
      })
    }
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: CreditLine["status"] }) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      default:
        return null
    }
  }

  // Type badge component
  const TypeBadge = ({ type }: { type: CreditLine["type"] }) => {
    switch (type) {
      case "line-of-credit":
        return <Badge className="bg-blue-100 text-blue-800">Line of Credit</Badge>
      case "term-loan":
        return <Badge className="bg-purple-100 text-purple-800">Term Loan</Badge>
      case "credit-card":
        return <Badge className="bg-amber-100 text-amber-800">Credit Card</Badge>
      default:
        return null
    }
  }

  // Table columns
  const columns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: any) => {
        return <TypeBadge type={row.getValue("type")} />
      },
    },
    {
      accessorKey: "limit",
      header: "Limit",
      cell: ({ row }: any) => {
        const amount = Number.parseFloat(row.getValue("limit"))
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
      },
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }: any) => {
        const amount = Number.parseFloat(row.getValue("balance"))
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
      },
    },
    {
      accessorKey: "rate",
      header: "Interest Rate",
      cell: ({ row }: any) => {
        const rate = Number.parseFloat(row.getValue("rate"))
        return `${rate.toFixed(2)}%`
      },
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
        return <StatusBadge status={row.getValue("status")} />
      },
    },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Treasury Operations</h1>
            <p className="text-muted-foreground">Manage credit lines, debt instruments, and transfers</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setIsAddCreditLineModalOpen(true)}>
              <DollarSign className="mr-2 h-4 w-4" />
              New Credit Line
            </Button>
          </div>
        </div>

        {/* Credit Lines */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Lines & Debt Instruments</CardTitle>
            <CardDescription>Manage your company's credit facilities and debt</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-muted-foreground">Loading credit lines...</div>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={creditLines}
                searchColumn="name"
                onRowClick={handleRowClick}
                rowSelection={rowSelection} // Pass rowSelection
                onRowSelectionChange={setRowSelection} // Pass onRowSelectionChange
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Credit Line Details Modal */}
      <ModalDialog
        title={`Credit Line Details: ${selectedCreditLine?.name}`}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        size="lg"
      >
        {selectedCreditLine && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type</h3>
                <div className="mt-1">
                  <TypeBadge type={selectedCreditLine.type} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <StatusBadge status={selectedCreditLine.status} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Credit Limit</h3>
                <p className="mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(selectedCreditLine.limit)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Current Balance</h3>
                <p className="mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(selectedCreditLine.balance)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Interest Rate</h3>
                <p className="mt-1">{selectedCreditLine.rate.toFixed(2)}% APR</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                <p className="mt-1">{new Date(selectedCreditLine.dueDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Available Credit</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(selectedCreditLine.balance)}{" "}
                  of{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(selectedCreditLine.limit)}{" "}
                  used
                </span>
                <span className="font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(selectedCreditLine.limit - selectedCreditLine.balance)}{" "}
                  available
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-teal-600 rounded-full"
                  style={{
                    width: `${(selectedCreditLine.balance / selectedCreditLine.limit) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 flex justify-between">
              <Button
                variant="outline"
                onClick={async () => {
                  if (selectedCreditLine) {
                    try {
                      const response = await fetch(
                        `http://localhost:8004/treasury/credit-lines/${selectedCreditLine.id}/terms?tenant_id=default_tenant_id`
                      )
                      if (response.ok) {
                        const data = await response.json()
                        setTermsContent(data.terms)
                        setIsTermsModalOpen(true)
                      } else {
                        toast({
                          title: "Error",
                          description: "Failed to fetch terms",
                          variant: "destructive",
                        })
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to fetch terms",
                        variant: "destructive",
                      })
                    }
                  }
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                View Terms
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={handleScheduleTransfer}
                disabled={
                  selectedCreditLine.status !== "active" || selectedCreditLine.balance >= selectedCreditLine.limit
                }
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Schedule Transfer
              </Button>
            </div>
          </div>
        )}
      </ModalDialog>

      {/* View Terms Modal */}
      <ModalDialog
        title={`Terms for ${selectedCreditLine?.name}`}
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      >
        <p className="whitespace-pre-wrap">{termsContent}</p>
      </ModalDialog>

      {/* Schedule Transfer Modal */}
      <ModalDialog
        title="Schedule Transfer"
        description="Schedule a transfer from your credit line to a bank account"
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onConfirm={handleConfirmTransfer}
        confirmText="Schedule Transfer"
        cancelText="Cancel"
      >
        {selectedCreditLine && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">From</label>
              <div className="p-3 border rounded-md bg-gray-50">
                <div className="font-medium">{selectedCreditLine.name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  Available:{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(selectedCreditLine.limit - selectedCreditLine.balance)}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">To</label>
              <Select value={transferAccount} onValueChange={setTransferAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.value} value={account.value}>
                      {account.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="pl-9"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Transfer Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input type="date" className="pl-9" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-start">
                <ArrowRight className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <h3 className="font-medium text-blue-800">Transfer Summary</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    This transfer will increase your credit line balance and incur interest at a rate of{" "}
                    {selectedCreditLine.rate.toFixed(2)}% APR.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalDialog>

      {/* Add Credit Line Modal */}
      <ModalDialog
        title="Add New Credit Line"
        description="Enter the details for the new credit line"
        isOpen={isAddCreditLineModalOpen}
        onClose={() => setIsAddCreditLineModalOpen(false)}
        onConfirm={handleAddCreditLine}
        confirmText="Add Credit Line"
        cancelText="Cancel"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Name</label>
            <Input
              value={newCreditLine.name}
              onChange={(e) => setNewCreditLine({ ...newCreditLine, name: e.target.value })}
              placeholder="e.g., Business Loan, Revolving Credit"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <Select
              value={newCreditLine.type}
              onValueChange={(value) => setNewCreditLine({ ...newCreditLine, type: value as "line-of-credit" | "term-loan" | "credit-card" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line-of-credit">Line of Credit</SelectItem>
                <SelectItem value="term-loan">Term Loan</SelectItem>
                <SelectItem value="credit-card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Credit Limit</label>
            <Input
              type="number"
              value={newCreditLine.limit}
              onChange={(e) => setNewCreditLine({ ...newCreditLine, limit: parseFloat(e.target.value) })}
              placeholder="e.g., 100000"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Current Balance</label>
            <Input
              type="number"
              value={newCreditLine.balance}
              onChange={(e) => setNewCreditLine({ ...newCreditLine, balance: parseFloat(e.target.value) })}
              placeholder="e.g., 50000"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Interest Rate (%)</label>
            <Input
              type="number"
              value={newCreditLine.rate}
              onChange={(e) => setNewCreditLine({ ...newCreditLine, rate: parseFloat(e.target.value) })}
              placeholder="e.g., 4.5"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Due Date</label>
            <Input
              type="date"
              value={newCreditLine.dueDate}
              onChange={(e) => setNewCreditLine({ ...newCreditLine, dueDate: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select
              value={newCreditLine.status}
              onValueChange={(value) => setNewCreditLine({ ...newCreditLine, status: value as "active" | "inactive" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ModalDialog>
    </AppShell>
  )
}

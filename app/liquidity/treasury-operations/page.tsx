"use client"

import { useState } from "react"
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
  const [selectedCreditLine, setSelectedCreditLine] = useState<CreditLine | null>(null)
  const [transferAmount, setTransferAmount] = useState("")
  const [transferAccount, setTransferAccount] = useState("")

  // Sample data for credit lines
  const creditLines: CreditLine[] = [
    {
      id: "cl-1001",
      name: "Primary Line of Credit",
      type: "line-of-credit",
      limit: 250000,
      balance: 0,
      rate: 7.5,
      dueDate: "2025-12-31",
      status: "active",
    },
    {
      id: "cl-1002",
      name: "Equipment Term Loan",
      type: "term-loan",
      limit: 100000,
      balance: 75000,
      rate: 6.25,
      dueDate: "2027-06-30",
      status: "active",
    },
    {
      id: "cl-1003",
      name: "Corporate Credit Card",
      type: "credit-card",
      limit: 50000,
      balance: 12500,
      rate: 18.99,
      dueDate: "2024-06-15",
      status: "active",
    },
    {
      id: "cl-1004",
      name: "Secondary Line of Credit",
      type: "line-of-credit",
      limit: 100000,
      balance: 0,
      rate: 8.0,
      dueDate: "2025-06-30",
      status: "inactive",
    },
  ]

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
  const handleConfirmTransfer = () => {
    toast({
      title: "Transfer Scheduled",
      description: `A transfer of ${new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(Number(transferAmount))} has been scheduled.`,
    })
    setIsTransferModalOpen(false)
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
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700">
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
            <DataTable columns={columns} data={creditLines} searchColumn="name" onRowClick={handleRowClick} />
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
              <Button variant="outline">
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
    </AppShell>
  )
}

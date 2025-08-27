"use client"

import { useState } from "react"
import { Calendar, Filter, Check, Flag, Edit, AlertCircle } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { useToast } from "@/hooks/use-toast"

// Define column types
type Transaction = {
  id: string
  date: string
  description: string
  amount: number
  account: string
  suggestedGLAccount: string
  confidence: number
  status: "unreconciled" | "matched" | "flagged"
}

export default function BankReconciliationPage() {
  const { toast } = useToast()
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedGLAccount, setSelectedGLAccount] = useState<string>("")

  // Sample data
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "txn-1001",
      date: "2024-05-20",
      description: "Payment to Office Supplies Inc.",
      amount: -1250.0,
      account: "Business Checking",
      suggestedGLAccount: "Office Expenses",
      confidence: 95,
      status: "unreconciled",
    },
    {
      id: "txn-1002",
      date: "2024-05-18",
      description: "Payment from Client XYZ Corp",
      amount: 7500.0,
      account: "Business Checking",
      suggestedGLAccount: "Sales Revenue",
      confidence: 98,
      status: "unreconciled",
    },
    {
      id: "txn-1003",
      date: "2024-05-15",
      description: "AWS Cloud Services",
      amount: -350.75,
      account: "Business Checking",
      suggestedGLAccount: "IT Expenses",
      confidence: 92,
      status: "unreconciled",
    },
    {
      id: "txn-1004",
      date: "2024-05-12",
      description: "Payroll Processing",
      amount: -12500.0,
      account: "Payroll Account",
      suggestedGLAccount: "Salaries & Wages",
      confidence: 99,
      status: "matched",
    },
    {
      id: "txn-1005",
      date: "2024-05-10",
      description: "Unknown Transfer",
      amount: -500.0,
      account: "Business Checking",
      suggestedGLAccount: "Miscellaneous Expenses",
      confidence: 65,
      status: "flagged",
    },
  ])

  // Sample GL accounts
  const glAccounts = [
    { value: "office-expenses", label: "Office Expenses" },
    { value: "sales-revenue", label: "Sales Revenue" },
    { value: "it-expenses", label: "IT Expenses" },
    { value: "salaries-wages", label: "Salaries & Wages" },
    { value: "rent", label: "Rent & Facilities" },
    { value: "marketing", label: "Marketing & Advertising" },
    { value: "travel", label: "Travel & Entertainment" },
    { value: "misc-expenses", label: "Miscellaneous Expenses" },
  ]

  // Handle row click to show details
  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setSelectedGLAccount(transaction.suggestedGLAccount.toLowerCase().replace(/\s+/g, "-"))
    setIsDetailsModalOpen(true)
  }

  // Handle reconciliation actions
  const handleApproveMatch = () => {
    if (!selectedTransaction) return

    setTransactions((prevTransactions) =>
      prevTransactions.map((txn) =>
        txn.id === selectedTransaction.id ? { ...txn, status: "matched", suggestedGLAccount: selectedGLAccount.replace(/-/g, " ") } : txn
      )
    )

    toast({
      title: "Match Approved",
      description: `Transaction matched to ${selectedGLAccount.replace(/-/g, " ")}.`,
    })
    setIsDetailsModalOpen(false)
  }

  const handleFlagForReview = () => {
    if (!selectedTransaction) return

    setTransactions((prevTransactions) =>
      prevTransactions.map((txn) =>
        txn.id === selectedTransaction.id ? { ...txn, status: "flagged" } : txn
      )
    )

    toast({
      title: "Flagged for Review",
      description: "Transaction has been flagged for further review.",
      variant: "destructive",
    })
    setIsDetailsModalOpen(false)
  }

  const handleReconcileAll = () => {
    setTransactions((prevTransactions) =>
      prevTransactions.map((txn) =>
        txn.status === "unreconciled" ? { ...txn, status: "matched" } : txn
      )
    )
    toast({
      title: "All Transactions Reconciled",
      description: "All unreconciled transactions have been matched.",
    })
  }

  const handleEditDetails = () => {
    toast({
      title: "Edit Details",
      description: "Opening editor for transaction details.",
    })
    // TODO: Implement actual edit functionality (e.g., open a modal with editable fields)
  }

  const handleDateRange = () => {
    setIsDateRangeModalOpen(true)
    toast({
      title: "Date Range",
      description: "Opening date range selection.",
    })
  }

  const handleFilter = () => {
    setIsFilterModalOpen(true)
    toast({
      title: "Filter",
      description: "Opening filter options.",
    })
  }

  // Confidence badge component
  const ConfidenceBadge = ({ confidence }: { confidence: number }) => {
    if (confidence >= 90) {
      return <Badge className="bg-green-100 text-green-800">High ({confidence}%)</Badge>
    } else if (confidence >= 70) {
      return <Badge className="bg-amber-100 text-amber-800">Medium ({confidence}%)</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">Low ({confidence}%)</Badge>
    }
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: Transaction["status"] }) => {
    switch (status) {
      case "unreconciled":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800">
            Unreconciled
          </Badge>
        )
      case "matched":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Matched
          </Badge>
        )
      case "flagged":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Flagged
          </Badge>
        )
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
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }: any) => {
        const amount = Number.parseFloat(row.getValue("amount"))
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          signDisplay: "always",
        }).format(amount)
        return <span className={amount < 0 ? "text-red-600" : "text-green-600"}>{formatted}</span>
      },
    },
    {
      accessorKey: "account",
      header: "Bank Account",
    },
    {
      accessorKey: "suggestedGLAccount",
      header: "Suggested GL Account",
    },
    {
      accessorKey: "confidence",
      header: "Confidence",
      cell: ({ row }: any) => {
        return <ConfidenceBadge confidence={row.getValue("confidence")} />
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
            <h1 className="text-2xl font-bold tracking-tight">Bank Reconciliation</h1>
            <p className="text-muted-foreground">Match bank transactions to general ledger accounts</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleDateRange}>
              <Calendar className="mr-2 h-4 w-4" />
              Date Range
            </Button>
            <Button variant="outline" onClick={handleFilter}>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleReconcileAll}>
              <Check className="mr-2 h-4 w-4" />
              Reconcile All
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Unreconciled Transactions</CardTitle>
            <CardDescription>
              Review and match bank transactions to the appropriate general ledger accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={transactions} searchColumn="description" onRowClick={handleRowClick} />
          </CardContent>
        </Card>
      </div>

      {/* Transaction Details Modal */}
      <ModalDialog
        title="Transaction Details"
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        size="lg"
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                <p className="mt-1">{new Date(selectedTransaction.date).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                <p className={`mt-1 ${selectedTransaction.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    signDisplay: "always",
                  }).format(selectedTransaction.amount)}
                </p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1">{selectedTransaction.description}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Bank Account</h3>
                <p className="mt-1">{selectedTransaction.account}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <StatusBadge status={selectedTransaction.status} />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-teal-600 mt-0.5 mr-2" />
                <div>
                  <h3 className="font-medium">AI Suggestion</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Based on transaction patterns and description, this transaction should be categorized as{" "}
                    <span className="font-medium">{selectedTransaction.suggestedGLAccount}</span>. Confidence:{" "}
                    <ConfidenceBadge confidence={selectedTransaction.confidence} />
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Select GL Account</h3>
              <Select value={selectedGLAccount} onValueChange={setSelectedGLAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select GL account" />
                </SelectTrigger>
                <SelectContent>
                  {glAccounts.map((account) => (
                    <SelectItem key={account.value} value={account.value}>
                      {account.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-gray-200 pt-4 flex justify-between">
              <Button
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
                onClick={handleFlagForReview}
              >
                <Flag className="mr-2 h-4 w-4" />
                Flag for Review
              </Button>
              <div className="space-x-2">
                <Button variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50" onClick={handleEditDetails}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Details
                </Button>
                <Button
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={handleApproveMatch}
                  disabled={!selectedGLAccount}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve Match
                </Button>
              </div>
            </div>
          </div>
        )}
      </ModalDialog>

      {/* Date Range Modal */}
      <ModalDialog
        title="Select Date Range"
        description="Choose a date range for transactions."
        isOpen={isDateRangeModalOpen}
        onClose={() => setIsDateRangeModalOpen(false)}
        size="sm"
      >
        <div className="space-y-4">
          <p>Date range selection options would go here.</p>
          <Button onClick={() => setIsDateRangeModalOpen(false)}>Apply</Button>
        </div>
      </ModalDialog>

      {/* Filter Modal */}
      <ModalDialog
        title="Filter Transactions"
        description="Filter transactions by various criteria."
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <p>Filter options (e.g., status, amount range) would go here.</p>
          <Button onClick={() => setIsFilterModalOpen(false)}>Apply Filters</Button>
        </div>
      </ModalDialog>
    </AppShell>
  )
}

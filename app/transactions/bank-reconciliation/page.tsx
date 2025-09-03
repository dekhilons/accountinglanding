"use client"

import { useState, useEffect } from "react"
import { Calendar, Filter, Check, Flag, Edit, AlertCircle, RefreshCw } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { useToast } from "@/hooks/use-toast"

// Define column types for unified transactions
type Transaction = {
  id: string
  type: 'AR_PAYMENT' | 'AP_INVOICE' | 'GL_ENTRY' | 'BANK_TRANSACTION'
  source: string
  date: string
  description: string
  amount: number
  currency: string
  status: string
  entity_name?: string
  reference?: string
  suggestedGLAccount?: string
  confidence?: number
  metadata?: any
}

export default function TransactionsReconciliationPage() {
  const { toast } = useToast()
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedGLAccount, setSelectedGLAccount] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [loading, setLoading] = useState(false)

  // Real transaction data from API
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // GL accounts (would be fetched from API)
  const [glAccounts, setGLAccounts] = useState([
    { value: "cash", label: "Cash" },
    { value: "accounts-receivable", label: "Accounts Receivable" },
    { value: "accounts-payable", label: "Accounts Payable" },
    { value: "sales-revenue", label: "Sales Revenue" },
    { value: "office-expenses", label: "Office Expenses" },
    { value: "it-expenses", label: "IT Expenses" },
    { value: "salaries-wages", label: "Salaries & Wages" },
    { value: "rent", label: "Rent & Facilities" },
    { value: "marketing", label: "Marketing & Advertising" },
    { value: "travel", label: "Travel & Entertainment" },
    { value: "misc-expenses", label: "Miscellaneous Expenses" },
  ])

  // Fetch transactions from API
  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        tenant_id: 'test-tenant',
        ...(selectedType !== 'ALL' && { transaction_type: selectedType })
      })

      const response = await fetch(`http://localhost:8005/api/gl/transactions/unreconciled?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Load transactions on component mount and when type changes
  useEffect(() => {
    fetchTransactions()
  }, [selectedType])

  // Handle row click to show details and get AI suggestions
  const handleRowClick = async (transaction: Transaction) => {
    setSelectedTransaction(transaction)

    // Set default GL account selection
    if (transaction.suggestedGLAccount) {
      setSelectedGLAccount(transaction.suggestedGLAccount.toLowerCase().replace(/\s+/g, "-"))
    } else {
      setSelectedGLAccount("")
    }

    // Get AI reconciliation suggestions if not already present
    if (!transaction.suggestedGLAccount) {
      try {
        const response = await fetch(`http://localhost:8005/api/gl/transactions/${transaction.id}/reconcile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenant_id: 'test-tenant',
            vendor_name: transaction.type === 'AP_INVOICE' ? transaction.entity_name : undefined,
            customer_name: transaction.type === 'AR_PAYMENT' ? transaction.entity_name : undefined
          })
        })

        if (response.ok) {
          const result = await response.json()

          // Update transaction with AI suggestions
          setTransactions(prev => prev.map(t =>
            t.id === transaction.id
              ? {
                  ...t,
                  suggestedGLAccount: result.suggested_gl_account,
                  confidence: result.match_confidence
                }
              : t
          ))

          // Update selected transaction
          setSelectedTransaction(prev => prev ? {
            ...prev,
            suggestedGLAccount: result.suggested_gl_account,
            confidence: result.match_confidence
          } : null)
        }
      } catch (error) {
        console.error('Error getting AI suggestions:', error)
        toast({
          title: "Error",
          description: "Failed to get AI suggestions",
          variant: "destructive"
        })
      }
    }

    setIsDetailsModalOpen(true)
  }

  // Handle reconciliation approval
  const handleApproveMatch = async () => {
    if (!selectedTransaction || !selectedGLAccount) return

    try {
      const selectedAccount = glAccounts.find(acc => acc.value === selectedGLAccount)
      if (!selectedAccount) return

      const response = await fetch(`http://localhost:8005/api/gl/transactions/${selectedTransaction.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_type: selectedTransaction.type,
          gl_account_id: selectedGLAccount,
          gl_account_name: selectedAccount.label
        })
      })

      if (response.ok) {
        // Update local state
        setTransactions(prev => prev.map(txn =>
          txn.id === selectedTransaction.id
            ? { ...txn, status: "reconciled" }
            : txn
        ))

        toast({
          title: "Match Approved",
          description: `Transaction reconciled to ${selectedAccount.label}`,
        })

        setIsDetailsModalOpen(false)
      } else {
        throw new Error('Failed to approve reconciliation')
      }
    } catch (error) {
      console.error('Error approving match:', error)
      toast({
        title: "Error",
        description: "Failed to approve reconciliation",
        variant: "destructive"
      })
    }
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

  const handleBulkReconcile = async () => {
    const selectedTransactions = transactions.filter(t => t.status === "unreconciled")

    if (selectedTransactions.length === 0) {
      toast({
        title: "No Transactions",
        description: "No unreconciled transactions found",
      })
      return
    }

    try {
      const response = await fetch('http://localhost:8005/api/gl/transactions/bulk-reconcile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: 'test-tenant',
          transactions: selectedTransactions.map(t => ({
            transaction_id: t.id,
            transaction_type: t.type,
            vendor_name: t.type === 'AP_INVOICE' ? t.entity_name : undefined,
            customer_name: t.type === 'AR_PAYMENT' ? t.entity_name : undefined
          }))
        })
      })

      if (response.ok) {
        const result = await response.json()

        // Update UI with results
        result.results.forEach((res: any) => {
          if (res.success) {
            setTransactions(prev => prev.map(t =>
              t.id === res.transaction_id
                ? { ...t, status: res.auto_approved ? "reconciled" : "pending_approval" }
                : t
            ))
          }
        })

        const successCount = result.results.filter((r: any) => r.success).length
        toast({
          title: "Bulk Reconciliation Complete",
          description: `${successCount} of ${selectedTransactions.length} transactions processed`,
        })

        // Refresh data
        fetchTransactions()
      }
    } catch (error) {
      console.error('Error in bulk reconciliation:', error)
      toast({
        title: "Error",
        description: "Bulk reconciliation failed",
        variant: "destructive"
      })
    }
  }

  const handleEditDetails = () => {
    toast({
      title: "Edit Details",
      description: "Opening editor for transaction details.",
    })
    // TODO: Implement actual edit functionality
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

  // Transaction type badge component
  const TypeBadge = ({ type }: { type: string }) => {
    const typeConfig = {
      AR_PAYMENT: { label: "AR Payment", color: "bg-green-100 text-green-800" },
      AP_INVOICE: { label: "AP Invoice", color: "bg-red-100 text-red-800" },
      GL_ENTRY: { label: "GL Entry", color: "bg-blue-100 text-blue-800" },
      BANK_TRANSACTION: { label: "Bank", color: "bg-purple-100 text-purple-800" }
    }

    const config = typeConfig[type as keyof typeof typeConfig] || { label: type, color: "bg-gray-100 text-gray-800" }

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  // Confidence badge component
  const ConfidenceBadge = ({ confidence }: { confidence?: number }) => {
    if (!confidence) return null

    if (confidence >= 90) {
      return <Badge className="bg-green-100 text-green-800">High ({confidence}%)</Badge>
    } else if (confidence >= 70) {
      return <Badge className="bg-amber-100 text-amber-800">Medium ({confidence}%)</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">Low ({confidence}%)</Badge>
    }
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "unreconciled":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800">
            Unreconciled
          </Badge>
        )
      case "reconciled":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Reconciled
          </Badge>
        )
      case "flagged":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Flagged
          </Badge>
        )
      case "pending_approval":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending Approval
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            {status}
          </Badge>
        )
    }
  }

  // Table columns for unified transactions
  const columns = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: any) => {
        return <TypeBadge type={row.getValue("type")} />
      },
    },
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
      accessorKey: "entity_name",
      header: "Entity",
      cell: ({ row }: any) => {
        const entityName = row.getValue("entity_name")
        return entityName || "-"
      },
    },
    {
      accessorKey: "source",
      header: "Source",
    },
    {
      accessorKey: "suggestedGLAccount",
      header: "Suggested GL Account",
      cell: ({ row }: any) => {
        const suggested = row.getValue("suggestedGLAccount")
        return suggested || "-"
      },
    },
    {
      accessorKey: "confidence",
      header: "Confidence",
      cell: ({ row }: any) => {
        const confidence = row.getValue("confidence")
        return confidence ? <ConfidenceBadge confidence={confidence} /> : "-"
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
            <h1 className="text-2xl font-bold tracking-tight">Transactions Reconciliation</h1>
            <p className="text-muted-foreground">Reconcile all incoming and outgoing transactions across AR, AP, and GL services</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="AR_PAYMENT">AR Payments</SelectItem>
                <SelectItem value="AP_INVOICE">AP Invoices</SelectItem>
                <SelectItem value="GL_ENTRY">GL Entries</SelectItem>
                <SelectItem value="BANK_TRANSACTION">Bank Transactions</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleDateRange}>
              <Calendar className="mr-2 h-4 w-4" />
              Date Range
            </Button>
            <Button variant="outline" onClick={handleFilter}>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" onClick={fetchTransactions} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleBulkReconcile}>
              <Check className="mr-2 h-4 w-4" />
              Bulk Reconcile
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Unreconciled Transactions</CardTitle>
            <CardDescription>
              Review and reconcile all transactions from Accounts Receivable, Accounts Payable, and General Ledger services
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Loading transactions...</span>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={transactions}
                searchColumn="description"
                onRowClick={handleRowClick}
              />
            )}
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
            {/* Transaction Type Indicator */}
            <div className="flex items-center gap-2">
              <TypeBadge type={selectedTransaction.type} />
              <span className="text-sm text-gray-500">
                from {selectedTransaction.source}
              </span>
            </div>

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
                    currency: selectedTransaction.currency,
                    signDisplay: "always",
                  }).format(selectedTransaction.amount)}
                </p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1">{selectedTransaction.description}</p>
              </div>
              {selectedTransaction.entity_name && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    {selectedTransaction.type === 'AR_PAYMENT' ? 'Customer' : 'Vendor'}
                  </h3>
                  <p className="mt-1">{selectedTransaction.entity_name}</p>
                </div>
              )}
              {selectedTransaction.reference && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Reference</h3>
                  <p className="mt-1">{selectedTransaction.reference}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <StatusBadge status={selectedTransaction.status} />
                </div>
              </div>
            </div>

            {/* AI Suggestions */}
            {selectedTransaction.suggestedGLAccount && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-teal-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-medium">AI Suggestion</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Based on transaction patterns and description, this transaction should be categorized as{" "}
                      <span className="font-medium">{selectedTransaction.suggestedGLAccount}</span>.
                      {selectedTransaction.confidence && (
                        <>
                          {" "}Confidence: <ConfidenceBadge confidence={selectedTransaction.confidence} />
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* GL Account Selection */}
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

            {/* Action Buttons */}
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
                  Approve Reconciliation
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

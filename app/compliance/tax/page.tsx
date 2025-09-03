"use client"

import { useState } from "react"
import { Filter, Download, AlertCircle } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useTaxEntries, useTaxCodes, TaxEntry, TaxCode, formatCurrency, formatDate, getStatusColor, getConfidenceColor } from "@/lib/tax-api"

// Define column types for DataTable compatibility
type TaxTransaction = {
  id: string
  date: string
  description: string
  amount: number
  vendor: string
  category: string
  taxCode: string
  status: "pending" | "approved" | "flagged"
}

export default function TaxCompliancePage() {
  const { toast } = useToast()
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<TaxEntry | null>(null)
  const [selectedTaxCode, setSelectedTaxCode] = useState<string>("")

  // Use API hooks
  const { taxEntries, loading: entriesLoading, error: entriesError, updateStatus } = useTaxEntries()
  const { taxCodes, loading: codesLoading, error: codesError } = useTaxCodes()

  // Convert TaxEntry to TaxTransaction format for compatibility
  const taxTransactions: TaxTransaction[] = taxEntries.map(entry => ({
    id: entry.entry_id,
    date: entry.created_at,
    description: `Transaction ${entry.txn_id}`,
    amount: entry.amount,
    vendor: entry.vendor_customer_id || "Unknown Vendor",
    category: entry.account_code,
    taxCode: entry.tax_code,
    status: entry.status === "PENDING_APPROVAL" ? "pending" :
            entry.status === "APPLIED" ? "approved" : "flagged"
  }))

  // Handle row click to show details
  const handleRowClick = (transaction: TaxTransaction) => {
    // Find the corresponding TaxEntry
    const entry = taxEntries.find(e => e.entry_id === transaction.id)
    if (entry) {
      setSelectedEntry(entry)
      setSelectedTaxCode(entry.tax_code)
      setIsDetailsModalOpen(true)
    }
  }

  // Handle approve tax code
  const handleApproveTaxCode = async () => {
    if (!selectedEntry || !selectedTaxCode) {
      toast({
        title: "Validation Error",
        description: "Please select a tax code before approving.",
        variant: "destructive",
      })
      return
    }

    // Business logic validation
    if (selectedEntry.status === "APPLIED") {
      toast({
        title: "Validation Error",
        description: "This tax entry has already been applied.",
        variant: "destructive",
      })
      return
    }

    if (selectedEntry.status === "REJECTED") {
      toast({
        title: "Validation Error",
        description: "Cannot approve a rejected tax entry.",
        variant: "destructive",
      })
      return
    }

    try {
      await updateStatus(selectedEntry.entry_id, "APPLIED")
      toast({
        title: "Tax Code Approved",
        description: `Tax code ${selectedTaxCode} has been assigned to transaction ${selectedEntry.txn_id}.`,
      })
      setIsDetailsModalOpen(false)
      setSelectedEntry(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve tax code. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: TaxTransaction["status"] }) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "flagged":
        return <Badge className="bg-red-100 text-red-800">Flagged</Badge>
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
        return formatDate(row.getValue("date"))
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
        return formatCurrency(Number.parseFloat(row.getValue("amount")))
      },
    },
    {
      accessorKey: "vendor",
      header: "Vendor",
    },
    {
      accessorKey: "category",
      header: "Account Code",
    },
    {
      accessorKey: "taxCode",
      header: "Tax Code",
      cell: ({ row }: any) => {
        const taxCode = row.getValue("taxCode")
        return <Badge className={getStatusColor("pending")}>{taxCode}</Badge>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.getValue("status")
        return <Badge className={getStatusColor(status)}>{status.replace('_', ' ')}</Badge>
      },
    },
  ]

  // Show loading state
  if (entriesLoading || codesLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tax & Compliance</h1>
              <p className="text-muted-foreground">Manage tax codes and ensure compliance with tax regulations</p>
            </div>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading tax entries...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  // Show error state
  if (entriesError || codesError) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tax & Compliance</h1>
              <p className="text-muted-foreground">Manage tax codes and ensure compliance with tax regulations</p>
            </div>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-600">
                  {entriesError?.message || codesError?.message || "Failed to load data"}
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4"
                  variant="outline"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tax & Compliance</h1>
            <p className="text-muted-foreground">Manage tax codes and ensure compliance with tax regulations</p>
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

        {/* Tax Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Code Assignment</CardTitle>
            <CardDescription>Review and assign tax codes to transactions ({taxEntries.length} entries)</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={taxTransactions}
              searchColumn="description"
              onRowClick={handleRowClick}
            />
          </CardContent>
        </Card>
      </div>

      {/* Transaction Details Modal */}
      <ModalDialog
        title="Assign Tax Code"
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onConfirm={handleApproveTaxCode}
        confirmText="Approve Tax Code"
        cancelText="Cancel"
        size="lg"
      >
        {selectedEntry && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                <p className="mt-1">{formatDate(selectedEntry.created_at)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                <p className="mt-1">{formatCurrency(selectedEntry.amount)}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Transaction ID</h3>
                <p className="mt-1">{selectedEntry.txn_id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Vendor/Customer</h3>
                <p className="mt-1">{selectedEntry.vendor_customer_id || "N/A"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Account Code</h3>
                <p className="mt-1">{selectedEntry.account_code}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Current Tax Code</h3>
                <div className="mt-1">
                  <Badge className={getStatusColor(selectedEntry.status)}>
                    {selectedEntry.tax_code}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Confidence</h3>
                <div className="mt-1">
                  <span className={getConfidenceColor(selectedEntry.confidence)}>
                    {(selectedEntry.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <Badge className={getStatusColor(selectedEntry.status)}>
                    {selectedEntry.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Region</h3>
                <p className="mt-1">{selectedEntry.region}</p>
              </div>
            </div>

            {selectedEntry.status === "PENDING_APPROVAL" && selectedEntry.confidence < 0.85 && (
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-medium text-amber-800">Low Confidence</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        This tax code assignment has low confidence and requires manual review.
                        Please verify the tax code is correct before approving.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Assign Tax Code</h3>
              <Select value={selectedTaxCode} onValueChange={setSelectedTaxCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tax code" />
                </SelectTrigger>
                <SelectContent>
                  {taxCodes.map((code) => (
                    <SelectItem key={code.value} value={code.value}>
                      {code.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTaxCode === "EXP-ENT" && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
                  <p className="text-sm text-amber-700">
                    <strong>Note:</strong> Entertainment expenses are only 50% deductible for tax purposes. Please
                    ensure proper documentation is attached.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </ModalDialog>
    </AppShell>
  )
}

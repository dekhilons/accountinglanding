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

// Define column types
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
  const [selectedTransaction, setSelectedTransaction] = useState<TaxTransaction | null>(null)
  const [selectedTaxCode, setSelectedTaxCode] = useState<string>("")

  // Sample data for tax transactions
  const taxTransactions: TaxTransaction[] = [
    {
      id: "tx-1001",
      date: "2024-05-20",
      description: "Office Supplies Purchase",
      amount: 1250.0,
      vendor: "Office Supplies Inc.",
      category: "Office Expenses",
      taxCode: "EXP-GEN",
      status: "pending",
    },
    {
      id: "tx-1002",
      date: "2024-05-18",
      description: "Software License Renewal",
      amount: 5000.0,
      vendor: "Tech Solutions Ltd.",
      category: "Software Expenses",
      taxCode: "EXP-TECH",
      status: "pending",
    },
    {
      id: "tx-1003",
      date: "2024-05-15",
      description: "Client Entertainment",
      amount: 350.75,
      vendor: "Fine Dining Restaurant",
      category: "Entertainment",
      taxCode: "EXP-ENT",
      status: "flagged",
    },
    {
      id: "tx-1004",
      date: "2024-05-12",
      description: "Marketing Services",
      amount: 7500.0,
      vendor: "Marketing Agency Co.",
      category: "Marketing Expenses",
      taxCode: "EXP-MKT",
      status: "approved",
    },
    {
      id: "tx-1005",
      date: "2024-05-10",
      description: "International Vendor Payment",
      amount: 12500.0,
      vendor: "Global Suppliers Ltd.",
      category: "Inventory",
      taxCode: "PENDING",
      status: "pending",
    },
  ]

  // Sample tax codes
  const taxCodes = [
    { value: "EXP-GEN", label: "General Expenses (Fully Deductible)" },
    { value: "EXP-TECH", label: "Technology Expenses (Fully Deductible)" },
    { value: "EXP-MKT", label: "Marketing Expenses (Fully Deductible)" },
    { value: "EXP-ENT", label: "Entertainment (50% Deductible)" },
    { value: "EXP-MEAL", label: "Meals (50% Deductible)" },
    { value: "EXP-TRVL", label: "Travel Expenses (Fully Deductible)" },
    { value: "CAP-ASSET", label: "Capital Asset (Depreciable)" },
    { value: "NON-DED", label: "Non-Deductible Expense" },
  ]

  // Handle row click to show details
  const handleRowClick = (transaction: TaxTransaction) => {
    setSelectedTransaction(transaction)
    setSelectedTaxCode(transaction.taxCode !== "PENDING" ? transaction.taxCode : "")
    setIsDetailsModalOpen(true)
  }

  // Handle approve tax code
  const handleApproveTaxCode = () => {
    if (!selectedTransaction || !selectedTaxCode) return

    toast({
      title: "Tax Code Approved",
      description: `Tax code ${selectedTaxCode} has been assigned to transaction ${selectedTransaction.id}.`,
    })
    setIsDetailsModalOpen(false)
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
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
      },
    },
    {
      accessorKey: "vendor",
      header: "Vendor",
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "taxCode",
      header: "Tax Code",
      cell: ({ row }: any) => {
        const taxCode = row.getValue("taxCode")
        return taxCode === "PENDING" ? <Badge className="bg-amber-100 text-amber-800">Pending</Badge> : taxCode
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
            <CardDescription>Review and assign tax codes to transactions</CardDescription>
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
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                <p className="mt-1">{new Date(selectedTransaction.date).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                <p className="mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(selectedTransaction.amount)}
                </p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1">{selectedTransaction.description}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Vendor</h3>
                <p className="mt-1">{selectedTransaction.vendor}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="mt-1">{selectedTransaction.category}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Current Tax Code</h3>
                <div className="mt-1">
                  {selectedTransaction.taxCode === "PENDING" ? (
                    <Badge className="bg-amber-100 text-amber-800">Pending Assignment</Badge>
                  ) : (
                    selectedTransaction.taxCode
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <StatusBadge status={selectedTransaction.status} />
                </div>
              </div>
            </div>

            {selectedTransaction.status === "flagged" && (
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-medium text-red-800">Compliance Flag</h3>
                      <p className="text-sm text-red-700 mt-1">
                        This transaction has been flagged for review due to potential entertainment expense
                        restrictions. Please ensure proper documentation is attached and the correct tax code is
                        assigned.
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

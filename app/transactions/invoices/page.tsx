"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Check, Filter, Download, Upload, Clock, CheckCircle, XCircle, DollarSign, Receipt } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { FileUploader } from "@/components/ui/file-uploader"
import { ApprovalCard } from "@/components/ui/approval-card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// Define column types
type Invoice = {
  id: string
  invoiceNumber: string
  vendor: string
  amount: number
  currency: string
  date: string
  dueDate: string
  status: "pending" | "approved" | "rejected" | "paid"
  type: "ap" | "ar"
}

export default function InvoicesPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("all")
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateRange, setDateRange] = useState("all")

  // Set initial tab based on URL parameter
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "ap" || tab === "ar") {
      setActiveTab(tab)
      setTypeFilter(tab)
    }
  }, [searchParams])

  // Sample data
  const invoices: Invoice[] = [
    {
      id: "inv-1234",
      invoiceNumber: "INV-1234",
      vendor: "Office Supplies Inc.",
      amount: 1250.0,
      currency: "USD",
      date: "2024-05-15",
      dueDate: "2024-06-15",
      status: "pending",
      type: "ap",
    },
    {
      id: "inv-1235",
      invoiceNumber: "INV-1235",
      vendor: "Tech Solutions Ltd.",
      amount: 3450.75,
      currency: "USD",
      date: "2024-05-12",
      dueDate: "2024-06-12",
      status: "approved",
      type: "ap",
    },
    {
      id: "inv-1236",
      invoiceNumber: "INV-1236",
      vendor: "Marketing Agency Co.",
      amount: 5000.0,
      currency: "USD",
      date: "2024-05-10",
      dueDate: "2024-06-10",
      status: "paid",
      type: "ap",
    },
    {
      id: "rec-4567",
      invoiceNumber: "REC-4567",
      vendor: "Client XYZ Corp",
      amount: 7500.0,
      currency: "USD",
      date: "2024-05-14",
      dueDate: "2024-06-14",
      status: "pending",
      type: "ar",
    },
    {
      id: "rec-4568",
      invoiceNumber: "REC-4568",
      vendor: "Customer ABC Inc.",
      amount: 12000.0,
      currency: "USD",
      date: "2024-05-08",
      dueDate: "2024-06-08",
      status: "paid",
      type: "ar",
    },
    {
      id: "inv-1237",
      invoiceNumber: "INV-1237",
      vendor: "Utilities Company",
      amount: 850.0,
      currency: "USD",
      date: "2024-05-16",
      dueDate: "2024-06-16",
      status: "approved",
      type: "ap",
    },
    {
      id: "rec-4569",
      invoiceNumber: "REC-4569",
      vendor: "Enterprise Client Ltd.",
      amount: 25000.0,
      currency: "USD",
      date: "2024-05-13",
      dueDate: "2024-06-13",
      status: "approved",
      type: "ar",
    },
  ]

  // Filter invoices based on active tab and filters
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && invoice.status === "pending") ||
      (activeTab === "ap" && invoice.type === "ap") ||
      (activeTab === "ar" && invoice.type === "ar")

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    const matchesType = typeFilter === "all" || invoice.type === typeFilter

    return matchesTab && matchesStatus && matchesType
  })

  // Get summary statistics
  const getSummaryStats = () => {
    const apInvoices = invoices.filter((inv) => inv.type === "ap")
    const arInvoices = invoices.filter((inv) => inv.type === "ar")

    return {
      totalAP: apInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      totalAR: arInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      pendingAP: apInvoices.filter((inv) => inv.status === "pending").length,
      pendingAR: arInvoices.filter((inv) => inv.status === "pending").length,
      totalPending: invoices.filter((inv) => inv.status === "pending").length,
    }
  }

  const stats = getSummaryStats()

  // Document types for uploader
  const documentTypes = [
    { value: "AP_INVOICE", label: "AP Invoice" },
    { value: "AR_RECEIPT", label: "AR Receipt" },
    { value: "EXPENSE_REPORT", label: "Expense Report" },
    { value: "PURCHASE_ORDER", label: "Purchase Order" },
  ]

  // Handle file upload
  const handleUpload = async (file: File, documentType: string) => {
    // Simulate API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded as ${documentType}.`,
        })
        resolve()
      }, 2000)
    })
  }

  // Handle export
  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your invoice data is being exported. You'll receive a download link shortly.",
    })
  }

  // Handle filter application
  const handleApplyFilters = () => {
    setIsFilterModalOpen(false)
    toast({
      title: "Filters Applied",
      description: "Invoice list has been updated with your filter criteria.",
    })
  }

  // Handle clear filters
  const handleClearFilters = () => {
    setStatusFilter("all")
    setTypeFilter("all")
    setDateRange("all")
    toast({
      title: "Filters Cleared",
      description: "All filters have been reset.",
    })
  }

  // Handle row click to show details
  const handleRowClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsDetailsModalOpen(true)
  }

  // Handle approval actions
  const handleApprove = (id: string) => {
    toast({
      title: "Invoice Approved",
      description: `Invoice ${id} has been approved.`,
    })
    setIsDetailsModalOpen(false)
  }

  const handleReject = (id: string, reason?: string) => {
    toast({
      title: "Invoice Rejected",
      description: reason ? `Reason: ${reason}` : "Invoice has been rejected.",
      variant: "destructive",
    })
    setIsDetailsModalOpen(false)
  }

  const handleEdit = (id: string) => {
    toast({
      title: "Edit mode",
      description: "Opening invoice editor.",
    })
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: Invoice["status"] }) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case "paid":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            <Check className="mr-1 h-3 w-3" />
            Paid
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  // Table columns
  const columns = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
    },
    {
      accessorKey: "vendor",
      header: "Vendor/Customer",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }: any) => {
        const amount = Number.parseFloat(row.getValue("amount"))
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: row.original.currency,
        }).format(amount)
        return formatted
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
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }: any) => {
        return new Date(row.getValue("dueDate")).toLocaleDateString()
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: any) => {
        const type = row.getValue("type")
        return (
          <Badge variant="outline" className={type === "ap" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}>
            {type === "ap" ? "Payable" : "Receivable"}
          </Badge>
        )
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
            <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">Manage accounts payable and receivable invoices</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsFilterModalOpen(true)}>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total AP</p>
                  <p className="text-2xl font-bold">${stats.totalAP.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total AR</p>
                  <p className="text-2xl font-bold">${stats.totalAR.toLocaleString()}</p>
                </div>
                <Receipt className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending AP</p>
                  <p className="text-2xl font-bold">{stats.pendingAP}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending AR</p>
                  <p className="text-2xl font-bold">{stats.pendingAR}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Invoice Management</CardTitle>
            <CardDescription>View, approve, and manage all invoices and receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Invoices</TabsTrigger>
                <TabsTrigger value="pending">
                  Pending Approval
                  <Badge className="ml-2 bg-amber-500">{stats.totalPending}</Badge>
                </TabsTrigger>
                <TabsTrigger value="ap">
                  Accounts Payable
                  <Badge className="ml-2 bg-red-500">{invoices.filter((i) => i.type === "ap").length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="ar">
                  Accounts Receivable
                  <Badge className="ml-2 bg-green-500">{invoices.filter((i) => i.type === "ar").length}</Badge>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="m-0">
                <DataTable
                  columns={columns}
                  data={filteredInvoices}
                  searchColumn="vendor"
                  onRowClick={handleRowClick}
                />
              </TabsContent>
              <TabsContent value="pending" className="m-0">
                <DataTable
                  columns={columns}
                  data={filteredInvoices}
                  searchColumn="vendor"
                  onRowClick={handleRowClick}
                />
              </TabsContent>
              <TabsContent value="ap" className="m-0">
                <DataTable
                  columns={columns}
                  data={filteredInvoices}
                  searchColumn="vendor"
                  onRowClick={handleRowClick}
                />
              </TabsContent>
              <TabsContent value="ar" className="m-0">
                <DataTable
                  columns={columns}
                  data={filteredInvoices}
                  searchColumn="vendor"
                  onRowClick={handleRowClick}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      <ModalDialog
        title="Upload Invoice or Receipt"
        description="Upload a new invoice or receipt for processing"
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      >
        <FileUploader documentTypes={documentTypes} onUpload={handleUpload} />
      </ModalDialog>

      {/* Filter Modal */}
      <ModalDialog
        title="Filter Invoices"
        description="Apply filters to narrow down the invoice list"
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="ap">Accounts Payable</SelectItem>
                <SelectItem value="ar">Accounts Receivable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="quarter">This quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
            <Button onClick={handleApplyFilters} className="bg-teal-600 hover:bg-teal-700">
              Apply Filters
            </Button>
          </div>
        </div>
      </ModalDialog>

      {/* Invoice Details Modal */}
      <ModalDialog
        title={`Invoice Details: ${selectedInvoice?.invoiceNumber}`}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Vendor/Customer</h3>
                <p className="mt-1">{selectedInvoice.vendor}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                <p className="mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: selectedInvoice.currency,
                  }).format(selectedInvoice.amount)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Invoice Date</h3>
                <p className="mt-1">{new Date(selectedInvoice.date).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                <p className="mt-1">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type</h3>
                <p className="mt-1">{selectedInvoice.type === "ap" ? "Accounts Payable" : "Accounts Receivable"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <StatusBadge status={selectedInvoice.status} />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Line Items</h3>
              <div className="bg-gray-50 rounded-md p-3">
                <div className="grid grid-cols-3 gap-2 text-sm font-medium text-gray-500 mb-2">
                  <div>Description</div>
                  <div>Quantity</div>
                  <div>Amount</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>Office Supplies</div>
                  <div>10</div>
                  <div>$500.00</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>Software Licenses</div>
                  <div>5</div>
                  <div>$750.00</div>
                </div>
              </div>
            </div>

            {selectedInvoice.status === "pending" && (
              <div className="border-t border-gray-200 pt-4">
                <ApprovalCard
                  id={selectedInvoice.id}
                  title={`Approve ${selectedInvoice.type === "ap" ? "Payment" : "Receipt"}`}
                  description={`${selectedInvoice.invoiceNumber} - ${selectedInvoice.vendor}`}
                  confidence={92}
                  rationale="This invoice has been processed by our AI system. All line items match expected categories and pricing. The vendor information has been verified against our records."
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={handleEdit}
                />
              </div>
            )}
          </div>
        )}
      </ModalDialog>
    </AppShell>
  )
}

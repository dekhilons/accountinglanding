"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Check, Filter, Download, Upload, Clock, CheckCircle, XCircle, DollarSign, Receipt, Loader2 } from "lucide-react"
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
import { useSalesOrders, SalesOrder } from "@/lib/ar-api" // Import useSalesOrders and SalesOrder

// Define column types
type Invoice = {
  id: string
  invoiceNumber: string
  vendor: string
  amount: number
  currency: string
  date: string
  dueDate: string
  status: "pending" | "approved" | "rejected" | "paid" | "open" | "fulfilled" | "cancelled" // Added sales order statuses
  type: "ap" | "ar" | "so" // Added 'so' for sales order
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

  // Hardcoded tenant_id for now, replace with dynamic value if available
  const TENANT_ID = "test-tenant" 

  // Fetch sales orders using the hook
  const { orders: salesOrders, loading: loadingSalesOrders, error: salesOrdersError } = useSalesOrders(TENANT_ID)

  // Set initial tab based on URL parameter
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "ap" || tab === "ar" || tab === "so") { // Added 'so' tab
      setActiveTab(tab)
      setTypeFilter(tab)
    }
  }, [searchParams])

  // Sample data (will be combined with fetched data)
  const sampleInvoices: Invoice[] = [
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
  ]

  // Combine sample invoices with fetched sales orders
  const allInvoices: Invoice[] = useMemo(() => {
    const mappedSalesOrders: Invoice[] = salesOrders.map((order: SalesOrder) => ({
      id: order.id,
      invoiceNumber: order.order_number,
      vendor: `Customer: ${order.customer_id}`, // Placeholder, ideally resolve customer name
      amount: order.total_amount,
      currency: order.currency,
      date: order.order_date,
      dueDate: order.order_date, // Using order_date as dueDate for simplicity
      status: order.status.toLowerCase() as Invoice["status"], // Map sales order status to invoice status
      type: "so", // Mark as sales order
    }))

    return [...sampleInvoices, ...mappedSalesOrders]
  }, [salesOrders, sampleInvoices]) // Depend on salesOrders and sampleInvoices

  // Filter invoices based on active tab and filters
  const filteredInvoices = allInvoices.filter((invoice: Invoice) => { // Explicitly type invoice
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && invoice.status === "pending") ||
      (activeTab === "ap" && invoice.type === "ap") ||
      (activeTab === "ar" && invoice.type === "ar") ||
      (activeTab === "so" && invoice.type === "so") // Filter for sales orders

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    const matchesType = typeFilter === "all" || invoice.type === typeFilter

    return matchesTab && matchesStatus && matchesType
  })

  // Get summary statistics
  const getSummaryStats = () => {
    const apInvoices = allInvoices.filter((inv: Invoice) => inv.type === "ap") // Explicitly type inv
    const arInvoices = allInvoices.filter((inv: Invoice) => inv.type === "ar") // Explicitly type inv
    const soInvoices = allInvoices.filter((inv: Invoice) => inv.type === "so") // Explicitly type inv

    return {
      totalAP: apInvoices.reduce((sum: number, inv: Invoice) => sum + inv.amount, 0), // Explicitly type sum and inv
      totalAR: arInvoices.reduce((sum: number, inv: Invoice) => sum + inv.amount, 0), // Explicitly type sum and inv
      totalSO: soInvoices.reduce((sum: number, inv: Invoice) => sum + inv.amount, 0), // Explicitly type sum and inv
      pendingAP: apInvoices.filter((inv: Invoice) => inv.status === "pending").length, // Explicitly type inv
      pendingAR: arInvoices.filter((inv: Invoice) => inv.status === "pending").length, // Explicitly type inv
      pendingSO: soInvoices.filter((inv: Invoice) => inv.status === "pending" || inv.status === "open").length, // Sales orders might have 'open' status, Explicitly type inv
      totalPending: allInvoices.filter((inv: Invoice) => inv.status === "pending" || inv.status === "open").length, // Explicitly type inv
    }
  }

  const stats = getSummaryStats()

  // Handle sales orders fetch error
  useEffect(() => {
    if (salesOrdersError) {
      toast({
        title: "Error fetching sales orders",
        description: salesOrdersError.message,
        variant: "destructive",
      })
    }
  }, [salesOrdersError, toast])

  // Document types for uploader
  const documentTypes = [
    { value: "AP_INVOICE", label: "AP Invoice" },
    { value: "AR_RECEIPT", label: "AR Receipt" },
    { value: "EXPENSE_REPORT", label: "Expense Report" },
    { value: "PURCHASE_ORDER", label: "Purchase Order" },
    { value: "SALES_ORDER", label: "Sales Order" }, // Added Sales Order
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
      case "open": // Added for Sales Orders
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <Clock className="mr-1 h-3 w-3" />
            {status === "pending" ? "Pending" : "Open"}
          </Badge>
        )
      case "approved":
      case "fulfilled": // Added for Sales Orders
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            {status === "approved" ? "Approved" : "Fulfilled"}
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
      case "cancelled": // Added for Sales Orders
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="mr-1 h-3 w-3" />
            {status === "rejected" ? "Rejected" : "Cancelled"}
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
      header: "Document #", // Changed to be more generic
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
        let badgeText = ""
        let badgeClass = ""
        if (type === "ap") {
          badgeText = "Payable"
          badgeClass = "bg-red-50 text-red-700"
        } else if (type === "ar") {
          badgeText = "Receivable"
          badgeClass = "bg-green-50 text-green-700"
        } else if (type === "so") {
          badgeText = "Sales Order"
          badgeClass = "bg-blue-50 text-blue-700"
        }
        return (
          <Badge variant="outline" className={badgeClass}>
            {badgeText}
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
            <h1 className="text-2xl font-bold tracking-tight">Documents</h1> {/* Changed title */}
            <p className="text-muted-foreground">Manage accounts payable, receivable, and sales orders</p> {/* Updated description */}
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
                  <p className="text-sm text-gray-500">Total Sales Orders</p> {/* New card for Sales Orders */}
                  <p className="text-2xl font-bold">${stats.totalSO.toLocaleString()}</p>
                </div>
                <Receipt className="h-8 w-8 text-blue-500" /> {/* Different icon/color for SO */}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Pending</p> {/* Combined pending */}
                  <p className="text-2xl font-bold">{stats.totalPending}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Document Management</CardTitle> {/* Changed title */}
            <CardDescription>View, approve, and manage all financial documents</CardDescription> {/* Updated description */}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Documents</TabsTrigger> {/* Changed text */}
                <TabsTrigger value="pending">
                  Pending Approval
                  <Badge className="ml-2 bg-amber-500">{stats.totalPending}</Badge>
                </TabsTrigger>
                <TabsTrigger value="ap">
                  Accounts Payable
                  <Badge className="ml-2 bg-red-500">{allInvoices.filter((i) => i.type === "ap").length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="ar">
                  Accounts Receivable
                  <Badge className="ml-2 bg-green-500">{allInvoices.filter((i) => i.type === "ar").length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="so"> {/* New tab for Sales Orders */}
                  Sales Orders
                  <Badge className="ml-2 bg-blue-500">{allInvoices.filter((i) => i.type === "so").length}</Badge>
                </TabsTrigger>
              </TabsList>
              {loadingSalesOrders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Loading sales orders...
                </div>
              ) : (
                <>
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
                  <TabsContent value="so" className="m-0"> {/* New tab content for Sales Orders */}
                    <DataTable
                      columns={columns}
                      data={filteredInvoices}
                      searchColumn="vendor"
                      onRowClick={handleRowClick}
                    />
                  </TabsContent>
                </>
              )}
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
                <SelectItem value="cancelled">Cancelled</SelectItem>
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

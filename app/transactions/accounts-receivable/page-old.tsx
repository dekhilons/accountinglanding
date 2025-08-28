"use client"

import { useState } from "react"
import {
  Check,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Receipt,
  AlertTriangle,
  Eye,
  MessageSquare,
  Send,
  Upload,
  X,
  CreditCard,
  Mail,
  PlusCircle,
  Loader2
} from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  useCustomers,
  useInvoices,
  usePayments,
  useAgingReports,
  useCollections,
  useCreditManagement,
  useSalesOrders,
  customerAPI,
  invoiceAPI,
  paymentAPI,
  agingAPI,
  collectionsAPI,
  creditAPI,
  salesOrdersAPI,
  formatCurrency,
  formatDate,
  getStatusColor,
  calculateDaysOverdue,
  type Customer,
  type Invoice,
  type Payment,
  type CustomerCreate,
  type InvoiceCreate,
  type PaymentCreate,
  type AgingReport,
  type CollectionCase,
  type CollectionActivity,
  type PaymentPlan,
  type CreditLimit,
  type CreditAssessment,
  type SalesOrder,
  type SalesOrderCreate,
  type CreditDecisionRequest,
  type InvoiceGenerationRequest,
  type CollectionCaseCreate,
  type CollectionActivityCreate,
  type PaymentPlanCreate,
  type CreditLimitUpdate,
  type CreditAssessmentRequest
} from "@/lib/ar-api"

// Type aliases for backward compatibility
type ARPayment = Payment & {
  paymentId: string;
  customer: string;
  datePaid: string;
  matched: "full" | "partial" | "none";
  confidence: number;
  appliedAmount?: number;
  remainingAmount?: number;
}

type ARRemittance = Payment & {
  remitId: string;
  customer: string;
  dateReceived: string;
  matched: boolean;
  fileType: "email" | "bank-feed" | "manual";
}

type CustomerResponse = Customer;
type CustomerView = "list" | "create" | "details" | "edit";
type InvoiceResponse = Invoice;
type InvoiceView = "list" | "create" | "details" | "edit";

export default function AccountsReceivablePage() {
   const { toast } = useToast()

   // Component state
   const [activeTab, setActiveTab] = useState("payments")
   const [selectedItem, setSelectedItem] = useState<Payment | ARRemittance | null>(null)
   const [showDetailPanel, setShowDetailPanel] = useState(false)
   const [isSubmitPaymentModalOpen, setIsSubmitPaymentModalOpen] = useState(false)
   const [isUploading, setIsUploading] = useState(false)

   // Form states
   const [newPayment, setNewPayment] = useState<PaymentCreate>({
     tenant_id: "",
     customer_id: "",
     payment_number: "",
     amount: 0,
     currency: "USD",
     payment_date: new Date().toISOString().split("T")[0],
     payment_method: "WIRE",
     reference_number: "",
     description: "",
   })

   // Filter states
   const [paymentDateRange, setPaymentDateRange] = useState("all")
   const [paymentCustomer, setPaymentCustomer] = useState("all")
   const [paymentStatus, setPaymentStatus] = useState("all")
   const [remittanceDateRange, setRemittanceDateRange] = useState("all")
   const [remittanceCustomer, setRemittanceCustomer] = useState("all")
   const [remittanceFileType, setRemittanceFileType] = useState("all")

   // Customer management states
   const [customerView, setCustomerView] = useState<CustomerView>("list")
   const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
   const [newCustomer, setNewCustomer] = useState<CustomerCreate>({
     customer_number: "",
     name: "",
     address: "",
     contact_email: "",
     contact_phone: "",
     payment_terms: 30,
     credit_limit: 0,
     is_active: true,
     tenant_id: "",
     additional_metadata: {},
   })
   const [customerSearchTerm, setCustomerSearchTerm] = useState("")

   // Invoice management states
   const [invoiceView, setInvoiceView] = useState<InvoiceView>("list")
   const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
   const [newInvoice, setNewInvoice] = useState<InvoiceCreate>({
     invoice_number: "",
     customer_id: "",
     amount: 0,
     tax_amount: 0,
     currency: "USD",
     issue_date: new Date().toISOString().split("T")[0],
     due_date: new Date().toISOString().split("T")[0],
     tenant_id: "",
     metadata: {},
   })
   const [invoiceSearchTerm, setInvoiceSearchTerm] = useState("")
   const [invoiceFilterCustomer, setInvoiceFilterCustomer] = useState("all")
   const [invoiceFilterStatus, setInvoiceFilterStatus] = useState("all")

   // Aging Reports state
   const [agingCustomerFilter, setAgingCustomerFilter] = useState("all")

   // Collections state
   const [collectionView, setCollectionView] = useState<"cases" | "activities" | "plans">("cases")
   const [selectedCase, setSelectedCase] = useState<CollectionCase | null>(null)
   const [newCollectionCase, setNewCollectionCase] = useState<CollectionCaseCreate>({
     customer_id: "",
     priority: "MEDIUM",
     notes: "",
   })
   const [newActivity, setNewActivity] = useState<CollectionActivityCreate>({
     activity_type: "",
     description: "",
     outcome: "",
     next_action: "",
     next_action_date: "",
     amount_discussed: 0,
     amount_promised: 0,
     promise_date: "",
   })
   const [newPaymentPlan, setNewPaymentPlan] = useState<PaymentPlanCreate>({
     total_amount: 0,
     installment_amount: 0,
     installment_frequency: "MONTHLY",
     number_of_installments: 1,
     start_date: new Date().toISOString().split("T")[0],
     end_date: new Date().toISOString().split("T")[0],
   })

   // Credit Management state
   const [creditView, setCreditView] = useState<"limits" | "assessments">("limits")
   const [selectedLimit, setSelectedLimit] = useState<CreditLimit | null>(null)
   const [newCreditLimit, setNewCreditLimit] = useState<CreditLimitUpdate>({
     credit_limit: 0,
     expiry_date: "",
     risk_rating: "",
     notes: "",
   })
   const [newAssessment, setNewAssessment] = useState<CreditAssessmentRequest>({
     assessment_type: "INITIAL",
     requested_amount: 0,
     notes: "",
   })

   // Sales Orders state
   const [salesOrderView, setSalesOrderView] = useState<"list" | "create" | "details">("list")
   const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
   const [newSalesOrder, setNewSalesOrder] = useState<SalesOrderCreate>({
     tenant_id: "",
     customer_id: "",
     order_date: new Date().toISOString().split("T")[0],
     requested_delivery_date: "",
     payment_terms: "Net 30",
     order_lines: [],
     notes: "",
   })
   const [creditDecision, setCreditDecision] = useState<CreditDecisionRequest>({
     decision: "",
     notes: "",
   })
   const [invoiceGeneration, setInvoiceGeneration] = useState<InvoiceGenerationRequest>({
     template_id: "",
     payment_terms: "",
   })

   // API hooks
   const {
     customers,
     loading: customersLoading,
     error: customersError,
     create: createCustomer,
     update: updateCustomer,
     delete: deleteCustomer,
     refetch: refetchCustomers
   } = useCustomers()
 
   const {
     invoices,
     loading: invoicesLoading,
     error: invoicesError,
     create: createInvoice,
     update: updateInvoice,
     delete: deleteInvoice,
     refetch: refetchInvoices
   } = useInvoices()
 
   const {
     payments,
     loading: paymentsLoading,
     error: paymentsError,
     create: createPayment,
     update: updatePayment,
     delete: deletePayment,
     classify: classifyPayment,
     reconcile: reconcilePayment,
     approveMatch: approveMatch,
     reject: rejectPayment,
     applyRemaining: applyRemaining,
     sendReminder: sendReminder,
     refetch: refetchPayments
   } = usePayments()

   // New API hooks
   const {
     agingReport,
     loading: agingLoading,
     error: agingError,
     refetch: refetchAging
   } = useAgingReports("org-abc-123") // Default tenant ID

   const {
     cases: collectionCases,
     loading: collectionsLoading,
     error: collectionsError,
     refetch: refetchCollections,
     createCase: createCollectionCase,
     processOverdue,
     executeDunning
   } = useCollections("org-abc-123") // Default tenant ID

   const {
     creditLimits,
     assessments: creditAssessments,
     loading: creditLoading,
     error: creditError,
     refetchLimits: refetchCreditLimits,
     refetchAssessments: refetchCreditAssessments,
     updateLimit: updateCreditLimit,
     createAssessment: createCreditAssessment,
     reviewLimits
   } = useCreditManagement("org-abc-123") // Default tenant ID

   const {
     orders: salesOrders,
     loading: salesOrdersLoading,
     error: salesOrdersError,
     refetch: refetchSalesOrders,
     create: createSalesOrder,
     makeCreditDecision,
     generateInvoice
   } = useSalesOrders("org-abc-123") // Default tenant ID

   // Mock remittances data for now (since we don't have a remittances API hook)
   const remittances: ARRemittance[] = []

  // Filter functions
  const filteredPayments = payments.filter((payment) => {
    const matchesCustomer = paymentCustomer === "all" || payment.customer_id === paymentCustomer
    const matchesStatus = paymentStatus === "all" || payment.status === paymentStatus

    return matchesCustomer && matchesStatus
  })

  const filteredRemittances = remittances.filter((remittance) => {
    const matchesCustomer = remittanceCustomer === "all" || remittance.customer === remittanceCustomer
    const matchesFileType = remittanceFileType === "all" || remittance.fileType === remittanceFileType

    return matchesCustomer && matchesFileType
  })

  // Customer filter function
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      (customer.customer_number?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ?? false) ||
      (customer.contact_email?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ?? false),
  )

  // Get summary stats
  const getStats = () => {
    const totalPayments = payments.length
    const totalAmount = payments.reduce((sum, pmt) => sum + pmt.amount, 0)
    const reconciledPayments = payments.filter((pmt) => pmt.status === "RECONCILED").length

    return {
      totalPayments,
      pendingPayments: payments.filter((pmt) => pmt.status === "RECEIVED").length,
      totalAmount,
      autoAppliedPayments: reconciledPayments,
      autoApplyRate: Math.round((reconciledPayments / totalPayments) * 100),
    }
  }

  const stats = getStats()

  // Action handlers
  const handleExport = () => {
    // In a real application, this would trigger a backend call to GET /v1/aging
    // and then initiate a file download.
    toast({
      title: "Aging Report Export Initiated",
      description: "Your Accounts Receivable aging report is being generated and will download shortly.",
    })
    // Simulate a download by creating a blob and a temporary link
    const sampleReportData = `Customer,Current,1-30 Days,31-60 Days,61-90 Days,90+ Days\nAcme Corp,$5000,$2000,$1000,$0,$0\nTech Solutions Inc.,$0,$0,$0,$3000,$1500`
    const blob = new Blob([sampleReportData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ar_aging_report.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleUpload = () => {
    // Trigger the hidden file input click
    document.getElementById("document-upload-input")?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      return
    }

    const file = files[0]
    setIsUploading(true)

    try {
      // Simulate file upload (e.g., to a backend API)
      // In a real application, you would send the file to your backend
      console.log("Uploading file:", file.name, file.type, file.size)
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate network delay

      toast({
        title: "Document Uploaded",
        description: `${file.name} has been successfully uploaded.`,
      })
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Clear the input to allow re-uploading the same file
      event.target.value = ""
    }
  }

  const handleApplyRemaining = (id: string) => {
    toast({
      title: "Payment Applied",
      description: `Remaining balance for payment ${id} has been applied.`,
    })
  }

  const handleSendReminder = (id: string) => {
    toast({
      title: "Reminder Sent",
      description: `Payment reminder sent for ${id}.`,
    })
  }

  const handleAutoMatch = (id: string) => {
    toast({
      title: "Auto-Match Applied",
      description: `Remittance ${id} has been automatically matched.`,
    })
  }

  const handleCreateCase = (id: string) => {
    toast({
      title: "Case Created",
      description: `Support case created for remittance ${id}.`,
    })
  }

  const handleReclassifyPayment = (id: string) => {
    toast({
      title: "Reclassification Initiated",
      description: `Reclassification process started for payment ${id}.`,
    })
    // In a real application, this would trigger an API call to POST /api/v1/payments/{payment_id}/classify
  }

  const handleApproveMatch = (id: string) => {
    toast({
      title: "Match Approved",
      description: `Manual match for payment ${id} has been approved and reconciled.`,
    })
    // In a real application, this would call a backend endpoint like POST /api/v1/payments/{payment_id}/approve_manual_match
  }

  const handleRejectPayment = (id: string) => {
    toast({
      title: "Payment Rejected",
      description: `Payment ${id} has been marked for dispute or rejected.`,
    })
    // In a real application, this would call a backend endpoint like POST /api/v1/payments/{payment_id}/reject
  }

  const handleEditMapping = (id: string) => {
    toast({
      title: "Edit Mapping",
      description: `Opening editor for payment ${id} to adjust mapping.`,
    })
    // In a real application, this would open a modal or navigate to a page for editing classification/invoice mapping
  }

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setNewCustomer(selectedCustomer) // Pre-populate form with existing data
      setCustomerView("edit") // Set view to edit mode
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete customer ${selectedCustomer?.name}?`)) {
      try {
        await deleteCustomer(id)
        setCustomerView("list")
        setSelectedCustomer(null)
        toast({
          title: "Customer Deleted",
          description: `Customer ${selectedCustomer?.name} has been deleted.`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete customer.",
          variant: "destructive",
        })
      }
    }
  }

  const handleSaveCustomer = async () => {
    // Basic validation
    if (!newCustomer.customer_number || !newCustomer.name || !newCustomer.tenant_id) {
      toast({
        title: "Error",
        description: "Customer Number, Name, and Tenant ID are mandatory fields.",
        variant: "destructive",
      })
      return
    }

    try {
      if (customerView === "create") {
        const createdCustomer = await createCustomer(newCustomer)
        toast({
          title: "Customer Created",
          description: `Customer ${newCustomer.name} (${newCustomer.customer_number}) has been created successfully.`,
        })
      } else if (customerView === "edit" && selectedCustomer) {
        const updatedCustomer = await updateCustomer(selectedCustomer.id, newCustomer)
        toast({
          title: "Customer Updated",
          description: `Customer ${newCustomer.name} (${newCustomer.customer_number}) has been updated successfully.`,
        })
      }

      // Reset form and return to list view
      setNewCustomer({
        customer_number: "",
        name: "",
        address: "",
        contact_email: "",
        contact_phone: "",
        payment_terms: 30,
        credit_limit: 0,
        is_active: true,
        tenant_id: "",
        additional_metadata: {},
      })
      setCustomerView("list")
      setSelectedCustomer(null); // Clear selected customer after save
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleSaveInvoice = async () => {
    if (!newInvoice.invoice_number || !newInvoice.customer_id || newInvoice.amount <= 0 || !newInvoice.issue_date || !newInvoice.due_date || !newInvoice.tenant_id) {
      toast({
        title: "Error",
        description: "Invoice Number, Customer ID, Amount, Issue Date, Due Date, and Tenant ID are mandatory.",
        variant: "destructive",
      })
      return
    }

    try {
      if (invoiceView === "create") {
        const createdInvoice = await createInvoice(newInvoice)
        toast({
          title: "Invoice Created",
          description: `Invoice ${newInvoice.invoice_number} has been created successfully.`,
        })
      } else if (invoiceView === "edit" && selectedInvoice) {
        const updatedInvoice = await updateInvoice(selectedInvoice.id, newInvoice)
        toast({
          title: "Invoice Updated",
          description: `Invoice ${newInvoice.invoice_number} has been updated successfully.`,
        })
      }

      setNewInvoice({ // Reset form
        invoice_number: "", customer_id: "", amount: 0, tax_amount: 0, currency: "USD",
        issue_date: new Date().toISOString().split("T")[0], due_date: new Date().toISOString().split("T")[0],
        tenant_id: "", metadata: {},
      })
      setInvoiceView("list")
      setSelectedInvoice(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" })
    }
  }

  const handleSubmitPayment = async () => {
    // Basic validation
    if (
      !newPayment.tenant_id ||
      !newPayment.customer_id ||
      !newPayment.payment_number ||
      newPayment.amount <= 0 ||
      !newPayment.currency ||
      !newPayment.payment_date ||
      !newPayment.payment_method
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields for the new payment.",
        variant: "destructive",
      })
      return
    }

    try {
      const createdPayment = await createPayment(newPayment)
      toast({
        title: "Payment Submitted",
        description: `Payment ${newPayment.payment_number} for ${formatCurrency(newPayment.amount)} has been submitted.`,
      })

      // Reset form and close modal
      setNewPayment({
        tenant_id: "",
        customer_id: "",
        payment_number: "",
        amount: 0,
        currency: "USD",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "WIRE",
        reference_number: "",
        description: "",
      })
      setIsSubmitPaymentModalOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit payment.",
        variant: "destructive",
      })
    }
  }

  const handleItemSelect = (item: Payment | ARRemittance) => {
    setSelectedItem(item)
    setShowDetailPanel(true)
  }

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false)
    setSelectedItem(null)
  }

  // Edit Invoice handler
  const handleEditInvoice = () => {
    if (selectedInvoice) {
      setNewInvoice(selectedInvoice)
      setInvoiceView("edit")
    }
  }

  // Delete Invoice handler
  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await deleteInvoice(id)
        setInvoiceView("list")
        setSelectedInvoice(null)
        toast({
          title: "Invoice Deleted",
          description: "The invoice has been deleted.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete invoice.",
          variant: "destructive",
        })
      }
    }
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "auto-applied":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Auto-Applied
          </Badge>
        )
      case "unmatched":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Unmatched
          </Badge>
        )
      case "pending-review":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending Review
          </Badge>
        )
      case "matched":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <Check className="mr-1 h-3 w-3" />
            Matched
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending
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

  const FileTypeBadge = ({ fileType }: { fileType: string }) => {
    switch (fileType) {
      case "email":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            <Mail className="mr-1 h-3 w-3" />
            Email
          </Badge>
        )
      case "bank-feed":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            <CreditCard className="mr-1 h-3 w-3" />
            Bank Feed
          </Badge>
        )
      case "manual":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            <FileText className="mr-1 h-3 w-3" />
            Manual
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            {fileType}
          </Badge>
        )
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Accounts Receivable</h1>
            <p className="text-muted-foreground">Manage payments, remittances, and customer collections</p>
          </div>
          <div className="flex space-x-2">
            <input id="document-upload-input" type="file" className="hidden" onChange={handleFileChange} />
            <Button onClick={handleUpload} className="bg-teal-600 hover:bg-teal-700" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Documents
                </>
              )}
            </Button>
            <Dialog open={isSubmitPaymentModalOpen} onOpenChange={setIsSubmitPaymentModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Send className="mr-2 h-4 w-4" />
                  Submit New Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Submit New Payment</DialogTitle>
                  <DialogDescription>Manually create and submit a new payment record.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tenantId" className="text-right">
                      Tenant ID
                    </Label>
                    <Input
                      id="tenant_id"
                      value={newPayment.tenant_id}
                      onChange={(e) => setNewPayment({ ...newPayment, tenant_id: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="customer_id" className="text-right">
                      Customer ID
                    </Label>
                    <Input
                      id="customer_id"
                      value={newPayment.customer_id}
                      onChange={(e) => setNewPayment({ ...newPayment, customer_id: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="payment_number" className="text-right">
                      Payment Number
                    </Label>
                    <Input
                      id="payment_number"
                      value={newPayment.payment_number}
                      onChange={(e) => setNewPayment({ ...newPayment, payment_number: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="currency" className="text-right">
                      Currency
                    </Label>
                    <Select
                      value={newPayment.currency}
                      onValueChange={(value) => setNewPayment({ ...newPayment, currency: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="paymentDate" className="text-right">
                      Payment Date
                    </Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={newPayment.payment_date}
                      onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="payment_method" className="text-right">
                      Payment Method
                    </Label>
                    <Select
                      value={newPayment.payment_method}
                      onValueChange={(value) => setNewPayment({ ...newPayment, payment_method: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WIRE">WIRE</SelectItem>
                        <SelectItem value="CHECK">CHECK</SelectItem>
                        <SelectItem value="CREDIT_CARD">CREDIT_CARD</SelectItem>
                        <SelectItem value="ACH">ACH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reference_number" className="text-right">
                      Reference Number
                    </Label>
                    <Input
                      id="reference_number"
                      value={newPayment.reference_number}
                      onChange={(e) => setNewPayment({ ...newPayment, reference_number: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={newPayment.description}
                      onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleSubmitPayment}>
                    Submit Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Payments</p>
                  <p className="text-2xl font-bold">{stats.totalPayments}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Review</p>
                  <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold">${stats.totalAmount.toLocaleString()}</p>
                </div>
                <Receipt className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Auto-Apply Rate</p>
                  <p className="text-2xl font-bold">{stats.autoApplyRate}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-teal-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={`grid gap-6 ${showDetailPanel ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1"}`}>
          {/* Master List */}
          <div className={showDetailPanel ? "lg:col-span-3" : "col-span-1"}>
            <Card>
              <CardHeader>
                <CardTitle>AR Management</CardTitle>
                <CardDescription>Process payments and remittances</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="payments">
                      Payments
                      <Badge className="ml-2 bg-blue-500">{payments.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="remittances">
                      Remittances
                      <Badge className="ml-2 bg-green-500">{remittances.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="customers">
                      Customers
                      <Badge className="ml-2 bg-green-500">{customers.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="invoices">
                      Invoices
                      <Badge className="ml-2 bg-yellow-500">{invoices.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="aging">
                      Aging Reports
                      <Badge className="ml-2 bg-purple-500">AR</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="collections">
                      Collections
                      <Badge className="ml-2 bg-red-500">{collectionCases.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="credit">
                      Credit Management
                      <Badge className="ml-2 bg-indigo-500">{creditLimits.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="sales-orders">
                      Sales Orders
                      <Badge className="ml-2 bg-green-500">{salesOrders.length}</Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="payments" className="space-y-4">
                    {/* Filters & Actions Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-between">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Select value={paymentDateRange} onValueChange={setPaymentDateRange}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Date range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All dates</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This week</SelectItem>
                            <SelectItem value="month">This month</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={paymentCustomer} onValueChange={setPaymentCustomer}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Customer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All customers</SelectItem>
                            <SelectItem value="ACME Corp">ACME Corp</SelectItem>
                            <SelectItem value="TechStart Inc">TechStart Inc</SelectItem>
                            <SelectItem value="Global Solutions">Global Solutions</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All status</SelectItem>
                            <SelectItem value="auto-applied">Auto-Applied</SelectItem>
                            <SelectItem value="unmatched">Unmatched</SelectItem>
                            <SelectItem value="pending-review">Pending Review</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleExport}>
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </Button>
                      </div>
                    </div>

                    {/* Payment List/Table */}
                    {showDetailPanel ? (
                      <div className="space-y-2">
                        {filteredPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                              selectedItem?.id === payment.id ? "border-teal-500 bg-teal-50" : ""
                            }`}
                            onClick={() => handleItemSelect(payment)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <p className="font-medium">{payment.payment_number}</p>
                                  <p className="text-sm text-gray-500">{payment.customer_id}</p>
                                </div>
                                <div>
                                  <p className="text-sm">{formatDate(payment.payment_date)}</p>
                                  <p className="font-medium">{formatCurrency(payment.amount, payment.currency)}</p>
                                </div>
                                <div>
                                  <div className="flex items-center space-x-1">
                                    {payment.status === "RECONCILED" ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : payment.status === "RECEIVED" ? (
                                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className="text-sm text-gray-500 capitalize">{payment.status.toLowerCase()}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <StatusBadge status={payment.status} />
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {payment.amount > 0 ? Math.round((payment.amount / payment.amount) * 100) : 0}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Payment ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date Paid</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Matched</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPayments.map((payment) => (
                            <TableRow
                              key={payment.id}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleItemSelect(payment)}
                            >
                              <TableCell className="font-medium">{payment.payment_number}</TableCell>
                              <TableCell>{payment.customer_id}</TableCell>
                              <TableCell>{formatDate(payment.payment_date)}</TableCell>
                              <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  {payment.status === "RECONCILED" ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : payment.status === "RECEIVED" ? (
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className="text-sm capitalize">{payment.status.toLowerCase()}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={payment.status} />
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {payment.amount > 0 ? Math.round((payment.amount / payment.amount) * 100) : 0}%
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleItemSelect(payment)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  <TabsContent value="remittances" className="space-y-4">
                    {/* Remittance Filters */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Select value={remittanceDateRange} onValueChange={setRemittanceDateRange}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Date range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All dates</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This week</SelectItem>
                          <SelectItem value="month">This month</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={remittanceCustomer} onValueChange={setRemittanceCustomer}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Customer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All customers</SelectItem>
                          <SelectItem value="ACME Corp">ACME Corp</SelectItem>
                          <SelectItem value="TechStart Inc">TechStart Inc</SelectItem>
                          <SelectItem value="Global Solutions">Global Solutions</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={remittanceFileType} onValueChange={setRemittanceFileType}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="File Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All types</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="bank-feed">Bank Feed</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Remittance List/Table */}
                    {showDetailPanel ? (
                      <div className="space-y-2">
                        {filteredRemittances.map((remittance) => (
                          <div
                            key={remittance.id}
                            className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                              selectedItem?.id === remittance.id ? "border-teal-500 bg-teal-50" : ""
                            }`}
                            onClick={() => handleItemSelect(remittance)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <p className="font-medium">{remittance.remitId}</p>
                                  <p className="text-sm text-gray-500">{remittance.customer}</p>
                                </div>
                                <div>
                                  <p className="text-sm">{new Date(remittance.dateReceived).toLocaleDateString()}</p>
                                  <p className="font-medium">${remittance.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                  <div className="flex items-center space-x-1">
                                    {remittance.matched ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className="text-sm text-gray-500">{remittance.matched ? "Yes" : "No"}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <StatusBadge status={remittance.status} />
                                <FileTypeBadge fileType={remittance.fileType} />
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  N/A
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Remit ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date Received</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Matched</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>File Type</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRemittances.map((remittance) => (
                            <TableRow
                              key={remittance.id}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleItemSelect(remittance)}
                            >
                              <TableCell className="font-medium">{remittance.remitId}</TableCell>
                              <TableCell>{remittance.customer}</TableCell>
                              <TableCell>{new Date(remittance.dateReceived).toLocaleDateString()}</TableCell>
                              <TableCell>${remittance.amount.toLocaleString()}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  {remittance.matched ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className="text-sm">{remittance.matched ? "Yes" : "No"}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={remittance.status} />
                              </TableCell>
                              <TableCell>
                                <FileTypeBadge fileType={remittance.fileType} />
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  N/A
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleItemSelect(remittance)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Placeholder for Review & Reconcile action
                                    toast({
                                      title: "Review & Reconcile",
                                      description: `Opening review for remittance ${remittance.id}`,
                                    })
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Placeholder for Reject Remittance action
                                    if (selectedItem) {
                                      toast({
                                        title: "Reject Remittance",
                                        description: `Marking remittance ${selectedItem.id} for dispute`,
                                      })
                                    }
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  <TabsContent value="customers" className="space-y-4">
                    {customerView === "list" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Input
                            placeholder="Search customers..."
                            value={customerSearchTerm}
                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                            className="max-w-sm"
                          />
                          <Button onClick={() => setCustomerView("create")} className="bg-teal-600 hover:bg-teal-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Customer
                          </Button>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Customer Number</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Contact Email</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCustomers.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                  No customers found.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredCustomers.map((customer) => (
                                <TableRow key={customer.id}>
                                  <TableCell className="font-medium">{customer.customer_number}</TableCell>
                                  <TableCell>{customer.name}</TableCell>
                                  <TableCell>{customer.contact_email}</TableCell>
                                  <TableCell>
                                    <Badge variant={customer.is_active ? "default" : "destructive"}>
                                      {customer.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setSelectedCustomer(customer)
                                        setCustomerView("details")
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {(customerView === "create" || customerView === "edit") && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          {customerView === "create" ? "Create New Customer" : "Edit Customer"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="customer_number">Customer Number (Mandatory)</Label>
                            <Input
                              id="customer_number"
                              value={newCustomer.customer_number}
                              onChange={(e) => setNewCustomer({ ...newCustomer, customer_number: e.target.value })}
                              placeholder="e.g., CUST-001"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="name">Name (Mandatory)</Label>
                            <Input
                              id="name"
                              value={newCustomer.name}
                              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                              placeholder="e.g., Acme Corporation"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contact_email">Contact Email</Label>
                            <Input
                              id="contact_email"
                              type="email"
                              value={newCustomer.contact_email}
                              onChange={(e) => setNewCustomer({ ...newCustomer, contact_email: e.target.value })}
                              placeholder="e.g., contact@acme.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contact_phone">Contact Phone</Label>
                            <Input
                              id="contact_phone"
                              value={newCustomer.contact_phone}
                              onChange={(e) => setNewCustomer({ ...newCustomer, contact_phone: e.target.value })}
                              placeholder="e.g., +1 (555) 123-4567"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Textarea
                            id="address"
                            value={newCustomer.address}
                            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                            placeholder="Street, City, State, Zip, Country"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="payment_terms">Payment Terms (days)</Label>
                            <Select
                              value={newCustomer.payment_terms?.toString()}
                              onValueChange={(value) => setNewCustomer({ ...newCustomer, payment_terms: parseInt(value) })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment terms" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15 Days</SelectItem>
                                <SelectItem value="30">30 Days</SelectItem>
                                <SelectItem value="45">45 Days</SelectItem>
                                <SelectItem value="60">60 Days</SelectItem>
                                <SelectItem value="90">90 Days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="credit_limit">Credit Limit</Label>
                            <Input
                              id="credit_limit"
                              type="number"
                              value={newCustomer.credit_limit}
                              onChange={(e) => setNewCustomer({ ...newCustomer, credit_limit: parseFloat(e.target.value) })}
                              placeholder="e.g., 10000"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="tenant_id">Tenant ID (Mandatory)</Label>
                            <Input
                              id="tenant_id"
                              value={newCustomer.tenant_id}
                              onChange={(e) => setNewCustomer({ ...newCustomer, tenant_id: e.target.value })}
                              placeholder="e.g., org-abc-123"
                            />
                          </div>
                          <div className="flex items-center space-x-2 mt-6">
                            <Checkbox
                              id="is_active"
                              checked={newCustomer.is_active}
                              onCheckedChange={(checked) => setNewCustomer((prev) => ({ ...prev, is_active: checked as boolean }))}
                            />
                            <Label htmlFor="is_active">Is Active</Label>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button onClick={handleSaveCustomer} className="bg-teal-600 hover:bg-teal-700">
                            {customerView === "create" ? "Create Customer" : "Save Changes"}
                          </Button>
                          <Button variant="outline" onClick={() => setCustomerView("list")}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {customerView === "details" && selectedCustomer && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                          <div className="flex space-x-2">
                            <Button variant="outline" onClick={() => setCustomerView("list")}>
                              Back to List
                            </Button>
                            <Button onClick={handleEditCustomer} className="bg-teal-600 hover:bg-teal-700">
                              Edit
                            </Button>
                            <Button variant="destructive" onClick={() => handleDeleteCustomer(selectedCustomer.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Customer ID</Label>
                            <p className="font-medium">{selectedCustomer.id}</p>
                          </div>
                          <div>
                            <Label>Customer Number</Label>
                            <p className="font-medium">{selectedCustomer.customer_number}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Contact Email</Label>
                            <p>{selectedCustomer.contact_email || "N/A"}</p>
                          </div>
                          <div>
                            <Label>Contact Phone</Label>
                            <p>{selectedCustomer.contact_phone || "N/A"}</p>
                          </div>
                        </div>

                        <div>
                          <Label>Address</Label>
                          <p>{selectedCustomer.address || "N/A"}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Payment Terms</Label>
                            <p>{selectedCustomer.payment_terms ? `${selectedCustomer.payment_terms} days` : "N/A"}</p>
                          </div>
                          <div>
                            <Label>Credit Limit</Label>
                            <p>{selectedCustomer.credit_limit ? `$${selectedCustomer.credit_limit.toLocaleString()}` : "N/A"}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Label>Status:</Label>
                          <Badge variant={selectedCustomer.is_active ? "default" : "destructive"}>
                            {selectedCustomer.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Created At</Label>
                            <p>{new Date(selectedCustomer.created_at).toLocaleString()}</p>
                          </div>
                          <div>
                            <Label>Updated At</Label>
                            <p>{new Date(selectedCustomer.updated_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="invoices" className="space-y-4">
                    {invoiceView === "list" && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3 justify-between">
                          <Input
                            placeholder="Search invoices by number..."
                            value={invoiceSearchTerm}
                            onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                            className="max-w-sm"
                          />
                          <Select value={invoiceFilterCustomer} onValueChange={setInvoiceFilterCustomer}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filter by Customer" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Customers</SelectItem>
                              {customers.map((cust) => (
                                <SelectItem key={cust.id} value={cust.id}>
                                  {cust.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={invoiceFilterStatus} onValueChange={setInvoiceFilterStatus}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="OPEN">Open</SelectItem>
                              <SelectItem value="PAID">Paid</SelectItem>
                              <SelectItem value="PARTIAL">Partial</SelectItem>
                              <SelectItem value="OVERDUE">Overdue</SelectItem>
                              <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button onClick={() => setInvoiceView("create")} className="bg-teal-600 hover:bg-teal-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New Invoice
                          </Button>
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice Number</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoices.filter(inv =>
                                (invoiceSearchTerm === "" || inv.invoice_number.toLowerCase().includes(invoiceSearchTerm.toLowerCase())) &&
                                (invoiceFilterCustomer === "all" || inv.customer_id === invoiceFilterCustomer) &&
                                (invoiceFilterStatus === "all" || inv.status === invoiceFilterStatus)
                              ).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                  No invoices found.
                                </TableCell>
                              </TableRow>
                            ) : (
                              invoices.filter(inv =>
                                (invoiceSearchTerm === "" || inv.invoice_number.toLowerCase().includes(invoiceSearchTerm.toLowerCase())) &&
                                (invoiceFilterCustomer === "all" || inv.customer_id === invoiceFilterCustomer) &&
                                (invoiceFilterStatus === "all" || inv.status === invoiceFilterStatus)
                              ).map((invoice) => (
                                <TableRow key={invoice.id}>
                                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                  <TableCell>{customers.find(c => c.id === invoice.customer_id)?.name || invoice.customer_id}</TableCell>
                                  <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                                  <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={
                                      invoice.status === "OPEN" ? "bg-blue-100 text-blue-800" :
                                      invoice.status === "PAID" ? "bg-green-100 text-green-800" :
                                      invoice.status === "OVERDUE" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                                    }>
                                      {invoice.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setSelectedInvoice(invoice)
                                        setInvoiceView("details")
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {(invoiceView === "create" || invoiceView === "edit") && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          {invoiceView === "create" ? "Create New Invoice" : "Edit Invoice"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="invoice_number">Invoice Number (Mandatory)</Label>
                            <Input
                              id="invoice_number"
                              value={newInvoice.invoice_number}
                              onChange={(e) => setNewInvoice({ ...newInvoice, invoice_number: e.target.value })}
                              placeholder="e.g., INV-2025-001"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer_id">Customer (Mandatory)</Label>
                            <Select
                              value={newInvoice.customer_id}
                              onValueChange={(value) => setNewInvoice({ ...newInvoice, customer_id: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Customer" />
                              </SelectTrigger>
                              <SelectContent>
                                {customers.map((cust) => (
                                  <SelectItem key={cust.id} value={cust.id}>
                                    {cust.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="amount">Amount (Mandatory)</Label>
                            <Input
                              id="amount"
                              type="number"
                              value={newInvoice.amount}
                              onChange={(e) => setNewInvoice({ ...newInvoice, amount: parseFloat(e.target.value) })}
                              placeholder="e.g., 1000.00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tax_amount">Tax Amount</Label>
                            <Input
                              id="tax_amount"
                              type="number"
                              value={newInvoice.tax_amount}
                              onChange={(e) => setNewInvoice({ ...newInvoice, tax_amount: parseFloat(e.target.value) })}
                              placeholder="e.g., 100.00"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select
                              value={newInvoice.currency}
                              onValueChange={(value) => setNewInvoice({ ...newInvoice, currency: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="issue_date">Issue Date (Mandatory)</Label>
                            <Input
                              id="issue_date"
                              type="date"
                              value={newInvoice.issue_date}
                              onChange={(e) => setNewInvoice({ ...newInvoice, issue_date: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="due_date">Due Date (Mandatory)</Label>
                            <Input
                              id="due_date"
                              type="date"
                              value={newInvoice.due_date}
                              onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tenant_id">Tenant ID (Mandatory)</Label>
                            <Input
                              id="tenant_id"
                              value={newInvoice.tenant_id}
                              onChange={(e) => setNewInvoice({ ...newInvoice, tenant_id: e.target.value })}
                              placeholder="e.g., org-abc-123"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newInvoice.description}
                            onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                            placeholder="e.g., Monthly subscription for cloud services"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="document_path">Document Path (URL)</Label>
                          <Input
                            id="document_path"
                            value={newInvoice.document_path}
                            onChange={(e) => setNewInvoice({ ...newInvoice, document_path: e.target.value })}
                            placeholder="e.g., https://example.com/invoice-001.pdf"
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button onClick={handleSaveInvoice} className="bg-teal-600 hover:bg-teal-700">
                            {invoiceView === "create" ? "Submit Invoice" : "Save Changes"}
                          </Button>
                          <Button variant="outline" onClick={() => setInvoiceView("list")}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {invoiceView === "details" && selectedInvoice && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Invoice: {selectedInvoice.invoice_number}</h3>
                          <Button variant="outline" onClick={() => setInvoiceView("list")}>
                            Back to List
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Invoice ID</Label>
                            <p className="font-medium">{selectedInvoice.id}</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Invoice Number</Label>
                            <p className="font-medium">{selectedInvoice.invoice_number}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Customer</Label>
                            <p className="font-medium">{customers.find(c => c.id === selectedInvoice.customer_id)?.name || selectedInvoice.customer_id}</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Tenant ID</Label>
                            <p className="font-medium">{selectedInvoice.tenant_id}</p>
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Amount</Label>
                            <p>${selectedInvoice.amount.toLocaleString()} {selectedInvoice.currency}</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Tax Amount</Label>
                            <p>${selectedInvoice.tax_amount.toLocaleString()} {selectedInvoice.currency}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Issue Date</Label>
                            <p>{new Date(selectedInvoice.issue_date).toLocaleDateString()}</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Due Date</Label>
                            <p>{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Badge variant="outline" className={
                            selectedInvoice.status === "OPEN" ? "bg-blue-100 text-blue-800" :
                            selectedInvoice.status === "PAID" ? "bg-green-100 text-green-800" :
                            selectedInvoice.status === "OVERDUE" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                          }>
                            {selectedInvoice.status}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <p>{selectedInvoice.description || "N/A"}</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Document</Label>
                          {selectedInvoice.document_path ? (
                            <a href={selectedInvoice.document_path} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              View Document
                            </a>
                          ) : (
                            <p>N/A</p>
                          )}
                        </div>

                        <Separator />

                        <h4 className="font-medium mb-2">Related Payments</h4>
                        {/* Placeholder for related payments table */}
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Payment ID</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Allocation Date</TableHead>
                              <TableHead>Auto-Matched</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>PMT-891</TableCell>
                              <TableCell>$5,500</TableCell>
                              <TableCell>2025-07-10</TableCell>
                              <TableCell>Yes</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>

                        <div className="flex space-x-2">
                          {/* Edit and Delete Invoice buttons (if backend endpoints available) */}
                          <Button
                            className="bg-teal-600 hover:bg-teal-700"
                            onClick={handleEditInvoice}
                          >
                            Edit Invoice
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                          >
                            Delete Invoice
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Detail Panel - Conditional */}
          {showDetailPanel && (
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {selectedItem
                        ? activeTab === "payments"
                          ? `Payment: ${(selectedItem as ARPayment).paymentId}`
                          : `Remittance: ${(selectedItem as ARRemittance).remitId}`
                        : "Select an item"}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={handleCloseDetailPanel} className="h-6 w-6">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedItem && (
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-6">
                        {/* Header */}
                        {selectedItem && (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {activeTab === "payments"
                                  ? (selectedItem as Payment).customer_id
                                  : (selectedItem as ARRemittance).customer}
                              </p>
                              <StatusBadge
                                status={activeTab === "payments"
                                  ? (selectedItem as Payment).status
                                  : (selectedItem as ARRemittance).status}
                              />
                            </div>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {activeTab === "payments"
                                ? `${(selectedItem as Payment).amount > 0 ? Math.round(((selectedItem as Payment).amount / (selectedItem as Payment).amount) * 100) : 0}%`
                                : "N/A"}
                            </Badge>
                          </div>
                        )}

                        <Separator />

                        {/* Document Viewer */}
                        <div>
                          <h3 className="font-medium mb-2">Document Viewer</h3>
                          <div className="p-8 bg-gray-50 text-center">
                            <Eye className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">
                              {activeTab === "payments"
                                ? "Remittance PDF or bank transaction record"
                                : "Remittance advice document"}
                            </p>
                          </div>
                        </div>

                        {activeTab === "payments" && (
                          <>
                            {/* Payment Details */}
                            <div>
                              <h3 className="font-medium mb-2">Payment Details</h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Payment Date:</span>
                                  <span>{formatDate((selectedItem as Payment).payment_date)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Total Amount:</span>
                                  <span>{formatCurrency((selectedItem as Payment).amount, (selectedItem as Payment).currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Payment Method:</span>
                                  <span>{(selectedItem as Payment).payment_method}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Reference:</span>
                                  <span>{(selectedItem as Payment).reference_number || "N/A"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Applied Invoices */}
                            <div>
                              <h3 className="font-medium mb-2">Applied Invoices</h3>
                              <div className="space-y-2">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">INV-2024-001</span>
                                    <span className="text-sm font-medium">$5,000</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">Applied automatically</div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">INV-2024-002</span>
                                    <span className="text-sm font-medium">$3,000</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">Applied automatically</div>
                                </div>
                              </div>
                            </div>

                            {/* Unmatched Balance */}
                            {(selectedItem as ARPayment).remainingAmount! > 0 && (
                              <div>
                                <h3 className="font-medium mb-2">Unmatched Balance</h3>
                                <div className="p-3 bg-amber-50 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-amber-700">Remaining Balance</span>
                                    <span className="text-sm font-medium text-amber-700">
                                      ${(selectedItem as ARPayment).remainingAmount?.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="text-xs text-amber-600 mt-1">Requires manual application</div>
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                className="bg-teal-600 hover:bg-teal-700"
                                onClick={() => handleApplyRemaining(selectedItem.id)}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Apply Remaining
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleSendReminder(selectedItem.id)}>
                                <Send className="mr-2 h-4 w-4" />
                                Send Reminder
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReclassifyPayment(selectedItem.id)}
                              >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Reclassify Payment
                              </Button>
                            </div>
                          </>
                        )}

                        {activeTab === "remittances" && (
                          <>
                            {/* Remittance Details */}
                            <div>
                              <h3 className="font-medium mb-2">Remittance Details</h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Date Received:</span>
                                  <span>
                                    {new Date((selectedItem as ARRemittance).dateReceived).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Amount:</span>
                                  <span>${(selectedItem as ARRemittance).amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">File Type:</span>
                                  <FileTypeBadge fileType={(selectedItem as ARRemittance).fileType} />
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Matched:</span>
                                  <span>{(selectedItem as ARRemittance).matched ? "Yes" : "No"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Extracted Fields */}
                            <div>
                              <h3 className="font-medium mb-2">Extracted Fields</h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Invoice References:</span>
                                  <span>INV-2024-001, INV-2024-002</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Bank TXN ID:</span>
                                  <span>TXN-789456123</span>
                                </div>
                              </div>
                            </div>

                            {/* Match Suggestions */}
                            <div>
                              <h3 className="font-medium mb-2">Match Suggestions</h3>
                              <div className="space-y-2">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">PMT-890 - ACME Corp</span>
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                      96% match
                                    </Badge>
                                  </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">PMT-891 - ACME Corp</span>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                      82% match
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                className="bg-teal-600 hover:bg-teal-700"
                                onClick={() => {
                                  // Placeholder for Review & Reconcile action
                                  toast({
                                    title: "Review & Reconcile",
                                    description: `Opening review for remittance ${selectedItem.id}`,
                                  })
                                }}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Review & Reconcile
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  // Placeholder for Reject Remittance action
                                  toast({
                                    title: "Reject Remittance",
                                    description: `Marking remittance ${selectedItem.id} for dispute`,
                                  })
                                }}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject Remittance
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

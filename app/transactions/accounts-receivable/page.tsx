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
import { uploadFile } from "@/lib/upload"
import {
  useCustomers,
  useInvoices,
  useAgingReports,
  useCollections,
  useCreditManagement,
  useSalesOrders,
  formatCurrency,
  formatDate,
  type CollectionCase,
  type CollectionActivity,
  type Payment,
  type CollectionCaseCreate,
  type CollectionActivityCreate,
  type PaymentPlanCreate,
} from "@/lib/ar-api"

import { ARRemittance } from "./types/ar-specific-types"
import StatusBadge from "./components/StatusBadge"
import SubmitPaymentDialog from "./components/SubmitPaymentDialog"
import { usePaymentsData } from "./hooks/usePaymentsData"
import { useCustomerManagement } from "./hooks/useCustomerManagement"
import { useInvoiceManagement } from "./hooks/useInvoiceManagement"
import { useSalesOrderManagement } from "./hooks/useSalesOrderManagement"
import { useCreditManagementLogic } from "./hooks/useCreditManagementLogic"
import { getStats } from "./utils/ar-utils"
import { ArSummaryCards } from "./components/ArSummaryCards"
import { CustomersSection } from "./components/CustomersSection"
import { InvoicesSection } from "./components/InvoicesSection"
import { SalesOrdersSection } from "./components/SalesOrdersSection"
import { CreditManagementSection } from "./components/CreditManagementSection"
import { AgingReportsSection } from "./components/AgingReportsSection"


export default function AccountsReceivablePage() {
  const { toast } = useToast()

   // Component state
   const [activeTab, setActiveTab] = useState("payments")
   const [isUploading, setIsUploading] = useState(false)

   const {
     payments,
     paymentsLoading,
     filteredPayments,
     remittances,
     filteredRemittances,
     selectedItem,
     setSelectedItem,
     showDetailPanel,
     setShowDetailPanel,
     isSubmitPaymentModalOpen,
     setIsSubmitPaymentModalOpen,
     newPayment,
     setNewPayment,
     paymentDateRange,
     setPaymentDateRange,
     paymentCustomer,
     setPaymentCustomer,
     paymentStatus,
     setPaymentStatus,
     remittanceDateRange,
     setRemittanceDateRange,
     remittanceCustomer,
     setRemittanceCustomer,
     remittanceFileType,
     setRemittanceFileType,
     handleSubmitPayment,
     handleItemSelect,
     handleCloseDetailPanel,
     handleApplyRemaining,
     handleSendReminder,
     handleAutoMatch,
     handleCreateCase,
     handleReclassifyPayment,
     handleApproveMatch,
     handleRejectPayment,
     handleEditMapping,
   } = usePaymentsData()

   // Collections state (remaining in page.tsx for now)
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

   // API hooks
   const {
     customers,
     loading: customersLoading,
     error: customersError,
     refetch: refetchCustomers
   } = useCustomers()
 
   const {
     invoices,
     loading: invoicesLoading,
     error: invoicesError,
     refetch: refetchInvoices
   } = useInvoices()
 
   const {
     agingReport,
     loading: agingLoading,
     error: agingError,
     refetch: refetchAging
   } = useAgingReports("test-tenant")

   const {
     cases: collectionCases,
     loading: collectionsLoading,
     error: collectionsError,
     refetch: refetchCollections,
     createCase: createCollectionCase,
     processOverdue,
     executeDunning
   } = useCollections("test-tenant")

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
   } = useCreditManagement("test-tenant")

   const {
     orders: salesOrders,
     loading: salesOrdersLoading,
     error: salesOrdersError,
     refetch: refetchSalesOrders,
     create: createSalesOrder,
     makeCreditDecision,
     generateInvoice
   } = useSalesOrders("test-tenant")

  const stats = getStats(payments)

  // Action handlers
  const handleExport = () => {
    toast({
      title: "Aging Report Export Initiated",
      description: "Your Accounts Receivable aging report is being generated and will download shortly.",
    })
  }

  const handleUpload = () => {
    document.getElementById("document-upload-input")?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setIsUploading(true)

    try {
      const tenantId = "test-tenant"
      const uploadResult = await uploadFile(file, tenantId, "accounts-receivable-document")
      console.log("Upload successful:", uploadResult)

      toast({
        title: "Document Uploaded",
        description: `${file.name} has been successfully uploaded. Document ID: ${uploadResult.documentId}`,
      })
    } catch (error) {
      console.error("Upload failed:", error)
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      event.target.value = ""
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Documents
                </>
              )}
            </Button>
            <SubmitPaymentDialog
              isOpen={isSubmitPaymentModalOpen}
              onOpenChange={setIsSubmitPaymentModalOpen}
              newPayment={newPayment}
              setNewPayment={setNewPayment}
              onSubmit={handleSubmitPayment}
              isUploading={isUploading}
              customers={customers}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <ArSummaryCards stats={stats} />

        <div className={`grid gap-6 ${showDetailPanel ? "grid-cols-1 lg:grid-cols-5" : "col-span-1"}`}>
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
                            {customers.map((cust) => (
                              <SelectItem key={cust.id} value={cust.id}>
                                {cust.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All status</SelectItem>
                            <SelectItem value="RECEIVED">Received</SelectItem>
                            <SelectItem value="RECONCILED">Reconciled</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
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
                    {paymentsLoading ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Payment ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date Paid</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
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
                              <TableCell>{customers.find(c => c.id === payment.customer_id)?.name || payment.customer_id}</TableCell>
                              <TableCell>{formatDate(payment.payment_date)}</TableCell>
                              <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                              <TableCell>
                                <StatusBadge status={payment.status} />
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

                  <TabsContent value="customers" className="space-y-4">
                    {/* Customer management section */}
                    <CustomersSection />
                  </TabsContent>

                  <TabsContent value="invoices" className="space-y-4">
                    {/* Invoice management section */}
                    <InvoicesSection customers={customers} />
                  </TabsContent>

                  <TabsContent value="credit" className="space-y-4">
                    {/* Credit management section */}
                    <CreditManagementSection
                      creditLimits={creditLimits}
                      creditAssessments={creditAssessments}
                      creditLoading={creditLoading}
                      customers={customers}
                    />
                  </TabsContent>

                  <TabsContent value="aging" className="space-y-4">
                    {/* Aging reports section */}
                    <AgingReportsSection
                      agingReport={agingReport}
                      agingLoading={agingLoading}
                      handleExport={handleExport}
                    />
                  </TabsContent>

                  <TabsContent value="sales-orders" className="space-y-4">
                    {/* Sales orders section */}
                    <SalesOrdersSection customers={customers} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Detail Panel - Conditional */}
          {showDetailPanel && selectedItem && (
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      Payment: {selectedItem.payment_number}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={handleCloseDetailPanel} className="h-6 w-6">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{customers.find(c => c.id === selectedItem.customer_id)?.name || selectedItem.customer_id}</p>
                          <StatusBadge status={selectedItem.status} />
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {selectedItem.status === "RECONCILED" ? "Reconciled" : "Pending"}
                        </Badge>
                      </div>

                      <Separator />

                      {/* Document Viewer */}
                      <div>
                        <h3 className="font-medium mb-2">Document Viewer</h3>
                        <div className="p-8 bg-gray-50 text-center">
                          <Eye className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">
                            Payment record details
                          </p>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div>
                        <h3 className="font-medium mb-2">Payment Details</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Payment Date:</span>
                            <span>{formatDate(selectedItem.payment_date)}</span
                          ></div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Total Amount:</span>
                            <span>{formatCurrency(selectedItem.amount, selectedItem.currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Payment Method:</span>
                            <span>{selectedItem.payment_method}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Reference Number:</span>
                            <span>{selectedItem.reference_number || "N/A"}</span>
                          </div>
                        </div>
                      </div>

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
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

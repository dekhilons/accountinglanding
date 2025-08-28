import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  usePayments,
  type Payment,
  type PaymentCreate,
  formatCurrency,
  formatDate,
} from "@/lib/ar-api"
import { ARRemittance } from "../types/ar-specific-types"

export const usePaymentsData = () => {
  const { toast } = useToast()

  // Payment management states
  const [selectedItem, setSelectedItem] = useState<Payment | ARRemittance | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [isSubmitPaymentModalOpen, setIsSubmitPaymentModalOpen] = useState(false)
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
  const [remittanceDateRange, setRemittanceDateRange] = useState("all") // Still needed for mock data
  const [remittanceCustomer, setRemittanceCustomer] = useState("all") // Still needed for mock data
  const [remittanceFileType, setRemittanceFileType] = useState("all") // Still needed for mock data

  // API hooks
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

  // Action handlers
  const handleSubmitPayment = async () => {
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

  const handleItemSelect = (item: Payment) => {
    setSelectedItem(item)
    setShowDetailPanel(true)
  }

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false)
    setSelectedItem(null)
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
  }

  const handleApproveMatch = (id: string) => {
    toast({
      title: "Match Approved",
      description: `Manual match for payment ${id} has been approved and reconciled.`,
    })
  }

  const handleRejectPayment = (id: string) => {
    toast({
      title: "Payment Rejected",
      description: `Payment ${id} has been marked for dispute or rejected.`,
    })
  }

  const handleEditMapping = (id: string) => {
    toast({
      title: "Edit Mapping",
      description: `Opening editor for payment ${id} to adjust mapping.`,
    })
  }

  return {
    payments,
    paymentsLoading,
    paymentsError,
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
    createPayment,
    updatePayment,
    deletePayment,
    classifyPayment,
    reconcilePayment,
    approveMatch,
    rejectPayment,
    applyRemaining,
    sendReminder,
    refetchPayments,
  }
}

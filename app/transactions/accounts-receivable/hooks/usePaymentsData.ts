import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  usePayments,
  type Payment,
  type PaymentCreate,
  formatCurrency,
  formatDate,
  invoiceAPI,
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
    payment_date: new Date().toISOString(),
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
        payment_date: new Date().toISOString(),
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
  console.log(selectedItem)  

  const handleApplyRemaining = async (paymentId: string) => {
    console.log("Apply Remaining clicked for payment:", paymentId);
    console.log("Selected item:", selectedItem);
    console.log("Selected item metadata:", selectedItem?.metadata);

    if (!selectedItem) {
      console.error("No selected item found");
      toast({
        title: "Error",
        description: "No payment selected.",
        variant: "destructive",
      });
      return;
    }

    // Check if payment has any applied amount
    const appliedAmount = selectedItem.metadata?.applied_amount || 0;
    const remainingAmount = selectedItem.amount - appliedAmount;

    console.log("Applied amount:", appliedAmount);
    console.log("Remaining amount:", remainingAmount);

    if (remainingAmount <= 0) {
      console.log("Payment is already fully applied");
      toast({
        title: "Info",
        description: "Payment is already fully applied.",
      });
      return;
    }

    // Check for matched invoices from classification
    const matchedInvoices = selectedItem.metadata?.matched_invoices_from_classification || [];
    console.log("Matched invoices from classification:", matchedInvoices);

    if (matchedInvoices.length === 0) {
      console.log("No matched invoices from classification, attempting to find outstanding invoices...");

      // For NO_MATCH payments, we still want to allow applying remaining balance
      // Let's try to find outstanding invoices for this customer
      // This is a simplified approach - in a real app, you'd show a dialog to choose which invoice

      try {
        // Get outstanding invoices for this customer
        const outstandingInvoices = await invoiceAPI.getByCustomer(selectedItem.customer_id!, "OPEN,PARTIAL,OVERDUE");

        if (outstandingInvoices.length === 0) {
          toast({
            title: "No Outstanding Invoices",
            description: "No outstanding invoices found for this customer to apply the payment to.",
            variant: "destructive",
          });
          return;
        }

        // Use the first outstanding invoice (in a real app, show a selection dialog)
        const targetInvoice = outstandingInvoices[0];
        console.log("Using first outstanding invoice:", targetInvoice);

        const reconciliationData = {
          tenant_id: selectedItem.tenant_id,
          invoice_id: targetInvoice.id,
          payment_id: paymentId,
          amount: remainingAmount,
          currency: selectedItem.currency,
          is_auto_matched: false,
          confidence_score: 0.5, // Lower confidence for manual application
        };

        console.log("Calling reconcilePayment for NO_MATCH payment:", reconciliationData);

        await reconcilePayment(paymentId, reconciliationData);
        console.log("Reconciliation API call successful for NO_MATCH payment");

        toast({
          title: "Reconciliation Successful",
          description: `Remaining balance of ${formatCurrency(remainingAmount, selectedItem.currency)} applied to invoice ${targetInvoice.invoice_number}.`,
        });
        refetchPayments();
        handleCloseDetailPanel();

      } catch (invoiceError: any) {
        console.error("Failed to get outstanding invoices:", invoiceError);
        toast({
          title: "Error",
          description: "Failed to find outstanding invoices for this customer.",
          variant: "destructive",
        });
      }
      return;
    }

    // Use the first matched invoice
    const matchedInvoice = matchedInvoices[0];
    const invoiceId = matchedInvoice.invoice_id;

    console.log("Using matched invoice:", matchedInvoice);
    console.log("Invoice ID:", invoiceId);
    console.log("Amount to apply:", remainingAmount);

    try {
      // Create InvoicePaymentCreate object
      const reconciliationData = {
        tenant_id: selectedItem.tenant_id,
        invoice_id: invoiceId,
        payment_id: paymentId, // This field is ignored by backend, but good to include for type safety
        amount: remainingAmount,
        currency: selectedItem.currency,
        is_auto_matched: false, // This is a manual action
        confidence_score: matchedInvoice.confidence_score || 1.0,
      };

      console.log("Calling reconcilePayment with data:", reconciliationData);

      await reconcilePayment(paymentId, reconciliationData);
      console.log("Reconciliation API call successful");

      toast({
        title: "Reconciliation Successful",
        description: `Remaining balance of ${formatCurrency(remainingAmount, selectedItem.currency)} for payment ${paymentId} has been applied to invoice ${matchedInvoice.invoice_number}.`,
      });
      refetchPayments(); // Refresh payments data
      handleCloseDetailPanel(); // Close detail panel
    } catch (error: any) {
      console.error("Reconciliation failed:", error);
      toast({
        title: "Reconciliation Failed",
        description: error.message || `Failed to apply remaining balance for payment ${paymentId}.`,
        variant: "destructive",
      });
    }
  };

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

  const handleReclassifyPayment = async (id: string) => {
    try {
      await classifyPayment(id)
      toast({
        title: "Reclassification Successful",
        description: `Payment ${id} has been reclassified.`,
      })
      refetchPayments() // Refresh payments data to reflect changes
      handleCloseDetailPanel() // Close detail panel if reclassification changes payment status/details
    } catch (error: any) {
      toast({
        title: "Reclassification Failed",
        description: error.message || `Failed to reclassify payment ${id}.`,
        variant: "destructive",
      })
    }
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

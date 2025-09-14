import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  useCreditManagement,
  type SalesOrder,
  type CreditDecisionRequest
} from "@/lib/ar-api"

export const useCreditOverrideManagement = (onDataRefresh?: () => void) => {
  const { toast } = useToast()
  const [isProcessingOverride, setIsProcessingOverride] = useState(false)
  const [selectedOrderForOverride, setSelectedOrderForOverride] = useState<SalesOrder | null>(null)
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false)

  const {
    overrideCreditDecision,
  } = useCreditManagement("test-tenant")

  const handleCreditOverride = async (overrideData: CreditDecisionRequest): Promise<void> => {
    setIsProcessingOverride(true)

    try {
      if (!selectedOrderForOverride) {
        throw new Error("No order selected for override")
      }

      // Debug logging removed - issue resolved

      const response = await overrideCreditDecision({
        order_id: selectedOrderForOverride.id,
        decision: overrideData.decision as 'APPROVED' | 'REJECTED',
        override_reason: 'MANUAL_OVERRIDE',
        approved_amount: selectedOrderForOverride.total_amount,
        notes: overrideData.notes || 'Manual credit decision override'
      }, "current-user")


      if (response.success !== false) { // Backend returns success or throws error
        toast({
          title: "Credit Decision Overridden",
          description: `Order credit decision updated to ${overrideData.decision}`,
        })

        // Trigger data refresh in parent component
        if (onDataRefresh) {
          onDataRefresh()
        }

        // Close dialog
        setIsOverrideDialogOpen(false)
        setSelectedOrderForOverride(null)
      } else {
        throw new Error(response.message || "Failed to override credit decision")
      }
    } catch (error: any) {
      console.error('Credit override error:', error)
      toast({
        title: "Override Failed",
        description: error.message || "Failed to override credit decision",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsProcessingOverride(false)
    }
  }

  const openOverrideDialog = (order: SalesOrder) => {
    setSelectedOrderForOverride(order)
    setIsOverrideDialogOpen(true)
  }

  const closeOverrideDialog = () => {
    setIsOverrideDialogOpen(false)
    setSelectedOrderForOverride(null)
  }

  // Helper function to check if an order can have its credit decision overridden
  const canOverrideCreditDecision = (order: SalesOrder): boolean => {
    // Allow override for orders that have been through credit assessment
    return order.credit_status !== 'PENDING' && order.status !== 'PENDING'
  }

  return {
    // State
    isProcessingOverride,
    selectedOrderForOverride,
    isOverrideDialogOpen,

    // Actions
    handleCreditOverride,
    openOverrideDialog,
    closeOverrideDialog,

    // Helpers
    canOverrideCreditDecision,
  }
}
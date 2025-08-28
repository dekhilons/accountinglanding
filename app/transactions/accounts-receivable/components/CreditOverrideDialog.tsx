import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate, formatCurrency, type SalesOrder, type CreditDecisionRequest } from "@/lib/ar-api"

interface CreditOverrideDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  salesOrder: SalesOrder | null
  onCreditOverride: (overrideData: CreditDecisionRequest) => Promise<void>
  isProcessing?: boolean
}

export const CreditOverrideDialog: React.FC<CreditOverrideDialogProps> = ({
  isOpen,
  onOpenChange,
  salesOrder,
  onCreditOverride,
  isProcessing = false
}) => {
  const { toast } = useToast()

  const [overrideData, setOverrideData] = useState<{
    order_id: string;
    decision: 'APPROVED' | 'REJECTED';
    override_reason: string;
    approved_amount: number;
    notes: string;
  }>({
    order_id: '',
    decision: 'APPROVED',
    override_reason: '',
    approved_amount: 0,
    notes: '',
  })

  // Reset form when dialog opens with new order
  useEffect(() => {
    if (isOpen && salesOrder) {
      setOverrideData({
        order_id: salesOrder.id,
        decision: 'APPROVED',
        override_reason: '',
        approved_amount: salesOrder.total_amount,
        notes: '',
      })
    }
  }, [isOpen, salesOrder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!salesOrder) return

    try {
      // Transform the override data to match backend API expectations
      const creditDecisionData = {
        decision: overrideData.decision,
        notes: `${overrideData.override_reason}: ${overrideData.notes || ''}`.trim(),
      }

      await onCreditOverride(creditDecisionData)

      toast({
        title: "Credit Decision Overridden",
        description: `Order ${salesOrder.order_number} credit decision updated to ${overrideData.decision}`,
      })

      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Override Failed",
        description: error.message || "Failed to override credit decision",
        variant: "destructive",
      })
    }
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'APPROVED':
        return 'border-green-200 bg-green-50'
      case 'REJECTED':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-yellow-200 bg-yellow-50'
    }
  }

  if (!salesOrder) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Credit Decision Override - {salesOrder.order_number}
          </DialogTitle>
          <DialogDescription>
            Override the automated credit decision for this sales order. This action requires justification.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Order Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Order Date:</span>
                <p className="font-medium">{formatDate(salesOrder.order_date)}</p>
              </div>
              <div>
                <span className="text-gray-500">Total Amount:</span>
                <p className="font-medium flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {salesOrder.total_amount.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Current Status:</span>
                <Badge variant="outline" className={
                  salesOrder.status === "APPROVED" ? "bg-green-100 text-green-800" :
                  salesOrder.status === "REJECTED" ? "bg-red-100 text-red-800" :
                  "bg-blue-100 text-blue-800"
                }>
                  {salesOrder.status}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">Credit Status:</span>
                <Badge variant="outline" className={
                  salesOrder.credit_status === "APPROVED" ? "bg-green-100 text-green-800" :
                  salesOrder.credit_status === "REJECTED" ? "bg-red-100 text-red-800" :
                  "bg-blue-100 text-blue-800"
                }>
                  {salesOrder.credit_status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Override Decision */}
          <div className="space-y-2">
            <Label htmlFor="decision">Override Decision *</Label>
            <Select
              value={overrideData.decision}
              onValueChange={(value: 'APPROVED' | 'REJECTED') => setOverrideData({ ...overrideData, decision: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROVED">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Approve Order
                  </div>
                </SelectItem>
                <SelectItem value="REJECTED">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Reject Order
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Approved Amount (only for approved decisions) */}
          {overrideData.decision === 'APPROVED' && (
            <div className="space-y-2">
              <Label htmlFor="approved_amount">Approved Amount</Label>
              <Input
                id="approved_amount"
                type="number"
                step="0.01"
                value={overrideData.approved_amount}
                onChange={(e) => setOverrideData({ ...overrideData, approved_amount: parseFloat(e.target.value) || 0 })}
                placeholder="Enter approved amount"
              />
              <p className="text-xs text-gray-500">
                Original amount: ${salesOrder.total_amount.toFixed(2)}
              </p>
            </div>
          )}

          {/* Override Reason */}
          <div className="space-y-2">
            <Label htmlFor="override_reason">Override Reason *</Label>
            <Select
              value={overrideData.override_reason}
              onValueChange={(value) => setOverrideData({ ...overrideData, override_reason: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason for override" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXCEPTIONAL_CIRCUMSTANCES">Exceptional Circumstances</SelectItem>
                <SelectItem value="STRATEGIC_CUSTOMER">Strategic Customer</SelectItem>
                <SelectItem value="PAYMENT_GUARANTEE">Payment Guarantee</SelectItem>
                <SelectItem value="MANAGEMENT_APPROVAL">Management Approval</SelectItem>
                <SelectItem value="DATA_CORRECTION">Data Correction</SelectItem>
                <SelectItem value="SPECIAL_TERMS">Special Terms Agreement</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={overrideData.notes}
              onChange={(e) => setOverrideData({ ...overrideData, notes: e.target.value })}
              placeholder="Provide additional context or justification for this override..."
              rows={3}
            />
          </div>

          {/* Warning */}
          <div className={`p-4 rounded-lg border ${getDecisionColor(overrideData.decision)}`}>
            <div className="flex items-start gap-3">
              {getDecisionIcon(overrideData.decision)}
              <div>
                <h4 className="font-medium mb-1">
                  {overrideData.decision === 'APPROVED' ? 'Approving Order' : 'Rejecting Order'}
                </h4>
                <p className="text-sm">
                  {overrideData.decision === 'APPROVED'
                    ? 'This will override the automated credit decision and approve the order for processing.'
                    : 'This will override the automated credit decision and reject the order.'
                  }
                </p>
                <p className="text-xs mt-2 opacity-75">
                  This action will be logged and may require additional approval based on your organization's policies.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={overrideData.decision === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              disabled={isProcessing || !overrideData.override_reason.trim()}
            >
              {isProcessing ? (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Override Decision
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
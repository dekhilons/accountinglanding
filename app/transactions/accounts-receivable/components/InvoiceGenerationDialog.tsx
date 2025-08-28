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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate, formatCurrency, type SalesOrder, type InvoiceGenerationRequest } from "@/lib/ar-api"

interface InvoiceGenerationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  salesOrder: SalesOrder | null
  onInvoiceGeneration: (orderId: string, invoiceData: InvoiceGenerationRequest) => Promise<void>
  isGenerating?: boolean
}

export const InvoiceGenerationDialog: React.FC<InvoiceGenerationDialogProps> = ({
  isOpen,
  onOpenChange,
  salesOrder,
  onInvoiceGeneration,
  isGenerating = false
}) => {
  const { toast } = useToast()

  const [invoiceData, setInvoiceData] = useState<InvoiceGenerationRequest>({
    template_id: '',
    payment_terms: '',
  })

  // Reset form when dialog opens with new order
  useEffect(() => {
    if (isOpen && salesOrder) {
      setInvoiceData({
        template_id: 'default',
        payment_terms: salesOrder.payment_terms || 'Net 30',
      })
    }
  }, [isOpen, salesOrder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!salesOrder) return

    try {
      await onInvoiceGeneration(salesOrder.id, invoiceData)

      toast({
        title: "Invoice Generated",
        description: `Invoice generated successfully for order ${salesOrder.order_number}`,
      })

      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate invoice",
        variant: "destructive",
      })
    }
  }

  if (!salesOrder) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Invoice - {salesOrder.order_number}
          </DialogTitle>
          <DialogDescription>
            Generate an invoice for this approved sales order.
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
                <span className="text-gray-500">Status:</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 ml-1">
                  {salesOrder.status}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">Credit Status:</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 ml-1">
                  {salesOrder.credit_status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Invoice Template */}
          <div className="space-y-2">
            <Label htmlFor="template_id">Invoice Template</Label>
            <Select
              value={invoiceData.template_id}
              onValueChange={(value) => setInvoiceData({ ...invoiceData, template_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Template</SelectItem>
                <SelectItem value="professional">Professional Template</SelectItem>
                <SelectItem value="minimal">Minimal Template</SelectItem>
                <SelectItem value="detailed">Detailed Template</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Terms */}
          <div className="space-y-2">
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Select
              value={invoiceData.payment_terms}
              onValueChange={(value) => setInvoiceData({ ...invoiceData, payment_terms: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Net 15">Net 15</SelectItem>
                <SelectItem value="Net 30">Net 30</SelectItem>
                <SelectItem value="Net 45">Net 45</SelectItem>
                <SelectItem value="Net 60">Net 60</SelectItem>
                <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                <SelectItem value="Cash on Delivery">Cash on Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Preview Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-900">Invoice Preview</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Invoice Amount:</strong> ${salesOrder.total_amount.toFixed(2)}</p>
              <p><strong>Tax Amount:</strong> ${salesOrder.tax_amount.toFixed(2)}</p>
              <p><strong>Total:</strong> ${(salesOrder.total_amount + salesOrder.tax_amount).toFixed(2)}</p>
              <p><strong>Payment Terms:</strong> {invoiceData.payment_terms}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
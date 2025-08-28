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
import { Loader2, Truck, Package, CheckCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate, type SalesOrder, type FulfillmentUpdateRequest } from "@/lib/ar-api"

interface FulfillmentDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  salesOrder: SalesOrder | null
  onFulfillmentUpdate: (orderId: string, fulfillmentData: FulfillmentUpdateRequest) => Promise<void>
  isUpdating?: boolean
}

const fulfillmentStatuses = [
  { value: 'PENDING', label: 'Pending', icon: Clock, color: 'bg-gray-100 text-gray-800' },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: Package, color: 'bg-blue-100 text-blue-800' },
  { value: 'FULFILLED', label: 'Fulfilled', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'SHIPPED', label: 'Shipped', icon: Truck, color: 'bg-purple-100 text-purple-800' },
  { value: 'DELIVERED', label: 'Delivered', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800' },
]

export const FulfillmentDialog: React.FC<FulfillmentDialogProps> = ({
  isOpen,
  onOpenChange,
  salesOrder,
  onFulfillmentUpdate,
  isUpdating = false
}) => {
  const { toast } = useToast()

  const [fulfillmentData, setFulfillmentData] = useState<FulfillmentUpdateRequest>({
    fulfillment_status: 'PENDING',
    fulfillment_date: '',
    tracking_number: '',
    carrier: '',
    shipping_address: '',
    delivery_date: '',
    fulfillment_notes: '',
  })

  // Reset form when dialog opens with new order
  useEffect(() => {
    if (isOpen && salesOrder) {
      setFulfillmentData({
        fulfillment_status: salesOrder.fulfillment_status || 'PENDING',
        fulfillment_date: salesOrder.fulfillment_date || '',
        tracking_number: salesOrder.tracking_number || '',
        carrier: salesOrder.carrier || '',
        shipping_address: salesOrder.shipping_address || '',
        delivery_date: salesOrder.delivery_date || '',
        fulfillment_notes: salesOrder.fulfillment_notes || '',
      })
    }
  }, [isOpen, salesOrder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!salesOrder) return

    try {
      await onFulfillmentUpdate(salesOrder.id, fulfillmentData)

      toast({
        title: "Fulfillment Updated",
        description: `Order ${salesOrder.order_number} fulfillment status updated to ${fulfillmentData.fulfillment_status}`,
      })

      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update fulfillment status",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    const statusConfig = fulfillmentStatuses.find(s => s.value === status)
    return statusConfig ? statusConfig.icon : Clock
  }

  const getStatusColor = (status: string) => {
    const statusConfig = fulfillmentStatuses.find(s => s.value === status)
    return statusConfig ? statusConfig.color : 'bg-gray-100 text-gray-800'
  }

  if (!salesOrder) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Fulfillment - {salesOrder.order_number}
          </DialogTitle>
          <DialogDescription>
            Update fulfillment status and shipping information for this sales order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Order Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Customer:</span>
                <p className="font-medium">{salesOrder.customer_id}</p>
              </div>
              <div>
                <span className="text-gray-500">Order Date:</span>
                <p className="font-medium">{formatDate(salesOrder.order_date)}</p>
              </div>
              <div>
                <span className="text-gray-500">Total Amount:</span>
                <p className="font-medium">${salesOrder.total_amount.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <Badge variant="outline" className={getStatusColor(salesOrder.fulfillment_status || 'PENDING')}>
                  {salesOrder.fulfillment_status || 'PENDING'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Fulfillment Status */}
          <div className="space-y-2">
            <Label htmlFor="fulfillment_status">Fulfillment Status *</Label>
            <Select
              value={fulfillmentData.fulfillment_status}
              onValueChange={(value) => setFulfillmentData({ ...fulfillmentData, fulfillment_status: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fulfillment status" />
              </SelectTrigger>
              <SelectContent>
                {fulfillmentStatuses.map((status) => {
                  const IconComponent = status.icon
                  return (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {status.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Fulfillment Date */}
          <div className="space-y-2">
            <Label htmlFor="fulfillment_date">Fulfillment Date</Label>
            <Input
              id="fulfillment_date"
              type="datetime-local"
              value={fulfillmentData.fulfillment_date ? new Date(fulfillmentData.fulfillment_date).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFulfillmentData({
                ...fulfillmentData,
                fulfillment_date: e.target.value ? new Date(e.target.value).toISOString() : ''
              })}
            />
          </div>

          {/* Shipping Information */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Shipping Information
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tracking_number">Tracking Number</Label>
                <Input
                  id="tracking_number"
                  value={fulfillmentData.tracking_number}
                  onChange={(e) => setFulfillmentData({ ...fulfillmentData, tracking_number: e.target.value })}
                  placeholder="Enter tracking number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier</Label>
                <Select
                  value={fulfillmentData.carrier}
                  onValueChange={(value) => setFulfillmentData({ ...fulfillmentData, carrier: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPS">UPS</SelectItem>
                    <SelectItem value="FedEx">FedEx</SelectItem>
                    <SelectItem value="DHL">DHL</SelectItem>
                    <SelectItem value="USPS">USPS</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping_address">Shipping Address</Label>
              <Textarea
                id="shipping_address"
                value={fulfillmentData.shipping_address}
                onChange={(e) => setFulfillmentData({ ...fulfillmentData, shipping_address: e.target.value })}
                placeholder="Enter shipping address"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_date">Expected Delivery Date</Label>
              <Input
                id="delivery_date"
                type="datetime-local"
                value={fulfillmentData.delivery_date ? new Date(fulfillmentData.delivery_date).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFulfillmentData({
                  ...fulfillmentData,
                  delivery_date: e.target.value ? new Date(e.target.value).toISOString() : ''
                })}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="fulfillment_notes">Fulfillment Notes</Label>
            <Textarea
              id="fulfillment_notes"
              value={fulfillmentData.fulfillment_notes}
              onChange={(e) => setFulfillmentData({ ...fulfillmentData, fulfillment_notes: e.target.value })}
              placeholder="Add any notes about the fulfillment process..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Fulfillment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
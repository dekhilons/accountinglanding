import React, { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, Loader2, Truck, FileText, Eye, X, Package, Calendar, DollarSign, User, Hash } from "lucide-react"
import { useSalesOrderManagement } from "../hooks/useSalesOrderManagement"
import { useFulfillmentManagement } from "../hooks/useFulfillmentManagement"
import { useInvoiceGenerationManagement } from "../hooks/useInvoiceGenerationManagement"
import { FulfillmentDialog } from "./FulfillmentDialog"
import { InvoiceGenerationDialog } from "./InvoiceGenerationDialog"
import { FulfillmentStatusBadge } from "./FulfillmentStatusBadge"
import { formatCurrency, formatDate, type Customer, type SalesOrder } from "@/lib/ar-api"

interface SalesOrdersSectionProps {
  customers: Customer[];
}

export const SalesOrdersSection: React.FC<SalesOrdersSectionProps> = ({ customers }) => {
  // Local state for details panel
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)

  const {
    salesOrderView,
    setSalesOrderView,
    newSalesOrder,
    setNewSalesOrder,
    salesOrders,
    salesOrdersLoading,
    handleCreateSalesOrder,
  } = useSalesOrderManagement()

  const {
    isFulfillmentDialogOpen,
    selectedOrderForFulfillment,
    isUpdatingFulfillment,
    handleFulfillmentUpdate,
    openFulfillmentDialog,
    closeFulfillmentDialog,
    canFulfillOrder,
  } = useFulfillmentManagement()

  const {
    isInvoiceDialogOpen,
    selectedOrderForInvoice,
    isGeneratingInvoice,
    handleInvoiceGeneration,
    openInvoiceDialog,
    closeInvoiceDialog,
    canGenerateInvoice,
  } = useInvoiceGenerationManagement()

  // Handle row selection
  const handleOrderSelect = (order: SalesOrder) => {
    setSelectedOrder(order)
    setShowDetailPanel(true)
  }

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false)
    setSelectedOrder(null)
  }

  // Debug logging
  console.log('SalesOrdersSection render:', {
    salesOrdersCount: salesOrders.length,
    salesOrdersLoading,
    selectedOrder: selectedOrder?.id,
    showDetailPanel,
    firstOrder: salesOrders[0] ? {
      id: salesOrders[0].id,
      status: salesOrders[0].status,
      credit_status: salesOrders[0].credit_status,
      canFulfill: canFulfillOrder(salesOrders[0]),
      canGenerateInvoice: canGenerateInvoice(salesOrders[0])
    } : null
  })

  return (
    <div className={`grid gap-6 ${showDetailPanel ? "grid-cols-1 lg:grid-cols-5" : "col-span-1"}`}>
      {/* Master List */}
      <div className={showDetailPanel ? "lg:col-span-3" : "col-span-1"}>
        {salesOrderView === "list" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Sales Orders Overview</h3>
              <Button onClick={() => setSalesOrderView("create")} className="bg-teal-600 hover:bg-teal-700">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Sales Order
              </Button>
            </div>
            {salesOrdersLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-250px)]"> {/* Adjust height as needed */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Credit Status</TableHead>
                      <TableHead>Fulfillment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No sales orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      salesOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleOrderSelect(order)}
                        >
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{customers.find(c => c.id === order.customer_id)?.name || order.customer_id}</TableCell>
                          <TableCell>{formatDate(order.order_date)}</TableCell>
                          <TableCell>{formatCurrency(order.total_amount, order.currency)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              order.status === "PENDING" ? "bg-blue-100 text-blue-800" :
                              order.status === "APPROVED" ? "bg-green-100 text-green-800" :
                              order.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                            }>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              order.credit_status === "PENDING" ? "bg-blue-100 text-blue-800" :
                              order.credit_status === "APPROVED" ? "bg-green-100 text-green-800" :
                              order.credit_status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                            }>
                              {order.credit_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <FulfillmentStatusBadge status={order.fulfillment_status} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        )}

      {salesOrderView === "create" && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Create New Sales Order</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenant_id_so">Tenant ID (Mandatory)</Label>
              <Input
                id="tenant_id_so"
                value={newSalesOrder.tenant_id}
                onChange={(e) => setNewSalesOrder({ ...newSalesOrder, tenant_id: e.target.value })}
                placeholder="e.g., org-abc-123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_id_so">Customer (Mandatory)</Label>
              <Select
                value={newSalesOrder.customer_id}
                onValueChange={(value) => setNewSalesOrder({ ...newSalesOrder, customer_id: value })}
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
              <Label htmlFor="order_date">Order Date</Label>
              <Input
                id="order_date"
                type="datetime-local"
                value={newSalesOrder.order_date ? newSalesOrder.order_date.substring(0, 16) : ''}
                onChange={(e) => setNewSalesOrder({ ...newSalesOrder, order_date: e.target.value ? new Date(e.target.value).toISOString() : '' })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requested_delivery_date">Requested Delivery Date</Label>
              <Input
                id="requested_delivery_date"
                type="datetime-local"
                value={newSalesOrder.requested_delivery_date ? new Date(newSalesOrder.requested_delivery_date).toISOString().substring(0, 16) : ''}
                onChange={(e) => setNewSalesOrder({ ...newSalesOrder, requested_delivery_date: e.target.value ? new Date(e.target.value).toISOString() : '' })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_terms_so">Payment Terms</Label>
            <Input
              id="payment_terms_so"
              value={newSalesOrder.payment_terms}
              onChange={(e) => setNewSalesOrder({ ...newSalesOrder, payment_terms: e.target.value })}
              placeholder="e.g., Net 30"
            />
          </div>

          <h4 className="text-md font-medium mt-4">Order Lines (Minimum 1)</h4>
          <div className="space-y-2 border p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="line_description">Description</Label>
                <Input
                  id="line_description"
                  value={newSalesOrder.order_lines[0]?.description || ''}
                  onChange={(e) => {
                    const updatedLines = [...newSalesOrder.order_lines];
                    if (!updatedLines[0]) updatedLines[0] = { line_number: 1, description: '', quantity: 0, unit_price: 0 };
                    updatedLines[0].description = e.target.value;
                    setNewSalesOrder({ ...newSalesOrder, order_lines: updatedLines });
                  }}
                  placeholder="e.g., Product A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="line_quantity">Quantity</Label>
                <Input
                  id="line_quantity"
                  type="number"
                  value={newSalesOrder.order_lines[0]?.quantity || 0}
                  onChange={(e) => {
                    const updatedLines = [...newSalesOrder.order_lines];
                    if (!updatedLines[0]) updatedLines[0] = { line_number: 1, description: '', quantity: 0, unit_price: 0 };
                    updatedLines[0].quantity = parseFloat(e.target.value);
                    setNewSalesOrder({ ...newSalesOrder, order_lines: updatedLines });
                  }}
                  placeholder="e.g., 1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="line_unit_price">Unit Price</Label>
                <Input
                  id="line_unit_price"
                  type="number"
                  value={newSalesOrder.order_lines[0]?.unit_price || 0}
                  onChange={(e) => {
                    const updatedLines = [...newSalesOrder.order_lines];
                    if (!updatedLines[0]) updatedLines[0] = { line_number: 1, description: '', quantity: 0, unit_price: 0 };
                    updatedLines[0].unit_price = parseFloat(e.target.value);
                    setNewSalesOrder({ ...newSalesOrder, order_lines: updatedLines });
                  }}
                  placeholder="e.g., 100.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="line_tax_rate">Tax Rate (%)</Label>
                <Input
                  id="line_tax_rate"
                  type="number"
                  value={newSalesOrder.order_lines[0]?.tax_rate || 0}
                  onChange={(e) => {
                    const updatedLines = [...newSalesOrder.order_lines];
                    if (!updatedLines[0]) updatedLines[0] = { line_number: 1, description: '', quantity: 0, unit_price: 0 };
                    updatedLines[0].tax_rate = parseFloat(e.target.value);
                    setNewSalesOrder({ ...newSalesOrder, order_lines: updatedLines });
                  }}
                  placeholder="e.g., 0.05 (for 5%)"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes_so">Notes</Label>
            <Textarea
              id="notes_so"
              value={newSalesOrder.notes || ''}
              onChange={(e) => setNewSalesOrder({ ...newSalesOrder, notes: e.target.value })}
              placeholder="Add any relevant notes here..."
              rows={3}
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleCreateSalesOrder} className="bg-teal-600 hover:bg-teal-700">
              Create Sales Order
            </Button>
            <Button variant="outline" onClick={() => setSalesOrderView("list")}>
              Cancel
            </Button>
          </div>
        </div>)}
      </div>

      {/* Detail Panel */}
      {showDetailPanel && selectedOrder && (
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Order: {selectedOrder.order_number}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={handleCloseDetailPanel} className="h-6 w-6">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-full flex flex-col p-4"> {/* Added h-full, flex-col, p-4 */}
              <div className="flex-grow overflow-y-auto space-y-6"> {/* Added flex-grow, overflow-y-auto */}
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{customers.find(c => c.id === selectedOrder.customer_id)?.name || selectedOrder.customer_id}</p>
                    <Badge variant="outline" className={
                      selectedOrder.status === "PENDING" ? "bg-blue-100 text-blue-800" :
                      selectedOrder.status === "APPROVED" ? "bg-green-100 text-green-800" :
                      selectedOrder.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                    }>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <Badge variant="outline" className={
                    selectedOrder.credit_status === "PENDING" ? "bg-blue-50 text-blue-700" :
                    selectedOrder.credit_status === "APPROVED" ? "bg-green-50 text-green-700" :
                    selectedOrder.credit_status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700"
                  }>
                    {selectedOrder.credit_status}
                  </Badge>
                </div>

                <Separator />

                {/* Document Viewer (Placeholder) */}
                <div>
                  <h3 className="font-medium mb-2">Order Document</h3>
                  <div className="p-8 bg-gray-50 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Sales order document details
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Order Details */}
                <div>
                  <h3 className="font-medium mb-2">Order Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Order Date:</span>
                      <span>{formatDate(selectedOrder.order_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Amount:</span>
                      <span>{formatCurrency(selectedOrder.total_amount, selectedOrder.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Terms:</span>
                      <span>{selectedOrder.payment_terms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Requested Delivery:</span>
                      <span>{selectedOrder.requested_delivery_date ? formatDate(selectedOrder.requested_delivery_date) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fulfillment Status:</span>
                      <span><FulfillmentStatusBadge status={selectedOrder.fulfillment_status} /></span>
                    </div>
                    {selectedOrder.tracking_number && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tracking Number:</span>
                        <span>{selectedOrder.tracking_number}</span>
                      </div>
                    )}
                    {selectedOrder.carrier && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Carrier:</span>
                        <span>{selectedOrder.carrier}</span>
                      </div>
                    )}
                    {selectedOrder.fulfillment_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fulfillment Date:</span>
                        <span>{formatDate(selectedOrder.fulfillment_date)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Order Lines */}
                <div>
                  <h3 className="font-medium mb-3">Order Lines</h3>
                  {selectedOrder.order_lines && selectedOrder.order_lines.length > 0 ? (
                    <div className="space-y-3">
                      {selectedOrder.order_lines.map((line, index) => (
                        <Card key={index} className="p-3">
                          <p className="font-medium text-sm">{line.description}</p>
                          <div className="text-xs text-gray-600">
                            <p>Quantity: {line.quantity}</p>
                            <p>Unit Price: {formatCurrency(line.unit_price, selectedOrder.currency)}</p>
                            {line.tax_rate !== undefined && line.tax_rate !== null && (
                              <p>Tax Rate: {(line.tax_rate * 100).toFixed(2)}%</p>
                            )}
                            <p>Line Total: {formatCurrency(line.quantity * line.unit_price * (1 + (line.tax_rate || 0)), selectedOrder.currency)}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No order lines found.</p>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div>
                  <h3 className="font-medium mb-3">Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    {canFulfillOrder(selectedOrder) && (
                      <Button
                        onClick={() => openFulfillmentDialog(selectedOrder)}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isUpdatingFulfillment}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        {isUpdatingFulfillment ? 'Updating...' : 'Fulfill Order'}
                      </Button>
                    )}
                    {canGenerateInvoice(selectedOrder) && (
                      <Button
                        onClick={() => openInvoiceDialog(selectedOrder)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isGeneratingInvoice}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {isGeneratingInvoice ? 'Generating...' : 'Generate Invoice'}
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleCloseDetailPanel}>
                      <Eye className="w-4 h-4 mr-2" />
                      Close Details
                    </Button>
                  </div>
                </div>

                {/* Additional Details / Notes */}
                {selectedOrder.notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-2">Notes</h3>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fulfillment Dialog */}
      <FulfillmentDialog
        isOpen={isFulfillmentDialogOpen}
        onOpenChange={closeFulfillmentDialog}
        salesOrder={selectedOrderForFulfillment}
        onFulfillmentUpdate={handleFulfillmentUpdate}
        isUpdating={isUpdatingFulfillment}
      />

      {/* Invoice Generation Dialog */}
      <InvoiceGenerationDialog
        isOpen={isInvoiceDialogOpen}
        onOpenChange={closeInvoiceDialog}
        salesOrder={selectedOrderForInvoice}
        onInvoiceGeneration={handleInvoiceGeneration}
        isGenerating={isGeneratingInvoice}
      />
    </div>
  )
}

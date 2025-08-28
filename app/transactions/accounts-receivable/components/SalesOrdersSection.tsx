import React from "react"
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
import { PlusCircle, Loader2 } from "lucide-react"
import { useSalesOrderManagement } from "../hooks/useSalesOrderManagement"
import { formatCurrency, formatDate, type Customer } from "@/lib/ar-api"

interface SalesOrdersSectionProps {
  customers: Customer[];
}

export const SalesOrdersSection: React.FC<SalesOrdersSectionProps> = ({ customers }) => {
  const {
    salesOrderView,
    setSalesOrderView,
    newSalesOrder,
    setNewSalesOrder,
    salesOrders,
    salesOrdersLoading,
    handleCreateSalesOrder,
  } = useSalesOrderManagement()

  return (
    <div className="space-y-4">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credit Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No sales orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  salesOrders.map((order) => (
                    <TableRow key={order.id}>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
        </div>
      )}
    </div>
  )
}

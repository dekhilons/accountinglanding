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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator" // Added import for Separator
import { PlusCircle, Eye, Loader2 } from "lucide-react"
import { useCustomerManagement } from "../hooks/useCustomerManagement"
import { formatCurrency, formatDate } from "@/lib/ar-api" // Assuming these are still needed for display

export const CustomersSection = () => {
  const {
    customerView,
    setCustomerView,
    selectedCustomer,
    setSelectedCustomer,
    newCustomer,
    setNewCustomer,
    customerSearchTerm,
    setCustomerSearchTerm,
    customersLoading,
    filteredCustomers,
    handleEditCustomer,
    handleDeleteCustomer,
    handleSaveCustomer,
  } = useCustomerManagement()

  return (
    <div className="space-y-4">
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
          {customersLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
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
          )}
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
              <Input
                id="payment_terms"
                type="number"
                value={newCustomer.payment_terms}
                onChange={(e) => setNewCustomer({ ...newCustomer, payment_terms: parseInt(e.target.value) })}
                placeholder="e.g., 30"
              />
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
              <p>{selectedCustomer.credit_limit ? formatCurrency(selectedCustomer.credit_limit) : "N/A"}</p>
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
              <p>{formatDate(selectedCustomer.created_at)}</p>
            </div>
            <div>
              <Label>Updated At</Label>
              <p>{formatDate(selectedCustomer.updated_at)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

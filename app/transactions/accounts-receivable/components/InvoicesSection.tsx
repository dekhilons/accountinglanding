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
import { Separator } from "@/components/ui/separator" // Added import for Separator
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Eye, Loader2 } from "lucide-react"
import { useInvoiceManagement } from "../hooks/useInvoiceManagement"
import { formatCurrency, formatDate, type Customer } from "@/lib/ar-api" // Import Customer type

interface InvoicesSectionProps {
  customers: Customer[]; // Pass customers for dropdown
}

export const InvoicesSection: React.FC<InvoicesSectionProps> = ({ customers }) => {
  const {
    invoiceView,
    setInvoiceView,
    selectedInvoice,
    setSelectedInvoice,
    newInvoice,
    setNewInvoice,
    invoiceSearchTerm,
    setInvoiceSearchTerm,
    invoiceFilterCustomer,
    setInvoiceFilterCustomer,
    invoiceFilterStatus,
    setInvoiceFilterStatus,
    invoicesLoading,
    filteredInvoices,
    handleSaveInvoice,
    handleEditInvoice,
    handleDeleteInvoice,
  } = useInvoiceManagement()

  return (
    <div className="space-y-4">
      {invoiceView === "list" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <Input
              placeholder="Search invoices by number..."
              value={invoiceSearchTerm}
              onChange={(e) => setInvoiceSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={invoiceFilterCustomer} onValueChange={setInvoiceFilterCustomer}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((cust) => (
                  <SelectItem key={cust.id} value={cust.id}>
                    {cust.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={invoiceFilterStatus} onValueChange={setInvoiceFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setInvoiceView("create")} className="bg-teal-600 hover:bg-teal-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Invoice
            </Button>
          </div>

          {invoicesLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{customers.find(c => c.id === invoice.customer_id)?.name || invoice.customer_id}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          invoice.status === "OPEN" ? "bg-blue-100 text-blue-800" :
                          invoice.status === "PAID" ? "bg-green-100 text-green-800" :
                          invoice.status === "OVERDUE" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                        }>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedInvoice(invoice)
                            setInvoiceView("details")
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

      {(invoiceView === "create" || invoiceView === "edit") && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {invoiceView === "create" ? "Create New Invoice" : "Edit Invoice"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number (Mandatory)</Label>
              <Input
                id="invoice_number"
                value={newInvoice.invoice_number}
                onChange={(e) => setNewInvoice({ ...newInvoice, invoice_number: e.target.value })}
                placeholder="e.g., INV-2025-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer (Mandatory)</Label>
              <Select
                value={newInvoice.customer_id}
                onValueChange={(value) => setNewInvoice({ ...newInvoice, customer_id: value })}
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
              <Label htmlFor="amount">Amount (Mandatory)</Label>
              <Input
                id="amount"
                type="number"
                value={newInvoice.amount}
                onChange={(e) => setNewInvoice({ ...newInvoice, amount: parseFloat(e.target.value) })}
                placeholder="e.g., 1000.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_amount">Tax Amount</Label>
              <Input
                id="tax_amount"
                type="number"
                value={newInvoice.tax_amount}
                onChange={(e) => setNewInvoice({ ...newInvoice, tax_amount: parseFloat(e.target.value) })}
                placeholder="e.g., 100.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={newInvoice.currency}
                onValueChange={(value) => setNewInvoice({ ...newInvoice, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue_date">Issue Date (Mandatory)</Label>
              <Input
                id="issue_date"
                type="date"
                value={newInvoice.issue_date}
                onChange={(e) => setNewInvoice({ ...newInvoice, issue_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date (Mandatory)</Label>
              <Input
                id="due_date"
                type="date"
                value={newInvoice.due_date}
                onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant_id">Tenant ID (Mandatory)</Label>
              <Input
                id="tenant_id"
                value={newInvoice.tenant_id}
                onChange={(e) => setNewInvoice({ ...newInvoice, tenant_id: e.target.value })}
                placeholder="e.g., org-abc-123"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newInvoice.description}
              onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
              placeholder="e.g., Monthly subscription for cloud services"
              rows={3}
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSaveInvoice} className="bg-teal-600 hover:bg-teal-700">
              {invoiceView === "create" ? "Submit Invoice" : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => setInvoiceView("list")}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {invoiceView === "details" && selectedInvoice && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Invoice: {selectedInvoice.invoice_number}</h3>
            <Button variant="outline" onClick={() => setInvoiceView("list")}>
              Back to List
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice ID</Label>
              <p className="font-medium">{selectedInvoice.id}</p>
            </div>
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <p className="font-medium">{selectedInvoice.invoice_number}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <p className="font-medium">{customers.find(c => c.id === selectedInvoice.customer_id)?.name || selectedInvoice.customer_id}</p>
            </div>
            <div className="space-y-2">
              <Label>Tenant ID</Label>
              <p className="font-medium">{selectedInvoice.tenant_id}</p>
            </div>
          </div>

          {/* Separator is not imported here, but it was in the original page.tsx */}
          {/* <Separator /> */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <p>{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</p>
            </div>
            <div className="space-y-2">
              <Label>Tax Amount</Label>
              <p>{formatCurrency(selectedInvoice.tax_amount, selectedInvoice.currency)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <p>{formatDate(selectedInvoice.issue_date)}</p>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <p>{formatDate(selectedInvoice.due_date)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Badge variant="outline" className={
              selectedInvoice.status === "OPEN" ? "bg-blue-100 text-blue-800" :
              selectedInvoice.status === "PAID" ? "bg-green-100 text-green-800" :
              selectedInvoice.status === "OVERDUE" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
            }>
              {selectedInvoice.status}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <p>{selectedInvoice.description || "N/A"}</p>
          </div>

          <div className="flex space-x-2">
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleEditInvoice}
            >
              Edit Invoice
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteInvoice(selectedInvoice.id)}
            >
              Delete Invoice
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

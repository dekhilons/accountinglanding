"use client"

import React from "react"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PaymentCreate, Customer } from "@/lib/ar-api"

interface SubmitPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newPayment: PaymentCreate;
  setNewPayment: React.Dispatch<React.SetStateAction<PaymentCreate>>;
  onSubmit: () => Promise<void>;
  isUploading: boolean; // Assuming this might be passed down if upload is integrated
  customers: Customer[]; // Assuming customers are needed for a dropdown or similar
}

const SubmitPaymentDialog: React.FC<SubmitPaymentDialogProps> = ({
  isOpen,
  onOpenChange,
  newPayment,
  setNewPayment,
  onSubmit,
  isUploading,
  customers,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Send className="mr-2 h-4 w-4" />
          Submit New Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Submit New Payment</DialogTitle>
          <DialogDescription>Manually create and submit a new payment record.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tenant_id" className="text-right">
              Tenant ID
            </Label>
            <Input
              id="tenant_id"
              value={newPayment.tenant_id}
              onChange={(e) => setNewPayment({ ...newPayment, tenant_id: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer_id" className="text-right">
              Customer ID
            </Label>
            {/* You might want a Select component here for customer_id */}
            <Select
              value={newPayment.customer_id}
              onValueChange={(value) => setNewPayment({ ...newPayment, customer_id: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment_number" className="text-right">
              Payment Number
            </Label>
            <Input
              id="payment_number"
              value={newPayment.payment_number}
              onChange={(e) => setNewPayment({ ...newPayment, payment_number: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={newPayment.amount}
              onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currency" className="text-right">
              Currency
            </Label>
            <Select
              value={newPayment.currency}
              onValueChange={(value) => setNewPayment({ ...newPayment, currency: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment_date" className="text-right">
              Payment Date
            </Label>
            <Input
              id="payment_date"
              type="date"
              value={newPayment.payment_date.split('T')[0]} // Display only the date part for the date input
              onChange={(e) => {
                const selectedDate = e.target.value; // This will be in YYYY-MM-DD format
                // Convert to ISO string for consistency with backend expectation
                setNewPayment({ ...newPayment, payment_date: new Date(selectedDate).toISOString() });
              }}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment_method" className="text-right">
              Payment Method
            </Label>
            <Select
              value={newPayment.payment_method}
              onValueChange={(value) => setNewPayment({ ...newPayment, payment_method: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WIRE">WIRE</SelectItem>
                <SelectItem value="CHECK">CHECK</SelectItem>
                <SelectItem value="CREDIT_CARD">CREDIT_CARD</SelectItem>
                <SelectItem value="ACH">ACH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reference_number" className="text-right">
              Reference Number
            </Label>
            <Input
              id="reference_number"
              value={newPayment.reference_number}
              onChange={(e) => setNewPayment({ ...newPayment, reference_number: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={newPayment.description}
              onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={onSubmit}>
            Submit Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SubmitPaymentDialog

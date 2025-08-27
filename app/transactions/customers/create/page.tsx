"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

// Define CustomerCreate type based on backend schema
type CustomerCreate = {
  customer_number: string
  name: string
  address?: string
  contact_email?: string
  contact_phone?: string
  payment_terms?: number
  credit_limit?: number
  is_active?: boolean
  tenant_id: string
  metadata?: Record<string, any> // Using a generic record type for metadata
}

export default function CreateCustomerPage() {
  const { toast } = useToast()
  const [customer, setCustomer] = useState<CustomerCreate>({
    customer_number: "",
    name: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    payment_terms: 30, // Default value
    credit_limit: 0,
    is_active: true, // Default value
    tenant_id: "",
    metadata: {},
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type, checked } = e.target as HTMLInputElement
    setCustomer((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setCustomer((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleCreateCustomer = async () => {
    // Basic validation
    if (!customer.customer_number || !customer.name || !customer.tenant_id) {
      toast({
        title: "Error",
        description: "Customer Number, Name, and Tenant ID are mandatory fields.",
        variant: "destructive",
      })
      return
    }

    try {
      // Simulate API call to POST /api/v1/customers
      console.log("Creating customer:", customer)
      // In a real app, you would use fetch or a library like axios here:
      // const response = await fetch('/api/v1/customers', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(customer),
      // });
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || 'Failed to create customer');
      // }
      // const result = await response.json();

      toast({
        title: "Customer Created",
        description: `Customer ${customer.name} (${customer.customer_number}) has been created successfully.`,
      })

      // Optionally clear form or redirect
      setCustomer({
        customer_number: "",
        name: "",
        address: "",
        contact_email: "",
        contact_phone: "",
        payment_terms: 30,
        credit_limit: 0,
        is_active: true,
        tenant_id: "",
        metadata: {},
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create New Customer</h1>
            <p className="text-muted-foreground">Add a new customer record to the system.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Fill in the details for the new customer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_number">Customer Number (Mandatory)</Label>
                <Input
                  id="customer_number"
                  value={customer.customer_number}
                  onChange={handleInputChange}
                  placeholder="e.g., CUST-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name (Mandatory)</Label>
                <Input
                  id="name"
                  value={customer.name}
                  onChange={handleInputChange}
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
                  value={customer.contact_email}
                  onChange={handleInputChange}
                  placeholder="e.g., contact@acme.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={customer.contact_phone}
                  onChange={handleInputChange}
                  placeholder="e.g., +1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={customer.address}
                onChange={handleInputChange}
                placeholder="Street, City, State, Zip, Country"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms (days)</Label>
                <Select
                  value={customer.payment_terms?.toString()}
                  onValueChange={(value) => handleSelectChange("payment_terms", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="45">45 Days</SelectItem>
                    <SelectItem value="60">60 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="credit_limit">Credit Limit</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  value={customer.credit_limit}
                  onChange={handleInputChange}
                  placeholder="e.g., 10000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenant_id">Tenant ID (Mandatory)</Label>
                <Input
                  id="tenant_id"
                  value={customer.tenant_id}
                  onChange={handleInputChange}
                  placeholder="e.g., org-abc-123"
                />
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id="is_active"
                  checked={customer.is_active}
                  onCheckedChange={(checked) => setCustomer((prev) => ({ ...prev, is_active: checked as boolean }))}
                />
                <Label htmlFor="is_active">Is Active</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadata">Metadata (JSON)</Label>
              <Textarea
                id="metadata"
                value={JSON.stringify(customer.metadata, null, 2)}
                onChange={(e) => {
                  try {
                    setCustomer((prev) => ({ ...prev, metadata: JSON.parse(e.target.value) }))
                  } catch (error) {
                    // Handle invalid JSON input
                    console.error("Invalid JSON for metadata:", error)
                  }
                }}
                placeholder='e.g., { "industry": "retail" }'
                rows={5}
              />
            </div>

            <Button onClick={handleCreateCustomer} className="bg-blue-600 hover:bg-blue-700">
              Create Customer
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

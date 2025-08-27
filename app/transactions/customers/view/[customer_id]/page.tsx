"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Define CustomerResponse type based on backend schema
type CustomerResponse = {
  id: string
  customer_number: string
  name: string
  address?: string
  contact_email?: string
  contact_phone?: string
  payment_terms?: number
  credit_limit?: number
  is_active: boolean
  tenant_id: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export default function ViewCustomerPage() {
  const { toast } = useToast()
  const params = useParams()
  const customerId = params.customer_id as string
  const [customer, setCustomer] = useState<CustomerResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) {
        setError("Customer ID is missing.")
        setLoading(false)
        return
      }

      try {
        // Simulate API call to GET /api/v1/customers/{customer_id}
        // In a real app, you would use fetch or a library like axios here:
        // const response = await fetch(`/api/v1/customers/${customerId}`);
        // if (!response.ok) {
        //   if (response.status === 404) {
        //     throw new Error("Customer not found.");
        //   }
        //   const errorData = await response.json();
        //   throw new Error(errorData.detail || 'Failed to fetch customer');
        // }
        // const data = await response.json();
        // setCustomer(data);

        // Mock data for demonstration
        const mockCustomer: CustomerResponse = {
          id: customerId,
          customer_number: "CUST-001",
          name: "Acme Corporation",
          address: "123 Main St, Anytown, USA",
          contact_email: "contact@acme.com",
          contact_phone: "+1 (555) 123-4567",
          payment_terms: 30,
          credit_limit: 50000,
          is_active: true,
          tenant_id: "org-abc-123",
          metadata: { industry: "manufacturing", tier: "gold" },
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-07-20T14:30:00Z",
        }
        setCustomer(mockCustomer)
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while fetching customer details.")
        toast({
          title: "Error",
          description: err.message || "Failed to load customer details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCustomer()
  }, [customerId, toast])

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">Loading Customer Details...</h1>
          <p className="text-muted-foreground">Please wait while we fetch the customer information.</p>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </AppShell>
    )
  }

  if (!customer) {
    return (
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">Customer Not Found</h1>
          <p className="text-muted-foreground">No customer details found for ID: {customerId}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customer Details: {customer.name}</h1>
            <p className="text-muted-foreground">Detailed information for {customer.customer_number}</p>
          </div>
          {/* Optional: Edit/Delete buttons can go here */}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Key information about the customer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer ID</Label>
                <p className="font-medium">{customer.id}</p>
              </div>
              <div className="space-y-2">
                <Label>Customer Number</Label>
                <p className="font-medium">{customer.customer_number}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <p className="font-medium">{customer.name}</p>
              </div>
              <div className="space-y-2">
                <Label>Tenant ID</Label>
                <p className="font-medium">{customer.tenant_id}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <p>{customer.contact_email || "N/A"}</p>
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <p>{customer.contact_phone || "N/A"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <p>{customer.address || "N/A"}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <p>{customer.payment_terms ? `${customer.payment_terms} days` : "N/A"}</p>
              </div>
              <div className="space-y-2">
                <Label>Credit Limit</Label>
                <p>{customer.credit_limit ? `$${customer.credit_limit.toLocaleString()}` : "N/A"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Badge variant={customer.is_active ? "default" : "destructive"}>
                {customer.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Metadata</Label>
              <pre className="p-2 bg-gray-100 rounded-md text-sm overflow-auto">
                {JSON.stringify(customer.metadata, null, 2)}
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Created At</Label>
                <p>{new Date(customer.created_at).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <Label>Updated At</Label>
                <p>{new Date(customer.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

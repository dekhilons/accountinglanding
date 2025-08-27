"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Eye, PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

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

export default function CustomerListPage() {
  const { toast } = useToast()
  const [customers, setCustomers] = useState<CustomerResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // Simulate API call to GET /api/v1/customers
        // In a real app, you would use fetch or a library like axios here:
        // const response = await fetch('/api/v1/customers');
        // if (!response.ok) {
        //   const errorData = await response.json();
        //   throw new Error(errorData.detail || 'Failed to fetch customers');
        // }
        // const data = await response.json();
        // setCustomers(data);

        // Mock data for demonstration
        const mockCustomers: CustomerResponse[] = [
          {
            id: "cust-123",
            customer_number: "CUST-001",
            name: "Acme Corporation",
            address: "123 Main St, Anytown, USA",
            contact_email: "contact@acme.com",
            contact_phone: "+1 (555) 123-4567",
            payment_terms: 30,
            credit_limit: 50000,
            is_active: true,
            tenant_id: "org-abc-123",
            metadata: { industry: "manufacturing" },
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-07-20T14:30:00Z",
          },
          {
            id: "cust-124",
            customer_number: "CUST-002",
            name: "Tech Solutions Inc.",
            address: "456 Tech Ave, Techville, USA",
            contact_email: "info@techsolutions.com",
            contact_phone: "+1 (555) 987-6543",
            payment_terms: 45,
            credit_limit: 75000,
            is_active: true,
            tenant_id: "org-abc-123",
            metadata: { industry: "software" },
            created_at: "2024-02-01T09:00:00Z",
            updated_at: "2024-07-22T10:00:00Z",
          },
          {
            id: "cust-125",
            customer_number: "CUST-003",
            name: "Global Innovations Ltd.",
            address: "789 Global Blvd, World City, UK",
            contact_email: "sales@globalinnovations.co.uk",
            contact_phone: "+44 20 1234 5678",
            payment_terms: 60,
            credit_limit: 100000,
            is_active: false,
            tenant_id: "org-xyz-456",
            metadata: { region: "EMEA" },
            created_at: "2024-03-10T11:00:00Z",
            updated_at: "2024-07-18T16:00:00Z",
          },
        ]
        setCustomers(mockCustomers)
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while fetching customers.")
        toast({
          title: "Error",
          description: err.message || "Failed to load customer list.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [toast])

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customer_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">Loading Customers...</h1>
          <p className="text-muted-foreground">Please wait while we fetch the customer list.</p>
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

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customer List</h1>
            <p className="text-muted-foreground">View and manage customer records.</p>
          </div>
          <Link href="/transactions/customers/create">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Customer
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>A comprehensive list of all your customers.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search customers by name, number, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tenant ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                      <TableCell>{customer.tenant_id}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/transactions/customers/view/${customer.id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

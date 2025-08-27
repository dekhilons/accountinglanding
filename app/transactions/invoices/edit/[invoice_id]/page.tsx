"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { getInvoiceById, updateInvoice, UpdateInvoiceRequest, InvoiceDetailsResponseSchema } from "@/lib/ap/ap"

export default function EditInvoicePage() {
  const { toast } = useToast()
  const params = useParams()
  const invoiceId = params.invoice_id as string
  const [invoice, setInvoice] = useState<InvoiceDetailsResponseSchema | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(true) // Always in edit mode for this page
  const [editedInvoice, setEditedInvoice] = useState<Partial<InvoiceDetailsResponseSchema> | null>(null)

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) {
        setError("Invoice ID is missing.")
        setLoading(false)
        return
      }

      try {
        const fetchedInvoice = await getInvoiceById(invoiceId)
        setInvoice(fetchedInvoice)
        setEditedInvoice(fetchedInvoice)
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while fetching invoice details.")
        toast({
          title: "Error",
          description: err.message || "Failed to load invoice details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [invoiceId, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditedInvoice((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setEditedInvoice((prev) => ({ ...prev, is_active: checked })) // Assuming is_active for invoices
  }

  const handleSave = async () => {
    if (!editedInvoice || !editedInvoice.action_id) return

    setLoading(true)
    try {
      // TODO: Replace with actual tenant_id from context/auth
      await updateInvoice({ ...editedInvoice, tenant_id: "test-tenant" } as UpdateInvoiceRequest)
      toast({ title: "Invoice Updated", description: "Invoice details updated successfully." })
      setIsEditing(false) // Exit edit mode after saving
      setInvoice(editedInvoice as InvoiceDetailsResponseSchema) // Optimistic update
    } catch (err: any) {
      console.error("Failed to update invoice:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update invoice details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">Loading Invoice Details...</h1>
          <p className="text-muted-foreground">Please wait while we fetch the invoice information.</p>
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

  if (!invoice) {
    return (
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">Invoice Not Found</h1>
          <p className="text-muted-foreground">No invoice details found for ID: {invoiceId}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Invoice: {invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground">Modify invoice details.</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>Update the information for this invoice.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice ID</Label>
                <p className="font-medium">{invoice.action_id}</p>
              </div>
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  name="invoiceNumber"
                  value={editedInvoice?.invoiceNumber || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor Name</Label>
                <Input
                  name="vendorName"
                  value={editedInvoice?.vendorName || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  name="invoiceDate"
                  value={editedInvoice?.invoiceDate || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input
                  type="number"
                  name="total"
                  value={editedInvoice?.total || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input
                  name="currency"
                  value={editedInvoice?.currency || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Purchase Order Number</Label>
              <Input
                name="purchaseOrderNumber"
                value={editedInvoice?.purchaseOrderNumber || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Line Items (JSON)</Label>
              <Textarea
                name="lineItems"
                value={JSON.stringify(editedInvoice?.lineItems || [], null, 2)}
                onChange={(e) => {
                  try {
                    setEditedInvoice((prev) => ({ ...prev, lineItems: JSON.parse(e.target.value) }));
                  } catch (error) {
                    console.error("Invalid JSON for line items:", error);
                    // Optionally, show a toast or error message to the user
                  }
                }}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Input
                name="status"
                value={editedInvoice?.status || ""}
                onChange={handleChange}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={editedInvoice?.is_active || false}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="is_active">Is Active</Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

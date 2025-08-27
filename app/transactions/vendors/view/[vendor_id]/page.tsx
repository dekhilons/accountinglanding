"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { DwDimVendorResponseSchema, getVendorById, updateVendor, UpdateVendorRequest } from "@/lib/ap/ap"
import { ArrowLeft } from "lucide-react"

export default function ViewVendorPage() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const vendorId = params.vendor_id as string

  const [vendor, setVendor] = useState<DwDimVendorResponseSchema | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const fetchVendor = async () => {
      if (!vendorId) return

      setLoading(true)
      setError(null)
      try {
        const fetchedVendor = await getVendorById(vendorId)
        setVendor(fetchedVendor)
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while fetching vendor details.")
        toast({
          title: "Error",
          description: err.message || "Failed to load vendor details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVendor()
  }, [vendorId, toast])

  const handleUpdateVendor = async () => {
    if (!vendor) return

    setLoading(true)
    try {
      // TODO: Replace with actual tenant_id from context/auth
      await updateVendor({ ...vendor, tenant_id: "test-tenant" } as UpdateVendorRequest)
      toast({ title: "Vendor Updated", description: "Vendor details updated successfully." })
      setIsEditing(false) // Exit editing mode
    } catch (err: any) {
      console.error("Failed to update vendor:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update vendor details.",
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
          <h1 className="text-2xl font-bold tracking-tight">Loading Vendor...</h1>
          <p className="text-muted-foreground">Please wait while we fetch vendor details.</p>
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

  if (!vendor) {
    return (
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">Vendor Not Found</h1>
          <p className="text-muted-foreground">The requested vendor could not be found.</p>
          <Button onClick={() => router.push("/transactions/accounts-payable")}>
            Back to Vendor List
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button variant="ghost" onClick={() => router.push("/transactions/accounts-payable")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vendor List
            </Button>
            <h1 className="text-2xl font-bold tracking-tight mt-2">{vendor.name}</h1>
            <p className="text-muted-foreground">Details for vendor ID: {vendor.vendor_id}</p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              Edit Vendor
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
            <CardDescription>View and manage this vendor's details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Vendor Name</label>
              <Input
                value={vendor.name}
                onChange={(e) => setVendor({ ...vendor, name: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Vendor ID</label>
              <Input value={vendor.vendor_id} disabled />
            </div>
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Category</label>
              <Input
                value={vendor.category || ""}
                onChange={(e) => setVendor({ ...vendor, category: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Region</label>
              <Input
                value={vendor.region || ""}
                onChange={(e) => setVendor({ ...vendor, region: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Created At</label>
              <Input value={new Date(vendor.created_at).toLocaleString()} disabled />
            </div>
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Updated At</label>
              <Input value={new Date(vendor.updated_at).toLocaleString()} disabled />
            </div>

            {isEditing && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  // Optionally re-fetch original data if changes were not saved
                  // fetchVendor();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateVendor} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

"use client"

import { useState, useEffect } from "react" // Import useEffect
import { Filter, Download, Edit, Check, TrendingUp, TrendingDown } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

// Define column types matching backend VarianceItem
type BackendVarianceItem = {
  id: string
  category: string
  subcategory: string
  budget: number
  actual: number
  variance: number
  variancePercent: number
  commentary: string
  status: "draft" | "approved" | "distributed"
}

// Define backend VarianceReportPayload structure
type VarianceReportPayload = {
  reportId: string
  tenantId: string
  period: string
  narrative: string
  varianceDetails: BackendVarianceItem[]
  status: "draft" | "approved" | "distributed"
  modelVersion: string
  createdAt: string
  updatedAt: string
}

// Frontend VarianceItem will also include the reportId for updates
type FrontendVarianceItem = BackendVarianceItem & { reportId: string }

export default function VarianceAnalysisPage() {
  const { toast } = useToast()
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedVariance, setSelectedVariance] = useState<FrontendVarianceItem | null>(null)
  const [editedCommentary, setEditedCommentary] = useState("")
  const [varianceReports, setVarianceReports] = useState<VarianceReportPayload[]>([]) // Store raw reports
  const [varianceItems, setVarianceItems] = useState<FrontendVarianceItem[]>([]) // Flattened items for table

  const TENANT_ID = "default_tenant_id" // Assuming a default tenant ID

  // Fetch variance data from API
  const fetchVarianceReports = async () => {
    try {
      const response = await fetch(`/variance-reports?tenant_id=${TENANT_ID}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: VarianceReportPayload[] = await response.json()
      setVarianceReports(data)

      // Flatten varianceDetails from all reports into a single array for the table
      const flattenedItems: FrontendVarianceItem[] = []
      data.forEach(report => {
        report.varianceDetails.forEach(item => {
          flattenedItems.push({ ...item, reportId: report.reportId }) // Add reportId to each item
        })
      })
      setVarianceItems(flattenedItems)

      toast({
        title: "Variance Data Loaded",
        description: "The latest variance reports have been fetched.",
      })
    } catch (error) {
      console.error("Failed to fetch variance reports:", error)
      toast({
        title: "Error",
        description: "Failed to fetch variance data.",
        variant: "destructive",
      })
    }
  }

  // Initial fetch on component mount
  useEffect(() => {
    fetchVarianceReports()
  }, [])

  // Handle row click to show details
  const handleRowClick = (variance: FrontendVarianceItem) => {
    setSelectedVariance(variance)
    setIsDetailsModalOpen(true)
  }

  // Handle edit commentary
  const handleEditCommentary = () => {
    if (!selectedVariance) return
    setEditedCommentary(selectedVariance.commentary)
    setIsDetailsModalOpen(false)
    setIsEditModalOpen(true)
  }

  // Handle save commentary
  const handleSaveCommentary = async () => {
    if (!selectedVariance) return

    try {
      const response = await fetch(`/variance-reports/${selectedVariance.reportId}?tenant_id=${TENANT_ID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variance_item_id: selectedVariance.id,
          updated_commentary: editedCommentary,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Commentary Updated",
        description: "The variance commentary has been updated.",
      })
      setIsEditModalOpen(false)
      fetchVarianceReports() // Re-fetch data to update the table
    } catch (error) {
      console.error("Failed to save commentary:", error)
      toast({
        title: "Error",
        description: "Failed to update commentary.",
        variant: "destructive",
      })
    }
  }

  // Handle approve for distribution
  const handleApproveForDistribution = async () => {
    if (!selectedVariance) return

    try {
      const response = await fetch(`/variance-reports/${selectedVariance.reportId}?tenant_id=${TENANT_ID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: "approved",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Approved for Distribution",
        description: "The variance analysis has been approved for distribution.",
      })
      setIsDetailsModalOpen(false)
      fetchVarianceReports() // Re-fetch data to update the table
    } catch (error) {
      console.error("Failed to approve for distribution:", error)
      toast({
        title: "Error",
        description: "Failed to approve variance report.",
        variant: "destructive",
      })
    }
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: BackendVarianceItem["status"] }) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-amber-100 text-amber-800">Draft</Badge>
      case "approved":
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>
      case "distributed":
        return <Badge className="bg-green-100 text-green-800">Distributed</Badge>
      default:
        return null
    }
  }

  // Variance indicator component
  const VarianceIndicator = ({ variance, percent }: { variance: number; percent: number }) => {
    const isPositive = variance > 0
    return (
      <div className={`flex items-center ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
        <span>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            signDisplay: "always",
          }).format(variance)}{" "}
          ({Math.abs(percent)}%)
        </span>
      </div>
    )
  }

  // Table columns
  const columns = [
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "subcategory",
      header: "Subcategory",
    },
    {
      accessorKey: "budget",
      header: "Budget",
      cell: ({ row }: any) => {
        const amount = Number.parseFloat(row.getValue("budget"))
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
      },
    },
    {
      accessorKey: "actual",
      header: "Actual",
      cell: ({ row }: any) => {
        const amount = Number.parseFloat(row.getValue("actual"))
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
      },
    },
    {
      accessorKey: "variance",
      header: "Variance",
      cell: ({ row }: any) => {
        // Access variance and variancePercent directly from row.original
        return <VarianceIndicator variance={row.original.variance} percent={row.original.variancePercent} />
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        return <StatusBadge status={row.getValue("status")} />
      },
    },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Variance Analysis</h1>
            <p className="text-muted-foreground">Analyze budget vs. actual performance with AI-generated insights</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Variance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Variance Reports Summary</CardTitle>
            <CardDescription>Top variances between budget and actual performance</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={varianceItems} searchColumn="category" onRowClick={handleRowClick} />
          </CardContent>
        </Card>
      </div>

      {/* Variance Details Modal */}
      <ModalDialog
        title={`Variance Details: ${selectedVariance?.category} - ${selectedVariance?.subcategory}`}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        size="lg"
      >
        {selectedVariance && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Budget</h3>
                <p className="mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(selectedVariance.budget)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Actual</h3>
                <p className="mt-1">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(selectedVariance.actual)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Variance</h3>
                <div className="mt-1">
                  <VarianceIndicator variance={selectedVariance.variance} percent={selectedVariance.variancePercent} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <StatusBadge status={selectedVariance.status} />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">AI Commentary</h3>
                <Button variant="outline" size="sm" onClick={handleEditCommentary}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Narrative
                </Button>
              </div>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <p className="text-sm">{selectedVariance.commentary}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 flex justify-end">
              {selectedVariance.status === "draft" && (
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleApproveForDistribution}>
                  <Check className="mr-2 h-4 w-4" />
                  Approve for Distribution
                </Button>
              )}
            </div>
          </div>
        )}
      </ModalDialog>

      {/* Edit Commentary Modal */}
      <ModalDialog
        title="Edit Variance Commentary"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onConfirm={handleSaveCommentary}
        confirmText="Save Commentary"
        cancelText="Cancel"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Edit the AI-generated commentary to provide additional context or insights.
          </p>
          <Textarea
            value={editedCommentary}
            onChange={(e) => setEditedCommentary(e.target.value)}
            className="min-h-[200px]"
          />
        </div>
      </ModalDialog>
    </AppShell>
  )
}

"use client"

import { useState } from "react"
import { Filter, Download, Edit, Check, TrendingUp, TrendingDown } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

// Define column types
type VarianceItem = {
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

export default function VarianceAnalysisPage() {
  const { toast } = useToast()
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedVariance, setSelectedVariance] = useState<VarianceItem | null>(null)
  const [editedCommentary, setEditedCommentary] = useState("")

  // Sample data for variance analysis
  const varianceItems: VarianceItem[] = [
    {
      id: "var-1001",
      category: "Marketing",
      subcategory: "Trade Shows",
      budget: 10000,
      actual: 22500,
      variance: -12500,
      variancePercent: -125,
      commentary:
        "Marketing expenses are 125% over budget this month, primarily due to the unplanned trade show participation ($12,500). However, this is offset by new customer acquisition, with 15 new accounts signed this month directly attributed to the event.",
      status: "draft",
    },
    {
      id: "var-1002",
      category: "Sales",
      subcategory: "Commissions",
      budget: 50000,
      actual: 65000,
      variance: -15000,
      variancePercent: -30,
      commentary:
        "Sales commissions exceeded budget by 30% due to higher than expected sales volume in Q2. This is a positive variance as it directly correlates with increased revenue.",
      status: "approved",
    },
    {
      id: "var-1003",
      category: "Operations",
      subcategory: "Utilities",
      budget: 8000,
      actual: 6500,
      variance: 1500,
      variancePercent: 18.75,
      commentary:
        "Utility costs were 18.75% under budget due to energy efficiency improvements implemented last quarter and lower than expected usage.",
      status: "distributed",
    },
    {
      id: "var-1004",
      category: "IT",
      subcategory: "Software Licenses",
      budget: 15000,
      actual: 12000,
      variance: 3000,
      variancePercent: 20,
      commentary:
        "Software license costs were 20% under budget due to renegotiated enterprise agreements and consolidation of redundant systems.",
      status: "draft",
    },
    {
      id: "var-1005",
      category: "HR",
      subcategory: "Recruiting",
      budget: 20000,
      actual: 25000,
      variance: -5000,
      variancePercent: -25,
      commentary:
        "Recruiting expenses exceeded budget by 25% due to increased hiring activity and use of external recruiters for specialized positions.",
      status: "draft",
    },
  ]

  // Handle row click to show details
  const handleRowClick = (variance: VarianceItem) => {
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
  const handleSaveCommentary = () => {
    if (!selectedVariance) return
    toast({
      title: "Commentary Updated",
      description: "The variance commentary has been updated.",
    })
    setIsEditModalOpen(false)
  }

  // Handle approve for distribution
  const handleApproveForDistribution = () => {
    if (!selectedVariance) return
    toast({
      title: "Approved for Distribution",
      description: "The variance analysis has been approved for distribution.",
    })
    setIsDetailsModalOpen(false)
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: VarianceItem["status"] }) => {
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
        return <VarianceIndicator variance={row.getValue("variance")} percent={row.getValue("variancePercent")} />
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
            <CardTitle>May 2024 Variance Summary</CardTitle>
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

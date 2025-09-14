import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle } from "lucide-react"
import { useCreditManagementLogic } from "../hooks/useCreditManagementLogic"
import { useCreditOverrideManagement } from "../hooks/useCreditOverrideManagement"
import { CreditOverrideDialog } from "./CreditOverrideDialog"
import { formatCurrency, formatDate, type Customer, type CreditLimit, type CreditAssessment, type SalesOrder } from "@/lib/ar-api"

interface CreditManagementSectionProps {
  creditLimits: CreditLimit[];
  creditAssessments: CreditAssessment[];
  creditLoading: boolean;
  customers: Customer[];
  salesOrders: SalesOrder[];
  onDataRefresh?: () => void;
}

export const CreditManagementSection: React.FC<CreditManagementSectionProps> = ({
  creditLimits,
  creditAssessments,
  creditLoading,
  customers,
  salesOrders,
  onDataRefresh,
}) => {
  const { creditView, setCreditView } = useCreditManagementLogic()

  const {
    isOverrideDialogOpen,
    selectedOrderForOverride,
    isProcessingOverride,
    handleCreditOverride,
    openOverrideDialog,
    closeOverrideDialog,
    canOverrideCreditDecision,
  } = useCreditOverrideManagement(onDataRefresh)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Credit Management Overview</h3>
        <div className="flex gap-2">
          <Button
            variant={creditView === "limits" ? "default" : "outline"}
            onClick={() => setCreditView("limits")}
          >
            Credit Limits
          </Button>
          <Button
            variant={creditView === "assessments" ? "default" : "outline"}
            onClick={() => setCreditView("assessments")}
          >
            Credit Assessments
          </Button>
          <Button
            variant={creditView === "overrides" ? "default" : "outline"}
            onClick={() => setCreditView("overrides")}
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Credit Overrides
          </Button>
        </div>
      </div>

      {creditLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {creditView === "limits" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Risk Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditLimits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No credit limits found.
                    </TableCell>
                  </TableRow>
                ) : (
                  creditLimits.map((limit) => (
                    <TableRow key={limit.id}>
                      <TableCell>{customers.find(c => c.id === limit.customer_id)?.name || limit.customer_id}</TableCell>
                      <TableCell>{formatCurrency(limit.credit_limit)}</TableCell>
                      <TableCell>{limit.expiry_date ? formatDate(limit.expiry_date) : "N/A"}</TableCell>
                      <TableCell>{limit.risk_rating || "N/A"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {creditView === "assessments" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Requested Amount</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Approved Amount</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Assessment Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditAssessments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No credit assessments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  creditAssessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell>{customers.find(c => c.id === assessment.customer_id)?.name || assessment.customer_id}</TableCell>
                      <TableCell>{assessment.assessment_type}</TableCell>
                      <TableCell>{formatCurrency(assessment.requested_amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          assessment.decision === "APPROVED" ? "bg-green-100 text-green-800" :
                          assessment.decision === "REJECTED" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                        }>
                          {assessment.decision}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(assessment.approved_amount)}</TableCell>
                      <TableCell>{assessment.risk_score?.toFixed(2) || "N/A"}</TableCell>
                      <TableCell>{formatDate(assessment.assessment_date)}</TableCell>
                      <TableCell>{assessment.notes || "N/A"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {creditView === "overrides" && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-medium text-yellow-800">Credit Decision Override</h4>
                </div>
                <p className="text-sm text-yellow-700">
                  Override automated credit decisions for sales orders. This feature allows manual approval or rejection
                  of orders that were automatically processed. All overrides are logged for audit purposes.
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order Amount</TableHead>
                    <TableHead>Current Decision</TableHead>
                    <TableHead>Credit Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesOrders.filter(order => canOverrideCreditDecision(order)).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        <div className="space-y-2">
                          <AlertTriangle className="h-8 w-8 mx-auto text-gray-400" />
                          <p>No orders available for credit override.</p>
                          <p className="text-sm">Orders must have completed credit assessment to be eligible for override.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesOrders
                      .filter(order => canOverrideCreditDecision(order))
                      .map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{customers.find(c => c.id === order.customer_id)?.name || order.customer_id}</TableCell>
                          <TableCell>{formatCurrency(order.total_amount, order.currency)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              order.status === "APPROVED" ? "bg-green-100 text-green-800" :
                              order.status === "REJECTED" ? "bg-red-100 text-red-800" :
                              "bg-blue-100 text-blue-800"
                            }>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              order.credit_status === "APPROVED" ? "bg-green-100 text-green-800" :
                              order.credit_status === "REJECTED" ? "bg-red-100 text-red-800" :
                              "bg-blue-100 text-blue-800"
                            }>
                              {order.credit_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openOverrideDialog(order)}
                              className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Override
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* Credit Override Dialog */}
      <CreditOverrideDialog
        isOpen={isOverrideDialogOpen}
        onOpenChange={closeOverrideDialog}
        salesOrder={selectedOrderForOverride}
        onCreditOverride={handleCreditOverride}
        isProcessing={isProcessingOverride}
      />
    </div>
  )
}

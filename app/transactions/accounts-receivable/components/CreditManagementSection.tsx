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
import { Loader2 } from "lucide-react"
import { useCreditManagementLogic } from "../hooks/useCreditManagementLogic"
import { formatCurrency, formatDate, type Customer, type CreditLimit, type CreditAssessment } from "@/lib/ar-api"

interface CreditManagementSectionProps {
  creditLimits: CreditLimit[];
  creditAssessments: CreditAssessment[];
  creditLoading: boolean;
  customers: Customer[];
}

export const CreditManagementSection: React.FC<CreditManagementSectionProps> = ({
  creditLimits,
  creditAssessments,
  creditLoading,
  customers,
}) => {
  const { creditView, setCreditView } = useCreditManagementLogic()

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
        </>
      )}
    </div>
  )
}

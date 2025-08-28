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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Download } from "lucide-react"
import { formatCurrency } from "@/lib/ar-api" // Assuming formatCurrency is still needed

interface AgingReportsSectionProps {
  agingReport: any; // Use a more specific type if available
  agingLoading: boolean;
  handleExport: () => void;
}

export const AgingReportsSection: React.FC<AgingReportsSectionProps> = ({
  agingReport,
  agingLoading,
  handleExport,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Aging Report</h3>
        <Button onClick={handleExport} className="bg-teal-600 hover:bg-teal-700">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {agingLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : agingReport ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(agingReport.total_outstanding)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(agingReport.total_overdue)}</p>
              </CardContent>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aging Bucket</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Invoice Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agingReport.buckets.map((bucket: any) => (
                <TableRow key={bucket.bucket_name}>
                  <TableCell className="font-medium">{bucket.bucket_name} Days</TableCell>
                  <TableCell>{formatCurrency(bucket.total_amount)}</TableCell>
                  <TableCell>{bucket.invoice_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {agingReport.customer_breakdown && agingReport.customer_breakdown.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-lg font-medium">Customer Breakdown</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total Outstanding</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>1-30 Days</TableHead>
                    <TableHead>31-60 Days</TableHead>
                    <TableHead>61-90 Days</TableHead>
                    <TableHead>90+ Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agingReport.customer_breakdown.map((customerAging: any) => (
                    <TableRow key={customerAging.customer_id}>
                      <TableCell>{customerAging.customer_name}</TableCell>
                      <TableCell>{formatCurrency(customerAging.total_outstanding)}</TableCell>
                      <TableCell>{formatCurrency(customerAging.current)}</TableCell>
                      <TableCell>{formatCurrency(customerAging.days_1_30)}</TableCell>
                      <TableCell>{formatCurrency(customerAging.days_31_60)}</TableCell>
                      <TableCell>{formatCurrency(customerAging.days_61_90)}</TableCell>
                      <TableCell>{formatCurrency(customerAging.days_90_plus)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-muted-foreground p-8">
          No aging report data available.
        </div>
      )}
    </div>
  )
}

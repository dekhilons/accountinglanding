import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, Receipt, CheckCircle } from "lucide-react"
import { formatCurrency } from "@/lib/ar-api"

interface ArSummaryCardsProps {
  stats: {
    totalPayments: number;
    totalAmount: number;
    autoAppliedPayments: number;
    autoApplyRate: number;
  };
}

export const ArSummaryCards: React.FC<ArSummaryCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Payments</p>
              <p className="text-2xl font-bold">{stats.totalPayments}</p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <Receipt className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Auto-Applied</p>
              <p className="text-2xl font-bold">{stats.autoAppliedPayments}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-teal-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Reconciliation Rate</p>
              <p className="text-2xl font-bold">{stats.autoApplyRate}%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-teal-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

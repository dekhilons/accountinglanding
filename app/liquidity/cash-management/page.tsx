"use client"

import { useState } from "react"
import { Calendar, Download, AlertCircle, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart } from "@/components/ui/chart"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export default function CashManagementPage() {
  const { toast } = useToast()
  const [isCreditDrawModalOpen, setIsCreditDrawModalOpen] = useState(false)
  const [creditDrawAmount, setCreditDrawAmount] = useState("50000")

  // Sample data for cash runway chart
  const cashRunwayData = [
    { date: "Jun 1", balance: 850000 },
    { date: "Jul 1", balance: 780000 },
    { date: "Aug 1", balance: 710000 },
    { date: "Sep 1", balance: 640000 },
    { date: "Oct 1", balance: 570000 },
    { date: "Nov 1", balance: 500000 },
    { date: "Dec 1", balance: 430000 },
    { date: "Jan 1", balance: 360000 },
  ]

  // Sample data for cash flow chart
  const cashFlowData = [
    { date: "Week 1", inflow: 120000, outflow: 90000 },
    { date: "Week 2", inflow: 95000, outflow: 110000 },
    { date: "Week 3", inflow: 130000, outflow: 85000 },
    { date: "Week 4", inflow: 105000, outflow: 120000 },
  ]

  // Handle approve credit draw
  const handleApproveCreditDraw = () => {
    toast({
      title: "Credit Draw Approved",
      description: `A credit draw of ${new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(Number(creditDrawAmount))} has been approved.`,
    })
    setIsCreditDrawModalOpen(false)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cash Management</h1>
            <p className="text-muted-foreground">Monitor and manage your company's cash position</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Date Range
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Cash Runway */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Runway</CardTitle>
            <CardDescription>Current cash position and projected runway</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="text-5xl font-bold text-teal-600">8.5</div>
                <p className="text-sm text-gray-500">months remaining</p>
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-teal-600 rounded-full" style={{ width: "70%" }}></div>
                </div>
              </div>

              <Chart
                title=""
                data={cashRunwayData}
                type="line"
                xAxisKey="date"
                series={[{ name: "Cash Balance", key: "balance", color: "#10b981" }]}
                height={300}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
            <CardDescription>Weekly cash inflows and outflows</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              title=""
              data={cashFlowData}
              type="bar"
              xAxisKey="date"
              series={[
                { name: "Cash Inflow", key: "inflow", color: "#10b981" },
                { name: "Cash Outflow", key: "outflow", color: "#ef4444" },
              ]}
              height={300}
            />
          </CardContent>
        </Card>

        {/* Low Cash Alert */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <CardTitle className="text-red-800">Low Cash Alert</CardTitle>
            </div>
            <CardDescription className="text-red-700">
              Your cash balance is projected to fall below the minimum threshold in 3 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white rounded-md border border-red-200 p-4">
                <h3 className="font-medium text-gray-900 mb-2">Recommended Actions</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <DollarSign className="h-5 w-5 text-teal-600 mr-2 flex-shrink-0" />
                    <span>
                      Draw on your available credit line to increase cash reserves. You have $250,000 available.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <TrendingUp className="h-5 w-5 text-teal-600 mr-2 flex-shrink-0" />
                    <span>Accelerate collections on outstanding receivables totaling $175,000.</span>
                  </li>
                  <li className="flex items-start">
                    <TrendingDown className="h-5 w-5 text-teal-600 mr-2 flex-shrink-0" />
                    <span>Defer non-essential capital expenditures planned for next quarter.</span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-end">
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setIsCreditDrawModalOpen(true)}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Approve Credit Draw
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Draw Modal */}
      <ModalDialog
        title="Approve Credit Draw"
        description="Approve a draw on your available credit line"
        isOpen={isCreditDrawModalOpen}
        onClose={() => setIsCreditDrawModalOpen(false)}
        onConfirm={handleApproveCreditDraw}
        confirmText="Approve Draw"
        cancelText="Cancel"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Draw Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="number"
                value={creditDrawAmount}
                onChange={(e) => setCreditDrawAmount(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Available Credit</label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Credit Limit</span>
              <span className="font-medium">$250,000</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-teal-600 rounded-full" style={{ width: "0%" }}></div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
              <div>
                <h3 className="font-medium text-amber-800">Important Notice</h3>
                <p className="text-sm text-amber-700 mt-1">
                  This credit draw will incur interest at a rate of 7.5% APR. The minimum monthly payment will be
                  approximately{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format((Number(creditDrawAmount) * 0.075) / 12)}
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalDialog>
    </AppShell>
  )
}

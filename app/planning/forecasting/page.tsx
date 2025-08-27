"use client"

import { useState } from "react"
import { Calendar, Download, RefreshCw, MessageSquare } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function ForecastingPage() {
  const { toast } = useToast()
  const [timeframe, setTimeframe] = useState("30-day")
  const [metric, setMetric] = useState("cash-flow")
  const [isLoading, setIsLoading] = useState(false)

  // Sample data for forecasts
  const cashFlowData = {
    "7-day": [
      { date: "Jun 1", actual: 25000, forecast: 25000 },
      { date: "Jun 2", actual: 22000, forecast: 23000 },
      { date: "Jun 3", actual: 28000, forecast: 26000 },
      { date: "Jun 4", actual: 24000, forecast: 25000 },
      { date: "Jun 5", actual: 26000, forecast: 27000 },
      { date: "Jun 6", actual: null, forecast: 29000 },
      { date: "Jun 7", actual: null, forecast: 30000 },
    ],
    "30-day": [
      { date: "Week 1", actual: 120000, forecast: 120000 },
      { date: "Week 2", actual: 115000, forecast: 118000 },
      { date: "Week 3", actual: 125000, forecast: 122000 },
      { date: "Week 4", actual: null, forecast: 130000 },
      { date: "Week 5", actual: null, forecast: 135000 },
    ],
    quarterly: [
      { date: "Q1", actual: 1500000, forecast: 1500000 },
      { date: "Q2", actual: 1650000, forecast: 1600000 },
      { date: "Q3", actual: null, forecast: 1750000 },
      { date: "Q4", actual: null, forecast: 1900000 },
    ],
  }

  const revenueData = {
    "7-day": [
      { date: "Jun 1", actual: 35000, forecast: 35000 },
      { date: "Jun 2", actual: 32000, forecast: 33000 },
      { date: "Jun 3", actual: 38000, forecast: 36000 },
      { date: "Jun 4", actual: 34000, forecast: 35000 },
      { date: "Jun 5", actual: 36000, forecast: 37000 },
      { date: "Jun 6", actual: null, forecast: 39000 },
      { date: "Jun 7", actual: null, forecast: 40000 },
    ],
    "30-day": [
      { date: "Week 1", actual: 150000, forecast: 150000 },
      { date: "Week 2", actual: 145000, forecast: 148000 },
      { date: "Week 3", actual: 155000, forecast: 152000 },
      { date: "Week 4", actual: null, forecast: 160000 },
      { date: "Week 5", actual: null, forecast: 165000 },
    ],
    quarterly: [
      { date: "Q1", actual: 1800000, forecast: 1800000 },
      { date: "Q2", actual: 1950000, forecast: 1900000 },
      { date: "Q3", actual: null, forecast: 2050000 },
      { date: "Q4", actual: null, forecast: 2200000 },
    ],
  }

  const expenseData = {
    "7-day": [
      { date: "Jun 1", actual: 20000, forecast: 20000 },
      { date: "Jun 2", actual: 18000, forecast: 19000 },
      { date: "Jun 3", actual: 22000, forecast: 21000 },
      { date: "Jun 4", actual: 19000, forecast: 20000 },
      { date: "Jun 5", actual: 21000, forecast: 22000 },
      { date: "Jun 6", actual: null, forecast: 23000 },
      { date: "Jun 7", actual: null, forecast: 24000 },
    ],
    "30-day": [
      { date: "Week 1", actual: 90000, forecast: 90000 },
      { date: "Week 2", actual: 85000, forecast: 88000 },
      { date: "Week 3", actual: 95000, forecast: 92000 },
      { date: "Week 4", actual: null, forecast: 100000 },
      { date: "Week 5", actual: null, forecast: 105000 },
    ],
    quarterly: [
      { date: "Q1", actual: 1200000, forecast: 1200000 },
      { date: "Q2", actual: 1300000, forecast: 1250000 },
      { date: "Q3", actual: null, forecast: 1350000 },
      { date: "Q4", actual: null, forecast: 1450000 },
    ],
  }

  // Get current data based on selected metric and timeframe
  const getCurrentData = () => {
    switch (metric) {
      case "cash-flow":
        return cashFlowData[timeframe as keyof typeof cashFlowData]
      case "revenue":
        return revenueData[timeframe as keyof typeof revenueData]
      case "expenses":
        return expenseData[timeframe as keyof typeof expenseData]
      default:
        return cashFlowData[timeframe as keyof typeof cashFlowData]
    }
  }

  // Get chart title based on selected metric
  const getChartTitle = () => {
    switch (metric) {
      case "cash-flow":
        return "Cash Flow Forecast"
      case "revenue":
        return "Revenue Forecast"
      case "expenses":
        return "Expense Forecast"
      default:
        return "Forecast"
    }
  }

  // Handle refresh forecast
  const handleRefreshForecast = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Forecast Updated",
        description: "The forecast has been refreshed with the latest data.",
      })
    }, 1500)
  }

  // Handle run scenario
  const handleRunScenario = () => {
    toast({
      title: "Scenario Analysis",
      description: "Opening scenario analysis tool.",
    })
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Forecasting & FP&A</h1>
            <p className="text-muted-foreground">Financial planning, analysis, and forecasting tools</p>
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
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleRefreshForecast} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Forecast
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Forecast Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Forecast Settings</CardTitle>
            <CardDescription>Configure forecast parameters and run scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Timeframe</label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7-day">7 Day</SelectItem>
                    <SelectItem value="30-day">30 Day</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Metric</label>
                <Select value={metric} onValueChange={setMetric}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash-flow">Cash Flow</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expenses">Expenses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" variant="outline" onClick={handleRunScenario}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Run What-If Scenario
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forecast Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{getChartTitle()}</CardTitle>
            <CardDescription>Actual vs. forecast comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="chart" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="chart">Chart</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
              </TabsList>
              <TabsContent value="chart" className="m-0">
                <Chart
                  title=""
                  data={getCurrentData()}
                  type="line"
                  xAxisKey="date"
                  series={[
                    { name: "Actual", key: "actual", color: "#10b981" },
                    { name: "Forecast", key: "forecast", color: "#6366f1" },
                  ]}
                  height={400}
                />
              </TabsContent>
              <TabsContent value="table" className="m-0">
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actual</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Forecast</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {getCurrentData().map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm">{item.date}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            {item.actual !== null
                              ? new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "USD",
                                  maximumFractionDigits: 0,
                                }).format(item.actual)
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                              maximumFractionDigits: 0,
                            }).format(item.forecast)}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm text-right ${
                              item.actual !== null
                                ? item.actual > item.forecast
                                  ? "text-green-600"
                                  : item.actual < item.forecast
                                    ? "text-red-600"
                                    : ""
                                : "text-gray-400"
                            }`}
                          >
                            {item.actual !== null
                              ? new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "USD",
                                  signDisplay: "always",
                                  maximumFractionDigits: 0,
                                }).format(item.actual - item.forecast)
                              : "Pending"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Scenario Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Scenario Analysis</CardTitle>
            <CardDescription>Explore different financial scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-md p-4 hover:border-teal-500 hover:bg-teal-50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-2">Revenue Growth</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Simulate the impact of a 10% increase in monthly revenue growth.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Run Scenario
                </Button>
              </div>
              <div className="border rounded-md p-4 hover:border-teal-500 hover:bg-teal-50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-2">Cost Reduction</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Analyze the effect of reducing operational expenses by 15%.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Run Scenario
                </Button>
              </div>
              <div className="border rounded-md p-4 hover:border-teal-500 hover:bg-teal-50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-2">Market Downturn</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Stress test your finances with a 20% revenue decrease scenario.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Run Scenario
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

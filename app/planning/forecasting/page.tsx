"use client"

"use client"

import { useState, useEffect } from "react"
import { Calendar as CalendarIcon, Download, RefreshCw, MessageSquare } from "lucide-react" // Alias Calendar to CalendarIcon
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover" // Import Popover components
import { Calendar } from "@/components/ui/calendar" // Import Calendar component
import { format } from "date-fns" // Import format for date formatting
import { cn } from "@/lib/utils" // Import cn for conditional classnames

export default function ForecastingPage() {
  const { toast } = useToast()
  const [timeframe, setTimeframe] = useState("30-day")
  const [metric, setMetric] = useState("cash-flow")
  const [isLoading, setIsLoading] = useState(false)
  const [forecastData, setForecastData] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date()) // New state for selected date

  const TENANT_ID = "default_tenant_id"

  // Helper to get current YYYY-MM period based on selectedDate
  const getPeriod = (date: Date | undefined) => {
    if (!date) {
      return getCurrentPeriod(); // Fallback to current period if no date selected
    }
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${year}-${month}`
  }

  // Helper to get current YYYY-MM period (for initial load)
  const getCurrentPeriod = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    return `${year}-${month}`
  }

  // Fetch forecast data from API
  const fetchForecast = async (date?: Date) => {
    setIsLoading(true)
    const periodToFetch = getPeriod(date || selectedDate); // Use provided date or current selectedDate
    try {
      const response = await fetch(
        `/api/forecast/latest?tenant_id=${TENANT_ID}&period=${periodToFetch}&metric_type=${metric}`
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const transformedData = data.forecastPoints.map((fp: any) => ({
        date: fp.date,
        actual: fp.actual,
        forecast: fp.value,
      }))
      setForecastData(transformedData)
      toast({
        title: "Forecast Updated",
        description: "The forecast has been refreshed with the latest data.",
      })
    } catch (error) {
      console.error("Failed to fetch forecast:", error)
      toast({
        title: "Error",
        description: "Failed to fetch forecast data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch and refetch on metric/timeframe/selectedDate change
  useEffect(() => {
    fetchForecast()
  }, [metric, timeframe, selectedDate]) // Re-fetch when metric, timeframe, or selectedDate changes

  // Get current data based on selected metric and timeframe
  const getCurrentData = () => {
    return forecastData;
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
    fetchForecast()
  }

  // Handle export to CSV
  const handleExport = () => {
    if (forecastData.length === 0) {
      toast({
        title: "No Data",
        description: "No forecast data to export.",
      });
      return;
    }

    const headers = ["Date", "Actual", "Forecast", "Variance"];
    const csvRows = [headers.join(",")];

    forecastData.forEach(item => {
      const actual = item.actual !== null ? item.actual : "";
      const variance = item.actual !== null ? (item.actual - item.forecast) : "Pending";
      const row = [
        item.date,
        actual,
        item.forecast,
        variance
      ].map(String).join(",");
      csvRows.push(row);
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `forecast_${getPeriod(selectedDate)}_${metric}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Forecast data exported to CSV.",
    });
  };

  // Handle run scenario
  const handleRunScenario = async (scenarioType: 'revenue_growth' | 'cost_reduction' | 'market_downturn') => {
    setIsLoading(true)
    try {
      let revenue_growth_percent: number | undefined
      let cost_reduction_percent: number | undefined

      // Prepare the scenario request payload
      const baseForecastRequest = {
        period: getPeriod(selectedDate), // Use the selected period for the base forecast
        tenantId: TENANT_ID,
        metric_type: metric,
        horizon_days: timeframe === "7-day" ? 7 : (timeframe === "30-day" ? 30 : 90),
        historical_data: [],
      }

      switch (scenarioType) {
        case 'revenue_growth':
          revenue_growth_percent = 0.10
          break
        case 'cost_reduction':
          cost_reduction_percent = 0.15
          break
        case 'market_downturn':
          revenue_growth_percent = -0.20
          break
        default:
          break
      }

      const response = await fetch('/api/forecast/scenario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_forecast_request: baseForecastRequest,
          revenue_growth_percent,
          cost_reduction_percent,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const transformedData = data.forecastPoints.map((fp: any) => ({
        date: fp.date,
        actual: null,
        forecast: fp.value,
      }))
      setForecastData(transformedData)
      toast({
        title: "Scenario Applied",
        description: `"${scenarioType.replace(/_/g, ' ').toUpperCase()}" scenario applied.`,
      })
    } catch (error) {
      console.error("Failed to run scenario:", error)
      toast({
        title: "Error",
        description: "Failed to run scenario analysis.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "MMM yyyy") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    fetchForecast(date || new Date()); // Trigger fetch with the newly selected date
                  }}
                  initialFocus
                  captionLayout="dropdown" // Enable dropdowns for month and year
                  fromYear={2020} // Adjust as needed
                  toYear={2030} // Adjust as needed
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={handleExport}>
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
                <Button className="w-full" variant="outline" onClick={() => handleRunScenario('revenue_growth')}>
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
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleRunScenario('revenue_growth')}>
                  Run Scenario
                </Button>
              </div>
              <div className="border rounded-md p-4 hover:border-teal-500 hover:bg-teal-50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-2">Cost Reduction</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Analyze the effect of reducing operational expenses by 15%.
                </p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleRunScenario('cost_reduction')}>
                  Run Scenario
                </Button>
              </div>
              <div className="border rounded-md p-4 hover:border-teal-500 hover:bg-teal-50 transition-colors cursor-pointer">
                <h3 className="font-medium mb-2">Market Downturn</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Stress test your finances with a 20% revenue decrease scenario.
                </p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleRunScenario('market_downturn')}>
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

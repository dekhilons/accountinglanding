"use client"

import { useState, useEffect } from "react" // Import useEffect
import { Calendar, Download, AlertCircle, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart } from "@/components/ui/chart"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"

export default function CashManagementPage() {
  const { toast } = useToast()
  const [isCreditDrawModalOpen, setIsCreditDrawModalOpen] = useState(false)
  const [creditDrawAmount, setCreditDrawAmount] = useState("50000")
  const [cashRunwayData, setCashRunwayData] = useState([]) // State for cash runway data
  const [cashFlowData, setCashFlowData] = useState([]) // State for cash flow data
  const [availableCredit, setAvailableCredit] = useState(0) // State for available credit
  const [creditLimit, setCreditLimit] = useState(0); // State for credit limit
  const [currentBalance, setCurrentBalance] = useState(0); // State for current balance
  const [dateRange, setDateRange] = useState<DateRange | undefined>() // State for date range
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false) // State for date picker modal
  const [liquidityAlerts, setLiquidityAlerts] = useState([]) // State for liquidity alerts
  const [pendingActions, setPendingActions] = useState([]) // State for pending treasury actions
  const [forecastData, setForecastData] = useState<any>(null) // State for cash flow forecast

  // Dummy tenant ID and period for now
  const tenantId = "default_tenant_id";
  const API_BASE_URL = "http://localhost:8004"; // Use the correct port

  // Get period from date range or use default
  const getPeriodFromDateRange = () => {
    if (dateRange?.from) {
      return format(dateRange.from, "yyyy-MM");
    }
    return "2025-09"; // Default period
  };

  const period = getPeriodFromDateRange();

  // Function to fetch cash runway data
  const fetchCashRunwayData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cash-management/runway?tenant_id=${tenantId}&period=${period}&horizon_days=180`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCashRunwayData(data.cashRunwayData);
    } catch (error) {
      console.error("Error fetching cash runway data:", error);
      toast({
        title: "Error",
        description: "Failed to load cash runway data.",
        variant: "destructive",
      });
    }
  };

  // Function to fetch cash flow data
  const fetchCashFlowData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cash-management/cash-flow?tenant_id=${tenantId}&period=${period}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCashFlowData(data.cashFlowData);
    } catch (error) {
      console.error("Error fetching cash flow data:", error);
      toast({
        title: "Error",
        description: "Failed to load cash flow data.",
        variant: "destructive",
      });
    }
  };

  // Function to fetch credit line data
  const fetchCreditLineData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cash-management/credit-line?tenant_id=${tenantId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAvailableCredit(data.availableCredit);
      setCreditLimit(data.creditLimit);
      setCurrentBalance(data.currentBalance);
    } catch (error) {
      console.error("Error fetching credit line data:", error);
      toast({
        title: "Error",
        description: "Failed to load credit line data.",
        variant: "destructive",
      });
    }
  };

  // Function to export data as CSV
  const exportData = () => {
    const csvData = [
      // Cash Runway Data
      ["Cash Runway Data"],
      ["Date", "Balance"],
      ...cashRunwayData.map((item: any) => [item.date, item.balance]),
      [""],
      // Cash Flow Data
      ["Cash Flow Data"],
      ["Date", "Inflow", "Outflow"],
      ...cashFlowData.map((item: any) => [item.date, item.inflow, item.outflow]),
      [""],
      // Credit Line Data
      ["Credit Line Information"],
      ["Credit Limit", "Available Credit", "Current Balance"],
      [creditLimit, availableCredit, currentBalance]
    ];

    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `cash-management-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Export Successful",
      description: "Cash management data has been exported to CSV.",
    });
  };

  // Function to handle date range selection
  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    setIsDatePickerOpen(false);

    if (range?.from && range?.to) {
      const fromDate = format(range.from, "yyyy-MM");
      const toDate = format(range.to, "yyyy-MM");

      toast({
        title: "Date Range Selected",
        description: `Selected period: ${fromDate} to ${toDate}. Refreshing data...`,
      });

      // Re-fetch data with new date range
      fetchCashRunwayData();
      fetchCashFlowData();
    }
  };

  // Function to fetch treasury forecast and alerts
  const fetchTreasuryData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/treasury/forecast-cash-flow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          horizon_days: 30
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setForecastData(data);
      setLiquidityAlerts(data.alerts || []);
    } catch (error) {
      console.error("Error fetching treasury data:", error);
    }
  };

  // Function to fetch pending actions
  const fetchPendingActions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/treasury/pending-actions?tenant_id=${tenantId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPendingActions(data);
    } catch (error) {
      console.error("Error fetching pending actions:", error);
    }
  };

  // Function to approve credit draw
  const handleApproveTreasuryCreditDraw = async (amount: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/treasury/approve-credit-draw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenant_id: tenantId, amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Credit Draw Approved",
        description: `Treasury credit draw of ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)} has been approved.`,
      });

      // Refresh all data
      fetchCreditLineData();
      fetchTreasuryData();
      fetchPendingActions();
    } catch (error: any) {
      console.error("Error approving treasury credit draw:", error);
      toast({
        title: "Error Approving Credit Draw",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // Fetch data on component mount and when period changes
  useEffect(() => {
    fetchCashRunwayData();
    fetchCashFlowData();
    fetchCreditLineData();
    fetchTreasuryData();
    fetchPendingActions();
  }, [period]);

  // Handle approve credit draw
  const handleApproveCreditDraw = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cash-management/credit-draw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantId, amount: Number(creditDrawAmount) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Credit Draw Approved",
        description: `A credit draw of ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(Number(creditDrawAmount))} has been approved. New available credit: ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(data.availableCredit)}.`,
      });
      setAvailableCredit(data.availableCredit);
      setCurrentBalance(data.newBalance);
      setIsCreditDrawModalOpen(false);
      // Re-fetch cash runway data as balance might have changed
      fetchCashRunwayData(); 
    } catch (error: any) {
      console.error("Error approving credit draw:", error);
      toast({
        title: "Error Approving Credit Draw",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cash Management</h1>
            <p className="text-muted-foreground">Monitor and manage your company's cash position</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Date Range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={exportData}>
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
                {/* Dynamically calculate months remaining based on availableCredit and average monthly burn rate */}
                {/* For now, keep hardcoded or derive from cashRunwayData */}
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

        {/* Treasury Alerts */}
        {liquidityAlerts.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <CardTitle className="text-red-800">Treasury Liquidity Alerts</CardTitle>
              </div>
              <CardDescription className="text-red-700">
                AI-powered cash flow forecasting has detected potential liquidity issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {liquidityAlerts.map((alert: any, index: number) => (
                  <div key={index} className="bg-white rounded-md border border-red-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">Projected Shortfall Alert</h3>
                      <span className="text-sm text-red-600 font-medium">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(alert.projectedBalance)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Projected balance on {alert.projectedDate} falls below threshold of{" "}
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(alert.threshold)}
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded p-3">
                      <p className="text-sm text-amber-800 font-medium">AI Recommendation:</p>
                      <p className="text-sm text-amber-700">{alert.recommendedAction}</p>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={() => setIsCreditDrawModalOpen(true)}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Review Credit Options
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Treasury Actions */}
        {pendingActions.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                <CardTitle className="text-amber-800">Pending Treasury Actions</CardTitle>
              </div>
              <CardDescription className="text-amber-700">
                Actions requiring your approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingActions.map((action: any, index: number) => (
                  <div key={index} className="bg-white rounded-md border border-amber-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{action.description}</h3>
                      <span className="text-sm text-amber-600 font-medium">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(action.amount)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Created: {new Date(action.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        Review Details
                      </Button>
                      <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700"
                        onClick={() => handleApproveTreasuryCreditDraw(action.amount)}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cash Flow Forecast */}
        {forecastData && (
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Forecast</CardTitle>
              <CardDescription>AI-powered 30-day cash flow projection</CardDescription>
            </CardHeader>
            <CardContent>
              <Chart
                title=""
                data={forecastData.pointForecast || []}
                type="line"
                xAxisKey="date"
                series={[
                  { name: "Forecast", key: "value", color: "#10b981" },
                ]}
                height={300}
              />
              <div className="mt-4 text-sm text-gray-600">
                <p>Model Version: {forecastData.modelVersion}</p>
                <p>Last Updated: {new Date().toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        )}
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
              <span className="font-medium">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(creditLimit)}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-teal-600 rounded-full" style={{ width: `${(currentBalance / creditLimit) * 100}%` }}></div>
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

"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, AlertTriangle, FileText, BarChart3, TrendingUp, TrendingDown, Bell, BellRing } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Chart } from "@/components/ui/chart"
import { ApprovalCard } from "@/components/ui/approval-card"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { toast } = useToast()
  const [pendingApprovals, setPendingApprovals] = useState(3)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isApprovalsModalOpen, setIsApprovalsModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Sample notifications data
  const notifications = [
    {
      id: "notif-1",
      title: "Invoice #1234 requires approval",
      message: "Office Supplies Inc. - $1,250.00",
      time: "5 minutes ago",
      type: "approval",
      read: false,
    },
    {
      id: "notif-2",
      title: "Payment processed successfully",
      message: "Tech Solutions Ltd. - $3,450.75",
      time: "1 hour ago",
      type: "success",
      read: false,
    },
    {
      id: "notif-3",
      title: "Monthly report generated",
      message: "May 2024 financial report is ready",
      time: "2 hours ago",
      type: "info",
      read: true,
    },
    {
      id: "notif-4",
      title: "Budget variance detected",
      message: "Marketing expenses exceeded by 18%",
      time: "3 hours ago",
      type: "warning",
      read: true,
    },
  ]

  // Sample pending approvals data
  const allPendingApprovals = [
    {
      id: "inv-1234",
      title: "Invoice #1234 - Office Supplies Inc.",
      description: "$1,250.00 - Due in 15 days",
      confidence: 92,
      rationale:
        "This invoice matches previous payments to this vendor. All line items are within expected ranges and the payment terms match our agreement.",
      type: "invoice",
    },
    {
      id: "exp-5678",
      title: "Expense Report #5678 - John Doe",
      description: "$850.00 - Travel expenses",
      confidence: 88,
      rationale:
        "Travel expenses are within policy limits. All receipts are attached and destinations match approved business travel.",
      type: "expense",
    },
    {
      id: "pur-9012",
      title: "Purchase Order #9012 - IT Equipment",
      description: "$4,500.00 - Laptop computers",
      confidence: 95,
      rationale:
        "Purchase order matches approved budget allocation for IT equipment. Vendor is on approved supplier list.",
      type: "purchase",
    },
  ]

  // Sample data for charts
  const cashRunwayData = [
    { month: "Jan", runway: 12 },
    { month: "Feb", runway: 11 },
    { month: "Mar", runway: 10 },
    { month: "Apr", runway: 9.5 },
    { month: "May", runway: 8.5 },
    { month: "Jun", runway: 8 },
  ]

  const apMetricsData = [
    { date: "May 1", invoiced: 12000, paid: 8000 },
    { date: "May 8", invoiced: 15000, paid: 10000 },
    { date: "May 15", invoiced: 9000, paid: 7000 },
    { date: "May 22", invoiced: 18000, paid: 12000 },
    { date: "May 29", invoiced: 14000, paid: 9000 },
  ]

  const arMetricsData = [
    { date: "May 1", billed: 20000, collected: 15000 },
    { date: "May 8", billed: 25000, collected: 18000 },
    { date: "May 15", billed: 18000, collected: 14000 },
    { date: "May 22", billed: 30000, collected: 22000 },
    { date: "May 29", billed: 22000, collected: 17000 },
  ]

  // Handle notifications
  const handleNotificationsClick = () => {
    setIsNotificationsOpen(true)
  }

  const markNotificationAsRead = (id: string) => {
    toast({
      title: "Notification marked as read",
      description: "The notification has been marked as read.",
    })
  }

  // Handle view all pending approvals
  const handleViewAllApprovals = () => {
    setIsApprovalsModalOpen(true)
  }

  // Handle generate report
  const handleGenerateReport = () => {
    setIsReportModalOpen(true)
  }

  const handleConfirmGenerateReport = async (reportType: string) => {
    setIsGeneratingReport(true)

    // Simulate report generation
    setTimeout(() => {
      setIsGeneratingReport(false)
      setIsReportModalOpen(false)
      toast({
        title: "Report Generated",
        description: `${reportType} report has been generated and is ready for download.`,
      })
    }, 3000)
  }

  // Handle view analytics
  const handleViewAnalytics = () => {
    toast({
      title: "Analytics Dashboard",
      description: "Redirecting to advanced analytics dashboard...",
    })
    // In a real app, this would navigate to an analytics page
  }

  const handleApprove = (id: string) => {
    toast({
      title: "Approved",
      description: `Item ${id} has been approved.`,
    })
    setPendingApprovals((prev) => prev - 1)
  }

  const handleReject = (id: string, reason?: string) => {
    toast({
      title: "Rejected",
      description: reason ? `Item ${id} rejected: ${reason}` : `Item ${id} has been rejected.`,
      variant: "destructive",
    })
    setPendingApprovals((prev) => prev - 1)
  }

  const handleEdit = (id: string) => {
    toast({
      title: "Edit mode",
      description: `Opening editor for item ${id}.`,
    })
  }

  // Get notification icon based on read status
  const getNotificationIcon = () => {
    const unreadCount = notifications.filter((n) => !n.read).length
    return unreadCount > 0 ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />
  }

  // Get notification badge color based on type
  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "approval":
        return "bg-amber-100 text-amber-800"
      case "success":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-red-100 text-red-800"
      case "info":
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your accounting operations and pending actions.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            
            <Button variant="outline" onClick={handleGenerateReport}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleViewAnalytics}>
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg font-medium">Pending Approvals</CardTitle>
                <CardDescription>Items requiring your review and approval</CardDescription>
              </div>
              <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {pendingApprovals} Pending
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ApprovalCard
                  id="inv-1234"
                  title="Invoice #1234 - Office Supplies Inc."
                  description="$1,250.00 - Due in 15 days"
                  confidence={92}
                  rationale="This invoice matches previous payments to this vendor. All line items are within expected ranges and the payment terms match our agreement."
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={handleEdit}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="ml-auto" onClick={handleViewAllApprovals}>
                View all pending approvals
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Metrics Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Cash Runway */}
          <Card className="col-span-full md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Cash Runway</CardTitle>
              <CardDescription>Current financial sustainability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="text-5xl font-bold text-teal-600">8.5</div>
                <p className="text-sm text-gray-500">months remaining</p>
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-teal-600 rounded-full" style={{ width: "70%" }}></div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link
                href="/liquidity/cash-management"
                className="text-sm text-teal-600 hover:underline ml-auto flex items-center"
              >
                View cash management
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </CardFooter>
          </Card>

          {/* AP Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Accounts Payable</CardTitle>
              <CardDescription>Month-to-date metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Invoiced</p>
                    <p className="text-2xl font-bold">$68,000</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">+12%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Paid</p>
                    <p className="text-2xl font-bold">$46,000</p>
                  </div>
                  <div className="flex items-center text-red-600">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">-3%</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link
                href="/transactions/invoices?tab=ap"
                className="text-sm text-teal-600 hover:underline ml-auto flex items-center"
              >
                View AP invoices
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </CardFooter>
          </Card>

          {/* AR Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Accounts Receivable</CardTitle>
              <CardDescription>Month-to-date metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Billed</p>
                    <p className="text-2xl font-bold">$115,000</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">+8%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Collected</p>
                    <p className="text-2xl font-bold">$86,000</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">+5%</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link
                href="/transactions/invoices?tab=ar"
                className="text-sm text-teal-600 hover:underline ml-auto flex items-center"
              >
                View AR receivables
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Chart
            title="AP Metrics Trend"
            description="Invoiced vs Paid amounts"
            data={apMetricsData}
            type="line"
            xAxisKey="date"
            series={[
              { name: "Invoiced", key: "invoiced", color: "#0ea5e9" },
              { name: "Paid", key: "paid", color: "#10b981" },
            ]}
          />

          <Chart
            title="AR Metrics Trend"
            description="Billed vs Collected amounts"
            data={arMetricsData}
            type="line"
            xAxisKey="date"
            series={[
              { name: "Billed", key: "billed", color: "#8b5cf6" },
              { name: "Collected", key: "collected", color: "#f59e0b" },
            ]}
          />
        </div>

        {/* Variance Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Latest Variance Analysis</CardTitle>
            <CardDescription>AI-generated insights on budget vs. actual performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <h3 className="font-medium text-amber-800 mb-2">Marketing Expenses Exceeded Budget</h3>
              <p className="text-sm text-gray-700">
                Marketing expenses are 18% over budget this month, primarily due to the unplanned trade show
                participation ($12,500). However, this is offset by new customer acquisition, with 15 new accounts
                signed this month directly attributed to the event.
              </p>
              <div className="mt-3 flex justify-end">
                <Button variant="outline" size="sm" className="text-xs bg-transparent">
                  View Full Analysis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Modal */}
      <ModalDialog
        title="Notifications"
        description="Recent system notifications and alerts"
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        size="lg"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${
                notification.read ? "bg-gray-50 border-gray-200" : "bg-white border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium ${notification.read ? "text-gray-700" : "text-gray-900"}`}>
                      {notification.title}
                    </h4>
                    <Badge className={getNotificationBadge(notification.type)}>{notification.type}</Badge>
                  </div>
                  <p className={`text-sm ${notification.read ? "text-gray-500" : "text-gray-600"}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                </div>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markNotificationAsRead(notification.id)}
                    className="text-xs"
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ModalDialog>

      {/* All Pending Approvals Modal */}
      <ModalDialog
        title="All Pending Approvals"
        description="Complete list of items requiring approval"
        isOpen={isApprovalsModalOpen}
        onClose={() => setIsApprovalsModalOpen(false)}
        size="xl"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {allPendingApprovals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              id={approval.id}
              title={approval.title}
              description={approval.description}
              confidence={approval.confidence}
              rationale={approval.rationale}
              onApprove={handleApprove}
              onReject={handleReject}
              onEdit={handleEdit}
            />
          ))}
        </div>
      </ModalDialog>

      {/* Generate Report Modal */}
      <ModalDialog
        title="Generate Report"
        description="Select the type of report to generate"
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center bg-transparent"
              onClick={() => handleConfirmGenerateReport("Financial Summary")}
              disabled={isGeneratingReport}
            >
              <FileText className="h-6 w-6 mb-2" />
              Financial Summary
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center bg-transparent"
              onClick={() => handleConfirmGenerateReport("Cash Flow")}
              disabled={isGeneratingReport}
            >
              <BarChart3 className="h-6 w-6 mb-2" />
              Cash Flow Report
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center bg-transparent"
              onClick={() => handleConfirmGenerateReport("AP Aging")}
              disabled={isGeneratingReport}
            >
              <TrendingDown className="h-6 w-6 mb-2" />
              AP Aging Report
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center bg-transparent"
              onClick={() => handleConfirmGenerateReport("AR Aging")}
              disabled={isGeneratingReport}
            >
              <TrendingUp className="h-6 w-6 mb-2" />
              AR Aging Report
            </Button>
          </div>
          {isGeneratingReport && (
            <div className="text-center py-4">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600 mr-2"></div>
                Generating report...
              </div>
            </div>
          )}
        </div>
      </ModalDialog>
    </AppShell>
  )
}

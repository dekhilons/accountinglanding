"use client"

import { useState } from "react"
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { useToast } from "@/hooks/use-toast"

// Define types
type CloseStep = {
  id: string
  name: string
  status: "completed" | "in-progress" | "pending" | "blocked"
  completedBy?: string
  completedAt?: string
  description: string
}

type ClosePeriod = {
  id: string
  name: string
  startDate: string
  endDate: string
  status: "open" | "in-progress" | "closed"
  progress: number
  steps: CloseStep[]
}

export default function MonthEndClosePage() {
  const { toast } = useToast()
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isSelectPeriodModalOpen, setIsSelectPeriodModalOpen] = useState(false)
  const [isViewReportsModalOpen, setIsViewReportsModalOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<ClosePeriod | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState<ClosePeriod>({
    id: "period-2024-05",
    name: "May 2024",
    startDate: "2024-05-01",
    endDate: "2024-05-31",
    status: "in-progress",
    progress: 65,
    steps: [
      {
        id: "step-1",
        name: "Bank Reconciliation",
        status: "completed",
        completedBy: "John Doe",
        completedAt: "2024-06-02T14:30:00",
        description: "Reconcile all bank accounts with the general ledger",
      },
      {
        id: "step-2",
        name: "Accounts Receivable Review",
        status: "completed",
        completedBy: "Jane Smith",
        completedAt: "2024-06-03T10:15:00",
        description: "Review and age all outstanding receivables",
      },
      {
        id: "step-3",
        name: "Accounts Payable Review",
        status: "in-progress",
        description: "Review and confirm all outstanding payables",
      },
      {
        id: "step-4",
        name: "Expense Accruals",
        status: "pending",
        description: "Record accruals for expenses incurred but not yet invoiced",
      },
      {
        id: "step-5",
        name: "Revenue Recognition",
        status: "pending",
        description: "Ensure all revenue is properly recognized for the period",
      },
      {
        id: "step-6",
        name: "Inventory Reconciliation",
        status: "blocked",
        description: "Reconcile physical inventory with system records",
      },
      {
        id: "step-7",
        name: "Financial Statement Review",
        status: "pending",
        description: "Review draft financial statements for accuracy",
      },
      {
        id: "step-8",
        name: "Close Period",
        status: "pending",
        description: "Lock the period and finalize financial statements",
      },
    ],
  })

  // Sample data for close periods
  const [closePeriods, setClosePeriods] = useState<ClosePeriod[]>([
    {
      id: "period-2024-05",
      name: "May 2024",
      startDate: "2024-05-01",
      endDate: "2024-05-31",
      status: "in-progress",
      progress: 65,
      steps: [
        {
          id: "step-1",
          name: "Bank Reconciliation",
          status: "completed",
          completedBy: "John Doe",
          completedAt: "2024-06-02T14:30:00",
          description: "Reconcile all bank accounts with the general ledger",
        },
        {
          id: "step-2",
          name: "Accounts Receivable Review",
          status: "completed",
          completedBy: "Jane Smith",
          completedAt: "2024-06-03T10:15:00",
          description: "Review and age all outstanding receivables",
        },
        {
          id: "step-3",
          name: "Accounts Payable Review",
          status: "in-progress",
          description: "Review and confirm all outstanding payables",
        },
        {
          id: "step-4",
          name: "Expense Accruals",
          status: "pending",
          description: "Record accruals for expenses incurred but not yet invoiced",
        },
        {
          id: "step-5",
          name: "Revenue Recognition",
          status: "pending",
          description: "Ensure all revenue is properly recognized for the period",
        },
        {
          id: "step-6",
          name: "Inventory Reconciliation",
          status: "blocked",
          description: "Reconcile physical inventory with system records",
        },
        {
          id: "step-7",
          name: "Financial Statement Review",
          status: "pending",
          description: "Review draft financial statements for accuracy",
        },
        {
          id: "step-8",
          name: "Close Period",
          status: "pending",
          description: "Lock the period and finalize financial statements",
        },
      ],
    },
    {
      id: "period-2024-04",
      name: "April 2024",
      startDate: "2024-04-01",
      endDate: "2024-04-30",
      status: "closed",
      progress: 100,
      steps: [
        {
          id: "step-1-apr",
          name: "Bank Reconciliation",
          status: "completed",
          completedBy: "John Doe",
          completedAt: "2024-05-02T11:30:00",
          description: "Reconcile all bank accounts with the general ledger",
        },
        {
          id: "step-2-apr",
          name: "Accounts Receivable Review",
          status: "completed",
          completedBy: "Jane Smith",
          completedAt: "2024-05-03T09:45:00",
          description: "Review and age all outstanding receivables",
        },
        {
          id: "step-3-apr",
          name: "Accounts Payable Review",
          status: "completed",
          completedBy: "Mike Johnson",
          completedAt: "2024-05-03T14:20:00",
          description: "Review and confirm all outstanding payables",
        },
        {
          id: "step-8-apr",
          name: "Close Period",
          status: "completed",
          completedBy: "Sarah Williams",
          completedAt: "2024-05-05T16:30:00",
          description: "Lock the period and finalize financial statements",
        },
      ],
    },
  ])

  // Handle approve close
  const handleApproveClose = () => {
    // Update the status of the current period to 'closed'
    setCurrentPeriod((prevPeriod) => ({
      ...prevPeriod,
      status: "closed",
      progress: 100,
      steps: prevPeriod.steps.map(step => ({ ...step, status: "completed", completedBy: "System", completedAt: new Date().toISOString() }))
    }))

    // Add the current period to the list of closed periods (if it's not already there)
    setClosePeriods((prevPeriods) => {
      if (!prevPeriods.some(period => period.id === currentPeriod.id)) {
        return [currentPeriod, ...prevPeriods];
      }
      return prevPeriods.map(period => period.id === currentPeriod.id ? currentPeriod : period);
    });

    toast({
      title: "Period Closed",
      description: `The period ${currentPeriod.name} has been successfully closed.`,
    })
    setIsConfirmModalOpen(false)
  }

  const handleSelectPeriod = (period: ClosePeriod) => {
    setCurrentPeriod(period)
    setIsSelectPeriodModalOpen(false)
    toast({
      title: "Period Selected",
      description: `You have selected ${period.name} as the current period.`,
    })
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: CloseStep["status"] | ClosePeriod["status"] }) => {
    switch (status) {
      case "completed":
      case "closed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            {status === "completed" ? "Completed" : "Closed"}
          </Badge>
        )
      case "in-progress":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="mr-1 h-3 w-3" />
            In Progress
          </Badge>
        )
      case "pending":
      case "open":
        return (
          <Badge className="bg-amber-100 text-amber-800">
            <Clock className="mr-1 h-3 w-3" />
            {status === "pending" ? "Pending" : "Open"}
          </Badge>
        )
      case "blocked":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            Blocked
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Month-End Close</h1>
            <p className="text-muted-foreground">Manage and track the month-end close process</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsSelectPeriodModalOpen(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Select Period
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => {
                setSelectedPeriod(currentPeriod)
                setIsConfirmModalOpen(true)
              }}
              disabled={currentPeriod.progress < 100}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve Close
            </Button>
          </div>
        </div>

        {/* Current Period */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Current Period: {currentPeriod.name}</CardTitle>
                <CardDescription>
                  {new Date(currentPeriod.startDate).toLocaleDateString()} to{" "}
                  {new Date(currentPeriod.endDate).toLocaleDateString()}
                </CardDescription>
              </div>
              <StatusBadge status={currentPeriod.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Close Progress</span>
                  <span className="text-sm font-medium">{currentPeriod.progress}%</span>
                </div>
                <Progress value={currentPeriod.progress} className="h-2" />
              </div>

              <div className="border rounded-md">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="text-sm font-medium">Close Checklist</h3>
                </div>
                <div className="divide-y">
                  {currentPeriod.steps.map((step) => (
                    <div key={step.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {step.status === "completed" ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          ) : step.status === "in-progress" ? (
                            <Clock className="h-5 w-5 text-blue-500 mr-2" />
                          ) : step.status === "blocked" ? (
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                          ) : (
                            <div className="h-5 w-5 border-2 border-gray-300 rounded-full mr-2"></div>
                          )}
                          <span className="font-medium">{step.name}</span>
                        </div>
                        <StatusBadge status={step.status} />
                      </div>
                      <p className="text-sm text-gray-500 mt-1 ml-7">{step.description}</p>
                      {step.completedBy && (
                        <p className="text-xs text-gray-500 mt-1 ml-7">
                          Completed by {step.completedBy} on{" "}
                          {new Date(step.completedAt!).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previous Periods */}
        <Card>
          <CardHeader>
            <CardTitle>Previous Periods</CardTitle>
            <CardDescription>History of closed accounting periods</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {closePeriods.filter(period => period.id !== currentPeriod.id).map((period) => (
                <AccordionItem key={period.id} value={period.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center">
                        <span className="font-medium">{period.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({new Date(period.startDate).toLocaleDateString()} to{" "}
                          {new Date(period.endDate).toLocaleDateString()})
                        </span>
                      </div>
                      <StatusBadge status={period.status} />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="border rounded-md">
                        <div className="bg-gray-50 px-4 py-3 border-b">
                          <h3 className="text-sm font-medium">Close Checklist</h3>
                        </div>
                        <div className="divide-y">
                          {period.steps.map((step) => (
                            <div key={step.id} className="px-4 py-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                  <span className="font-medium">{step.name}</span>
                                </div>
                                <StatusBadge status={step.status} />
                              </div>
                              {step.completedBy && (
                                <p className="text-xs text-gray-500 mt-1 ml-7">
                                  Completed by {step.completedBy} on{" "}
                                  {new Date(step.completedAt!).toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="outline" onClick={() => setIsViewReportsModalOpen(true)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          View Reports
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Close Modal */}
      <ModalDialog
        title="Confirm Period Close"
        description="Are you sure you want to close this accounting period? This action cannot be undone."
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleApproveClose}
        confirmText="Approve Close"
        cancelText="Cancel"
      >
        {selectedPeriod && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
                <div>
                  <h3 className="font-medium text-amber-800">Important Notice</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Closing the period will lock all transactions for {selectedPeriod.name}. After closing, you will not
                    be able to post new transactions to this period without special authorization.
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-md">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="text-sm font-medium">Close Checklist Status</h3>
              </div>
              <div className="p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Completed Steps</span>
                  <span className="text-sm font-medium">
                    {selectedPeriod.steps.filter((step) => step.status === "completed").length} of{" "}
                    {selectedPeriod.steps.length}
                  </span>
                </div>
                <Progress
                  value={
                    (selectedPeriod.steps.filter((step) => step.status === "completed").length /
                      selectedPeriod.steps.length) *
                    100
                  }
                  className="h-2"
                />
              </div>
            </div>

            {selectedPeriod.steps.some((step) => step.status === "blocked") && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-medium text-red-800">Blocked Steps Detected</h3>
                    <p className="text-sm text-red-700 mt-1">
                      There are blocked steps in the close checklist. It is recommended to resolve these issues before
                      closing the period.
                    </p>
                    <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                      {selectedPeriod.steps
                        .filter((step) => step.status === "blocked")
                        .map((step) => (
                          <li key={step.id}>{step.name}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ModalDialog>

      {/* Select Period Modal */}
      <ModalDialog
        title="Select Accounting Period"
        isOpen={isSelectPeriodModalOpen}
        onClose={() => setIsSelectPeriodModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          {closePeriods.map((period) => (
            <Card
              key={period.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSelectPeriod(period)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{period.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(period.startDate).toLocaleDateString()} to{" "}
                      {new Date(period.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={period.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ModalDialog>

      {/* View Reports Modal */}
      <ModalDialog
        title="Reports for Selected Period"
        description="This is a placeholder for viewing detailed financial reports for the selected period."
        isOpen={isViewReportsModalOpen}
        onClose={() => setIsViewReportsModalOpen(false)}
        size="lg"
      >
        <div className="space-y-4">
          <p>Reports would be displayed here.</p>
          {/* Add report components or links here */}
        </div>
      </ModalDialog>
    </AppShell>
  )
}

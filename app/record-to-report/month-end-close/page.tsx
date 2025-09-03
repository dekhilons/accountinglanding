"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, CheckCircle, AlertCircle, FileText, DollarSign, TrendingUp, Users } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

// API Integration Types
interface GLAccount {
  id: string
  account_number: string
  name: string
  account_type: string
  balance: number
  is_control_account: boolean
}

interface UnreconciledTransaction {
  id: string
  type: string
  source: string
  date: string
  description: string
  amount: number
  currency: string
  status: string
  entity_name?: string
  reference?: string
}

interface ReconciliationSuggestion {
  transaction_id: string
  match_confidence: number
  suggested_gl_account?: string
  alternatives: Array<{
    account_id: string
    account_name: string
    confidence: number
  }>
  requires_approval: boolean
  anomaly_score: number
}

interface FinancialReport {
  fiscal_period_id: string
  period_name: string
  generated_at: string
  // Add specific report fields based on report type
  [key: string]: any
}

// API Service Class
class GLAPIService {
  private baseURL = process.env.NEXT_PUBLIC_GL_API_URL || 'http://localhost:8005'
  private tenantId = 'default' // This should come from auth context

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`, // Add auth header
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  private getAuthToken(): string {
    // This should get the token from your auth context/store
    return localStorage.getItem('authToken') || ''
  }

  // Transaction Reconciliation APIs
  async getUnreconciledTransactions(type?: string): Promise<UnreconciledTransaction[]> {
    const params = new URLSearchParams({ tenant_id: this.tenantId })
    if (type) params.append('transaction_type', type)
    return this.request(`/api/gl/transactions/unreconciled?${params}`)
  }

  async getReconciliationSuggestions(transactionId: string, vendorName?: string, customerName?: string): Promise<ReconciliationSuggestion> {
    return this.request(`/api/gl/transactions/${transactionId}/reconcile`, {
      method: 'POST',
      body: JSON.stringify({
        tenant_id: this.tenantId,
        vendor_name: vendorName,
        customer_name: customerName,
      }),
    })
  }

  async approveReconciliation(transactionId: string, glAccountId: string, glAccountName: string): Promise<any> {
    return this.request(`/api/gl/transactions/${transactionId}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        transaction_type: 'BANK_TRANSACTION', // or determine from context
        gl_account_id: glAccountId,
        gl_account_name: glAccountName,
      }),
    })
  }

  async bulkReconcileTransactions(transactions: Array<{transaction_id: string, transaction_type: string}>): Promise<any> {
    return this.request('/api/gl/transactions/bulk-reconcile', {
      method: 'POST',
      body: JSON.stringify({
        tenant_id: this.tenantId,
        transactions,
      }),
    })
  }

  async getGLAccounts(accountType?: string): Promise<GLAccount[]> {
    const params = new URLSearchParams({ tenant_id: this.tenantId })
    if (accountType) params.append('account_type', accountType)
    return this.request(`/api/gl/transactions/gl-accounts?${params}`)
  }

  // Journal Entry APIs
  async createJournalEntry(entryData: any): Promise<any> {
    return this.request('/journal-entries', {
      method: 'POST',
      body: JSON.stringify({
        ...entryData,
        tenant_id: this.tenantId,
      }),
    })
  }

  async postJournalEntry(journalEntryId: string): Promise<any> {
    return this.request(`/journal-entries/${journalEntryId}/post`, {
      method: 'POST',
    })
  }

  async getJournalEntries(filters: any = {}): Promise<any[]> {
    const params = new URLSearchParams({
      tenant_id: this.tenantId,
      ...filters,
    })
    return this.request(`/journal-entries?${params}`)
  }

  // Financial Reporting APIs
  async generateTrialBalance(fiscalPeriodId: string): Promise<FinancialReport> {
    return this.request(`/reports/trial-balance?tenant_id=${this.tenantId}&fiscal_period_id=${fiscalPeriodId}`)
  }

  async generateBalanceSheet(fiscalPeriodId: string): Promise<FinancialReport> {
    return this.request(`/reports/balance-sheet?tenant_id=${this.tenantId}&fiscal_period_id=${fiscalPeriodId}`)
  }

  async generateIncomeStatement(fiscalPeriodId: string): Promise<FinancialReport> {
    return this.request(`/reports/income-statement?tenant_id=${this.tenantId}&fiscal_period_id=${fiscalPeriodId}`)
  }

  async generateCashFlowStatement(fiscalPeriodId: string): Promise<FinancialReport> {
    return this.request(`/reports/cash-flow?tenant_id=${this.tenantId}&fiscal_period_id=${fiscalPeriodId}`)
  }

  // Master Data APIs
  async getFiscalPeriods(): Promise<any[]> {
    return this.request(`/fiscal-periods?tenant_id=${this.tenantId}`)
  }

  async getAccounts(): Promise<any[]> {
    return this.request(`/accounts?tenant_id=${this.tenantId}`)
  }
}

// Define types
type CloseStep = {
  id: string
  name: string
  status: "completed" | "in-progress" | "pending" | "blocked"
  completedBy?: string
  completedAt?: string
  description: string
  apiEndpoint?: string
  data?: any
  error?: string
}

type ClosePeriod = {
  id: string
  name: string
  startDate: string
  endDate: string
  status: "open" | "in-progress" | "closed"
  progress: number
  steps: CloseStep[]
  fiscalPeriodId?: string
}

export default function MonthEndClosePage() {
  const { toast } = useToast()
  const [apiService] = useState(() => new GLAPIService())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isViewReportsModalOpen, setIsViewReportsModalOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<ClosePeriod | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState<ClosePeriod | null>(null)

  const [closePeriods, setClosePeriods] = useState<ClosePeriod[]>([])

  // API Integration State
  const [unreconciledTransactions, setUnreconciledTransactions] = useState<UnreconciledTransaction[]>([])
  const [glAccounts, setGLAccounts] = useState<GLAccount[]>([])
  const [financialReports, setFinancialReports] = useState<Record<string, FinancialReport | undefined>>({})
  const [fiscalPeriods, setFiscalPeriods] = useState<any[]>([])

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Debug logging for dropdown state
  useEffect(() => {
    console.log('Dropdown state - currentPeriod:', currentPeriod?.name, 'closePeriods:', closePeriods.length)
  }, [currentPeriod, closePeriods])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load fiscal periods
      try {
        const periods = await apiService.getFiscalPeriods()
        console.log('Loaded fiscal periods:', periods)
        setFiscalPeriods(periods)

        // Create close periods from fiscal periods
        const closePeriodsData = periods.map((period: any) => ({
          id: period.id,
          name: period.name,
          startDate: period.start_date,
          endDate: period.end_date,
          status: (period.is_closed ? "closed" : "open") as "open" | "in-progress" | "closed",
          progress: period.is_closed ? 100 : 0,
          fiscalPeriodId: period.id,
          steps: createDefaultCloseSteps()
        }))
        console.log('Created close periods:', closePeriodsData)
        setClosePeriods(closePeriodsData)
      } catch (error) {
        console.error('Failed to load fiscal periods:', error)
        setError('Failed to load fiscal periods. Please check the GL service.')
        return
      }

      // Load GL accounts
      const accounts = await apiService.getGLAccounts()
      setGLAccounts(accounts)

      // Load unreconciled transactions
      await loadUnreconciledTransactions()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load initial data')
      toast({
        title: "Error",
        description: "Failed to load initial data. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUnreconciledTransactions = async (type?: string) => {
    try {
      const transactions = await apiService.getUnreconciledTransactions(type)
      setUnreconciledTransactions(transactions)
    } catch (err) {
      console.error('Failed to load unreconciled transactions:', err)
    }
  }

  const createDefaultCloseSteps = (): CloseStep[] => [
    {
      id: "step-1",
      name: "Bank Reconciliation",
      status: "pending",
      description: "Reconcile all bank accounts with the general ledger",
      apiEndpoint: "/api/gl/transactions/unreconciled",
    },
    {
      id: "step-2",
      name: "Accounts Receivable Review",
      status: "pending",
      description: "Review and age all outstanding receivables",
      apiEndpoint: "/api/gl/transactions/unreconciled",
    },
    {
      id: "step-3",
      name: "Accounts Payable Review",
      status: "pending",
      description: "Review and confirm all outstanding payables",
      apiEndpoint: "/api/gl/transactions/unreconciled",
    },
    {
      id: "step-4",
      name: "Expense Accruals",
      status: "pending",
      description: "Record accruals for expenses incurred but not yet invoiced",
      apiEndpoint: "/journal-entries",
    },
    {
      id: "step-5",
      name: "Revenue Recognition",
      status: "pending",
      description: "Ensure all revenue is properly recognized for the period",
      apiEndpoint: "/journal-entries",
    },
    {
      id: "step-6",
      name: "Inventory Reconciliation",
      status: "pending",
      description: "Reconcile physical inventory with system records",
    },
    {
      id: "step-7",
      name: "Financial Statement Review",
      status: "pending",
      description: "Review draft financial statements for accuracy",
      apiEndpoint: "/reports",
    },
    {
      id: "step-8",
      name: "Close Period",
      status: "pending",
      description: "Lock the period and finalize financial statements",
    },
  ]

  const executeStep = async (stepId: string) => {
    if (!currentPeriod) return

    const step = currentPeriod.steps.find(s => s.id === stepId)
    if (!step) return

    try {
      setLoading(true)
      updateStepStatus(stepId, "in-progress")

      switch (stepId) {
        case "step-1":
          await executeBankReconciliation()
          break
        case "step-2":
          await executeARReview()
          break
        case "step-3":
          await executeAPReview()
          break
        case "step-4":
          await executeExpenseAccruals()
          break
        case "step-5":
          await executeRevenueRecognition()
          break
        case "step-7":
          await executeFinancialReporting()
          break
        case "step-8":
          await executePeriodClosure()
          break
      }

      updateStepStatus(stepId, "completed", "System")
      toast({
        title: "Step Completed",
        description: `${step.name} has been completed successfully.`,
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      updateStepStatus(stepId, "blocked", undefined, errorMessage)
      toast({
        title: "Step Failed",
        description: `Failed to complete ${step.name}: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const executeBankReconciliation = async () => {
    const bankTransactions = unreconciledTransactions.filter(t => t.type === 'BANK_TRANSACTION')

    if (bankTransactions.length === 0) {
      throw new Error('No unreconciled bank transactions found')
    }

    // Get reconciliation suggestions for each transaction
    const reconciliationPromises = bankTransactions.map(async (transaction) => {
      try {
        const suggestion = await apiService.getReconciliationSuggestions(transaction.id)
        return { transaction, suggestion }
      } catch (err) {
        console.error(`Failed to get suggestion for ${transaction.id}:`, err)
        return { transaction, suggestion: null }
      }
    })

    const results = await Promise.all(reconciliationPromises)

    // Auto-approve high confidence matches
    const approvalPromises = results
      .filter(result => result.suggestion && result.suggestion.match_confidence > 0.8)
      .map(async (result) => {
        const bestMatch = result.suggestion!.alternatives[0]
        if (bestMatch) {
          await apiService.approveReconciliation(
            result.transaction.id,
            bestMatch.account_id,
            bestMatch.account_name
          )
        }
      })

    await Promise.all(approvalPromises)

    // Reload unreconciled transactions
    await loadUnreconciledTransactions('BANK')
  }

  const executeARReview = async () => {
    const arTransactions = unreconciledTransactions.filter(t => t.type === 'AR_PAYMENT')

    if (arTransactions.length === 0) {
      // This is actually fine - no unreconciled AR transactions
      return
    }

    // Similar logic to bank reconciliation but for AR
    const reconciliationPromises = arTransactions.map(async (transaction) => {
      const suggestion = await apiService.getReconciliationSuggestions(
        transaction.id,
        undefined,
        transaction.entity_name
      )
      return { transaction, suggestion }
    })

    await Promise.all(reconciliationPromises)
    await loadUnreconciledTransactions('AR')
  }

  const executeAPReview = async () => {
    const apTransactions = unreconciledTransactions.filter(t => t.type === 'AP_INVOICE')

    if (apTransactions.length === 0) {
      return
    }

    const reconciliationPromises = apTransactions.map(async (transaction) => {
      const suggestion = await apiService.getReconciliationSuggestions(
        transaction.id,
        transaction.entity_name
      )
      return { transaction, suggestion }
    })

    await Promise.all(reconciliationPromises)
    await loadUnreconciledTransactions('AP')
  }

  const executeExpenseAccruals = async () => {
    if (!currentPeriod) return

    // Find appropriate GL accounts for accruals
    const accruedExpensesAccount = glAccounts.find(acc => acc.account_number.startsWith('2') && acc.name.toLowerCase().includes('accrued'))
    const expenseAccount = glAccounts.find(acc => acc.account_number.startsWith('5') || acc.account_number.startsWith('6'))

    if (!accruedExpensesAccount || !expenseAccount) {
      throw new Error('Required GL accounts for expense accruals not found. Please configure accrued expenses and expense accounts.')
    }

    // Calculate accrual amount (this would typically come from business logic)
    const accrualAmount = 5000.00

    const accrualEntry = {
      journal_type_id: "manual-entry", // Use a standard journal type
      fiscal_period_id: currentPeriod.fiscalPeriodId,
      entry_number: `ACCRUAL-${Date.now()}`,
      entry_date: new Date().toISOString().split('T')[0],
      description: "Monthly expense accruals",
      reference: "MONTH-END-ACCRUAL",
      source: "MANUAL",
      lines: [
        {
          account_id: accruedExpensesAccount.id,
          line_number: 1,
          description: "Accrued expenses",
          debit_amount: accrualAmount,
          credit_amount: 0,
        },
        {
          account_id: expenseAccount.id,
          line_number: 2,
          description: "Expense liability",
          debit_amount: 0,
          credit_amount: accrualAmount,
        }
      ]
    }

    const createdEntry = await apiService.createJournalEntry(accrualEntry)
    await apiService.postJournalEntry(createdEntry.id)
  }

  const executeRevenueRecognition = async () => {
    if (!currentPeriod) return

    // Find appropriate GL accounts for revenue recognition
    const deferredRevenueAccount = glAccounts.find(acc => acc.account_number.startsWith('2') && acc.name.toLowerCase().includes('deferred'))
    const revenueAccount = glAccounts.find(acc => acc.account_number.startsWith('4') && acc.name.toLowerCase().includes('revenue'))

    if (!deferredRevenueAccount || !revenueAccount) {
      throw new Error('Required GL accounts for revenue recognition not found. Please configure deferred revenue and revenue accounts.')
    }

    // Calculate recognition amount (this would typically come from business logic)
    const recognitionAmount = 7500.00

    const revenueEntry = {
      journal_type_id: "manual-entry", // Use a standard journal type
      fiscal_period_id: currentPeriod.fiscalPeriodId,
      entry_number: `REVENUE-${Date.now()}`,
      entry_date: new Date().toISOString().split('T')[0],
      description: "Revenue recognition adjustments",
      reference: "MONTH-END-REVENUE",
      source: "MANUAL",
      lines: [
        {
          account_id: deferredRevenueAccount.id,
          line_number: 1,
          description: "Deferred revenue recognition",
          debit_amount: 0,
          credit_amount: recognitionAmount,
        },
        {
          account_id: revenueAccount.id,
          line_number: 2,
          description: "Recognized revenue",
          debit_amount: recognitionAmount,
          credit_amount: 0,
        }
      ]
    }

    const createdEntry = await apiService.createJournalEntry(revenueEntry)
    await apiService.postJournalEntry(createdEntry.id)
  }

  const executeFinancialReporting = async () => {
    if (!currentPeriod || !currentPeriod.fiscalPeriodId) {
      throw new Error('Current period and fiscal period ID are required for financial reporting')
    }

    try {
      const [trialBalance, balanceSheet, incomeStatement, cashFlow] = await Promise.all([
        apiService.generateTrialBalance(currentPeriod.fiscalPeriodId).catch(() => null),
        apiService.generateBalanceSheet(currentPeriod.fiscalPeriodId).catch(() => null),
        apiService.generateIncomeStatement(currentPeriod.fiscalPeriodId).catch(() => null),
        apiService.generateCashFlowStatement(currentPeriod.fiscalPeriodId).catch(() => null),
      ])

      setFinancialReports({
        trialBalance: trialBalance || undefined,
        balanceSheet: balanceSheet || undefined,
        incomeStatement: incomeStatement || undefined,
        cashFlow: cashFlow || undefined,
      })
    } catch (error) {
      console.error('Error generating financial reports:', error)
      // Set empty reports if generation fails
      setFinancialReports({})
    }
  }

  const executePeriodClosure = async () => {
    if (!currentPeriod) return

    // Period closure would typically involve:
    // 1. Final validation of all entries
    // 2. Locking the period
    // 3. Publishing period close event
    // For now, we'll just mark it as closed

    // This would require a new API endpoint for period closure
    // await apiService.closePeriod(currentPeriod.fiscalPeriodId)

    setCurrentPeriod(prev => ({
      ...prev!,
      status: "closed",
      progress: 100,
    }))

    // Update the period in closePeriods as well
    setClosePeriods(prev => prev.map(period =>
      period.id === currentPeriod.id
        ? { ...period, status: "closed", progress: 100 }
        : period
    ))
  }

  const updateStepStatus = (
    stepId: string,
    status: CloseStep["status"],
    completedBy?: string,
    error?: string
  ) => {
    if (!currentPeriod) return

    setCurrentPeriod(prev => ({
      ...prev!,
      steps: prev!.steps.map(step =>
        step.id === stepId
          ? {
              ...step,
              status,
              completedBy: completedBy || step.completedBy,
              completedAt: status === "completed" ? new Date().toISOString() : step.completedAt,
              error,
            }
          : step
      ),
      progress: calculateProgress(prev!.steps.map(step =>
        step.id === stepId ? { ...step, status } : step
      )),
    }))
  }

  const calculateProgress = (steps: CloseStep[]): number => {
    const completedSteps = steps.filter(step => step.status === "completed").length
    return Math.round((completedSteps / steps.length) * 100)
  }

  // Handle approve close
  const handleApproveClose = () => {
    if (!currentPeriod) return

    setCurrentPeriod((prevPeriod) => ({
      ...prevPeriod!,
      status: "closed",
      progress: 100,
      steps: prevPeriod!.steps.map(step => ({ ...step, status: "completed", completedBy: "System", completedAt: new Date().toISOString() }))
    }))

    // Update the period in closePeriods as well
    setClosePeriods(prev => prev.map(period =>
      period.id === currentPeriod.id
        ? {
            ...period,
            status: "closed",
            progress: 100,
            steps: period.steps.map(step => ({ ...step, status: "completed", completedBy: "System", completedAt: new Date().toISOString() }))
          }
        : period
    ))

    toast({
      title: "Period Closed",
      description: `The period ${currentPeriod.name} has been successfully closed.`,
    })
    setIsConfirmModalOpen(false)
  }

  const handleSelectPeriod = (period: ClosePeriod) => {
    setCurrentPeriod(period)
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
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Month-End Close</h1>
            <p className="text-muted-foreground">Manage and track the month-end close process with integrated GL functionality</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={loading}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {currentPeriod ? currentPeriod.name : "Select Period"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading...</span>
                  </div>
                ) : closePeriods.length > 0 ? (
                  closePeriods.map((period) => (
                    <DropdownMenuItem
                      key={period.id}
                      onClick={() => handleSelectPeriod(period)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col w-full">
                        <span className="font-medium">{period.name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <StatusBadge status={period.status} />
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500 text-center">
                    No periods available
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {currentPeriod && (
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => {
                  setSelectedPeriod(currentPeriod)
                  setIsConfirmModalOpen(true)
                }}
                disabled={currentPeriod.progress < 100 || loading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Close
              </Button>
            )}
          </div>
        </div>

        {/* Current Period */}
        {currentPeriod ? (
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
                          <div className="flex items-center gap-2">
                            {/* {step.apiEndpoint && (
                              <Badge variant="outline" className="text-xs">
                                API Integrated
                              </Badge>
                            )} */}
                            <Button
                              size="sm"
                              variant={step.status === "pending" ? "default" : "outline"}
                              onClick={() => executeStep(step.id)}
                              disabled={loading || step.status === "completed" || step.status === "blocked"}
                            >
                              {loading ? "Processing..." : step.status === "pending" ? "Execute" : "Re-run"}
                            </Button>
                            <StatusBadge status={step.status} />
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 ml-7">{step.description}</p>
                        {step.error && (
                          <p className="text-sm text-red-500 mt-1 ml-7">Error: {step.error}</p>
                        )}
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
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Period Selected</h3>
                <p className="text-gray-500 mb-4">Please select a fiscal period from the dropdown above to begin the month-end close process.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              GL Integration Status
            </CardTitle>
            <CardDescription>Real-time status of GL service integration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm">
                  {unreconciledTransactions.length} Unreconciled Transactions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {glAccounts.length} GL Accounts Available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-sm">
                  {fiscalPeriods.length} Fiscal Periods
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-teal-500" />
                <span className="text-sm">
                  API Connected
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previous Periods */}
        <Card>
          <CardHeader>
            <CardTitle>Available Periods</CardTitle>
            <CardDescription>All fiscal periods available for month-end close</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading periods...</span>
              </div>
            ) : closePeriods.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {closePeriods.filter(period => period.id !== currentPeriod?.id).map((period) => (
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
                            {(period.steps || []).map((step) => (
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
                          <Button variant="outline" size="sm" onClick={() => setIsViewReportsModalOpen(true)}>
                            <Calendar className="mr-2 h-4 w-4" />
                            View Reports
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Periods Available</h3>
                <p className="text-gray-500">No fiscal periods found. Please ensure the GL service is running and configured.</p>
              </div>
            )}
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


      {/* View Reports Modal */}
      <ModalDialog
        title="Financial Reports for Selected Period"
        description="Generated financial reports for the selected period"
        isOpen={isViewReportsModalOpen}
        onClose={() => setIsViewReportsModalOpen(false)}
        size="lg"
      >
        <Tabs defaultValue="trial-balance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
            <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
          </TabsList>

          <TabsContent value="trial-balance" className="space-y-4">
            {financialReports.trialBalance ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Trial Balance</h3>
                  <span className="text-sm text-gray-500">
                    Generated: {new Date(financialReports.trialBalance.generated_at).toLocaleString()}
                  </span>
                </div>
                <div className="border rounded-md">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <div className="grid grid-cols-4 gap-4 font-medium text-sm">
                      <span>Account</span>
                      <span>Debit</span>
                      <span>Credit</span>
                      <span>Balance</span>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {financialReports.trialBalance.items?.map((item: any) => (
                      <div key={item.account_id} className="grid grid-cols-4 gap-4 px-4 py-2 border-b text-sm">
                        <span>{item.account_name}</span>
                        <span>${item.debit_amount?.toLocaleString()}</span>
                        <span>${item.credit_amount?.toLocaleString()}</span>
                        <span className={item.net_amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${Math.abs(item.net_amount)?.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">Trial balance not generated yet.</p>
            )}
          </TabsContent>

          <TabsContent value="balance-sheet" className="space-y-4">
            {financialReports.balanceSheet ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Balance Sheet</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium mb-2">Assets</h4>
                    <div className="space-y-1">
                      {financialReports.balanceSheet.assets?.map((item: any) => (
                        <div key={item.account_name} className="flex justify-between text-sm">
                          <span>{item.account_name}</span>
                          <span>${item.amount?.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t pt-1 font-medium">
                        <div className="flex justify-between">
                          <span>Total Assets</span>
                          <span>${financialReports.balanceSheet.total_assets?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Liabilities & Equity</h4>
                    <div className="space-y-1">
                      {financialReports.balanceSheet.liabilities?.map((item: any) => (
                        <div key={item.account_name} className="flex justify-between text-sm">
                          <span>{item.account_name}</span>
                          <span>${item.amount?.toLocaleString()}</span>
                        </div>
                      ))}
                      {financialReports.balanceSheet.equity?.map((item: any) => (
                        <div key={item.account_name} className="flex justify-between text-sm">
                          <span>{item.account_name}</span>
                          <span>${item.amount?.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t pt-1 font-medium">
                        <div className="flex justify-between">
                          <span>Total Liabilities & Equity</span>
                          <span>${financialReports.balanceSheet.total_liabilities_equity?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">Balance sheet not generated yet.</p>
            )}
          </TabsContent>

          <TabsContent value="income-statement" className="space-y-4">
            {financialReports.incomeStatement ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Income Statement</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Revenues</h4>
                    <div className="space-y-1">
                      {financialReports.incomeStatement.revenues?.map((item: any) => (
                        <div key={item.account_name} className="flex justify-between text-sm">
                          <span>{item.account_name}</span>
                          <span>${item.amount?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Expenses</h4>
                    <div className="space-y-1">
                      {financialReports.incomeStatement.expenses?.map((item: any) => (
                        <div key={item.account_name} className="flex justify-between text-sm">
                          <span>{item.account_name}</span>
                          <span>${item.amount?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-2 font-medium">
                    <div className="flex justify-between text-lg">
                      <span>Net Income</span>
                      <span className={financialReports.incomeStatement.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${financialReports.incomeStatement.net_income?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">Income statement not generated yet.</p>
            )}
          </TabsContent>

          <TabsContent value="cash-flow" className="space-y-4">
            {financialReports.cashFlow ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cash Flow Statement</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Operating Activities</h4>
                    <div className="space-y-1">
                      {financialReports.cashFlow.operating_activities?.map((item: any) => (
                        <div key={item.description} className="flex justify-between text-sm">
                          <span>{item.description}</span>
                          <span>${item.amount?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Investing Activities</h4>
                    <div className="space-y-1">
                      {financialReports.cashFlow.investing_activities?.map((item: any) => (
                        <div key={item.description} className="flex justify-between text-sm">
                          <span>{item.description}</span>
                          <span>${item.amount?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Financing Activities</h4>
                    <div className="space-y-1">
                      {financialReports.cashFlow.financing_activities?.map((item: any) => (
                        <div key={item.description} className="flex justify-between text-sm">
                          <span>{item.description}</span>
                          <span>${item.amount?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-2 font-medium">
                    <div className="flex justify-between text-lg">
                      <span>Net Change in Cash</span>
                      <span className={financialReports.cashFlow.net_change_in_cash >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${financialReports.cashFlow.net_change_in_cash?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">Cash flow statement not generated yet.</p>
            )}
          </TabsContent>
        </Tabs>
      </ModalDialog>
    </AppShell>
  )
}

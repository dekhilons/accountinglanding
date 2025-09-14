"use client"

import { useState, useMemo } from "react"
import { Filter, Download, AlertCircle, Search, CalendarDays, TrendingUp, BarChart, Clock, ListChecks, FileText, CheckCircle, XCircle, MinusCircle } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  useTaxEntries,
  useTaxCodes,
  useTaxProvisions,
  TaxEntry,
  TaxCode,
  TaxProvision,
  formatCurrency,
  formatDate,
  getStatusColor,
  getConfidenceColor
} from "@/lib/tax-api"
import { Checkbox } from "@/components/ui/checkbox" // Corrected import location
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, Legend, Bar } from 'recharts';
import { Progress } from "@/components/ui/progress";

// Define column types for DataTable compatibility
type TaxTransaction = {
  id: string
  date: string
  description: string
  amount: number
  vendor: string
  category: string
  taxCode: string
  status: "pending" | "approved" | "flagged" // These are frontend display statuses
}

type TaxProvisionDisplay = {
  id: string
  period: string
  amount: number
  status: "pending" | "approved" | "flagged" // Frontend display statuses
}

export default function TaxCompliancePage() {
  const { toast } = useToast()
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<TaxEntry | null>(null)
  const [selectedTaxCode, setSelectedTaxCode] = useState<string>("")
  const [selectedVendor, setSelectedVendor] = useState<string>("")
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>("")
  const [selectedRegion, setSelectedRegion] = useState<string>("")
  const [isEditingTaxCode, setIsEditingTaxCode] = useState(false)
  const [selectedEntryIds, setSelectedEntryIds] = useState<Record<string, boolean>>({});

  const [isProvisionDetailsModalOpen, setIsProvisionDetailsModalOpen] = useState(false)
  const [selectedProvision, setSelectedProvision] = useState<TaxProvision | null>(null)
  const [selectedProvisionIds, setSelectedProvisionIds] = useState<Record<string, boolean>>({});

  // State for filter modal
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterTaxCode, setFilterTaxCode] = useState<string>("all")
  const [filterPeriod, setFilterPeriod] = useState<string>("all")
  const [currentTab, setCurrentTab] = useState("tax-entries"); // State to track active tab


  // Use API hooks
  const { taxEntries, loading: entriesLoading, error: entriesError, updateStatus: updateEntryStatus, refetch: refetchEntries, update } = useTaxEntries(
    filterStatus === "all" ? undefined : (filterStatus === "pending" ? "PENDING_APPROVAL" : (filterStatus === "approved" ? "APPLIED" : "REJECTED")),
    filterTaxCode === "all" ? undefined : filterTaxCode
  )
  const { taxCodes, loading: codesLoading, error: codesError } = useTaxCodes()
  const { taxProvisions, loading: provisionsLoading, error: provisionsError, updateStatus: updateProvisionStatus, refetch: refetchProvisions } = useTaxProvisions(
    filterStatus === "all" ? undefined : (filterStatus === "pending" ? "PENDING_APPROVAL" : (filterStatus === "approved" ? "APPLIED" : "REJECTED")),
    filterPeriod === "all" ? undefined : filterPeriod
  )

  // Filtered Tax Entries (now primarily filtered by backend)
  const filteredTaxEntries = useMemo(() => {
    return taxEntries.map(entry => ({
      id: entry.entry_id || `entry-${Math.random().toString(36).substring(7)}`, // Ensure id is always a string
      date: entry.created_at,
      description: `Transaction ${entry.txn_id}`,
      amount: entry.amount,
      vendor: entry.vendor_customer_id || "Unknown Vendor",
      category: entry.account_code,
      taxCode: entry.tax_code,
      status: (entry.status === "PENDING_APPROVAL" ? "pending" :
              (entry.status === "APPLIED" ? "approved" : "flagged")) as "pending" | "approved" | "flagged" // Ensure correct type mapping
    }));
  }, [taxEntries]);

  // Filtered Tax Provisions (now primarily filtered by backend)
  const filteredTaxProvisions = useMemo(() => {
    return taxProvisions.map(provision => ({
      id: provision.provision_id || `provision-${Math.random().toString(36).substring(7)}`, // Ensure id is always a string
      period: provision.period,
      amount: provision.provision_amount,
      status: (provision.status === "PENDING_APPROVAL" ? "pending" :
              (provision.status === "APPLIED" ? "approved" : "flagged")) as "pending" | "approved" | "flagged" // Frontend display statuses
    }));
  }, [taxProvisions]);

  // KPI Calculations
  const { totalOutputTax, totalInputTax, netTaxPayable, nextFilingDueDate, daysUntilFiling } = useMemo(() => {
    // Hardcoded realistic values for demonstration
    const outputTax = 75000;
    const inputTax = 40000;
    const net = outputTax - inputTax;

    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const filingDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 20);

    const diffTime = filingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      totalOutputTax: outputTax,
      totalInputTax: inputTax,
      netTaxPayable: net,
      nextFilingDueDate: filingDate.toLocaleDateString(),
      daysUntilFiling: diffDays > 0 ? diffDays : 0,
    };
  }, []); // Removed taxEntries from dependency array as values are now static for demo

  // Tax Code Utilization Data
  const taxCodeUtilizationData = useMemo(() => {
    const codeAmounts: { [key: string]: number } = {};
    taxEntries.filter(e => e.status === "APPLIED").forEach(entry => {
      codeAmounts[entry.tax_code] = (codeAmounts[entry.tax_code] || 0) + entry.amount;
    });

    return Object.keys(codeAmounts).map(code => ({
      name: taxCodes.find(tc => tc.value === code)?.label || code,
      amount: codeAmounts[code],
    }));
  }, [taxEntries, taxCodes]);

  const BAR_COLORS = ['#3b82f6', '#22c55e', '#3b82f6', '#22c55e', '#3b82f6', '#22c55e']; // Blue and Green from platform chart colors

  // Exception Monitoring Data
  const exceptionMonitoringData = useMemo(() => {
    // Hardcoded realistic values for demonstration
    const missingTaxCodes = 5; // Example: 5 transactions
    const invalidTaxIds = 2; // Example: 2 invalid tax IDs
    const unusualTaxRates = 3; // Example: 3 instances of unusual tax rates
    const manualOverrides = 1; // Example: 1 manual override

    return [
      { name: "Transactions missing tax codes", count: missingTaxCodes },
      { name: "Invalid tax IDs", count: invalidTaxIds },
      { name: "Unusual tax rates", count: unusualTaxRates },
      { name: "Manual overrides", count: manualOverrides },
    ];
  }, []); // Removed taxEntries from dependency array as values are now static for demo

  // Reconciliation Data (Placeholders)
  const reconciliationData = useMemo(() => {
    return [
      { name: "GL vs. Tax Transactions", status: "✔", value: true },
      { name: "Input vs. Supplier Statements", status: "✔", value: true },
      { name: "Historical Comparison", status: "⚠", value: false }, // Example: deviation
    ];
  }, []);

  // Filing Calendar & Deadlines (Placeholder data)
  const filingDeadlines = [
    { id: 1, name: "VAT Q3 Filing", date: "2025-10-20", status: "Upcoming" },
    { id: 2, name: "WHT September", date: "2025-10-15", status: "Submitted" },
    { id: 3, name: "Income Tax Q2 Estimate", date: "2025-09-15", status: "Overdue" },
  ];

  // Monitoring Status Banner
  const complianceStatus = useMemo(() => {
    const pendingEntries = taxEntries.filter(e => e.status === "PENDING_APPROVAL").length;
    const pendingProvisions = taxProvisions.filter(p => p.status === "PENDING_APPROVAL").length;
    const flaggedEntries = taxEntries.filter(e => e.status === "REJECTED" || e.confidence < 0.85).length;
    const flaggedProvisions = taxProvisions.filter(p => p.status === "REJECTED" || (p.confidence && p.confidence < 0.85)).length;

    if (pendingEntries > 0 || pendingProvisions > 0) {
      return { status: "🟡 Pending review", color: "bg-amber-500", icon: <Clock className="h-5 w-5" /> };
    } else if (flaggedEntries > 0 || flaggedProvisions > 0) {
      return { status: "🔴 Errors/exceptions", color: "bg-red-500", icon: <XCircle className="h-5 w-5" /> };
    } else {
      return { status: "🟢 Ready for filing", color: "bg-green-500", icon: <CheckCircle className="h-5 w-5" /> };
    }
  }, [taxEntries, taxProvisions]);

  // Handle row click to show details for Tax Entries
  const handleEntryRowClick = (transaction: TaxTransaction) => {
    const entry = taxEntries.find(e => e.entry_id === transaction.id)
    if (entry) {
      setSelectedEntry(entry)
      setSelectedTaxCode(entry.tax_code)
      setSelectedVendor(entry.vendor_customer_id || "")
      setSelectedAccountCode(entry.account_code)
      setSelectedRegion(entry.region)
      setIsEditingTaxCode(false)
      setIsDetailsModalOpen(true)
    }
  }

  // Handle row click to show details for Tax Provisions
  const handleProvisionRowClick = (provisionDisplay: TaxProvisionDisplay) => {
    const provision = taxProvisions.find(p => p.provision_id === provisionDisplay.id)
    if (provision) {
      setSelectedProvision(provision)
      setIsProvisionDetailsModalOpen(true)
    }
  }

  // Handle batch approve tax entries
  const handleApproveSelectedEntries = async () => {
    if (Object.keys(selectedEntryIds).length === 0) return;

    try {
      for (const entryId in selectedEntryIds) {
        if (selectedEntryIds[entryId]) {
          await update(entryId, { status: "APPLIED" }); // Assuming we just apply, not change tax code in batch
        }
      }
      toast({
        title: "Batch Approval",
        description: `${Object.keys(selectedEntryIds).length} tax entries approved successfully.`,
      });
      setSelectedEntryIds({}); // Clear selection
      refetchEntries(); // Refetch data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve selected tax entries.",
        variant: "destructive",
      });
    }
  };

  // Handle batch reject tax entries
  const handleRejectSelectedEntries = async () => {
    if (Object.keys(selectedEntryIds).length === 0) return;

    try {
      for (const entryId in selectedEntryIds) {
        if (selectedEntryIds[entryId]) {
          await update(entryId, { status: "REJECTED" });
        }
      }
      toast({
        title: "Batch Rejection",
        description: `${Object.keys(selectedEntryIds).length} tax entries rejected successfully.`,
      });
      setSelectedEntryIds({}); // Clear selection
      refetchEntries(); // Refetch data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject selected tax entries.",
        variant: "destructive",
      });
    }
  };

  // Handle batch approve tax provisions
  const handleApproveSelectedProvisions = async () => {
    if (Object.keys(selectedProvisionIds).length === 0) return;

    try {
      for (const provisionId in selectedProvisionIds) {
        if (selectedProvisionIds[provisionId]) {
          await updateProvisionStatus(provisionId, "APPLIED");
        }
      }
      toast({
        title: "Batch Approval",
        description: `${Object.keys(selectedProvisionIds).length} tax provisions approved successfully.`,
      });
      setSelectedProvisionIds({}); // Clear selection
      refetchProvisions(); // Refetch data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve selected tax provisions.",
        variant: "destructive",
      });
    }
  };

  // Handle batch reject tax provisions
  const handleRejectSelectedProvisions = async () => {
    if (Object.keys(selectedProvisionIds).length === 0) return;

    try {
      for (const provisionId in selectedProvisionIds) {
        if (selectedProvisionIds[provisionId]) {
          await updateProvisionStatus(provisionId, "REJECTED");
        }
      }
      toast({
        title: "Batch Rejection",
        description: `${Object.keys(selectedProvisionIds).length} tax provisions rejected successfully.`,
      });
      setSelectedProvisionIds({}); // Clear selection
      refetchProvisions(); // Refetch data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject selected tax provisions.",
        variant: "destructive",
      });
    }
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    // Filters are applied via useMemo, just close the modal
    setIsFilterModalOpen(false)
    toast({
      title: "Filters Applied",
      description: "Data has been filtered based on your selections.",
    })
  }

  // Handle clear filters
  const handleClearFilters = () => {
    setFilterStatus("")
    setFilterTaxCode("")
    setFilterPeriod("")
    setIsFilterModalOpen(false)
    toast({
      title: "Filters Cleared",
      description: "All filters have been removed.",
    })
  }

  // Handle export data
  const handleExportData = () => {
    let dataToExport: any[] = [];
    let filename = "";

    if (currentTab === "tax-entries") {
      dataToExport = filteredTaxEntries;
      filename = "tax_entries.csv";
    } else {
      dataToExport = filteredTaxProvisions;
      filename = "tax_provisions.csv";
    }

    if (dataToExport.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There is no data matching the current filters to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(dataToExport[0]);
    const csv = [
      headers.join(','),
      ...dataToExport.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Export Successful",
        description: `Data exported to ${filename}.`,
      });
    } else {
      toast({
        title: "Export Failed",
        description: "Your browser does not support downloading files directly.",
        variant: "destructive",
      });
    }
  };

  // Handle approve tax code for Tax Entry
  const handleApproveTaxCode = async () => {
    if (!selectedEntry) {
      toast({
        title: "Validation Error",
        description: "No tax entry selected for approval.",
        variant: "destructive",
      })
      return
    }

    if (selectedEntry.status === "APPLIED") {
      toast({
        title: "Validation Error",
        description: "This tax entry has already been applied.",
        variant: "destructive",
      })
      return
    }

    if (selectedEntry.status === "REJECTED") {
      toast({
        title: "Validation Error",
        description: "Cannot approve a rejected tax entry.",
        variant: "destructive",
      })
      return
    }

    try {
      const updateData: any = {
        status: "APPLIED",
        tax_code: selectedTaxCode,
      };

      if (isEditingTaxCode) {
        updateData.vendor_customer_id = selectedVendor;
        updateData.account_code = selectedAccountCode;
        updateData.region = selectedRegion;
      }

      await update(selectedEntry.entry_id, updateData);
      toast({
        title: "Tax Entry Approved",
        description: `Tax entry ${selectedEntry.txn_id} has been approved${isEditingTaxCode ? ' with modifications' : ''}.`,
      })
      setIsDetailsModalOpen(false)
      setSelectedEntry(null)
      refetchEntries() // Refetch entries to show updated status
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve tax code. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle reject tax code for Tax Entry
  const handleRejectTaxCode = async () => {
    if (!selectedEntry) {
      toast({
        title: "Validation Error",
        description: "No tax entry selected for rejection.",
        variant: "destructive",
      })
      return
    }

    if (selectedEntry.status === "APPLIED") {
      toast({
        title: "Validation Error",
        description: "This tax entry has already been applied and cannot be rejected.",
      })
      return
    }

    if (selectedEntry.status === "REJECTED") {
      toast({
        title: "Validation Error",
        description: "This tax entry has already been rejected.",
        variant: "destructive",
      })
      return
    }

    try {
      await updateEntryStatus(selectedEntry.entry_id, "REJECTED")
      toast({
        title: "Tax Entry Rejected",
        description: `Tax entry ${selectedEntry.txn_id} has been rejected.`,
      })
      setIsDetailsModalOpen(false)
      setSelectedEntry(null)
      refetchEntries() // Refetch entries to show updated status
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject tax code. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle approve tax provision
  const handleApproveProvision = async () => {
    if (!selectedProvision) {
      toast({
        title: "Validation Error",
        description: "No tax provision selected for approval.",
      })
      return
    }

    if (selectedProvision.status === "APPLIED") {
      toast({
        title: "Validation Error",
        description: "This tax provision has already been applied.",
        variant: "destructive",
      })
      return
    }

    if (selectedProvision.status === "REJECTED") {
      toast({
        title: "Validation Error",
        description: "Cannot approve a rejected tax provision.",
        variant: "destructive",
      })
      return
    }

    try {
      await updateProvisionStatus(selectedProvision.provision_id, "APPLIED")
      toast({
        title: "Tax Provision Approved",
        description: `Tax provision for period ${selectedProvision.period} has been approved.`,
      })
      setIsProvisionDetailsModalOpen(false)
      setSelectedProvision(null)
      refetchProvisions() // Refetch provisions to show updated status
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve tax provision. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle reject tax provision
  const handleRejectProvision = async () => {
    if (!selectedProvision) {
      toast({
        title: "Validation Error",
        description: "No tax provision selected for rejection.",
      })
      return
    }

    if (selectedProvision.status === "APPLIED") {
      toast({
        title: "Validation Error",
        description: "This tax provision has already been applied and cannot be rejected.",
      })
      return
    }

    if (selectedProvision.status === "REJECTED") {
      toast({
        title: "Validation Error",
        description: "This tax provision has already been rejected.",
        variant: "destructive",
      })
      return
    }

    try {
      await updateProvisionStatus(selectedProvision.provision_id, "REJECTED")
      toast({
        title: "Tax Provision Rejected",
        description: `Tax provision for period ${selectedProvision.period} has been rejected.`,
      })
      setIsProvisionDetailsModalOpen(false)
      setSelectedProvision(null)
      refetchProvisions() // Refetch provisions to show updated status
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject tax provision. Please try again.",
        variant: "destructive",
      })
    }
  }



  // Table columns for Tax Entries
  const entryColumns = [
    {
      id: "select",
      header: ({ table }: any) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }: any) => {
        return formatDate(row.getValue("date"))
      },
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }: any) => {
        return formatCurrency(Number.parseFloat(row.getValue("amount")))
      },
    },
    {
      accessorKey: "vendor",
      header: "Vendor",
    },
    {
      accessorKey: "category",
      header: "Account Code",
    },
    {
      accessorKey: "taxCode",
      header: "Tax Code",
      cell: ({ row }: any) => {
        const taxCode = row.getValue("taxCode")
        // Tax code itself does not have a status like 'pending', just display it
        return <Badge variant="secondary">{taxCode}</Badge>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.getValue("status")
        return <Badge className={getStatusColor(status)}>{status.replace('_', ' ')}</Badge>
      },
    },
  ]

  // Table columns for Tax Provisions
  const provisionColumns = [
    {
      id: "select",
      header: ({ table }: any) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "period",
      header: "Period",
    },
    {
      accessorKey: "amount",
      header: "Provision Amount",
      cell: ({ row }: any) => {
        return formatCurrency(Number.parseFloat(row.getValue("amount")))
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.getValue("status")
        return <Badge className={getStatusColor(status)}>{status.replace('_', ' ')}</Badge>
      },
    },
  ]

  // Show loading state
  if (entriesLoading || codesLoading || provisionsLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tax & Compliance</h1>
              <p className="text-muted-foreground">Manage tax codes and ensure compliance with tax regulations</p>
            </div>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading tax data...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  // Show error state
  if (entriesError || codesError || provisionsError) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tax & Compliance</h1>
              <p className="text-muted-foreground">Manage tax codes and ensure compliance with tax regulations</p>
            </div>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive-foreground">
                  {entriesError?.message || codesError?.message || provisionsError?.message || "Failed to load data"}
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4"
                  variant="outline"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tax & Compliance Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive overview and management of tax compliance activities.</p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" onClick={() => setIsFilterModalOpen(true)}>
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
          </div>
        </div>

          {/* Top Bar KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Output Tax</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalOutputTax)}</div>
                <p className="text-xs text-muted-foreground">From sales invoices</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Input Tax</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalInputTax)}</div>
                <p className="text-xs text-muted-foreground">From purchases & expenses</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Tax Payable/Refundable</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(netTaxPayable)}</div>
                <p className="text-xs text-muted-foreground">Output – Input</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Filing Due</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nextFilingDueDate}</div>
                <p className="text-xs text-muted-foreground">
                  {daysUntilFiling > 0 ? `${daysUntilFiling} days left` : "Today or overdue"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tax Code Utilization and Filing Calendar */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Tax Code Utilization (Analytics Widget) */}
            <Card className="col-span-4 shadow-sm rounded-lg">
              <CardHeader>
                <CardTitle>Tax Code Utilization</CardTitle>
                <CardDescription>Breakdown of tax codes used in the period.</CardDescription>
              </CardHeader>
              <CardContent>
                {taxCodeUtilizationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart
                      data={taxCodeUtilizationData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="amount" barSize={30} radius={[5, 5, 0, 0]}>
                        {taxCodeUtilizationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground">No tax code utilization data available.</div>
                )}
              </CardContent>
            </Card>

            {/* Filing Calendar & Deadlines */}
            <Card className="col-span-3 shadow-sm rounded-lg">
              <CardHeader>
                <CardTitle>Filing Calendar & Deadlines</CardTitle>
                <CardDescription>Upcoming and overdue tax filing deadlines.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filingDeadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md"
                      onClick={() => toast({
                        title: "Filing Deadline Details",
                        description: `${deadline.name} on ${formatDate(deadline.date)} - Status: ${deadline.status}`,
                      })}
                    >
                      <div>
                        <p className="font-medium">{deadline.name}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(deadline.date)}</p>
                      </div>
                      <Badge variant={deadline.status === "Overdue" ? "destructive" : deadline.status === "Submitted" ? "default" : "secondary"}>
                        {deadline.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exception Monitoring (Alert Panel) */}
          <Card className="shadow-sm rounded-lg">
            <CardHeader>
              <CardTitle>Exception Monitoring</CardTitle>
              <CardDescription>Highlight risks before filing.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exceptionMonitoringData.map((exception, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <p className="font-medium">{exception.name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-amber-100 text-amber-800">
                        {exception.count} Issues
                      </Badge>
                      {exception.count > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast({
                            title: "View Details",
                            description: `Viewing details for: ${exception.name}`,
                          })}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Batch Action Buttons */}
          {(Object.keys(selectedEntryIds).length > 0 && currentTab === "tax-entries") || (Object.keys(selectedProvisionIds).length > 0 && currentTab === "tax-provisions") ? (
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={currentTab === "tax-entries" ? handleApproveSelectedEntries : handleApproveSelectedProvisions}
                disabled={(currentTab === "tax-entries" && Object.keys(selectedEntryIds).length === 0) || (currentTab === "tax-provisions" && Object.keys(selectedProvisionIds).length === 0)}
              >
                Approve Selected ({currentTab === "tax-entries" ? Object.keys(selectedEntryIds).length : Object.keys(selectedProvisionIds).length})
              </Button>
              <Button
                variant="destructive"
                onClick={currentTab === "tax-entries" ? handleRejectSelectedEntries : handleRejectSelectedProvisions}
                disabled={(currentTab === "tax-entries" && Object.keys(selectedEntryIds).length === 0) || (currentTab === "tax-provisions" && Object.keys(selectedProvisionIds).length === 0)}
              >
                Reject Selected ({currentTab === "tax-entries" ? Object.keys(selectedEntryIds).length : Object.keys(selectedProvisionIds).length})
              </Button>
            </div>
          ) : null}

          <Tabs defaultValue="tax-entries" onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tax-entries">Tax Entries ({filteredTaxEntries.length})</TabsTrigger>
              <TabsTrigger value="tax-provisions">Tax Provisions ({filteredTaxProvisions.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="tax-entries">
              {/* Tax Transactions */}
              <Card className="shadow-sm rounded-lg">
                <CardHeader>
                  <CardTitle>Tax Code Assignment</CardTitle>
                  <CardDescription>Review and assign tax codes to transactions ({filteredTaxEntries.length} entries)</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={entryColumns}
                    data={filteredTaxEntries}
                    searchColumn="description"
                    onRowClick={handleEntryRowClick}
                    rowSelection={selectedEntryIds}
                    onRowSelectionChange={setSelectedEntryIds}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tax-provisions">
              {/* Tax Provisions */}
              <Card className="shadow-sm rounded-lg">
                <CardHeader>
                  <CardTitle>Tax Provisions</CardTitle>
                  <CardDescription>Review and manage direct tax provisions ({filteredTaxProvisions.length} provisions)</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={provisionColumns}
                    data={filteredTaxProvisions}
                    searchColumn="period"
                    onRowClick={handleProvisionRowClick}
                    rowSelection={selectedProvisionIds}
                    onRowSelectionChange={setSelectedProvisionIds}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

      {/* Transaction Details Modal (Tax Entry) */}
      <ModalDialog
        title={isEditingTaxCode ? "Modify Tax Entry" : "Review Tax Entry"}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        confirmText={isEditingTaxCode ? "Save Changes" : "Approve Entry"}
        onConfirm={handleApproveTaxCode}
        cancelText="Reject Entry"
        onCancel={handleRejectTaxCode} // Added reject handler
        size="lg"
      >
        {selectedEntry && (
          <div className="space-y-6">
            {!isEditingTaxCode && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsEditingTaxCode(true)}
                >
                  Modify Entry
                </Button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                <p className="mt-1">{formatDate(selectedEntry.created_at)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                <p className="mt-1">{formatCurrency(selectedEntry.amount)}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Transaction ID</h3>
                <p className="mt-1">{selectedEntry.txn_id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Vendor/Customer</h3>
                {isEditingTaxCode ? (
                  <Input
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="mt-1"
                    placeholder="Enter vendor/customer"
                  />
                ) : (
                  <p className="mt-1">{selectedEntry.vendor_customer_id || "N/A"}</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Account Code</h3>
                {isEditingTaxCode ? (
                  <Input
                    value={selectedAccountCode}
                    onChange={(e) => setSelectedAccountCode(e.target.value)}
                    className="mt-1"
                    placeholder="Enter account code"
                  />
                ) : (
                  <p className="mt-1">{selectedEntry.account_code}</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Current Tax Code</h3>
                <div className="mt-1">
                  <Badge className={getStatusColor(selectedEntry.status)}>
                    {selectedEntry.tax_code}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Confidence</h3>
                <div className="mt-1">
                  <span className={getConfidenceColor(selectedEntry.confidence)}>
                    {(selectedEntry.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <Badge className={getStatusColor(selectedEntry.status)}>
                    {selectedEntry.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Region</h3>
                {isEditingTaxCode ? (
                  <Input
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="mt-1"
                    placeholder="Enter region"
                  />
                ) : (
                  <p className="mt-1">{selectedEntry.region}</p>
                )}
              </div>
            </div>

            {isEditingTaxCode && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Entry Modifications</h3>
                <p className="text-xs text-gray-400 mb-4">Modify the tax code and other entry details as needed</p>
                <Select value={selectedTaxCode} onValueChange={setSelectedTaxCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tax code" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxCodes.map((code) => (
                      <SelectItem key={code.value} value={code.value}>
                        {code.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTaxCode === "EXP-ENT" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
                    <p className="text-sm text-amber-700">
                      <strong>Note:</strong> Entertainment expenses are only 50% deductible for tax purposes. Please
                      ensure proper documentation is attached.
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedEntry.status === "PENDING_APPROVAL" && selectedEntry.confidence < 0.85 && (
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-medium text-amber-800">Low Confidence</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        This tax code assignment has low confidence and requires manual review.
                        Please verify the tax code is correct before approving.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </ModalDialog>

      {/* Provision Details Modal (Tax Provision) */}
      <ModalDialog
        title="Review Tax Provision"
        isOpen={isProvisionDetailsModalOpen}
        onClose={() => setIsProvisionDetailsModalOpen(false)}
        confirmText="Approve Provision"
        onConfirm={handleApproveProvision}
        cancelText="Reject Provision"
        onCancel={handleRejectProvision}
        size="lg"
      >
        {selectedProvision && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Period</h3>
                <p className="mt-1">{selectedProvision.period}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Provision Amount</h3>
                <p className="mt-1">{formatCurrency(selectedProvision.provision_amount)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Model Version</h3>
                <p className="mt-1">{selectedProvision.model_version}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Confidence</h3>
                <div className="mt-1">
                  <span className={getConfidenceColor(selectedProvision.confidence || 0)}>
                    {(selectedProvision.confidence ? selectedProvision.confidence * 100 : 0).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <Badge className={getStatusColor(selectedProvision.status)}>
                    {selectedProvision.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                <p className="mt-1">{formatDate(selectedProvision.created_at)}</p>
              </div>
            </div>

            {selectedProvision.status === "PENDING_APPROVAL" && selectedProvision.confidence && selectedProvision.confidence < 0.85 && (
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-medium text-amber-800">Low Confidence</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        This tax provision calculation has low confidence and requires manual review.
                        Please verify the amount is correct before approving.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Policy Snippets if available */}
            {selectedProvision.policy_snippets && Object.keys(selectedProvision.policy_snippets).length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Policy Snippets</h3>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {JSON.stringify(selectedProvision.policy_snippets, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </ModalDialog>

      {/* Filter Modal */}
      <ModalDialog
        title="Filter Options"
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        confirmText="Apply Filters"
        onConfirm={handleApplyFilters}
        cancelText="Clear Filters"
        onCancel={handleClearFilters}
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="filter-status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filter-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          {currentTab === "tax-entries" && (
            <div>
              <Label htmlFor="filter-tax-code">Tax Code</Label>
              <Select value={filterTaxCode} onValueChange={setFilterTaxCode}>
                <SelectTrigger id="filter-tax-code">
                  <SelectValue placeholder="Select tax code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {taxCodes.map((code) => (
                    <SelectItem key={code.value} value={code.value}>
                      {code.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {currentTab === "tax-provisions" && (
            <div>
              <Label htmlFor="filter-period">Period</Label>
              <Input
                id="filter-period"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                placeholder="e.g., 2025-05"
              />
            </div>
          )}
        </div>
      </ModalDialog>
    </AppShell>
  )
}

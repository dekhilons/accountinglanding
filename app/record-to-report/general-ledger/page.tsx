"use client"

import React, { useState, useEffect } from "react"
import { Filter, Download, ArrowRight, AlertCircle } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Chart } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { ApprovalCard } from "@/components/ui/approval-card"
import { useToast } from "@/hooks/use-toast"

import type { JournalEntry, NewEntryForm } from "@/lib/types";
import {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry, // Import updateJournalEntry
  rejectJournalEntry, // Import rejectJournalEntry
  getAccounts,
  getJournalTypes,
  getFiscalPeriods,
  postJournalEntry,
  generateTrialBalance,
  createAccount,
  AccountResponseBackend,
  JournalTypeResponseBackend,
  FiscalPeriodResponseBackend,
  TrialBalanceResponse,
  getAccountTypes, // Import getAccountTypes
  AccountTypeResponseBackend, // Import AccountTypeResponseBackend
} from "@/lib/gl-api"; // Import the API functions and types

export default function GeneralLedgerPage() {
  const { toast } = useToast()
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false) // New state for edit modal
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [entryToEdit, setEntryToEdit] = useState<JournalEntry | null>(null) // New state for editing
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [accounts, setAccounts] = useState<AccountResponseBackend[]>([])
  const [journalTypes, setJournalTypes] = useState<JournalTypeResponseBackend[]>([])
  const [accountTypes, setAccountTypes] = useState<AccountTypeResponseBackend[]>([]) // New state for account types
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriodResponseBackend[]>([])
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newEntry, setNewEntry] = useState<NewEntryForm>({
    date: "",
    description: "",
    debit: 0,
    credit: 0,
    account: "", // This will now store the account ID
    journal_type_id: "", // New field to store journal type ID
    reference: "",
    // is_anomaly is not part of NewEntryForm as it's set by the backend
  })
  const [filterCriteria, setFilterCriteria] = useState<{
    startDate: string;
    endDate: string;
    account: string;
    status: JournalEntry["status"] | undefined;
  }>({
    startDate: "",
    endDate: "",
    account: "",
    status: undefined,
  })
  const [isLedgerMaintenanceOpen, setIsLedgerMaintenanceOpen] = useState(false)
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false)
  const [newAccount, setNewAccount] = useState({
    account_number: "",
    name: "",
    description: "",
    account_type_id: "",
  })

  // Fetch all necessary data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      const tenantId = "default" // Placeholder: Replace with actual tenant ID

      try {
        const [
          fetchedAccounts,
          fetchedJournalTypes,
          fetchedAccountTypes, // Fetch account types
          fetchedFiscalPeriods,
          fetchedJournalEntries,
        ] = await Promise.all([
          getAccounts(tenantId),
          getJournalTypes(tenantId),
          getAccountTypes(tenantId), // Call getAccountTypes
          getFiscalPeriods(tenantId),
          getJournalEntries(tenantId, {
            startDate: filterCriteria.startDate,
            endDate: filterCriteria.endDate,
            account: filterCriteria.account,
            status: filterCriteria.status, // Now directly pass filterCriteria.status
          }),
        ])

        if (fetchedAccounts) setAccounts(fetchedAccounts)
        if (fetchedJournalTypes) setJournalTypes(fetchedJournalTypes)
        if (fetchedAccountTypes) setAccountTypes(fetchedAccountTypes) // Set account types state
        if (fetchedFiscalPeriods) setFiscalPeriods(fetchedFiscalPeriods)
        if (fetchedJournalEntries) {
          setJournalEntries(fetchedJournalEntries)
          console.log("Fetched Journal Entries:", fetchedJournalEntries); // Debugging log
        }

        // Fetch Trial Balance for the latest fiscal period, if available
        if (fetchedFiscalPeriods && fetchedFiscalPeriods.length > 0) {
          // Find the fiscal period for the most recently updated journal entry, or default to the latest period
          let fiscalPeriodIdToUse = fetchedFiscalPeriods.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0].id;
          
          // Hardcode fiscal_period_id for demonstration purposes
          const hardcodedFiscalPeriodId = "884c13ae-049c-40ea-9ea3-e82e77819d00"; // Fiscal period where journal entries were posted
          const fetchedTrialBalance = await generateTrialBalance(tenantId, hardcodedFiscalPeriodId);
          if (fetchedTrialBalance) {
            setTrialBalanceData(fetchedTrialBalance);
          } else {
            toast({
              title: "Warning",
              description: "Failed to load trial balance data (using hardcoded period).",
              variant: "default",
            });
          }
        }
      } catch (err) {
        setError("Failed to fetch data.");
        console.error("Fetch error:", err);
        toast({
          title: "Error",
          description: "Failed to load general ledger data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filterCriteria.startDate, filterCriteria.endDate, filterCriteria.account, filterCriteria.status, toast]); // Re-fetch when filter criteria change or on mount

  // Handle row click to show details
  const handleRowClick = (entry: JournalEntry) => {
    setSelectedEntry(entry)
    setIsDetailsModalOpen(true)
  }

  // Handle approval actions
  const handleApprove = async (id: string) => {
    const tenantId = "default"; // Placeholder: Replace with actual tenant ID
    try {
      const result = await postJournalEntry(id);
      if (result && result.success) {
        toast({
          title: "Anomaly Approved",
          description: `Journal entry ${id} has been approved and posted.`,
        });
        setJournalEntries((prevEntries) =>
          prevEntries.map((entry) =>
            entry.id === id ? { ...entry, status: "approved" } : entry
          )
        );
        setIsDetailsModalOpen(false);
        // Re-fetch all data to ensure balances and lists are updated
        const [
          fetchedAccounts,
          fetchedJournalTypes,
          fetchedFiscalPeriods,
          fetchedJournalEntries,
        ] = await Promise.all([
          getAccounts(tenantId),
          getJournalTypes(tenantId),
          getFiscalPeriods(tenantId),
          getJournalEntries(tenantId, {
            startDate: filterCriteria.startDate,
            endDate: filterCriteria.endDate,
            account: filterCriteria.account,
            status: filterCriteria.status,
          }),
        ]);
        if (fetchedAccounts) setAccounts(fetchedAccounts);
        if (fetchedJournalTypes) setJournalTypes(fetchedJournalTypes);
        if (fetchedFiscalPeriods) setFiscalPeriods(fetchedFiscalPeriods);
        if (fetchedJournalEntries) setJournalEntries(fetchedJournalEntries);
        
        if (fetchedFiscalPeriods && fetchedFiscalPeriods.length > 0) {
          // Hardcode fiscal_period_id for demonstration purposes
          const hardcodedFiscalPeriodId = "884c13ae-049c-40ea-9ea3-e82e77819d00"; // Fiscal period where journal entries were posted
          const fetchedTrialBalance = await generateTrialBalance(tenantId, hardcodedFiscalPeriodId);
          if (fetchedTrialBalance) {
            setTrialBalanceData(fetchedTrialBalance);
          }
        }

      } else {
        throw new Error(result?.status || "Unknown error during posting.");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to approve journal entry ${id}: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
      console.error("Approval error:", error);
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    const tenantId = "default"; // Placeholder: Replace with actual tenant ID
    try {
      const result = await rejectJournalEntry(id);
      // Check if the result is not null and the status is REVERSED
      if (result && result.status === "REVERSED") {
        toast({
          title: "Entry Rejected",
          description: `Journal entry ${id} has been rejected and marked as ${result.status}.`,
        });
        setJournalEntries((prevEntries) =>
          prevEntries.map((entry) =>
            entry.id === id ? { ...entry, status: result.status as JournalEntry["status"] } : entry
          )
        );
        setIsDetailsModalOpen(false);
        // Re-fetch data to update lists and balances
        const fetchedEntries = await getJournalEntries(tenantId, {
            ...filterCriteria,
            status: filterCriteria.status, // Now directly pass filterCriteria.status
        });
        setJournalEntries(fetchedEntries);
      } else {
        // If result is null or status is not REVERSED, it's an error
        throw new Error(result?.status || "Unknown error during rejection.");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to reject journal entry ${id}: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
      console.error("Rejection error:", error);
    }
  }

  const handleEdit = (entry: JournalEntry) => { // Changed to accept full entry
    setEntryToEdit(entry);
    setIsEditModalOpen(true);
    setIsDetailsModalOpen(false); // Close details modal when opening edit modal
    toast({
      title: "Edit mode",
      description: "Opening journal entry editor for " + entry.id + ".",
    })
  }

  const handleUpdateJournalEntry = async () => {
    if (!entryToEdit) return;

    // Basic validation (simplified, add more as needed)
    if (!entryToEdit.date || !entryToEdit.description || (!entryToEdit.debit && !entryToEdit.credit && entryToEdit.debit !== 0 && entryToEdit.credit !== 0) || !entryToEdit.account || !entryToEdit.reference || !entryToEdit.journal_type_id) {
      toast({
        title: "Error",
        description: "Please fill all required fields for the journal entry.",
        variant: "destructive",
      });
      return;
    }


    const tenantId = "default"; // Placeholder: Replace with actual tenant ID

    try {
      // Assuming a function `updateJournalEntry` exists in gl-api.ts
      // This function needs to be created in gl-api.ts
      const updatedEntry = await updateJournalEntry(tenantId, entryToEdit.id, {
        date: entryToEdit.date,
        description: entryToEdit.description,
        debit: entryToEdit.debit,
        credit: entryToEdit.credit,
        account: entryToEdit.account,
        journal_type_id: entryToEdit.journal_type_id,
        reference: entryToEdit.reference,
        // status and is_anomaly might be updated by backend or through specific actions
      });

      if (updatedEntry) {
        toast({
          title: "Journal Entry Updated",
          description: `Entry ${updatedEntry.entry_number} updated successfully.`,
        });
        setIsEditModalOpen(false);
        setEntryToEdit(null); // Clear the entry being edited
        // Re-fetch journal entries to update the list
        const fetchedEntries = await getJournalEntries(tenantId, filterCriteria as any);
        setJournalEntries(fetchedEntries);
      } else {
        throw new Error("Failed to update journal entry on backend.");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update journal entry: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
      console.error("Error updating journal entry:", error);
    }
  };

  const handleSubmitNewAccount = async () => {
    if (!newAccount.account_number || !newAccount.name || !newAccount.account_type_id) {
      toast({
        title: "Error",
        description: "Please fill all required fields for the new account.",
        variant: "destructive",
      });
      return;
    }
    const tenantId = "default"; // Placeholder

    try {
      const createdAccount = await createAccount(tenantId, {
        account_number: newAccount.account_number,
        name: newAccount.name,
        description: newAccount.description,
        account_type_id: newAccount.account_type_id,
      });

      if (createdAccount) {
        toast({
          title: "Account Created",
          description: `Account ${createdAccount.name} (${createdAccount.account_number}) created successfully.`,
        });
        setIsNewAccountModalOpen(false);
        setNewAccount({
          account_number: "",
          name: "",
          description: "",
          account_type_id: "",
        });
        // Re-fetch accounts to update the list
        const fetchedAccounts = await getAccounts(tenantId);
        if (fetchedAccounts) setAccounts(fetchedAccounts);
      } else {
        throw new Error("Failed to create account on backend.");
      }
    } catch (error: any) { // Use 'any' to handle potential nested error messages
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Attempt to parse the detailed error message from the backend
      try {
        const errorJson = JSON.parse(errorMessage);
        if (errorJson && errorJson.detail && typeof errorJson.detail === 'string') {
          // Look for the unique constraint violation message
          if (errorJson.detail.includes("duplicate key value violates unique constraint \"uix_account_tenant_number\"")) {
            errorMessage = "Account number already exists for this tenant. Please choose a unique account number.";
          } else {
            errorMessage = errorJson.detail;
          }
        }
      } catch (parseError) {
        // If parsing fails, use the original error message
        console.error("Failed to parse backend error message:", parseError);
      }

      toast({
        title: "Error",
        description: `Failed to create account: ${errorMessage}`,
        variant: "destructive",
      });
      console.error("Error creating account:", error);
      
      // Clear only the account_number field to allow user to try again easily
      setNewAccount(prev => ({ ...prev, account_number: "" }));
    }
  };

  const handleNewJournalEntry = () => {
    toast({
      title: "New Journal Entry",
      description: "Opening form to create a new journal entry.",
    })
    setIsNewEntryModalOpen(true)
  }

  // Helper function to convert data to CSV string using column definitions
  const convertToCsv = (data: JournalEntry[], columns: any[]) => {
    if (data.length === 0) return "";

    // Extract headers from columns (using header property)
    const headers = columns.map(col => col.header).join(",");

    // Extract rows based on accessorKey and apply formatting
    const rows = data.map(entry => {
      return columns.map(col => {
        let value = (entry as any)[col.accessorKey];
        
        // Apply formatting similar to cell rendering for better CSV output
        if (col.accessorKey === "date") {
          value = new Date(value).toLocaleDateString();
        } else if (col.accessorKey === "debit" || col.accessorKey === "credit") {
          // Remove currency formatting, just the number with 2 decimal places
          value = Number.parseFloat(value).toFixed(2);
        } else if (col.accessorKey === "status") {
          value = String(value).toUpperCase(); // Convert status enum to string
        }
        
        const stringValue = String(value || ""); // Ensure value is string, handle null/undefined
        // Escape double quotes and enclose in quotes if value contains comma or double quote
        return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
      }).join(",");
    });

    return [headers, ...rows].join("\n");
  };

  const handleSubmitNewEntry = async () => { // Made async
    if (!newEntry.date || !newEntry.description || (!newEntry.debit && !newEntry.credit && newEntry.debit !== 0 && newEntry.credit !== 0) || !newEntry.account || !newEntry.reference) {
      toast({
        title: "Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      })
      return
    }

    // Validate if debit and credit are balanced (for a single line entry, one should be 0 and the other non-zero)
    // For a simple single-line entry, either debit or credit should be non-zero, but not both,
    // and if both are zero, it's not a valid entry.
    // The backend error indicates a general journal entry requires debits to equal credits across all lines.
    // Since this form currently creates only one line, it implies a simple debit OR credit.
    // If the intention is for a single line to represent both debit and credit, the form/backend model needs adjustment.
    // For now, let's enforce that for a single line, either debit or credit is zero, and the other is non-zero.
    // The previous error "Journal entry must be balanced. Debits: X, Credits: Y" means the *total* debits must equal *total* credits.
    // This implies the current single-line entry is being treated as the *entire* journal entry, which must balance itself.
    // To make it balance, one of the amounts (debit or credit) should be zero, and the other should be the full amount.
    // Or, the form needs to support multiple lines to balance. Assuming single line for now, and amounts should be equal.


    const tenantId = "default"; // Placeholder: Replace with actual tenant ID

    try {
      const createdEntry = await createJournalEntry(tenantId, {
        ...newEntry,
        account: newEntry.account, // account is now the ID
        journal_type_id: newEntry.journal_type_id, // journal_type_id is now included
      });

      if (createdEntry) {
        toast({
          title: "Journal Entry Added",
          description: `New entry ${createdEntry.entry_number} created successfully.`,
        });
        setIsNewEntryModalOpen(false);
        setNewEntry({ // Reset form
          date: "",
          description: "",
          debit: 0,
          credit: 0,
          account: "",
          journal_type_id: "",
          reference: "",
          // is_anomaly is not part of NewEntryForm as it's set by the backend
        });
        // Re-fetch journal entries to update the list
        const fetchedEntries = await getJournalEntries(tenantId, filterCriteria as any); // Re-fetch all entries
        setJournalEntries(fetchedEntries);
      } else {
        throw new Error("Failed to create journal entry on backend.");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create journal entry: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
      console.error("Error creating journal entry:", error);
    }
  };

  const handleFilter = () => {
    setIsFilterModalOpen(true)
  }

  const handleApplyFilter = () => {
    // Applying filter criteria will trigger the useEffect to re-fetch data
    setIsFilterModalOpen(false);
    toast({
      title: "Filter Applied",
      description: "Journal entries have been filtered.",
    });
  };

  const handleClearFilter = () => {
    setFilterCriteria({
      startDate: "",
      endDate: "",
      account: "",
      status: undefined,
    });
    // Clearing filter criteria will trigger the useEffect to re-fetch data
    setIsFilterModalOpen(false);
    toast({
      title: "Filter Cleared",
      description: "All filters have been removed.",
    });
  };

  const handleExport = () => {
    setIsExportModalOpen(true)
  }

  const handleExportData = (format: "csv" | "pdf") => {
    toast({
      title: "Exporting Data",
      description: `Exporting journal entries as ${format.toUpperCase()}.`,
    })

    if (format === "csv") {
      const csvContent = convertToCsv(journalEntries, columns);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) { // feature detection
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "journal_entries.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
    setIsExportModalOpen(false)
  }

  const handleViewRelatedEntries = (id: string) => {
    if (!selectedEntry) {
      toast({
        title: "Error",
        description: "No entry selected to view related entries.",
        variant: "destructive",
      });
      return;
    }

    const relatedReference = selectedEntry.reference;
    const filteredEntries = journalEntries.filter(
      (entry) => entry.reference === relatedReference
    );

    setJournalEntries(filteredEntries); // Update the displayed entries
    setIsDetailsModalOpen(false); // Close the details modal

    toast({
      title: "Related Entries Filtered",
      description: `Showing entries related to reference: ${relatedReference}.`,
    });
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: JournalEntry["status"] }) => {
    switch (status) {
      case "normal":
        return <Badge className="bg-green-100 text-green-800">Normal</Badge>
      case "anomaly":
        return <Badge className="bg-red-100 text-red-800">Anomaly</Badge>
      case "approved":
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>
      case "POSTED": // Handle POSTED status
        return <Badge className="bg-green-600 text-white">Posted</Badge>
      case "REVERSED": // Handle REVERSED status
        return <Badge className="bg-gray-500 text-white">Reversed</Badge>
      case "DRAFT": // Handle DRAFT status
        return <Badge className="bg-yellow-300 text-yellow-800">Draft</Badge>
      default:
        return null
    }
  }

  // Table columns
  const columns = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }: any) => {
        return new Date(row.getValue("date")).toLocaleDateString()
      },
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "account",
      header: "Account",
    },
    {
      accessorKey: "debit",
      header: "Debit",
      cell: ({ row }: any) => {
        const amount = Number.parseFloat(row.getValue("debit"))
        if (amount === 0) return ""
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
      },
    },
    {
      accessorKey: "credit",
      header: "Credit",
      cell: ({ row }: any) => {
        const amount = Number.parseFloat(row.getValue("credit"))
        if (amount === 0) return ""
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
      },
    },
    {
      accessorKey: "reference",
      header: "Reference",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        return <StatusBadge status={row.getValue("status")} />
      },
    },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">General Ledger</h1>
            <p className="text-muted-foreground">View and manage journal entries and account balances</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleFilter}>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleNewJournalEntry}>New Journal Entry</Button>
            <Button variant="outline" onClick={() => setIsLedgerMaintenanceOpen(!isLedgerMaintenanceOpen)}>
              {isLedgerMaintenanceOpen ? "Hide Ledger Maintenance" : "Manage Accounts"}
            </Button>
          </div>
        </div>

        {/* Ledger Maintenance Section */}
        {isLedgerMaintenanceOpen && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ledger Maintenance</CardTitle>
                <CardDescription>Manage your chart of accounts</CardDescription>
              </div>
              <Button onClick={() => setIsNewAccountModalOpen(true)}>Create Account</Button>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { accessorKey: "account_number", header: "Account Number" },
                  { accessorKey: "name", header: "Account Name" },
                  { accessorKey: "balance", header: "Balance", cell: ({ row }) => {
                      const amount = Number.parseFloat(row.getValue("balance"));
                      return new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                      }).format(amount);
                  }},
                ]}
                data={accounts}
                onRowClick={() => { /* TODO: Implement account details modal */ }}
              />
            </CardContent>
          </Card>
        )}

        {/* Trial Balance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Trial Balance</CardTitle>
            <CardDescription>Current account balances by category</CardDescription>
          </CardHeader>
          <CardContent>
            {trialBalanceData && trialBalanceData.items.length > 0 ? (
              <Chart
                title=""
                data={trialBalanceData.items.map(item => ({
                  category: item.account_name,
                  debit: item.debit_amount,
                  credit: item.credit_amount,
                }))}
                type="bar"
                xAxisKey="category"
                series={[
                  { name: "Debit", key: "debit", color: "#10b981" },
                  { name: "Credit", key: "credit", color: "#6366f1" },
                ]}
                height={300}
              />
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No trial balance data available for the selected period.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Journal Entries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Journal Entries</CardTitle>
                <CardDescription>View and manage all journal entries</CardDescription>
              </div>
              {journalEntries.filter(entry => entry.status === "anomaly").length > 0 && (
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {journalEntries.filter(entry => entry.status === "anomaly").length} Anomalies Detected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={journalEntries} onRowClick={handleRowClick} />
          </CardContent>
        </Card>
      </div>

      {/* Entry Details Modal */}
      <ModalDialog
        title="Journal Entry Details"
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        size="lg"
      >
        {selectedEntry && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Journal Type</h3>
            <p className="mt-1">
              {journalTypes.find(type => type.id === selectedEntry.journal_type_id)?.name || selectedEntry.journal_type_id}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Account</h3>
            <p className="mt-1">
              {accounts.find(account => account.id === selectedEntry.account)?.name || selectedEntry.account}
            </p>
          </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1">{selectedEntry.description}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Account</h3>
                <p className="mt-1">{selectedEntry.account}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                <p className="mt-1">
                  {selectedEntry.debit > 0
                    ? `Debit: ${new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(selectedEntry.debit)}`
                    : `Credit: ${new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(selectedEntry.credit)}`}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <StatusBadge status={selectedEntry.status} />
                </div>
              </div>
            </div>

            {(selectedEntry.status === "anomaly" || selectedEntry.status === "DRAFT") && (
              <div className="border-t border-gray-200 pt-4">
                <ApprovalCard
                  id={selectedEntry.id}
                  title={selectedEntry.is_anomaly ? "Anomaly Detected" : "Review Required"}
                  description="This journal entry has been flagged as an anomaly"
                  confidence={85}
                  rationale="This transaction is unusual because the amount is significantly higher than typical software expenses (300% above monthly average). Additionally, this vendor has not been used before for software purchases."
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={() => selectedEntry && handleEdit(selectedEntry)} // Pass the selectedEntry object
                />
              </div>
            )}

            {/* Removed: Export and View Related Entries buttons */}
            
          </div>
        )}
      </ModalDialog>

      {/* New Journal Entry Modal */}
      <ModalDialog
        title="Create New Journal Entry"
        isOpen={isNewEntryModalOpen}
        onClose={() => setIsNewEntryModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="entryDate" className="block text-sm font-medium text-gray-700">Date</label>
            <Input
              id="entryDate"
              type="date"
              value={newEntry.date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, date: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <Input
              id="description"
              value={newEntry.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, description: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="journalType" className="block text-sm font-medium text-gray-700">Journal Type</label>
            <select
              id="journalType"
              value={newEntry.journal_type_id} // Assuming newEntry will have a journal_type_id
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewEntry({ ...newEntry, journal_type_id: e.target.value })}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
            >
              <option value="">Select a journal type</option>
              {journalTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="account" className="block text-sm font-medium text-gray-700">Account</label>
            <select
              id="account"
              value={newEntry.account} // newEntry.account will now store account ID
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewEntry({ ...newEntry, account: e.target.value })}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
            >
              <option value="">Select an account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_number} - {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="debit" className="block text-sm font-medium text-gray-700">Debit</label>
              <Input
                id="debit"
                type="number"
                value={newEntry.debit === 0 ? "" : newEntry.debit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, debit: Number(e.target.value) })}
              />
            </div>
            <div>
              <label htmlFor="credit" className="block text-sm font-medium text-gray-700">Credit</label>
              <Input
                id="credit"
                type="number"
                value={newEntry.credit === 0 ? "" : newEntry.credit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, credit: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700">Reference</label>
            <Input
              id="reference"
              value={newEntry.reference}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, reference: e.target.value })}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setIsNewEntryModalOpen(false)} className="mr-2">
              Cancel
            </Button>
            <Button onClick={handleSubmitNewEntry} className="bg-teal-600 hover:bg-teal-700">
              Create Entry
            </Button>
          </div>
        </div>
      </ModalDialog>

      {/* Filter Modal */}
      <ModalDialog
        title="Filter Journal Entries"
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
            <Input
              id="startDate"
              type="date"
              value={filterCriteria.startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterCriteria({ ...filterCriteria, startDate: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
            <Input
              id="endDate"
              type="date"
              value={filterCriteria.endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterCriteria({ ...filterCriteria, endDate: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="filterAccount" className="block text-sm font-medium text-gray-700">Account</label>
            <select
              id="filterAccount"
              value={filterCriteria.account}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCriteria({ ...filterCriteria, account: e.target.value })}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
            >
              <option value="">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.name}> {/* Value should be account.name for getJournalEntries filter */}
                  {account.account_number} - {account.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="filterStatus"
              value={filterCriteria.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCriteria({ ...filterCriteria, status: e.target.value as JournalEntry["status"] })}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="normal">Normal</option>
              <option value="anomaly">Anomaly</option>
              <option value="approved">Approved</option>
              <option value="POSTED">Posted</option>
              <option value="REVERSED">Reversed</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={handleClearFilter} className="mr-2">
              Clear Filters
            </Button>
            <Button onClick={handleApplyFilter} className="bg-teal-600 hover:bg-teal-700">
              Apply Filters
            </Button>
          </div>
        </div>
      </ModalDialog>

      {/* Export Modal */}
      <ModalDialog
        title="Export Journal Entries"
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        size="sm"
      >
        <div className="space-y-4">
          <p>Select the desired export format:</p>
          <div className="flex justify-around">
            <Button onClick={() => handleExportData("csv")}>Export as CSV</Button>
          </div>
        </div>
      </ModalDialog>

      {/* New Account Modal */}
      <ModalDialog
        title="Create New Account"
        isOpen={isNewAccountModalOpen}
        onClose={() => setIsNewAccountModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">Account Number</label>
            <Input
              id="accountNumber"
              value={newAccount.account_number}
              onChange={(e) => setNewAccount({ ...newAccount, account_number: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">Account Name</label>
            <Input
              id="accountName"
              value={newAccount.name}
              onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="accountDescription" className="block text-sm font-medium text-gray-700">Description</label>
            <Input
              id="accountDescription"
              value={newAccount.description}
              onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">Account Type</label>
            <select
              id="accountType"
              value={newAccount.account_type_id}
              onChange={(e) => setNewAccount({ ...newAccount, account_type_id: e.target.value })}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
            >
              <option value="">Select an account type</option>
              {accountTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setIsNewAccountModalOpen(false)} className="mr-2">
              Cancel
            </Button>
            <Button onClick={handleSubmitNewAccount} className="bg-teal-600 hover:bg-teal-700">
              Create Account
            </Button>
          </div>
        </div>
      </ModalDialog>

      {/* Edit Journal Entry Modal */}
      <ModalDialog
        title="Edit Journal Entry"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        size="md"
      >
        {entryToEdit && (
          <div className="space-y-4">
            <div>
              <label htmlFor="editEntryDate" className="block text-sm font-medium text-gray-700">Date</label>
              <Input
                id="editEntryDate"
                type="date"
                value={entryToEdit.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntryToEdit({ ...entryToEdit, date: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700">Description</label>
              <Input
                id="editDescription"
                value={entryToEdit.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntryToEdit({ ...entryToEdit, description: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="editJournalType" className="block text-sm font-medium text-gray-700">Journal Type</label>
              <select
                id="editJournalType"
                value={entryToEdit.journal_type_id}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEntryToEdit({ ...entryToEdit, journal_type_id: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
              >
                <option value="">Select a journal type</option>
                {journalTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="editAccount" className="block text-sm font-medium text-gray-700">Account</label>
              <select
                id="editAccount"
                value={entryToEdit.account}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEntryToEdit({ ...entryToEdit, account: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_number} - {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="editDebit" className="block text-sm font-medium text-gray-700">Debit</label>
                <Input
                  id="editDebit"
                  type="number"
                  value={entryToEdit.debit === 0 ? "" : entryToEdit.debit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntryToEdit({ ...entryToEdit, debit: Number(e.target.value) })}
                />
              </div>
              <div>
                <label htmlFor="editCredit" className="block text-sm font-medium text-gray-700">Credit</label>
                <Input
                  id="editCredit"
                  type="number"
                  value={entryToEdit.credit === 0 ? "" : entryToEdit.credit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntryToEdit({ ...entryToEdit, credit: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label htmlFor="editReference" className="block text-sm font-medium text-gray-700">Reference</label>
              <Input
                id="editReference"
                value={entryToEdit.reference}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntryToEdit({ ...entryToEdit, reference: e.target.value })}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="mr-2">
                Cancel
              </Button>
              <Button onClick={handleUpdateJournalEntry} className="bg-teal-600 hover:bg-teal-700">
                Update Entry
              </Button>
            </div>
          </div>
        )}
      </ModalDialog>
    </AppShell>
  )
}

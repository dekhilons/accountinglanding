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

import type { JournalEntry } from "@/lib/types";
import { getJournalEntries, createJournalEntry } from "@/lib/gl-api"; // Import the API function

export default function GeneralLedgerPage() {
  const { toast } = useToast()
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]) // Initialize as empty array
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [newEntry, setNewEntry] = useState<Omit<JournalEntry, "id" | "status">>({
    date: "",
    description: "",
    debit: 0,
    credit: 0,
    account: "",
    reference: "",
    is_anomaly: false, // Initialize as false for new entries
  })
  const [filterCriteria, setFilterCriteria] = useState({
    startDate: "",
    endDate: "",
    account: "",
    status: "",
  })

  // Sample data for trial balance chart - this will eventually come from an API
  const trialBalanceData = [
    { category: "Assets", debit: 250000, credit: 0 },
    { category: "Liabilities", debit: 0, credit: 120000 },
    { category: "Equity", debit: 0, credit: 80000 },
    { category: "Revenue", debit: 0, credit: 175000 },
    { category: "Expenses", debit: 125000, credit: 0 },
  ]

  // Fetch journal entries on component mount and when filter criteria change
  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Assuming a tenantId is available, e.g., from user context or a default
        const tenantId = "default"; // Placeholder: Replace with actual tenant ID
        const fetchedEntries = await getJournalEntries(tenantId, {
          startDate: filterCriteria.startDate,
          endDate: filterCriteria.endDate,
          account: filterCriteria.account,
          status: filterCriteria.status as JournalEntry["status"],
        });
        setJournalEntries(fetchedEntries);
      } catch (err) {
        setError("Failed to fetch journal entries.");
        console.error("Fetch error:", err);
        toast({
          title: "Error",
          description: "Failed to load journal entries.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [filterCriteria.startDate, filterCriteria.endDate, filterCriteria.account, filterCriteria.status, toast]); // Re-fetch when filter criteria change

  // Handle row click to show details
  const handleRowClick = (entry: JournalEntry) => {
    setSelectedEntry(entry)
    setIsDetailsModalOpen(true)
  }

  // Handle approval actions
  const handleApprove = async (id: string) => {
    // TODO: Implement actual API call to post the journal entry
    // For now, just update local state and show toast
    try {
      // Assuming a postJournalEntry API function exists
      // await postJournalEntry(id);
      setJournalEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry.id === id ? { ...entry, status: "approved" } : entry
        )
      )
      toast({
        title: "Anomaly Approved",
        description: `Journal entry ${id} has been approved and posted.`,
      })
      setIsDetailsModalOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to approve journal entry ${id}.`,
        variant: "destructive",
      })
      console.error("Approval error:", error);
    }
  }

  const handleReject = (id: string, reason?: string) => {
    // For rejection, we might not change the status from 'anomaly' unless there's a 'rejected' status.
    // For now, just close the modal and provide toast feedback.
    toast({
      title: "Entry Rejected",
      description: reason ? `Reason: ${reason}` : "Entry has been rejected.",
      variant: "destructive",
    })
    setIsDetailsModalOpen(false)
  }

  const handleEdit = (id: string) => {
    toast({
      title: "Edit mode",
      description: "Opening journal entry editor for " + id + ".",
    })
    // TODO: Implement actual edit functionality here, e.g., navigate to an edit form or open an editable modal
  }

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

    if (newEntry.debit !== newEntry.credit) {
      toast({
        title: "Error",
        description: "Journal entry must be balanced. Debit and Credit amounts must be equal for a simple entry, or one must be zero.",
        variant: "destructive",
      })
      return
    }

    // TODO: Resolve account_id, journal_type_id, fiscal_period_id
    // For now, these are placeholders in createJournalEntry in gl-api.ts
    const tenantId = "default"; // Placeholder: Replace with actual tenant ID

    try {
      const createdEntry = await createJournalEntry(tenantId, newEntry);

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
          reference: "",
          is_anomaly: false,
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
      status: "",
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
          </div>
        </div>

        {/* Trial Balance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Trial Balance</CardTitle>
            <CardDescription>Current account balances by category</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              title=""
              data={trialBalanceData}
              type="bar"
              xAxisKey="category"
              series={[
                { name: "Debit", key: "debit", color: "#10b981" },
                { name: "Credit", key: "credit", color: "#6366f1" },
              ]}
              height={300}
            />
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
                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                <p className="mt-1">{new Date(selectedEntry.date).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Reference</h3>
                <p className="mt-1">{selectedEntry.reference}</p>
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

            {selectedEntry.status === "anomaly" && (
              <div className="border-t border-gray-200 pt-4">
                <ApprovalCard
                  id={selectedEntry.id}
                  title="Anomaly Detected"
                  description="This journal entry has been flagged as an anomaly"
                  confidence={85}
                  rationale="This transaction is unusual because the amount is significantly higher than typical software expenses (300% above monthly average). Additionally, this vendor has not been used before for software purchases."
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={handleEdit}
                />
              </div>
            )}

            {selectedEntry.status !== "anomaly" && (
              <div className="border-t border-gray-200 pt-4 flex justify-end">
                <Button variant="outline" className="mr-2" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => handleViewRelatedEntries(selectedEntry.id)}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  View Related Entries
                </Button>
              </div>
            )}
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
            <label htmlFor="account" className="block text-sm font-medium text-gray-700">Account</label>
            <Input
              id="account"
              value={newEntry.account}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, account: e.target.value })}
            />
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
            <Input
              id="filterAccount"
              value={filterCriteria.account}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterCriteria({ ...filterCriteria, account: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700">Status</label>
            <Input
              id="filterStatus"
              value={filterCriteria.status}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterCriteria({ ...filterCriteria, status: e.target.value })}
            />
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
    </AppShell>
  )
}

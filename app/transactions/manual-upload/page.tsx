"use client"

import { useState } from "react"
import { AlertCircle, Download } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUploader } from "@/components/ui/file-uploader"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

// Define types
type UploadedFile = {
  id: string
  fileName: string
  fileType: string
  uploadDate: string
  status: "processing" | "completed" | "error"
  recordsProcessed: number
  recordsTotal: number
  errors?: string[]
}

export default function ManualUploadPage() {
  const { toast } = useToast()
  const [uploadHistory, setUploadHistory] = useState<UploadedFile[]>([
    {
      id: "upload-1001",
      fileName: "bank_transactions_may_2024.csv",
      fileType: "Bank Transactions",
      uploadDate: "2024-05-20T14:30:00",
      status: "completed",
      recordsProcessed: 150,
      recordsTotal: 150,
    },
    {
      id: "upload-1002",
      fileName: "vendor_invoices_batch_1.xlsx",
      fileType: "AP Invoices",
      uploadDate: "2024-05-18T10:15:00",
      status: "completed",
      recordsProcessed: 45,
      recordsTotal: 45,
    },
    {
      id: "upload-1003",
      fileName: "customer_payments_may.csv",
      fileType: "AR Receipts",
      uploadDate: "2024-05-15T16:45:00",
      status: "error",
      recordsProcessed: 12,
      recordsTotal: 25,
      errors: ["Invalid customer ID in row 13", "Missing amount in row 18", "Duplicate transaction in row 22"],
    },
    {
      id: "upload-1004",
      fileName: "journal_entries_adjustments.xlsx",
      fileType: "Journal Entries",
      uploadDate: "2024-05-12T09:30:00",
      status: "processing",
      recordsProcessed: 8,
      recordsTotal: 15,
    },
  ])

  // Document types for uploader
  const documentTypes = [
    { value: "BANK_TRANSACTIONS", label: "Bank Transactions" },
    { value: "AP_INVOICES", label: "AP Invoices" },
    { value: "AR_RECEIPTS", label: "AR Receipts" },
    { value: "JOURNAL_ENTRIES", label: "Journal Entries" },
    { value: "EXPENSE_REPORTS", label: "Expense Reports" },
    { value: "PAYROLL_DATA", label: "Payroll Data" },
  ]

  // Handle file upload
  const handleUpload = async (file: File, documentType: string) => {
    // Simulate API call
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const newUpload: UploadedFile = {
          id: `upload-${Date.now()}`,
          fileName: file.name,
          fileType: documentTypes.find((dt) => dt.value === documentType)?.label || documentType,
          uploadDate: new Date().toISOString(),
          status: "processing",
          recordsProcessed: 0,
          recordsTotal: Math.floor(Math.random() * 100) + 10,
        }

        setUploadHistory((prev) => [newUpload, ...prev])

        toast({
          title: "Upload Started",
          description: `${file.name} is being processed.`,
        })

        // Trigger AR workflow if AR document is uploaded
        if (documentType === "AR_RECEIPTS") {
          await triggerARWorkflow(file, newUpload.id)
        }

        resolve()
      }, 1000)
    })
  }

  // Trigger Accounts Receivable workflow
  const triggerARWorkflow = async (file: File, uploadId: string) => {
    try {
      // Simulate processing the AR document and generating invoice
      setTimeout(() => {
        // Generate a new invoice for approval
        const newInvoice = {
          id: `inv-${Date.now()}`,
          title: `Invoice #${Math.floor(Math.random() * 10000)} - ${file.name.split('.')[0]}`,
          description: `$${(Math.random() * 5000 + 500).toFixed(2)} - Generated from ${file.name}`,
          confidence: Math.floor(Math.random() * 20) + 80, // 80-99% confidence
          rationale: `Invoice automatically generated from uploaded AR document. Document processed and validated against customer records.`,
          type: "invoice",
        }

        // Add to dashboard approval queue (this would normally be done via API/state management)
        addInvoiceToApprovalQueue(newInvoice)

        toast({
          title: "AR Workflow Triggered",
          description: `Invoice generated and added to approval queue from ${file.name}`,
        })
      }, 2000)
    } catch (error) {
      console.error("AR workflow failed:", error)
      toast({
        title: "AR Workflow Failed",
        description: "Failed to process AR document and generate invoice.",
        variant: "destructive",
      })
    }
  }

  // Function to add invoice to dashboard approval queue
  const addInvoiceToApprovalQueue = (invoice: any) => {
    // This would normally use a global state management solution or API call
    // For now, we'll use localStorage to communicate with the dashboard
    const existingQueue = JSON.parse(localStorage.getItem('approvalQueue') || '[]')
    const updatedQueue = [...existingQueue, invoice]
    localStorage.setItem('approvalQueue', JSON.stringify(updatedQueue))

    // Dispatch custom event to notify dashboard of new invoice
    window.dispatchEvent(new CustomEvent('invoiceAdded', { detail: invoice }))
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: UploadedFile["status"] }) => {
    switch (status) {
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return null
    }
  }

  // Table columns
  const columns = [
    {
      accessorKey: "fileName",
      header: "File Name",
    },
    {
      accessorKey: "fileType",
      header: "Type",
    },
    {
      accessorKey: "uploadDate",
      header: "Upload Date",
      cell: ({ row }: any) => {
        return new Date(row.getValue("uploadDate")).toLocaleString()
      },
    },
    {
      accessorKey: "recordsProcessed",
      header: "Progress",
      cell: ({ row }: any) => {
        const processed = row.getValue("recordsProcessed")
        const total = row.original.recordsTotal
        const percentage = Math.round((processed / total) * 100)
        return `${processed}/${total} (${percentage}%)`
      },
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
            <h1 className="text-2xl font-bold tracking-tight">Manual Upload</h1>
            <p className="text-muted-foreground">Upload and process transaction files manually</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList>
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
            <TabsTrigger value="history">Upload History</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Upload Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Instructions</CardTitle>
                <CardDescription>Follow these guidelines for successful file uploads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Supported File Formats</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• CSV (Comma-separated values)</li>
                      <li>• Excel (.xlsx, .xls)</li>
                      <li>• PDF (for invoice processing)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">File Requirements</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Maximum file size: 50MB</li>
                      <li>• Include column headers</li>
                      <li>• Use standard date formats (YYYY-MM-DD)</li>
                      <li>• Ensure all required fields are populated</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Transaction File</CardTitle>
                <CardDescription>Select a file type and upload your transaction data</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader documentTypes={documentTypes} onUpload={handleUpload} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Upload History */}
            <Card>
              <CardHeader>
                <CardTitle>Upload History</CardTitle>
                <CardDescription>View the status of your uploaded files</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable columns={columns} data={uploadHistory} searchColumn="fileName" />
              </CardContent>
            </Card>

            {/* Error Details */}
            {uploadHistory.some((upload) => upload.status === "error") && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5 text-red-600" />
                    Upload Errors
                  </CardTitle>
                  <CardDescription>Review and resolve upload errors</CardDescription>
                </CardHeader>
                <CardContent>
                  {uploadHistory
                    .filter((upload) => upload.status === "error")
                    .map((upload) => (
                      <div key={upload.id} className="border rounded-md p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{upload.fileName}</h3>
                          <StatusBadge status={upload.status} />
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Processed {upload.recordsProcessed} of {upload.recordsTotal} records
                        </div>
                        {upload.errors && (
                          <div>
                            <h4 className="font-medium text-red-800 mb-1">Errors:</h4>
                            <ul className="text-sm text-red-600 space-y-1">
                              {upload.errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex justify-end mt-3">
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Download Error Report
                          </Button>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

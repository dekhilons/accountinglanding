"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from 'next/dynamic'; // Import dynamic for client-side rendering
import {
  Check,
  Download,
  Clock, // Re-added Clock import
  CheckCircle,
  XCircle,
  Search,
  FileText,
  Receipt,
  AlertTriangle,
  Eye,
  MessageSquare,
  Zap,
  Upload,
  X,
  PlusCircle, // Added for vendor form
} from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import {
  InvoiceDetailsResponseSchema,
  DwDimVendorResponseSchema,
  getInvoices,
  approveInvoice,
  getVendors,
  createVendor, // Added createVendor
  CreateVendorRequest, // Added CreateVendorRequest
  updateVendor, // Added updateVendor
  UpdateVendorRequest, // Added UpdateVendorRequest
  deleteVendor, // Added deleteVendor
} from "@/lib/ap/ap"
import { uploadFile } from "@/lib/upload"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label" // Added for vendor form
import { Textarea } from "@/components/ui/textarea" // Added for vendor form
import { Checkbox } from "@/components/ui/checkbox" // Added for vendor form


// Define types
type APInvoice = InvoiceDetailsResponseSchema & {
  id: string // action_id mapped to id for component compatibility
  matched: boolean // Mock property
  exceptions?: string[] // Mock property
  confidence: number // Mock property
  document_path?: string; // Added document_path to APInvoice type
}
type APReceipt = {
  id: string
  receiptNumber: string
  vendor: string
  dateReceived: string
  quantity: number
  matchedInvoice: boolean
  status: "unmatched" | "matched" | "pending" | "flagged" // Added "flagged"
  confidence: number
}

// Define Vendor types for integration
type VendorResponse = DwDimVendorResponseSchema & {
  id: string; // Mapping vendor_id to id for component compatibility
};

type VendorCreate = {
  vendor_number?: string;
  name: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  payment_terms?: number;
  credit_limit?: number;
  is_active?: boolean;
  tenant_id: string;
  metadata?: Record<string, any>;
};

type VendorView = "list" | "create" | "details";


export default function AccountsPayablePage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("invoices")
  const [selectedItem, setSelectedItem] = useState<APInvoice | APReceipt | null>(null)
  const router = useRouter()
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [numPages, setNumPages] = useState<number | null>(null); // State for total pages
  const [pageNumber, setPageNumber] = useState(1); // State for current page number
  const [pdfUrl, setPdfUrl] = useState<string | null>(null); // State for PDF object URL
  const [isPdfLoading, setIsPdfLoading] = useState(false); // State to track PDF loading

  // Vendor Management states
  const [vendorView, setVendorView] = useState<VendorView>("list")
  const [selectedVendor, setSelectedVendor] = useState<VendorResponse | null>(null)
  const [isEditingVendor, setIsEditingVendor] = useState(false)
  const [newVendor, setNewVendor] = useState<Partial<CreateVendorRequest>>({ // Changed to Partial<CreateVendorRequest>
    name: "",
    vendor_id: "", // Changed from vendor_number to vendor_id
    address: "",
    contact_email: "",
    contact_phone: "",
    payment_terms: 30,
    credit_limit: 0,
    is_active: true,
    tenant_id: "",
    category: "", // Added category
    region: "", // Added region
    created_at: "", // Added created_at
    updated_at: "", // Added updated_at
  })

  // Invoice data and loading state
  const [invoices, setInvoices] = useState<APInvoice[]>(() => {
    // Initialize from localStorage or default
    if (typeof window !== 'undefined') {
      const savedInvoices = localStorage.getItem('apInvoices');
      if (savedInvoices) {
        return JSON.parse(savedInvoices);
      }
    }
    return []; // Default empty array if no saved data
  });
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [errorInvoices, setErrorInvoices] = useState<string | null>(null)

  // Vendor data for filters
  const [vendors, setVendors] = useState<DwDimVendorResponseSchema[]>([])
  const [loadingVendors, setLoadingVendors] = useState(true)
  const [errorVendors, setErrorVendors] = useState<string | null>(null)
  const [vendorSearchTerm, setVendorSearchTerm] = useState("") // Add vendor search state

  // Invoice filters
  const [invoiceDateRange, setInvoiceDateRange] = useState("all")
  const [invoiceVendor, setInvoiceVendor] = useState("all")
  const [invoiceStatus, setInvoiceStatus] = useState("all")
  const [invoiceSearch, setInvoiceSearch] = useState("")

  // Receipt filters
  const [receiptDateRange, setReceiptDateRange] = useState("all")
  const [receiptVendor, setReceiptVendor] = useState("all")
  const [receiptStatus, setReceiptStatus] = useState("all")

  // Fetch invoices
  useEffect(() => {
    const fetchInvoicesData = async () => {
      setLoadingInvoices(true)
      setErrorInvoices(null)
      try {
        // TODO: Replace with actual tenant_id from context/auth
        const fetchedInvoices = await getInvoices("test-tenant")
        setInvoices(
          fetchedInvoices.map((inv) => ({
            ...inv,
            id: inv.action_id, // Map action_id to id for existing component compatibility
            matched: Math.random() > 0.5, // Mock matched status for now
            exceptions: Math.random() > 0.7 ? ["Mock exception"] : [], // Mock exceptions
            confidence: Math.floor(Math.random() * 30) + 70, // Mock confidence 70-99
            document_path: inv.documentId, // Use the documentId from the fetched invoice as the MinIO path
          }))
        )
      } catch (error) {
        console.error("Failed to fetch invoices:", error)
        setErrorInvoices("Failed to load invoices.")
        toast({
          title: "Error",
          description: "Failed to load invoices.",
          variant: "destructive",
        })
      } finally {
        setLoadingInvoices(false)
      }
    }

    fetchInvoicesData()
  }, [invoiceDateRange, invoiceVendor, invoiceStatus, invoiceSearch, toast])

  // Function to fetch vendors
  const fetchVendors = async (searchTerm: string = "") => {
    setLoadingVendors(true)
    setErrorVendors(null)
    try {
      // TODO: Replace with actual tenant_id from context/auth
      const fetchedVendors = await getVendors("test-tenant", searchTerm, 0, 100)
      setVendors(fetchedVendors)
    } catch (error) {
      console.error("Failed to fetch vendors:", error)
      setErrorVendors("Failed to load vendors for filter.")
    } finally {
      setLoadingVendors(false)
    }
  }

  // Fetch vendors on component mount and when search term changes
  useEffect(() => {
    fetchVendors(vendorSearchTerm)
  }, [vendorSearchTerm]); // Add vendorSearchTerm to dependency array

  // Fetch PDF when selectedItem with document_path changes
  useEffect(() => {
    let currentPdfUrl: string | null = null;
    if (selectedItem && 'document_path' in selectedItem && selectedItem.document_path) {
      setIsPdfLoading(true);
      const fetchPdf = async () => {
        try {
          // Fetch from the ingestion service's document preview endpoint
          const url = `http://localhost:8002/document/preview?minio_path=${encodeURIComponent(selectedItem.document_path as string)}`; 
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.statusText}`);
          }
          const blob = await response.blob();
          currentPdfUrl = URL.createObjectURL(blob);
          setPdfUrl(currentPdfUrl);
          setPageNumber(1); // Reset to first page when new PDF is loaded
        } catch (error) {
          console.error("Error fetching PDF:", error);
          toast({
            title: "Error Loading Document",
            description: "Could not load the PDF document.",
            variant: "destructive",
          });
          setPdfUrl(null);
        } finally {
          setIsPdfLoading(false);
        }
      };
      fetchPdf();
    } else {
      setPdfUrl(null);
      setNumPages(null);
      setPageNumber(1);
      setIsPdfLoading(false);
    }

    // Cleanup function to revoke object URL when component unmounts or selectedItem changes
    return () => {
      if (currentPdfUrl) {
        URL.revokeObjectURL(currentPdfUrl);
      }
    };
  }, [selectedItem]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error: any) => {
    console.error("Error loading PDF document:", error);
    toast({
      title: "PDF Render Error",
      description: "Failed to render PDF document.",
      variant: "destructive",
    });
  };

  const PdfViewer = dynamic(() => import('@/components/pdf-viewer-component'), { ssr: false });

  const [receipts, setReceipts] = useState<APReceipt[]>(() => {
    // Initialize from localStorage or default
    if (typeof window !== 'undefined') {
      const savedReceipts = localStorage.getItem('apReceipts');
      if (savedReceipts) {
        return JSON.parse(savedReceipts);
      }
    }
    return [ // Default hardcoded receipts if no saved data
      {
        id: "rcpt-678",
        receiptNumber: "RCPT-678",
        vendor: "TechSupplier",
        dateReceived: "2025-07-10",
        quantity: 50,
        matchedInvoice: false,
        status: "pending",
        confidence: 89,
      },
      {
        id: "rcpt-679",
        receiptNumber: "RCPT-679",
        vendor: "Office Supplies Inc",
        dateReceived: "2025-07-09",
        quantity: 25,
        matchedInvoice: true,
        status: "matched",
        confidence: 95,
      },
    ];
  });

  // Effect to save invoices to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('apInvoices', JSON.stringify(invoices));
    }
  }, [invoices]);

  // Effect to save receipts to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('apReceipts', JSON.stringify(receipts));
    }
  }, [receipts]);


  // Filter functions
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesVendor = invoiceVendor === "all" || invoice.vendorName === invoiceVendor
    const matchesStatus = invoiceStatus === "all" || invoice.status.toLowerCase() === invoiceStatus.toLowerCase()
    const matchesSearch =
      invoiceSearch === "" ||
      invoice.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      (invoice.purchaseOrderNumber &&
        invoice.purchaseOrderNumber.toLowerCase().includes(invoiceSearch.toLowerCase()))

    // Date range filtering (simplified, needs proper date parsing/comparison)
    const invoiceDate = new Date(invoice.invoiceDate)
    const now = new Date()
    let matchesDateRange = true

    if (invoiceDateRange === "today") {
      matchesDateRange = invoiceDate.toDateString() === now.toDateString()
    } else if (invoiceDateRange === "week") {
      const oneWeekAgo = new Date(now.setDate(now.getDate() - 7))
      matchesDateRange = invoiceDate >= oneWeekAgo
    } else if (invoiceDateRange === "month") {
      matchesDateRange = invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear()
    }

    return matchesVendor && matchesStatus && matchesSearch && matchesDateRange
  })

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesVendor = receiptVendor === "all" || receipt.vendor === receiptVendor
    const matchesStatus = receiptStatus === "all" || receipt.status === receiptStatus

    return matchesVendor && matchesStatus
  })

  // --------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------
  const formatNumber = (n: number | undefined) => (typeof n === "number" ? n.toLocaleString() : "0")

  // Get summary stats
  const getStats = () => {
    const totalInvoices = invoices.length
    const pendingInvoices = invoices.filter((inv) => inv.status.toLowerCase() === "pending").length
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total ?? 0), 0)
    const matchedInvoices = invoices.filter((inv) => inv.matched).length

    return {
      totalInvoices,
      pendingInvoices,
      totalAmount,
      matchedInvoices,
      matchRate: totalInvoices > 0 ? Math.round((matchedInvoices / totalInvoices) * 100) : 0,
    }
  }

  const stats = getStats()

  // Create a ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Action handlers
  const handleBulkApprove = () => {
    // Mock implementation: Set all filtered invoices to approved
    setInvoices((prevInvoices) =>
      prevInvoices.map((inv) => ({ ...inv, status: "APPROVED" }))
    );
    toast({
      title: "Bulk Approval",
      description: "All displayed invoices have been approved.",
    });
    // TODO: Implement actual bulk approve API call
  };

  const handleExport = () => {
    // Create a Blob from the filtered invoices data
    // Function to convert JSON to CSV
    const convertToCsv = (data: APInvoice[]) => {
      if (data.length === 0) return "";

      const headers = Object.keys(data[0]);
      const csvRows = [];

      // Add header row
      csvRows.push(headers.join(","));

      // Add data rows
      for (const row of data) {
        const values = headers.map((header) => {
          const value = (row as any)[header];
          // Handle null/undefined, and escape commas/quotes for CSV
          if (value === null || value === undefined) return "";
          if (typeof value === "string") {
            // Escape double quotes and enclose in double quotes if it contains comma or double quotes
            const escapedValue = value.replace(/"/g, '""');
            return `"${escapedValue.includes(",") || escapedValue.includes('"') ? escapedValue : value}"`;
          }
          if (Array.isArray(value) || typeof value === "object") {
            // Stringify objects/arrays
            const escapedValue = JSON.stringify(value).replace(/"/g, '""');
            return `"${escapedValue.includes(",") || escapedValue.includes('"') ? escapedValue : value}"`;
          }
          return value;
        });
        csvRows.push(values.join(","));
      }

      return csvRows.join("\n");
    };

    const csvData = convertToCsv(filteredInvoices);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "ap_invoices_report.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Your AP invoices report has been downloaded as CSV.",
    });
  };

  const handleUploadClick = () => {
    // Trigger the hidden file input click
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    toast({
      title: "Uploading Document",
      description: `Uploading ${file.name}...`,
    })

    try {
      // TODO: Replace with actual tenant_id from context/auth
      const result = await uploadFile(file, "test-tenant", "AP_INVOICE") // Assuming typeHint "invoice" for now
      toast({
        title: "Upload Successful",
        description: `Document ${result.documentId} uploaded to ${result.path}`,
      })
      // Optionally, refresh invoice list after successful upload
      // fetchInvoicesData();
    } catch (error) {
      console.error("Upload failed:", error)
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      })
    }
  }

  const handleApprove = async (actionId: string) => {
    try {
      await approveInvoice({ actionId, userDecision: "APPROVED" })
      toast({
        title: "Invoice Approved",
        description: `Invoice ${actionId} has been approved.`,
      })
      // Refresh invoices after approval
      // TODO: Re-fetch only the updated invoice or update state directly
      setInvoices((prevInvoices) =>
        prevInvoices.map((inv) => (inv.action_id === actionId ? { ...inv, status: "APPROVED" } : inv))
      )
    } catch (error) {
      console.error("Failed to approve invoice:", error)
      toast({
        title: "Error",
        description: `Failed to approve invoice ${actionId}.`,
        variant: "destructive",
      })
    }
  }

  const handleReject = async (actionId: string) => {
    try {
      await approveInvoice({ actionId, userDecision: "REJECTED" })
      toast({
        title: "Invoice Rejected",
        description: `Invoice ${actionId} has been rejected.`,
        variant: "destructive",
      })
      // Refresh invoices after rejection
      // TODO: Re-fetch only the updated invoice or update state directly
      setInvoices((prevInvoices) =>
        prevInvoices.map((inv) => (inv.action_id === actionId ? { ...inv, status: "REJECTED" } : inv))
      )
    } catch (error) {
      console.error("Failed to reject invoice:", error)
      toast({
        title: "Error",
        description: `Failed to reject invoice ${actionId}.`,
        variant: "destructive",
      })
    }
  }

  const handleAutoMatch = (id: string) => {
    setReceipts((prevReceipts) =>
      prevReceipts.map((receipt) =>
        receipt.id === id ? { ...receipt, status: "matched" } : receipt
      )
    );
    toast({
      title: "Auto-Match Applied",
      description: `Receipt ${id} has been automatically matched.`,
    });
  };

  const handleFlagForReview = (id: string) => {
    setReceipts((prevReceipts) =>
      prevReceipts.map((receipt) =>
        receipt.id === id ? { ...receipt, status: "flagged" } : receipt
      )
    );
    toast({
      title: "Flagged for Review",
      description: `Receipt ${id} has been flagged for manual review.`,
    });
  };

  // Vendor Management Handlers
  const handleSaveVendor = async () => {
    setLoadingVendors(true)
    try {
      // TODO: Replace with actual tenant_id from context/auth
      await createVendor({ ...newVendor, tenant_id: "test-tenant" } as CreateVendorRequest)
      toast({ title: "Vendor Added", description: "New vendor added successfully." })
      setVendorView("list") // Redirect to vendor list after successful creation
      // Refresh vendors list with a slight delay to ensure backend is ready
      await new Promise(resolve => setTimeout(resolve, 500)); // Add 500ms delay
      await fetchVendors()
      setNewVendor({ // Reset form
        name: "", vendor_id: "", address: "", contact_email: "", contact_phone: "",
        payment_terms: 30, credit_limit: 0, is_active: true, tenant_id: "", metadata: {},
      })
    } catch (error: any) {
      console.error("Failed to add vendor:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add new vendor.",
        variant: "destructive",
      })
    } finally {
      setLoadingVendors(false)
    }
  }

  const handleUpdateVendor = async () => {
    if (!selectedVendor) return

    setLoadingVendors(true)
    try {
      // TODO: Replace with actual tenant_id from context/auth
      await updateVendor({ ...selectedVendor, tenant_id: "test-tenant" } as UpdateVendorRequest)
      toast({ title: "Vendor Updated", description: "Vendor details updated successfully." })
      setIsEditingVendor(false) // Exit editing mode
      // Refresh vendors list
      await fetchVendors()
    } catch (err: any) {
      console.error("Failed to update vendor:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update vendor details.",
        variant: "destructive",
      })
    } finally {
      setLoadingVendors(false)
    }
  }

  const handleDeleteVendor = async (vendorId: string) => {
    if (window.confirm(`Are you sure you want to delete vendor ${selectedVendor?.name}?`)) {
      setLoadingVendors(true)
      try {
        await deleteVendor(vendorId)
        toast({ title: "Vendor Deleted", description: `Vendor ${selectedVendor?.name} has been deleted.` })
        setVendorView("list")
        setSelectedVendor(null)
        // Refresh vendors list
        await fetchVendors()
      } catch (err: any) {
        console.error("Failed to delete vendor:", err)
        toast({
          title: "Error",
          description: err.message || "Failed to delete vendor.",
          variant: "destructive",
        })
      } finally {
        setLoadingVendors(false)
      }
    }
  }

  const handleItemSelect = (item: APInvoice | APReceipt | VendorResponse) => {
    if ((item as VendorResponse).vendor_id) {
      setSelectedVendor(item as VendorResponse)
      setVendorView("details")
    } else {
      setSelectedItem(item as APInvoice | APReceipt)
      setShowDetailPanel(true)
    }
  }

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false)
    setSelectedItem(null)
  }

  const handleCloseVendorDetailPanel = () => {
    setVendorView("list")
    setSelectedVendor(null)
    setIsEditingVendor(false)
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending Approval
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            <Clock className="mr-1 h-3 w-3" />
            Processing
          </Badge>
        )
      case "matched":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <Check className="mr-1 h-3 w-3" />
            Matched
          </Badge>
        )
      case "unmatched":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Unmatched
          </Badge>
        )
      case "flagged": // Added new case for "flagged" status
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Flagged
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            {status}
          </Badge>
        )
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Accounts Payable</h1>
            <p className="text-muted-foreground">Manage invoices, receipts, and vendor payments</p>
          </div>
          <Button onClick={handleUploadClick} className="bg-teal-600 hover:bg-teal-700">
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </Button>
          {/* Hidden file input */}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Invoices</p>
                  <p className="text-2xl font-bold">{stats.totalInvoices}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Approval</p>
                  <p className="text-2xl font-bold">{stats.pendingInvoices}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold">${formatNumber(stats.totalAmount)}</p>
                </div>
                <Receipt className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Match Rate</p>
                  <p className="text-2xl font-bold">{stats.matchRate}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-teal-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={`grid gap-6 ${showDetailPanel ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1"}`}>
          {/* Master List */}
          <div className={showDetailPanel ? "lg:col-span-3" : "col-span-1"}>
            <Card>
              <CardHeader>
                <CardTitle>AP Management</CardTitle>
                <CardDescription>Process invoices and receipts</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="invoices">
                      Invoices
                      <Badge className="ml-2 bg-blue-500">{invoices.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="receipts">
                      Receipts
                      <Badge className="ml-2 bg-green-500">{receipts.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="vendors" onClick={() => { setActiveTab("vendors"); setVendorView("list"); }}>
                      Vendors
                      <Badge className="ml-2 bg-purple-500">{vendors.length}</Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="invoices" className="space-y-4">
                    {/* Filters & Actions Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-between">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Select value={invoiceDateRange} onValueChange={setInvoiceDateRange}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Date range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All dates</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This week</SelectItem>
                            <SelectItem value="month">This month</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={invoiceVendor} onValueChange={setInvoiceVendor}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Vendor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All vendors</SelectItem>
                            {vendors.map((vendor) => (
                              <SelectItem key={vendor.vendor_id} value={vendor.name}>
                                {vendor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={invoiceStatus} onValueChange={setInvoiceStatus}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleBulkApprove}>
                          Bulk Approve
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExport}>
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </Button>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by Invoice # or PO #"
                        value={invoiceSearch}
                        onChange={(e) => setInvoiceSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Invoice List/Table */}
                    {loadingInvoices ? (
                      <div className="text-center py-8">Loading invoices...</div>
                    ) : errorInvoices ? (
                      <div className="text-center py-8 text-red-500">{errorInvoices}</div>
                    ) : filteredInvoices.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No invoices found.</div>
                    ) : showDetailPanel ? (
                      <div className="space-y-2">
                        {filteredInvoices.map((invoice) => (
                          <div
                            key={invoice.id}
                            className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                              selectedItem?.id === invoice.id ? "border-teal-500 bg-teal-50" : ""
                            }`}
                            onClick={() => handleItemSelect(invoice)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <p className="font-medium">{invoice.invoiceNumber}</p>
                                  <p className="text-sm text-gray-500">{invoice.vendorName}</p>
                                </div>
                                <div>
                                  <p className="text-sm">{invoice.purchaseOrderNumber}</p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium">${formatNumber(invoice.total)}</p>
                                  <div className="flex items-center space-x-1">
                                    {invoice.matched ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className="text-sm text-gray-500">
                                      {invoice.matched ? "Matched" : "Unmatched"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <StatusBadge status={invoice.status} />
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {invoice.confidence}%
                                </Badge>
                                {invoice.issues && invoice.issues.length > 0 && (
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>PO #</TableHead>
                            <TableHead>Date Received</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Matched</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInvoices.map((invoice) => (
                            <TableRow
                              key={invoice.id}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleItemSelect(invoice)}
                            >
                              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                              <TableCell>{invoice.vendorName}</TableCell>
                              <TableCell>{invoice.purchaseOrderNumber}</TableCell>
                              <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                              <TableCell>${formatNumber(invoice.total)}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  {invoice.matched ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className="text-sm">{invoice.matched ? "Yes" : "No"}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={invoice.status} />
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {invoice.confidence}%
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleItemSelect(invoice)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  <TabsContent value="receipts" className="space-y-4">
                    {/* Receipt Filters */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Select value={receiptDateRange} onValueChange={setReceiptDateRange}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Date range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All dates</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This week</SelectItem>
                          <SelectItem value="month">This month</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={receiptVendor} onValueChange={setReceiptVendor}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All vendors</SelectItem>
                          <SelectItem value="TechSupplier">TechSupplier</SelectItem>
                          <SelectItem value="Office Supplies Inc">Office Supplies Inc</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={receiptStatus} onValueChange={setReceiptStatus}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All status</SelectItem>
                            <SelectItem value="unmatched">Unmatched</SelectItem>
                            <SelectItem value="matched">Matched</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                    {/* Receipt List/Table */}
                    {filteredReceipts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No receipts found.</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Receipt #</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Date Received</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReceipts.map((receipt) => (
                            <TableRow
                              key={receipt.id}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleItemSelect(receipt)}
                            >
                              <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
                              <TableCell>{receipt.vendor}</TableCell>
                              <TableCell>{new Date(receipt.dateReceived).toLocaleDateString()}</TableCell>
                              <TableCell>{receipt.quantity}</TableCell>
                              <TableCell>
                                <StatusBadge status={receipt.status} />
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {receipt.confidence}%
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleItemSelect(receipt)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  <TabsContent value="vendors" className="space-y-4">
                    {vendorView === "list" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Input
                            placeholder="Search vendors..."
                            value={vendorSearchTerm}
                            onChange={(e) => setVendorSearchTerm(e.target.value)}
                            className="max-w-sm"
                          />
                          <Button onClick={() => setVendorView("create")} className="bg-teal-600 hover:bg-teal-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Vendor
                          </Button>
                        </div>
                        {loadingVendors ? (
                          <div className="text-center py-8">Loading vendors...</div>
                        ) : errorVendors ? (
                          <div className="text-center py-8 text-red-500">{errorVendors}</div>
                        ) : vendors.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">No vendors found.</div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Vendor Number</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Region</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {vendors.map((vendor) => (
                                <TableRow key={vendor.vendor_id}>
                                  <TableCell className="font-medium">{vendor.vendor_id}</TableCell>
                                  <TableCell>{vendor.name}</TableCell>
                                  <TableCell>{vendor.category || "N/A"}</TableCell>
                                  <TableCell>{vendor.region || "N/A"}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleItemSelect(vendor as VendorResponse)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    )}

                    {vendorView === "create" && (
                      <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h1 className="text-2xl font-bold tracking-tight">Add New Vendor</h1>
                            <p className="text-muted-foreground">Enter details for the new vendor.</p>
                          </div>
                        </div>

                        <Card>
                          <CardHeader>
                            <CardTitle>Vendor Details</CardTitle>
                            <CardDescription>Fill in the information for the new vendor.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Input
                              placeholder="Vendor Name"
                              value={newVendor.name}
                              onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                            />
                            <Input
                              placeholder="Category (Optional)"
                              value={newVendor.category}
                              onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                            />
                            <Input
                              placeholder="Region (Optional)"
                              value={newVendor.region}
                              onChange={(e) => setNewVendor({ ...newVendor, region: e.target.value })}
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setVendorView("list")}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveVendor} disabled={loadingVendors}>
                                {loadingVendors ? "Saving..." : "Save Vendor"}
                                </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {vendorView === "details" && selectedVendor && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold">{selectedVendor.name}</h3>
                          <div className="flex space-x-2">
                            <Button variant="outline" onClick={handleCloseVendorDetailPanel}>
                              Back to List
                            </Button>
                            <Button onClick={() => setIsEditingVendor(true)} className="bg-teal-600 hover:bg-teal-700">
                              Edit
                            </Button>
                            <Button variant="destructive" onClick={() => handleDeleteVendor(selectedVendor.vendor_id)}>
                              Delete
                            </Button>
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Vendor ID</Label>
                            <p className="font-medium">{selectedVendor.vendor_id}</p>
                          </div>
                          <div>
                            <Label>Name</Label>
                            <p className="font-medium">{selectedVendor.name}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Category</Label>
                            <p>{selectedVendor.category || "N/A"}</p>
                          </div>
                          <div>
                            <Label>Region</Label>
                            <p>{selectedVendor.region || "N/A"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Created At</Label>
                            <p>{new Date(selectedVendor.created_at).toLocaleString()}</p>
                          </div>
                          <div>
                            <Label>Updated At</Label>
                            <p>{new Date(selectedVendor.updated_at).toLocaleString()}</p>
                          </div>
                        </div>

                        {isEditingVendor && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Edit Vendor</CardTitle>
                              <CardDescription>Update vendor details.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <Input
                                placeholder="Vendor Name"
                                value={selectedVendor.name}
                                onChange={(e) => setSelectedVendor({ ...selectedVendor, name: e.target.value })}
                              />
                              <Input
                                placeholder="Category (Optional)"
                                value={selectedVendor.category || ""}
                                onChange={(e) => setSelectedVendor({ ...selectedVendor, category: e.target.value })}
                              />
                              <Input
                                placeholder="Region (Optional)"
                                value={selectedVendor.region || ""}
                                onChange={(e) => setSelectedVendor({ ...selectedVendor, region: e.target.value })}
                              />
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsEditingVendor(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleUpdateVendor} disabled={loadingVendors}>
                                  {loadingVendors ? "Saving..." : "Save Changes"}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          {/* Detail Panel - Conditional */}
          {showDetailPanel && (
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {selectedItem
                        ? activeTab === "invoices"
                          ? `Invoice: ${(selectedItem as APInvoice).invoiceNumber}`
                          : `Receipt: ${(selectedItem as APReceipt).receiptNumber}`
                        : "Select an item"}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={handleCloseDetailPanel} className="h-6 w-6">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedItem && (
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {activeTab === "invoices"
                                ? (selectedItem as APInvoice).vendorName
                                : (selectedItem as APReceipt).vendor}
                            </p>
                            <StatusBadge
                              status={
                                activeTab === "invoices"
                                  ? (selectedItem as APInvoice).status
                                  : (selectedItem as APReceipt).status
                              }
                            />
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {selectedItem.confidence}% confidence
                          </Badge>
                        </div>

                        <Separator />

                        {/* Document Viewer */}
                        <div>
                          <h3 className="font-medium mb-2">Document Viewer</h3>
                          <PdfViewer
                            pdfUrl={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            pageNumber={pageNumber}
                            numPages={numPages}
                            setPageNumber={setPageNumber}
                            isLoading={isPdfLoading}
                          />
                        </div>

                        {activeTab === "invoices" && (
                          <>
                            {/* Extracted Fields */}
                            <div>
                              <h3 className="font-medium mb-2">Extracted Fields</h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">PO Number:</span>
                                  <span>{(selectedItem as APInvoice).purchaseOrderNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Date:</span>
                                  <span>{new Date((selectedItem as APInvoice).invoiceDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Amount:</span>
                                  <span>${formatNumber((selectedItem as APInvoice).total)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Matching Info */}
                            <div>
                              <h3 className="font-medium mb-2">Matching Information</h3>
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  {(selectedItem as APInvoice).matched ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className="text-sm">
                                    {(selectedItem as APInvoice).matched ? "Matched to PO" : "No PO match found"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Exceptions */}
                            {(selectedItem as APInvoice).issues &&
                              (selectedItem as APInvoice).issues.length > 0 && (
                                <div>
                                  <h3 className="font-medium mb-2">Issues</h3>
                                  <div className="space-y-2">
                                    {(selectedItem as APInvoice).issues.map((issue: string, index: number) => (
                                      <div
                                        key={index}
                                        className="flex items-center space-x-2 p-2 bg-amber-50 rounded-lg"
                                      >
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        <span className="text-sm text-amber-700">{issue}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {/* Actions */}
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(selectedItem.id)}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleReject(selectedItem.id)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                              <Button size="sm" variant="outline">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Comment
                              </Button>
                            </div>
                          </>
                        )}

                        {activeTab === "receipts" && (
                          <>
                            {/* Receipt Fields */}
                            <div>
                              <h3 className="font-medium mb-2">Receipt Details</h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Date Received:</span>
                                  <span>{new Date((selectedItem as APReceipt).dateReceived).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Quantity:</span>
                                  <span>{(selectedItem as APReceipt).quantity}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Matched Invoice:</span>
                                  <span>{(selectedItem as APReceipt).matchedInvoice ? "Yes" : "No"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Match Suggestions */}
                            <div>
                              <h3 className="font-medium mb-2">Match Suggestions</h3>
                              <div className="space-y-2">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">INV-12345 - TechSupplier</span>
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                      95% match
                                    </Badge>
                                  </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">INV-12346 - TechSupplier</span>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                      78% match
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                className="bg-teal-600 hover:bg-teal-700"
                                onClick={() => handleAutoMatch(selectedItem.id)}
                              >
                                <Zap className="mr-2 h-4 w-4" />
                                Auto-Match
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleFlagForReview(selectedItem.id)}>
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Flag for Review
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

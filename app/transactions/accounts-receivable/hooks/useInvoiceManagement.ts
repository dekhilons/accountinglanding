import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  useInvoices,
  type Invoice,
  type InvoiceCreate,
} from "@/lib/ar-api"
import { InvoiceView } from "../types/ar-specific-types"

export const useInvoiceManagement = () => {
  const { toast } = useToast()

  const [invoiceView, setInvoiceView] = useState<InvoiceView>("list")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [newInvoice, setNewInvoice] = useState<InvoiceCreate>({
    invoice_number: "",
    customer_id: "",
    amount: 0,
    tax_amount: 0,
    currency: "USD",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: new Date().toISOString().split("T")[0],
    tenant_id: "",
    metadata: {},
  })
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState("")
  const [invoiceFilterCustomer, setInvoiceFilterCustomer] = useState("all")
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState("all")

  const {
    invoices,
    loading: invoicesLoading,
    error: invoicesError,
    create: createInvoice,
    update: updateInvoice,
    delete: deleteInvoice,
    refetch: refetchInvoices,
  } = useInvoices()

  const handleSaveInvoice = async () => {
    if (!newInvoice.invoice_number || !newInvoice.customer_id || newInvoice.amount <= 0 || !newInvoice.issue_date || !newInvoice.due_date || !newInvoice.tenant_id) {
      toast({
        title: "Error",
        description: "Invoice Number, Customer ID, Amount, Issue Date, Due Date, and Tenant ID are mandatory.",
        variant: "destructive",
      })
      return
    }

    try {
      if (invoiceView === "create") {
        const createdInvoice = await createInvoice(newInvoice)
        toast({
          title: "Invoice Created",
          description: `Invoice ${newInvoice.invoice_number} has been created successfully.`,
        })
      } else if (invoiceView === "edit" && selectedInvoice) {
        const updatedInvoice = await updateInvoice(selectedInvoice.id, newInvoice)
        toast({
          title: "Invoice Updated",
          description: `Invoice ${newInvoice.invoice_number} has been updated successfully.`,
        })
      }

      setNewInvoice({
        invoice_number: "",
        customer_id: "",
        amount: 0,
        tax_amount: 0,
        currency: "USD",
        issue_date: new Date().toISOString().split("T")[0],
        due_date: new Date().toISOString().split("T")[0],
        tenant_id: "",
        metadata: {},
      })
      setInvoiceView("list")
      setSelectedInvoice(null)
      refetchInvoices() // Refetch invoices after save
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleEditInvoice = () => {
    if (selectedInvoice) {
      setNewInvoice(selectedInvoice)
      setInvoiceView("edit")
    }
  }

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await deleteInvoice(id)
        setInvoiceView("list")
        setSelectedInvoice(null)
        toast({
          title: "Invoice Deleted",
          description: "The invoice has been deleted.",
        })
        refetchInvoices() // Refetch invoices after delete
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete invoice.",
          variant: "destructive",
        })
      }
    }
  }

  const filteredInvoices = invoices.filter(inv =>
    (invoiceSearchTerm === "" || inv.invoice_number.toLowerCase().includes(invoiceSearchTerm.toLowerCase())) &&
    (invoiceFilterCustomer === "all" || inv.customer_id === invoiceFilterCustomer) &&
    (invoiceFilterStatus === "all" || inv.status === invoiceFilterStatus)
  )

  return {
    invoiceView,
    setInvoiceView,
    selectedInvoice,
    setSelectedInvoice,
    newInvoice,
    setNewInvoice,
    invoiceSearchTerm,
    setInvoiceSearchTerm,
    invoiceFilterCustomer,
    setInvoiceFilterCustomer,
    invoiceFilterStatus,
    setInvoiceFilterStatus,
    invoices,
    invoicesLoading,
    invoicesError,
    filteredInvoices,
    handleSaveInvoice,
    handleEditInvoice,
    handleDeleteInvoice,
    refetchInvoices,
  }
}

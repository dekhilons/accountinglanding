import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  useSalesOrders,
  type SalesOrder,
  type SalesOrderCreate,
  type CreditDecisionRequest,
  type InvoiceGenerationRequest,
} from "@/lib/ar-api"

export const useSalesOrderManagement = () => {
  const { toast } = useToast()

  const [salesOrderView, setSalesOrderView] = useState<"list" | "create" | "details">("list")
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [newSalesOrder, setNewSalesOrder] = useState<SalesOrderCreate>({
    tenant_id: "",
    customer_id: "",
    order_date: new Date().toISOString(),
    requested_delivery_date: "",
    payment_terms: "Net 30",
    order_lines: [],
    notes: "",
  })
  const [creditDecision, setCreditDecision] = useState<CreditDecisionRequest>({
    decision: "",
    notes: "",
  })
  const [invoiceGeneration, setInvoiceGeneration] = useState<InvoiceGenerationRequest>({
    template_id: "",
    payment_terms: "",
  })

  const {
    orders: salesOrders,
    loading: salesOrdersLoading,
    error: salesOrdersError,
    refetch: refetchSalesOrders,
    create: createSalesOrder,
    makeCreditDecision,
    generateInvoice,
  } = useSalesOrders("test-tenant")

  const handleCreateSalesOrder = async () => {
    // Calculate total amount and tax amount for the sales order
    const totalAmount = newSalesOrder.order_lines.reduce((sum, line) => {
        const lineTotal = (line.quantity || 0) * (line.unit_price || 0);
        const taxRateDecimal = (line.tax_rate || 0) / 100; // Convert percentage to decimal
        const taxAmount = lineTotal * taxRateDecimal;
        return sum + lineTotal + taxAmount;
    }, 0);

    const totalTaxAmount = newSalesOrder.order_lines.reduce((sum, line) => {
        const lineTotal = (line.quantity || 0) * (line.unit_price || 0);
        const taxRateDecimal = (line.tax_rate || 0) / 100; // Convert percentage to decimal
        return sum + (lineTotal * taxRateDecimal);
    }, 0);

    // Update newSalesOrder with calculated totals and a dummy order_number
    const salesOrderToCreate = {
        ...newSalesOrder,
        total_amount: totalAmount,
        tax_amount: totalTaxAmount,
        order_number: `SO-${Date.now()}`, // Generate a unique order number
    };

    if (
      !salesOrderToCreate.tenant_id ||
      !salesOrderToCreate.customer_id ||
      salesOrderToCreate.order_lines.length === 0 ||
      (salesOrderToCreate.order_lines[0].description === '' || salesOrderToCreate.order_lines[0].quantity <= 0 || salesOrderToCreate.order_lines[0].unit_price <= 0)
    ) {
        toast({
            title: "Error",
            description: "Tenant ID, Customer, and at least one complete Order Line (Description, Quantity, Unit Price) are mandatory fields.",
            variant: "destructive",
        });
        return;
    }

    try {
        await createSalesOrder(salesOrderToCreate);
        toast({
            title: "Sales Order Created",
            description: `Sales Order ${salesOrderToCreate.order_number} has been created successfully.`,
        });
        setNewSalesOrder({
            tenant_id: "",
            customer_id: "",
            order_date: new Date().toISOString(),
            requested_delivery_date: "",
            payment_terms: "Net 30",
            order_lines: [],
            notes: "",
        });
        setSalesOrderView("list");
        refetchSalesOrders(); // Refetch sales orders after creation
    } catch (error: any) {
        toast({
            title: "Error",
            description: error.message || "Failed to create sales order.",
            variant: "destructive",
        });
    }
  }

  return {
    salesOrderView,
    setSalesOrderView,
    selectedOrder,
    setSelectedOrder,
    newSalesOrder,
    setNewSalesOrder,
    creditDecision,
    setCreditDecision,
    invoiceGeneration,
    setInvoiceGeneration,
    salesOrders,
    salesOrdersLoading,
    salesOrdersError,
    refetchSalesOrders,
    handleCreateSalesOrder,
    makeCreditDecision,
    generateInvoice,
  }
}

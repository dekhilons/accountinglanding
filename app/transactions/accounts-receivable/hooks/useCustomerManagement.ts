import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  useCustomers,
  type Customer,
  type CustomerCreate,
} from "@/lib/ar-api"
import { CustomerView } from "../types/ar-specific-types"

export const useCustomerManagement = () => {
  const { toast } = useToast()

  const [customerView, setCustomerView] = useState<CustomerView>("list")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState<CustomerCreate>({
    customer_number: "",
    name: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    payment_terms: 30,
    credit_limit: 0,
    is_active: true,
    tenant_id: "",
    additional_metadata: {},
  })
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")

  const {
    customers,
    loading: customersLoading,
    error: customersError,
    create: createCustomer,
    update: updateCustomer,
    delete: deleteCustomer,
    refetch: refetchCustomers,
  } = useCustomers()

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      (customer.customer_number?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ?? false) ||
      (customer.contact_email?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ?? false),
  )

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      // Ensure null values are converted to appropriate defaults for form inputs
      const customerForEdit = {
        ...selectedCustomer,
        payment_terms: selectedCustomer.payment_terms ?? 30,
        credit_limit: selectedCustomer.credit_limit ?? 0,
      }
      setNewCustomer(customerForEdit)
      setCustomerView("edit")
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete customer ${selectedCustomer?.name}?`)) {
      try {
        await deleteCustomer(id)
        setCustomerView("list")
        setSelectedCustomer(null)
        toast({
          title: "Customer Deleted",
          description: `Customer ${selectedCustomer?.name} has been deleted.`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete customer.",
          variant: "destructive",
        })
      }
    }
  }

  const handleSaveCustomer = async () => {
    if (!newCustomer.customer_number || !newCustomer.name || !newCustomer.tenant_id) {
      toast({
        title: "Error",
        description: "Customer Number, Name, and Tenant ID are mandatory fields.",
        variant: "destructive",
      })
      return
    }

    try {
      if (customerView === "create") {
        const createdCustomer = await createCustomer(newCustomer)
        toast({
          title: "Customer Created",
          description: `Customer ${newCustomer.name} (${newCustomer.customer_number}) has been created successfully.`,
        })
      } else if (customerView === "edit" && selectedCustomer) {
        const updatedCustomer = await updateCustomer(selectedCustomer.id, newCustomer)
        toast({
          title: "Customer Updated",
          description: `Customer ${newCustomer.name} (${newCustomer.customer_number}) has been updated successfully.`,
        })
      }

      setNewCustomer({
        customer_number: "",
        name: "",
        address: "",
        contact_email: "",
        contact_phone: "",
        payment_terms: 30,
        credit_limit: 0,
        is_active: true,
        tenant_id: "",
        additional_metadata: {},
      })
      setCustomerView("list")
      setSelectedCustomer(null)
      refetchCustomers() // Refetch customers after save
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  return {
    customerView,
    setCustomerView,
    selectedCustomer,
    setSelectedCustomer,
    newCustomer,
    setNewCustomer,
    customerSearchTerm,
    setCustomerSearchTerm,
    customers,
    customersLoading,
    customersError,
    filteredCustomers,
    handleEditCustomer,
    handleDeleteCustomer,
    handleSaveCustomer,
    refetchCustomers,
  }
}

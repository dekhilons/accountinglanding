/**
 * Accounts Receivable API Integration Layer
 *
 * This module provides a comprehensive API integration layer for the Accounts Receivable service.
 * It handles all CRUD operations for customers, invoices, and payments, along with advanced
 * features like payment classification, reconciliation, and matching.
 */

import { useState, useEffect } from 'react';

// Base API configuration
const BASE_URL = process.env.NEXT_PUBLIC_AR_API_URL || 'http://localhost:8003';

// Type definitions based on backend schemas
export interface Customer {
  id: string;
  tenant_id: string;
  customer_number?: string;
  name: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  payment_terms?: number;
  credit_limit?: number;
  is_active: boolean;
  additional_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreate {
  tenant_id: string;
  customer_number?: string;
  name: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  payment_terms?: number;
  credit_limit?: number;
  is_active?: boolean;
  additional_metadata?: Record<string, any>;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  customer_id: string;
  amount: number;
  tax_amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  status: 'OPEN' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
  description?: string;
  document_path?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface InvoiceCreate {
  tenant_id: string;
  invoice_number: string;
  customer_id: string;
  amount: number;
  tax_amount?: number;
  currency?: string;
  issue_date: string;
  due_date: string;
  description?: string;
  document_path?: string;
  metadata?: Record<string, any>;
}

export interface Payment {
  id: string;
  tenant_id: string;
  payment_number: string;
  customer_id?: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  description?: string;
  status: 'RECEIVED' | 'RECONCILED' | 'FAILED' | 'REFUNDED';
  is_reconciled: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentCreate {
  tenant_id: string;
  payment_number: string;
  customer_id?: string;
  amount: number;
  currency?: string;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  description?: string;
  status?: string;
  is_reconciled?: boolean;
  metadata?: Record<string, any>;
}

export interface PaymentMatchResult {
  payment_id: string;
  payment_number: string;
  payment_amount: number;
  payment_date: string;
  match_type: 'EXACT' | 'PARTIAL' | 'MULTIPLE' | 'NO_MATCH';
  candidates: PaymentMatchCandidate[];
  tenant_id: string;
}

export interface PaymentMatchCandidate {
  invoice_id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  match_score: number;
  match_reason: string;
}

export interface InvoicePaymentCreate {
  tenant_id: string;
  invoice_id: string;
  payment_id: string;
  amount: number;
  currency?: string;
  is_auto_matched?: boolean;
  confidence_score?: number;
  metadata?: Record<string, any>;
}

// Aging Report interfaces
export interface AgingBucket {
  bucket_name: string;
  total_amount: number;
  invoice_count: number;
  invoices: any[]; // You might want to define a more specific type for invoices if needed
}

export interface AgingReport {
  customer_id: string | null;
  customer_name: string | null;
  total_outstanding: number;
  total_overdue: number;
  buckets: AgingBucket[];
  report_date: string;
  tenant_id: string;
  customer_breakdown?: CustomerAging[];
}

export interface CustomerAging {
  customer_id: string;
  customer_name: string;
  total_outstanding: number;
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
}

// Collections interfaces
export interface CollectionCase {
  id: string;
  case_number: string;
  customer_id: string;
  total_outstanding: number;
  currency: string;
  case_status: string;
  priority: string;
  assigned_to?: string;
  opened_date: string;
  last_contact_date?: string;
  next_action_date?: string;
  resolution_date?: string;
  resolution_type?: string;
  notes?: string;
  created_at: string;
}

export interface CollectionActivity {
  id: string;
  collection_case_id: string;
  activity_type: string;
  activity_date: string;
  performed_by: string;
  description: string;
  outcome?: string;
  next_action?: string;
  next_action_date?: string;
  amount_discussed?: number;
  amount_promised?: number;
  promise_date?: string;
}

export interface PaymentPlan {
  id: string;
  plan_number: string;
  customer_id: string;
  total_amount: number;
  installment_amount: number;
  installment_frequency: string;
  number_of_installments: number;
  start_date: string;
  end_date: string;
  status: string;
  payments_made: number;
  amount_paid: number;
  next_payment_date?: string;
}

export interface CollectionCaseCreate {
  customer_id: string;
  priority?: string;
  notes?: string;
}

export interface CollectionActivityCreate {
  activity_type: string;
  description: string;
  outcome?: string;
  next_action?: string;
  next_action_date?: string;
  amount_discussed?: number;
  amount_promised?: number;
  promise_date?: string;
}

export interface PaymentPlanCreate {
  total_amount: number;
  installment_amount: number;
  installment_frequency?: string;
  number_of_installments: number;
  start_date: string;
  end_date: string;
}

// Credit Management interfaces
export interface CreditLimit {
  id: string;
  customer_id: string;
  credit_limit: number;
  available_credit: number;
  utilized_credit: number;
  currency: string;
  effective_date: string;
  expiry_date?: string;
  status: string;
  last_review_date?: string;
  next_review_date?: string;
  risk_rating?: string;
  created_at: string;
}

export interface CreditAssessment {
  id: string;
  customer_id: string;
  sales_order_id?: string;
  assessment_type: string;
  requested_amount: number;
  assessment_date: string;
  decision: string;
  approved_amount: number;
  risk_score?: number;
  decision_factors: Record<string, any>;
  model_version?: string;
  assessed_by: string;
  notes?: string;
  created_at: string;
}

export interface CreditLimitUpdate {
  credit_limit: number;
  expiry_date?: string;
  risk_rating?: string;
  notes?: string;
}

export interface CreditAssessmentRequest {
  assessment_type: string;
  requested_amount: number;
  notes?: string;
}

// Sales Orders interfaces
export interface SalesOrderLine {
  line_number: number;
  product_code?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  order_date: string;
  total_amount: number;
  tax_amount: number;
  currency: string;
  payment_terms: string;
  status: string;
  credit_status: string;
  approval_date?: string;
  created_at: string;
  order_lines: SalesOrderLine[];
  notes?: string;
  // Fulfillment fields
  fulfillment_status?: 'PENDING' | 'IN_PROGRESS' | 'FULFILLED' | 'SHIPPED' | 'DELIVERED';
  requested_delivery_date?: string; // Add this line
  fulfillment_date?: string;
  tracking_number?: string;
  carrier?: string;
  shipping_address?: string;
  delivery_date?: string;
  fulfillment_notes?: string;
}

export interface SalesOrderCreate {
  tenant_id: string;
  customer_id: string;
  order_date?: string;
  requested_delivery_date?: string;
  payment_terms?: string;
  order_lines: SalesOrderLine[];
  notes?: string;
}

export interface CreditDecisionRequest {
  decision: string;
  notes?: string;
}

export interface InvoiceGenerationRequest {
  template_id?: string;
  payment_terms?: string;
}

// Fulfillment interfaces
export interface FulfillmentUpdateRequest {
  fulfillment_status: 'PENDING' | 'IN_PROGRESS' | 'FULFILLED' | 'SHIPPED' | 'DELIVERED';
  fulfillment_date?: string;
  tracking_number?: string;
  carrier?: string;
  shipping_address?: string;
  delivery_date?: string;
  fulfillment_notes?: string;
}

export interface FulfillmentResponse {
  success: boolean;
  order_id: string;
  fulfillment_status: string;
  message: string;
}

// API Error handling
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Generic API fetch wrapper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}

// Customer API functions
export const customerAPI = {
  // Create a new customer
  async create(customer: CustomerCreate): Promise<Customer> {
    return apiRequest<Customer>('/api/v1/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },

  // List customers with optional filtering
  async list(tenant_id?: string): Promise<Customer[]> {
    const params = tenant_id ? `?tenant_id=${tenant_id}` : '';
    return apiRequest<Customer[]>(`/api/v1/customers${params}`);
  },

  // Get customer by ID
  async get(customer_id: string): Promise<Customer> {
    return apiRequest<Customer>(`/api/v1/customers/${customer_id}`);
  },

  // Update customer
  async update(customer_id: string, customer: CustomerCreate): Promise<Customer> {
    return apiRequest<Customer>(`/api/v1/customers/${customer_id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  },

  // Delete customer
  async delete(customer_id: string): Promise<void> {
    await apiRequest(`/api/v1/customers/${customer_id}`, {
      method: 'DELETE',
    });
  },
};

// Invoice API functions
export const invoiceAPI = {
  // Create a new invoice
  async create(invoice: InvoiceCreate): Promise<Invoice> {
    return apiRequest<Invoice>('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    });
  },

  // Get invoice by ID
  async get(invoice_id: string): Promise<Invoice> {
    return apiRequest<Invoice>(`/api/v1/invoices/${invoice_id}`);
  },

  // Get invoices for a customer
  async getByCustomer(customer_id: string, status?: string): Promise<Invoice[]> {
    const params = status ? `?status=${status}` : '';
    return apiRequest<Invoice[]>(`/api/v1/invoices/by_customer/${customer_id}${params}`);
  },

  // Update invoice
  async update(invoice_id: string, invoice: InvoiceCreate): Promise<Invoice> {
    return apiRequest<Invoice>(`/api/v1/invoices/${invoice_id}`, {
      method: 'PUT',
      body: JSON.stringify(invoice),
    });
  },

  // Delete invoice
  async delete(invoice_id: string): Promise<void> {
    await apiRequest(`/api/v1/invoices/${invoice_id}`, {
      method: 'DELETE',
    });
  },
};

// Payment API functions
export const paymentAPI = {
  // Create a new payment
  async create(payment: PaymentCreate): Promise<Payment> {
    return apiRequest<Payment>('/api/v1/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  },

  // List payments with optional filtering
  async list(tenant_id?: string, status?: string): Promise<Payment[]> {
    const params = new URLSearchParams();
    if (tenant_id) params.append('tenant_id', tenant_id);
    if (status) params.append('status', status);
    const queryString = params.toString();
    return apiRequest<Payment[]>(`/api/v1/payments${queryString ? `?${queryString}` : ''}`);
  },

  // Get payment by ID (includes applied invoices)
  async get(payment_id: string): Promise<Payment & { applied_invoices?: any[] }> {
    return apiRequest<Payment & { applied_invoices?: any[] }>(`/api/v1/payments/${payment_id}`);
  },

  // Get payments for a customer
  async getByCustomer(customer_id: string, status?: string): Promise<Payment[]> {
    const params = status ? `?status=${status}` : '';
    return apiRequest<Payment[]>(`/api/v1/payments/by_customer/${customer_id}${params}`);
  },

  // Update payment
  async update(payment_id: string, payment: PaymentCreate): Promise<Payment> {
    return apiRequest<Payment>(`/api/v1/payments/${payment_id}`, {
      method: 'PUT',
      body: JSON.stringify(payment),
    });
  },

  // Delete payment
  async delete(payment_id: string): Promise<void> {
    await apiRequest(`/api/v1/payments/${payment_id}`, {
      method: 'DELETE',
    });
  },

  // Classify payment and match to invoices
  async classify(payment_id: string): Promise<PaymentMatchResult> {
    return apiRequest<PaymentMatchResult>(`/api/v1/payments/${payment_id}/classify`, {
      method: 'POST',
    });
  },

  // Get payment classification
  async getClassification(payment_id: string): Promise<any> {
    return apiRequest(`/api/v1/payments/${payment_id}/classification`);
  },

  // Reconcile payment with invoice
  async reconcile(payment_id: string, reconciliation: InvoicePaymentCreate): Promise<any> {
    return apiRequest(`/api/v1/payments/${payment_id}/reconcile`, {
      method: 'POST',
      body: JSON.stringify(reconciliation),
    });
  },

  // Approve payment match
  async approveMatch(payment_id: string): Promise<Payment> {
    return apiRequest<Payment>(`/api/v1/payments/${payment_id}/approve_match`, {
      method: 'POST',
    });
  },

  // Reject payment
  async reject(payment_id: string): Promise<Payment> {
    return apiRequest<Payment>(`/api/v1/payments/${payment_id}/reject`, {
      method: 'POST',
    });
  },

  // Apply remaining payment balance
  async applyRemaining(payment_id: string, invoice_allocations: any[]): Promise<Payment> {
    return apiRequest<Payment>(`/api/v1/payments/${payment_id}/apply_remaining`, {
      method: 'POST',
      body: JSON.stringify({ invoice_allocations }),
    });
  },

  // Send payment reminder
  async sendReminder(payment_id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/v1/payments/${payment_id}/send_reminder`, {
      method: 'POST',
    });
  },
};

// Aging Reports API functions
export const agingAPI = {
  // Get aging report
  async getReport(tenant_id: string, customer_id?: string): Promise<AgingReport> {
    const params = customer_id ? `?customer_id=${customer_id}` : '';
    return apiRequest<AgingReport>(`/v1/aging?tenant_id=${tenant_id}${params}`);
  },
};

// Collections API functions
export const collectionsAPI = {
  // List collection cases
  async listCases(
    tenant_id: string,
    customer_id?: string,
    status?: string,
    priority?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<CollectionCase[]> {
    const params = new URLSearchParams({
      tenant_id,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (customer_id) params.append('customer_id', customer_id);
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);

    return apiRequest<CollectionCase[]>(`/collections/cases?${params.toString()}`);
  },

  // Get collection case by ID
  async getCase(case_id: string, tenant_id: string): Promise<CollectionCase> {
    return apiRequest<CollectionCase>(`/collections/cases/${case_id}?tenant_id=${tenant_id}`);
  },

  // Create collection case
  async createCase(case_data: CollectionCaseCreate, tenant_id: string): Promise<CollectionCase> {
    return apiRequest<CollectionCase>('/collections/cases', {
      method: 'POST',
      body: JSON.stringify({ ...case_data, tenant_id }),
    });
  },

  // Process overdue accounts
  async processOverdue(tenant_id: string): Promise<any> {
    return apiRequest('/collections/process-overdue', {
      method: 'POST',
      body: JSON.stringify({ tenant_id }),
    });
  },

  // Execute dunning sequence
  async executeDunning(tenant_id: string, case_id?: string): Promise<any> {
    const body: any = { tenant_id };
    if (case_id) body.case_id = case_id;

    return apiRequest('/collections/execute-dunning', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Get case activities
  async getCaseActivities(
    case_id: string,
    tenant_id: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<CollectionActivity[]> {
    const params = new URLSearchParams({
      tenant_id,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return apiRequest<CollectionActivity[]>(
      `/collections/cases/${case_id}/activities?${params.toString()}`
    );
  },

  // Create collection activity
  async createActivity(
    case_id: string,
    activity_data: CollectionActivityCreate,
    tenant_id: string,
    user_id: string
  ): Promise<CollectionActivity> {
    return apiRequest<CollectionActivity>(`/collections/cases/${case_id}/activities`, {
      method: 'POST',
      body: JSON.stringify({ ...activity_data, tenant_id, user_id }),
    });
  },

  // Create payment plan
  async createPaymentPlan(
    case_id: string,
    plan_data: PaymentPlanCreate,
    tenant_id: string
  ): Promise<PaymentPlan> {
    return apiRequest<PaymentPlan>(`/collections/cases/${case_id}/payment-plan`, {
      method: 'POST',
      body: JSON.stringify({ ...plan_data, tenant_id }),
    });
  },

  // List dunning rules
  async listDunningRules(tenant_id: string, is_active?: boolean): Promise<any[]> {
    const params = is_active !== undefined ? `?is_active=${is_active}` : '';
    return apiRequest<any[]>(`/collections/dunning-rules?tenant_id=${tenant_id}${params}`);
  },
};

// Credit Management API functions
export const creditAPI = {
  // List credit limits
  async listLimits(
    tenant_id: string,
    customer_id?: string,
    status?: string,
    risk_rating?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<CreditLimit[]> {
    const params = new URLSearchParams({
      tenant_id,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (customer_id) params.append('customer_id', customer_id);
    if (status) params.append('status', status);
    if (risk_rating) params.append('risk_rating', risk_rating);

    return apiRequest<CreditLimit[]>(`/credit/limits?${params.toString()}`);
  },

  // Get customer credit limit
  async getLimit(customer_id: string, tenant_id: string): Promise<CreditLimit> {
    return apiRequest<CreditLimit>(`/credit/limits/${customer_id}?tenant_id=${tenant_id}`);
  },

  // Update credit limit
  async updateLimit(
    customer_id: string,
    limit_data: CreditLimitUpdate,
    tenant_id: string,
    user_id: string
  ): Promise<CreditLimit> {
    return apiRequest<CreditLimit>(`/credit/limits/${customer_id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...limit_data, tenant_id, user_id }),
    });
  },

  // Create credit assessment
  async createAssessment(
    customer_id: string,
    assessment_data: CreditAssessmentRequest,
    tenant_id: string,
    user_id: string
  ): Promise<CreditAssessment> {
    return apiRequest<CreditAssessment>(`/credit/assessments/${customer_id}`, {
      method: 'POST',
      body: JSON.stringify({ ...assessment_data, tenant_id, user_id }),
    });
  },

  // List credit assessments
  async listAssessments(
    tenant_id: string,
    customer_id?: string,
    assessment_type?: string,
    decision?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<CreditAssessment[]> {
    const params = new URLSearchParams({
      tenant_id,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (customer_id) params.append('customer_id', customer_id);
    if (assessment_type) params.append('assessment_type', assessment_type);
    if (decision) params.append('decision', decision);

    return apiRequest<CreditAssessment[]>(`/credit/assessments?${params.toString()}`);
  },

  // Review credit limits
  async reviewLimits(tenant_id: string, customer_id?: string): Promise<any> {
    const body: any = { tenant_id };
    if (customer_id) body.customer_id = customer_id;

    return apiRequest('/credit/review-limits', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};

// Sales Orders API functions
export const salesOrdersAPI = {
  // Create sales order
  async create(order_data: SalesOrderCreate): Promise<SalesOrder> {
    return apiRequest<SalesOrder>('/sales-orders/', {
      method: 'POST',
      body: JSON.stringify(order_data),
    });
  },

  // Get sales order by ID
  async get(order_id: string, tenant_id: string): Promise<SalesOrder> {
    return apiRequest<SalesOrder>(`/sales-orders/${order_id}?tenant_id=${tenant_id}`);
  },

  // List sales orders
  async list(
    tenant_id: string,
    customer_id?: string,
    status?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<SalesOrder[]> {
    const params = new URLSearchParams({
      tenant_id,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (customer_id) params.append('customer_id', customer_id);
    if (status) params.append('status', status);

    return apiRequest<SalesOrder[]>(`/sales-orders/?${params.toString()}`);
  },

  // Make credit decision
  async makeCreditDecision(
    order_id: string,
    decision_data: CreditDecisionRequest,
    tenant_id: string,
    user_id: string
  ): Promise<any> {
    return apiRequest(`/sales-orders/${order_id}/credit-decision`, {
      method: 'POST',
      body: JSON.stringify({ ...decision_data, tenant_id, user_id }),
    });
  },

  // Generate invoice from sales order
  async generateInvoice(
    order_id: string,
    invoice_data: InvoiceGenerationRequest,
    tenant_id: string
  ): Promise<any> {
    return apiRequest(`/sales-orders/${order_id}/generate-invoice`, {
      method: 'POST',
      body: JSON.stringify({ ...invoice_data, tenant_id }),
    });
  },

  // Update fulfillment status
  async updateFulfillment(
    order_id: string,
    fulfillment_data: FulfillmentUpdateRequest,
    tenant_id: string
  ): Promise<FulfillmentResponse> {
    return apiRequest<FulfillmentResponse>(`/sales-orders/${order_id}/fulfillment`, {
      method: 'PUT',
      body: JSON.stringify({ ...fulfillment_data, tenant_id }),
    });
  },

  // Get fulfillment history
  async getFulfillmentHistory(order_id: string, tenant_id: string): Promise<any[]> {
    return apiRequest<any[]>(`/sales-orders/${order_id}/fulfillment-history?tenant_id=${tenant_id}`);
  },
};

// React hooks for API integration
export function useCustomers(tenant_id?: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerAPI.list(tenant_id);
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError(err as APIError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [tenant_id]);

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
    create: async (customer: CustomerCreate) => {
      const newCustomer = await customerAPI.create(customer);
      setCustomers(prev => [...prev, newCustomer]);
      return newCustomer;
    },
    update: async (id: string, customer: CustomerCreate) => {
      const updatedCustomer = await customerAPI.update(id, customer);
      setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
      return updatedCustomer;
    },
    delete: async (id: string) => {
      await customerAPI.delete(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
    },
  };
}

export function useInvoices(customer_id?: string, status?: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = customer_id
        ? await invoiceAPI.getByCustomer(customer_id, status)
        : await apiRequest<Invoice[]>('/api/v1/invoices');
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError(err as APIError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [customer_id, status]);

  return {
    invoices,
    loading,
    error,
    refetch: fetchInvoices,
    create: async (invoice: InvoiceCreate) => {
      const newInvoice = await invoiceAPI.create(invoice);
      setInvoices(prev => [...prev, newInvoice]);
      return newInvoice;
    },
    update: async (id: string, invoice: InvoiceCreate) => {
      const updatedInvoice = await invoiceAPI.update(id, invoice);
      setInvoices(prev => prev.map(i => i.id === id ? updatedInvoice : i));
      return updatedInvoice;
    },
    delete: async (id: string) => {
      await invoiceAPI.delete(id);
      setInvoices(prev => prev.filter(i => i.id !== id));
    },
  };
}

export function usePayments(tenant_id?: string, status?: string) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentAPI.list(tenant_id, status);
      setPayments(data);
      setError(null);
    } catch (err) {
      setError(err as APIError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [tenant_id, status]);

  return {
    payments,
    loading,
    error,
    refetch: fetchPayments,
    create: async (payment: PaymentCreate) => {
      const newPayment = await paymentAPI.create(payment);
      setPayments(prev => [...prev, newPayment]);
      return newPayment;
    },
    update: async (id: string, payment: PaymentCreate) => {
      const updatedPayment = await paymentAPI.update(id, payment);
      setPayments(prev => prev.map(p => p.id === id ? updatedPayment : p));
      return updatedPayment;
    },
    delete: async (id: string) => {
      await paymentAPI.delete(id);
      setPayments(prev => prev.filter(p => p.id !== id));
    },
    classify: (id: string) => paymentAPI.classify(id),
    reconcile: (id: string, reconciliation: InvoicePaymentCreate) =>
      paymentAPI.reconcile(id, reconciliation),
    approveMatch: async (id: string) => {
      const updatedPayment = await paymentAPI.approveMatch(id);
      setPayments(prev => prev.map(p => p.id === id ? updatedPayment : p));
      return updatedPayment;
    },
    reject: async (id: string) => {
      const updatedPayment = await paymentAPI.reject(id);
      setPayments(prev => prev.map(p => p.id === id ? updatedPayment : p));
      return updatedPayment;
    },
    applyRemaining: (id: string, allocations: any[]) =>
      paymentAPI.applyRemaining(id, allocations),
    sendReminder: (id: string) => paymentAPI.sendReminder(id),
  };
}

// React hooks for new APIs
export function useAgingReports(tenant_id?: string) {
  const [agingReport, setAgingReport] = useState<AgingReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const fetchReport = async (customer_id?: string) => {
    if (!tenant_id) return;

    try {
      setLoading(true);
      const report = await agingAPI.getReport(tenant_id, customer_id);
      setAgingReport(report);
      setError(null);
    } catch (err) {
      setError(err as APIError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant_id) {
      fetchReport();
    }
  }, [tenant_id]);

  return {
    agingReport,
    loading,
    error,
    refetch: fetchReport,
  };
}

export function useCollections(tenant_id?: string) {
  const [cases, setCases] = useState<CollectionCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const fetchCases = async (
    customer_id?: string,
    status?: string,
    priority?: string,
    limit: number = 100,
    offset: number = 0
  ) => {
    if (!tenant_id) return;

    try {
      setLoading(true);
      const data = await collectionsAPI.listCases(tenant_id, customer_id, status, priority, limit, offset);
      setCases(data);
      setError(null);
    } catch (err) {
      setError(err as APIError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant_id) {
      fetchCases();
    }
  }, [tenant_id]);

  return {
    cases,
    loading,
    error,
    refetch: fetchCases,
    createCase: async (case_data: CollectionCaseCreate) => {
      const newCase = await collectionsAPI.createCase(case_data, tenant_id!);
      setCases(prev => [...prev, newCase]);
      return newCase;
    },
    processOverdue: () => collectionsAPI.processOverdue(tenant_id!),
    executeDunning: (case_id?: string) => collectionsAPI.executeDunning(tenant_id!, case_id),
  };
}

export function useCreditManagement(tenant_id?: string) {
  const [creditLimits, setCreditLimits] = useState<CreditLimit[]>([]);
  const [assessments, setAssessments] = useState<CreditAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const fetchLimits = async (
    customer_id?: string,
    status?: string,
    risk_rating?: string,
    limit: number = 100,
    offset: number = 0
  ) => {
    if (!tenant_id) return;

    try {
      setLoading(true);
      const data = await creditAPI.listLimits(tenant_id, customer_id, status, risk_rating, limit, offset);
      setCreditLimits(data);
      setError(null);
    } catch (err) {
      setError(err as APIError);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async (
    customer_id?: string,
    assessment_type?: string,
    decision?: string,
    limit: number = 100,
    offset: number = 0
  ) => {
    if (!tenant_id) return;

    try {
      setLoading(true);
      const data = await creditAPI.listAssessments(tenant_id, customer_id, assessment_type, decision, limit, offset);
      setAssessments(data);
      setError(null);
    } catch (err) {
      setError(err as APIError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant_id) {
      fetchLimits();
      fetchAssessments();
    }
  }, [tenant_id]);

  return {
    creditLimits,
    assessments,
    loading,
    error,
    refetchLimits: fetchLimits,
    refetchAssessments: fetchAssessments,
    updateLimit: async (customer_id: string, limit_data: CreditLimitUpdate, user_id: string) => {
      const updatedLimit = await creditAPI.updateLimit(customer_id, limit_data, tenant_id!, user_id);
      setCreditLimits(prev => prev.map(limit =>
        limit.customer_id === customer_id ? updatedLimit : limit
      ));
      return updatedLimit;
    },
    createAssessment: async (customer_id: string, assessment_data: CreditAssessmentRequest, user_id: string) => {
      const newAssessment = await creditAPI.createAssessment(customer_id, assessment_data, tenant_id!, user_id);
      setAssessments(prev => [...prev, newAssessment]);
      return newAssessment;
    },
    reviewLimits: (customer_id?: string) => creditAPI.reviewLimits(tenant_id!, customer_id),
  };
}

export function useSalesOrders(tenant_id?: string) {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const fetchOrders = async (
    customer_id?: string,
    status?: string,
    limit: number = 100,
    offset: number = 0
  ) => {
    if (!tenant_id) return;

    try {
      setLoading(true);
      const data = await salesOrdersAPI.list(tenant_id, customer_id, status, limit, offset);
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err as APIError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant_id) {
      fetchOrders();
    }
  }, [tenant_id]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    create: async (order_data: SalesOrderCreate) => {
      const newOrder = await salesOrdersAPI.create(order_data);
      setOrders(prev => [...prev, newOrder]);
      return newOrder;
    },
    makeCreditDecision: (order_id: string, decision_data: CreditDecisionRequest, user_id: string) =>
      salesOrdersAPI.makeCreditDecision(order_id, decision_data, tenant_id!, user_id),
    generateInvoice: (order_id: string, invoice_data: InvoiceGenerationRequest) =>
      salesOrdersAPI.generateInvoice(order_id, invoice_data, tenant_id!),
    updateFulfillment: (order_id: string, fulfillment_data: FulfillmentUpdateRequest) =>
      salesOrdersAPI.updateFulfillment(order_id, fulfillment_data, tenant_id!),
    getFulfillmentHistory: (order_id: string) =>
      salesOrdersAPI.getFulfillmentHistory(order_id, tenant_id!),
  };
}

// Utility functions
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const calculateDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'paid':
    case 'reconciled':
    case 'auto-applied':
      return 'text-green-600 bg-green-100';
    case 'pending':
    case 'pending-review':
      return 'text-amber-600 bg-amber-100';
    case 'overdue':
    case 'unmatched':
    case 'rejected':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

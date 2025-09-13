// Interfaces for API Payloads and Responses

// ApproveInvoiceRequest
export interface ApproveInvoiceRequest {
  actionId: string;
  overrides?: Record<string, any>;
  userDecision: "APPROVED" | "REJECTED" | "MODIFIED";
}

// ApproveInvoiceResponse
export interface ApproveInvoiceResponse {
  status: string;
  actionId: string;
}

// InvoiceDetailsResponseSchema
export interface InvoiceDetailsResponseSchema {
  action_id: string;
  documentId: string;
  vendorId: string;
  vendorName?: string;
  invoiceNumber: string;
  invoiceDate: string; // Assuming date will be handled as string (ISO 8601)
  lineItems: Record<string, any>[];
  total: number;
  currency: string;
  purchaseOrderNumber?: string;
  status: string;
  document_path?: string; // Added document_path for PDF viewer
  created_at: string; // Assuming datetime will be handled as string (ISO 8601)
  decision_at?: string; // Assuming datetime will be handled as string (ISO 8601)
  decision_by?: string;
  tenant_id: string;
  aiModelVersion?: string;
  anomalyScore?: number;
  extractionModelVersion?: string;
  extractionConfidence?: number;
  issues: string[];
  vendorAvgInvoice?: number;
  vendorInvoiceCount?: number;
  daysSinceLastInvoice?: number;
  poAmount?: number;
  poLineCount?: number;
  is_active?: boolean; // Adding is_active to InvoiceDetailsResponseSchema
}

// DwDimVendorResponseSchema
export interface DwDimVendorResponseSchema {
  vendor_id: string;
  name: string;
  category?: string;
  region?: string;
  created_at: string; // Assuming datetime will be handled as string (ISO 8601)
  updated_at: string; // Assuming datetime will be handled as string (ISO 8601)
  tenant_id: string;
}

// New interfaces for vendor CRUD
export interface CreateVendorRequest {
  name: string;
  category?: string;
  region?: string;
  tenant_id: string;
  vendor_id?: string; // Adding vendor_id as optional for creation
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  payment_terms?: number;
  credit_limit?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateVendorRequest {
  vendor_id: string;
  name?: string;
  category?: string;
  region?: string;
  tenant_id: string; // Assuming tenant_id is always required for updates
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  payment_terms?: number;
  credit_limit?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateInvoiceRequest {
  action_id: string;
  documentId?: string;
  vendorId?: string;
  vendorName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  lineItems?: Record<string, any>[];
  total?: number;
  currency?: string;
  purchaseOrderNumber?: string;
  status?: string;
  tenant_id: string;
  is_active?: boolean;
}

export interface DeleteVendorResponse {
  status: string;
  vendorId: string;
}

// API Functions

const BASE_URL = "http://localhost:8007"; // Assuming a local backend for now

// Endpoint: /mcp/approveInvoice
export async function approveInvoice(
  request: ApproveInvoiceRequest
): Promise<ApproveInvoiceResponse> {
  const response = await fetch(`${BASE_URL}/mcp/approveInvoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("approveInvoice result:", data);
  return data;
}

// Endpoint: /api/ap/invoices
export async function getInvoices(
  tenant_id: string,
  skip: number = 0,
  limit: number = 100
): Promise<InvoiceDetailsResponseSchema[]> {
  const params = new URLSearchParams({
    tenant_id,
    skip: skip.toString(),
    limit: limit.toString(),
  });
  const response = await fetch(`${BASE_URL}/api/ap/invoices?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("getInvoices result:", data);
  return data;
}

// Endpoint: /api/ap/invoices/{action_id}
export async function getInvoiceById(
  action_id: string
): Promise<InvoiceDetailsResponseSchema> {
  const response = await fetch(`${BASE_URL}/api/ap/invoices/${action_id}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("getInvoiceById result:", data);
  return data;
}

// Endpoint: /api/ap/vendors
export async function getVendors(
  tenant_id: string,
  name?: string,
  skip: number = 0,
  limit: number = 100
): Promise<DwDimVendorResponseSchema[]> {
  const params = new URLSearchParams({
    tenant_id,
    skip: skip.toString(),
    limit: limit.toString(),
  });
  if (name) {
    params.append("name", name);
  }
  try {
    const response = await fetch(`${BASE_URL}/api/ap/vendors?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("getVendors result:", data);
    return data;
  } catch (error) {
    console.error("Failed to fetch vendors:", error);
    throw error; // or handle as needed
  }
}

// Endpoint: /api/ap/vendors/{vendor_id}
export async function getVendorById(
  vendor_id: string
): Promise<DwDimVendorResponseSchema> {
  const response = await fetch(`${BASE_URL}/api/ap/vendors/${vendor_id}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("getVendorById result:", data);
  return data;
}

// Endpoint: /api/ap/vendors (POST)
export async function createVendor(
  request: CreateVendorRequest
): Promise<DwDimVendorResponseSchema> {
  const response = await fetch(`${BASE_URL}/api/ap/vendors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("createVendor result:", data);
  return data;
}

// Endpoint: /api/ap/invoices/{action_id} (PUT)
export async function updateInvoice(
  request: UpdateInvoiceRequest
): Promise<InvoiceDetailsResponseSchema> {
  const response = await fetch(`${BASE_URL}/api/ap/invoices/${request.action_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("updateInvoice result:", data);
  return data;
}

// Endpoint: /api/ap/vendors/{vendor_id} (PUT)
export async function updateVendor(
  request: UpdateVendorRequest
): Promise<DwDimVendorResponseSchema> {
  const response = await fetch(`${BASE_URL}/api/ap/vendors/${request.vendor_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("updateVendor result:", data);
  return data;
}

// Endpoint: /api/ap/vendors/{vendor_id} (DELETE)
export async function deleteVendor(
  vendorId: string
): Promise<DeleteVendorResponse> {
  const response = await fetch(`${BASE_URL}/api/ap/vendors/${vendorId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("deleteVendor result:", data);
  return data;
}

/**
 * Tax Compliance API Integration Layer
 *
 * This module provides a comprehensive API integration layer for the Tax Compliance service.
 * It handles all CRUD operations for tax entries, tax codes, and compliance management.
 */

import { useState, useEffect } from 'react';

// Base API configuration
const BASE_URL = process.env.NEXT_PUBLIC_TAX_API_URL || 'http://localhost:8006';

// Type definitions based on backend schemas
export interface TaxEntry {
  entry_id: string;
  tenant_id: string;
  txn_id: string;
  tax_code: string;
  amount: number;
  tax_rate: number;
  tax_amount: number;
  account_code: string;
  vendor_customer_id?: string;
  region: string;
  confidence: number;
  model_version: string;
  policy_snippets?: any;
  status: 'PENDING_APPROVAL' | 'APPLIED' | 'REJECTED';
  created_at: string;
  updated_at?: string;
}

export interface TaxEntryCreate {
  txn_id: string;
  account_code: string;
  amount: number;
  vendor_customer_id?: string;
  region: string;
  tax_code: string;
  confidence?: number;
  model_version?: string;
  policy_snippets?: any;
  status?: string;
}

export interface TaxCode {
  value: string;
  label: string;
}

export interface TaxEntryUpdate {
  tax_code?: string;
  status?: string;
  confidence?: number;
  policy_snippets?: any;
}

export interface TaxProvision {
  provision_id: string;
  tenant_id: string;
  period: string;
  provision_amount: number;
  model_version: string;
  status: 'PENDING_APPROVAL' | 'APPLIED' | 'REJECTED';
  confidence?: number;
  policy_snippets?: any;
  created_at: string;
  updated_at?: string;
}

export interface GlCompletedEvent {
  txnId: string;
  accountCode: string;
  amount: number;
  vendorId?: string;
  customerId?: string;
  region: string;
}

export interface GlPeriodClosedEvent {
  period: string;
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

// Tax Entry API functions
export const taxEntryAPI = {
  // Get all tax entries with optional filtering
  async list(status?: string, limit: number = 100, offset: number = 0): Promise<TaxEntry[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    const queryString = params.toString();
    return apiRequest<TaxEntry[]>(`/tax-entries${queryString ? `?${queryString}` : ''}`);
  },

  // Get tax entry by ID
  async get(entry_id: string): Promise<TaxEntry> {
    return apiRequest<TaxEntry>(`/tax-entries/${entry_id}`);
  },

  // Create a new tax entry
  async create(tax_entry: TaxEntryCreate): Promise<TaxEntry> {
    return apiRequest<TaxEntry>('/tax-entries', {
      method: 'POST',
      body: JSON.stringify(tax_entry),
    });
  },

  // Update tax entry
  async update(entry_id: string, tax_entry_update: TaxEntryUpdate): Promise<TaxEntry> {
    return apiRequest<TaxEntry>(`/tax-entries/${entry_id}`, {
      method: 'PUT',
      body: JSON.stringify(tax_entry_update),
    });
  },

  // Update tax entry status
  async updateStatus(entry_id: string, status: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/tax-entries/${entry_id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Delete tax entry
  async delete(entry_id: string): Promise<void> {
    await apiRequest(`/tax-entries/${entry_id}`, {
      method: 'DELETE',
    });
  },
};

// Tax Provision API functions
export const taxProvisionAPI = {
  // Get all tax provisions with optional filtering
  async list(status?: string, limit: number = 100, offset: number = 0): Promise<TaxProvision[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    const queryString = params.toString();
    return apiRequest<TaxProvision[]>(`/tax-provisions${queryString ? `?${queryString}` : ''}`);
  },

  // Get tax provision by ID
  async get(provision_id: string): Promise<TaxProvision> {
    return apiRequest<TaxProvision>(`/tax-provisions/${provision_id}`);
  },

  // Update tax provision status
  async updateStatus(provision_id: string, status: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/tax-provisions/${provision_id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// Tax Code API functions
export const taxCodeAPI = {
  // Get available tax codes
  async list(): Promise<TaxCode[]> {
    return apiRequest<TaxCode[]>('/tax-codes');
  },
};

// Health check
export const healthAPI = {
  async check(): Promise<{ status: string }> {
    return apiRequest<{ status: string }>('/health');
  },
};

// Agent Trigger API functions
export const triggerAPI = {
  async triggerIndirectTaxClassification(event: GlCompletedEvent): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/trigger/indirect-tax-classification', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  async triggerDirectTaxProvision(event: GlPeriodClosedEvent): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/trigger/direct-tax-provision', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },
};

// React hooks for API integration
export function useTaxEntries(status?: string, limit: number = 100, offset: number = 0) {
  const [taxEntries, setTaxEntries] = useState<TaxEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  const fetchTaxEntries = async () => {
    try {
      setLoading(true);
      const data = await taxEntryAPI.list(status, limit, offset);
      setTaxEntries(data);
      setError(null);
    } catch (err) {
      setError(err as APIError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxEntries();
  }, [status, limit, offset]);

  return {
    taxEntries,
    loading,
    error,
    refetch: fetchTaxEntries,
    create: async (taxEntry: TaxEntryCreate) => {
      const newEntry = await taxEntryAPI.create(taxEntry);
      setTaxEntries(prev => [...prev, newEntry]);
      return newEntry;
    },
    update: async (entryId: string, update: TaxEntryUpdate) => {
      const updatedEntry = await taxEntryAPI.update(entryId, update);
      setTaxEntries(prev => prev.map(entry =>
        entry.entry_id === entryId ? updatedEntry : entry
      ));
      return updatedEntry;
    },
    updateStatus: async (entryId: string, status: string) => {
      // Validate status before sending
      const validStatuses = ["PENDING_APPROVAL", "APPLIED", "REJECTED"];
      if (!validStatuses.includes(status)) {
        throw new APIError(`Invalid status: ${status}`, 400);
      }

      await taxEntryAPI.updateStatus(entryId, status);
      setTaxEntries(prev => prev.map(entry =>
        entry.entry_id === entryId ? { ...entry, status: status as any } : entry
      ));
    },
    delete: async (entryId: string) => {
      await taxEntryAPI.delete(entryId);
      setTaxEntries(prev => prev.filter(entry => entry.entry_id !== entryId));
    },
  };
}

export function useTaxProvisions(status?: string, limit: number = 100, offset: number = 0) {
  const [taxProvisions, setTaxProvisions] = useState<TaxProvision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  const fetchTaxProvisions = async () => {
    try {
      setLoading(true);
      const data = await taxProvisionAPI.list(status, limit, offset);
      setTaxProvisions(data);
      setError(null);
    } catch (err) {
      setError(err as APIError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxProvisions();
  }, [status, limit, offset]);

  return {
    taxProvisions,
    loading,
    error,
    refetch: fetchTaxProvisions,
    updateStatus: async (provisionId: string, status: string) => {
      const validStatuses = ["PENDING_APPROVAL", "APPLIED", "REJECTED"];
      if (!validStatuses.includes(status)) {
        throw new APIError(`Invalid status: ${status}`, 400);
      }

      await taxProvisionAPI.updateStatus(provisionId, status);
      setTaxProvisions(prev => prev.map(provision =>
        provision.provision_id === provisionId ? { ...provision, status: status as any } : provision
      ));
    },
  };
}


export function useTaxCodes() {
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);

  const fetchTaxCodes = async () => {
    try {
      setLoading(true);
      const data = await taxCodeAPI.list();
      setTaxCodes(data);
      setError(null);
    } catch (err) {
      setError(err as APIError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxCodes();
  }, []);

  return {
    taxCodes,
    loading,
    error,
    refetch: fetchTaxCodes,
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

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'applied':
      return 'text-green-600 bg-green-100';
    case 'pending_approval':
      return 'text-amber-600 bg-amber-100';
    case 'rejected':
    case 'flagged': // Add 'flagged' to map to rejected styling
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.85) return 'text-green-600';
  if (confidence >= 0.7) return 'text-amber-600';
  return 'text-red-600';
};

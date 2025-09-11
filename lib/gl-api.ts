import type { JournalEntry } from "./types"; // Frontend JournalEntry type

const BASE_URL = "http://localhost:8005"; // General Ledger Service URL
const API_KEY = "test_api_key"; // API Key for authentication

// Backend interfaces (simplified based on main.py and common patterns)
interface JournalEntryResponseBackend {
  id: string;
  tenant_id: string;
  journal_type_id: string;
  fiscal_period_id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  reference: string;
  source: string; // e.g., "AP", "AR", "MANUAL", etc.
  status: string; // e.g., "DRAFT", "PENDING", "POSTED"
  is_recurring: boolean;
  is_auto_generated: boolean;
  is_adjustment: boolean; // Added is_adjustment
  is_anomaly: boolean; // New field
  metadata_: any | null;
  lines: JournalEntryLineBackend[];
  created_at?: string; // Added created_at
  updated_at?: string; // Added updated_at (assuming it might exist)
}

interface JournalEntryLineBackend {
  id: string;
  journal_entry_id: string;
  account_id: string;
  line_number: number;
  description: string;
  debit_amount: number;
  credit_amount: number;
  currency: string;
  exchange_rate: number;
  reference: string;
  dimension1: string | null;
  dimension2: string | null;
  metadata_: any | null; // SQLAlchemy uses metadata_ for 'metadata' column
}

export interface AccountResponseBackend {
    id: string;
    tenant_id: string;
    name: string; // Changed from account_name to name to match backend
    account_number: string;
    account_type_id: string;
    description: string | null;
    balance: number;
    metadata_: any | null;
}

export interface JournalTypeResponseBackend {
    id: string;
    tenant_id: string;
    name: string;
    code: string;
    description: string | null;
}

export interface FiscalPeriodResponseBackend {
    id: string;
    tenant_id: string;
    fiscal_year_id: string;
    name: string;
    period_number: number;
    start_date: string;
    end_date: string;
}

export interface AccountTypeResponseBackend {
    id: string;
    tenant_id: string;
    name: string;
    code: string;
    normal_balance: string; // "DEBIT" or "CREDIT"
    is_active: boolean;
}

export interface TrialBalanceItem {
    account_id: string;
    account_number: string;
    account_name: string;
    account_type: string;
    debit_amount: number;
    credit_amount: number;
    net_amount: number;
}

export interface TrialBalanceResponse {
    fiscal_period_id: string;
    period_name: string;
    start_date: string;
    end_date: string;
    items: TrialBalanceItem[];
    total_debits: number;
    total_credits: number;
    tenant_id: string;
    generated_at: string;
}

// Global simple cache object
const cache: { [key: string]: any } = {};

async function cachedFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    if (cache[key]) {
        console.log(`Cache hit for ${key}`);
        return cache[key];
    }
    console.log(`Cache miss for ${key}, fetching...`);
    const data = await fetchFn();
    cache[key] = data;
    return data;
}

// Maps to store account_id to account_name and vice-versa
let accountMap: Map<string, string> = new Map(); // id to name
let accountNameToIdMap: Map<string, string> = new Map(); // name to id

let journalTypeMap: Map<string, string> = new Map(); // code to id
let fiscalPeriodMap: Map<string, string> = new Map(); // date string to id

/**
 * Fetches all accounts and builds a map from account ID to account name.
 * This is used to transform backend account_id to frontend account name.
 */
async function getAccountMap(): Promise<void> {
    try {
        const accounts = await cachedFetch<AccountResponseBackend[]>("accounts", async () => {
            const response = await fetch(`${BASE_URL}/accounts?tenant_id=default`, { // Assuming 'default' tenant for now
                headers: {
                    "X-API-Key": API_KEY,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Failed to fetch accounts:", errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            return response.json();
        });

        accountMap = new Map(); // Clear previous map
        accountNameToIdMap = new Map(); // Clear previous map
        accounts.forEach(account => {
            accountMap.set(account.id, account.name); // Changed from account_name to name
            accountNameToIdMap.set(account.name, account.id); // Changed from account_name to name
        });
    } catch (error) {
        console.error("Error fetching account map:", error);
        // Depending on criticality, you might want to throw or return a default map
    }
}

/**
 * Fetches all journal types and builds a map from journal type code to journal type ID.
 */
async function getJournalTypesMap(): Promise<void> {
    try {
        const journalTypes = await cachedFetch<JournalTypeResponseBackend[]>("journal-types", async () => {
            const response = await fetch(`${BASE_URL}/journal-types?tenant_id=default`, {
                headers: {
                    "X-API-Key": API_KEY,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Failed to fetch journal types:", errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            return response.json();
        });

        journalTypeMap = new Map(); // Clear previous map
        journalTypes.forEach(journalType => {
            journalTypeMap.set(journalType.code, journalType.id);
        });
    } catch (error) {
        console.error("Error fetching journal types map:", error);
    }
}

/**
 * Fetches fiscal periods and finds the correct fiscal_period_id for a given date.
 * @param tenantId The ID of the tenant.
 * @param dateString The date string in "YYYY-MM-DD" format.
 * @returns The fiscal_period_id or null if not found.
 */
async function getFiscalPeriodIdByDate(tenantId: string, dateString: string): Promise<string | null> {
    const cacheKey = `fiscal-period-${tenantId}-${dateString}`;
    if (fiscalPeriodMap.has(cacheKey)) {
        return fiscalPeriodMap.get(cacheKey) || null;
    }

    try {
        const fiscalPeriods = await cachedFetch<FiscalPeriodResponseBackend[]>(`fiscal-periods-${tenantId}`, async () => {
            const response = await fetch(`${BASE_URL}/fiscal-periods?tenant_id=${tenantId}`, {
                headers: {
                    "X-API-Key": API_KEY,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Failed to fetch fiscal periods:", errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            return response.json();
        });
        
        const entryDate = new Date(dateString);

        for (const period of fiscalPeriods) {
            const startDate = new Date(period.start_date);
            const endDate = new Date(period.end_date);
            if (entryDate >= startDate && entryDate <= endDate) {
                fiscalPeriodMap.set(cacheKey, period.id); // Cache the result
                return period.id;
            }
        }
        console.warn(`No fiscal period found for date: ${dateString}`);
        return null;
    } catch (error) {
        console.error("Error fetching fiscal period by date:", error);
    return null;
  }
}

/**
 * Creates a new account.
 * @param tenantId The ID of the tenant.
 * @param accountData The data for the new account.
 * @returns A promise that resolves to the created AccountResponseBackend object or null on error.
 */
export async function createAccount(
  tenantId: string,
  accountData: {
    account_number: string;
    name: string;
    description?: string;
    account_type_id: string;
    is_active?: boolean;
    is_control_account?: boolean;
    metadata?: Record<string, any>;
  }
): Promise<AccountResponseBackend | null> {
  const payload = {
    tenant_id: tenantId,
    ...accountData,
  };

  try {
    const response = await fetch(`${BASE_URL}/accounts`, {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to create account:", errorText);
      return null;
    }

    const createdAccount: AccountResponseBackend = await response.json();
    // Invalidate accounts cache so next fetch gets new data
    delete cache[`accounts-${tenantId}`];
    return createdAccount;
  } catch (error) {
    console.error("Error creating account:", error);
    return null;
  }
}

/**
 * Fetches all accounts for a tenant.
 * @param tenantId The ID of the tenant.
 * @returns A promise that resolves to an array of AccountResponseBackend objects or null on error.
 */
export async function getAccounts(tenantId: string): Promise<AccountResponseBackend[]> {
    try {
        const accounts = await cachedFetch<AccountResponseBackend[]>(`accounts-${tenantId}`, async () => {
            const response = await fetch(`${BASE_URL}/accounts?tenant_id=${tenantId}`, {
                headers: {
                    "X-API-Key": API_KEY,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to fetch accounts for tenant ${tenantId}:`, errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            return response.json();
        });
        return accounts;
    } catch (error) {
        console.error("Error in getAccounts:", error);
        return []; // Return empty array on error
    }
}

/**
 * Fetches all journal types for a tenant.
 * @param tenantId The ID of the tenant.
 * @returns A promise that resolves to an array of JournalTypeResponseBackend objects or null on error.
 */
export async function getJournalTypes(tenantId: string): Promise<JournalTypeResponseBackend[] | null> {
    try {
        const journalTypes = await cachedFetch<JournalTypeResponseBackend[]>(`journal-types-${tenantId}`, async () => {
            const response = await fetch(`${BASE_URL}/journal-types?tenant_id=${tenantId}`, {
                headers: {
                    "X-API-Key": API_KEY,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to fetch journal types for tenant ${tenantId}:`, errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            return response.json();
        });
        return journalTypes;
    } catch (error) {
        console.error("Error in getJournalTypes:", error);
        return null;
    }
}

/**
 * Fetches fiscal periods for a tenant, optionally filtered by fiscal year.
 * @param tenantId The ID of the tenant.
 * @param fiscalYearId Optional fiscal year ID to filter periods.
 * @returns A promise that resolves to an array of FiscalPeriodResponseBackend objects or null on error.
 */
export async function getFiscalPeriods(tenantId: string, fiscalYearId?: string): Promise<FiscalPeriodResponseBackend[] | null> {
    const queryParams = new URLSearchParams({ tenant_id: tenantId });
    if (fiscalYearId) {
        queryParams.append("fiscal_year_id", fiscalYearId);
    }
    const cacheKey = `fiscal-periods-${tenantId}-${fiscalYearId || 'all'}`;

    try {
        const fiscalPeriods = await cachedFetch<FiscalPeriodResponseBackend[]>(cacheKey, async () => {
            const response = await fetch(`${BASE_URL}/fiscal-periods?${queryParams.toString()}`, {
                headers: {
                    "X-API-Key": API_KEY,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to fetch fiscal periods for tenant ${tenantId}:`, errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            return response.json();
        });
        return fiscalPeriods;
    } catch (error) {
        console.error("Error in getFiscalPeriods:", error);
        return null;
    }
}


/**
 * Fetches journal entries from the General Ledger service.
 * @param tenantId The ID of the tenant.
 * @param filters Optional filters for the journal entries.
 * @returns A promise that resolves to an array of JournalEntry objects.
 */
export async function getJournalEntries(
  tenantId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    description?: string;
    account?: string;
    status?: "normal" | "anomaly" | "approved" | "DRAFT" | "POSTED" | "REVERSED"; // Added DRAFT, POSTED, and REVERSED
  }
): Promise<JournalEntry[]> {
  // Ensure account map is populated for converting account_id to account name
  if (accountMap.size === 0) {
    await getAccountMap();
  }

  let queryParams = new URLSearchParams({ tenant_id: tenantId });

  // Add filters
  if (filters?.startDate) queryParams.append("start_date", filters.startDate);
  if (filters?.endDate) queryParams.append("end_date", filters.endDate);
  if (filters?.status) queryParams.append("status", filters.status);
  
  // For account filter, convert account name to account ID
  if (filters?.account) {
      // Ensure accountMap is populated before trying to get accountId
      if (accountMap.size === 0) {
          await getAccountMap();
      }
      const accountId = accountNameToIdMap.get(filters.account);
      if (accountId) {
          queryParams.append("account_id", accountId);
      } else {
          console.warn(`Account name '${filters.account}' not found for filtering.`);
          // If account name is invalid, return empty to prevent fetching irrelevant data
          return [];
      }
  }

  try {
    const response = await fetch(`${BASE_URL}/journal-entries?${queryParams.toString()}`, {
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch journal entries:", errorText);
      // Instead of throwing, return an empty array and let the component handle the error toast
      return [];
    }

    const backendEntries: JournalEntryResponseBackend[] = await response.json();

    // Transform backend response to frontend JournalEntry format
    const transformedEntries: JournalEntry[] = backendEntries.map((entry) => {
      // Find the account name for the first line's account_id.
      // In a real scenario, you might iterate through all lines or have a more complex mapping.
      const firstLineAccountId = entry.lines && entry.lines.length > 0 ? entry.lines[0].account_id : null;
      const accountName = firstLineAccountId ? accountMap.get(firstLineAccountId) : "Unknown Account";

      // Calculate debit and credit for the main entry display (assuming single line for simplicity)
      // In a real scenario, you'd sum up all debit/credit lines
      const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit_amount, 0);
      const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit_amount, 0);

      return {
        id: entry.id,
        date: entry.entry_date,
        description: entry.description,
        debit: totalDebit,
        credit: totalCredit,
        account: accountName || "N/A", // Use the resolved account name
        journal_type_id: entry.journal_type_id, // Map journal_type_id
        reference: entry.reference,
        status: entry.status as "normal" | "anomaly" | "approved" | "DRAFT" | "POSTED" | "REVERSED", // Include all possible statuses
        is_anomaly: entry.is_anomaly,
        created_at: entry.created_at, // Map created_at
        fiscal_period_id: entry.fiscal_period_id, // Map fiscal_period_id
      };
    });

    return transformedEntries;
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    // Return empty array on error
    return [];
    }
}

/**
 * Fetches all account types for a tenant.
 * @param tenantId The ID of the tenant.
 * @returns A promise that resolves to an array of AccountTypeResponseBackend objects or null on error.
 */
export async function getAccountTypes(tenantId: string): Promise<AccountTypeResponseBackend[] | null> {
    try {
        const accountTypes = await cachedFetch<AccountTypeResponseBackend[]>(`account-types-${tenantId}`, async () => {
            const response = await fetch(`${BASE_URL}/account-types?tenant_id=${tenantId}`, {
                headers: {
                    "X-API-Key": API_KEY,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to fetch account types for tenant ${tenantId}:`, errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            return response.json();
        });
        return accountTypes;
    } catch (error) {
        console.error("Error in getAccountTypes:", error);
        return null;
    }
}


import type { NewEntryForm } from "./types"; // Import NewEntryForm

/**
 * Creates a new journal entry in the General Ledger service.
 * @param tenantId The ID of the tenant.
 * @param journalEntryData The data for the new journal entry.
 * @returns A promise that resolves to the created JournalEntryResponseBackend object.
 */
export async function createJournalEntry(
  tenantId: string,
  journalEntryData: NewEntryForm // Use NewEntryForm type
): Promise<JournalEntryResponseBackend | null> {
  // No need to ensure maps are populated here, as IDs are directly provided
  // No need to resolve account_id from account name, it's already an ID
  const accountId = journalEntryData.account;
  const journalTypeId = journalEntryData.journal_type_id;

  if (!accountId) {
    console.error(`Account ID is missing.`);
    throw new Error('Account ID is missing for journal entry creation.');
  }
  if (!journalTypeId) {
    console.error(`Journal type ID is missing.`);
    throw new Error('Journal type ID is missing for journal entry creation.');
  }

  // Resolve fiscal_period_id from entry date
  const fiscalPeriodId = await getFiscalPeriodIdByDate(tenantId, journalEntryData.date);
  if (!fiscalPeriodId) {
    console.error(`Fiscal period not found for date '${journalEntryData.date}'.`);
    throw new Error(`Fiscal period not found for date '${journalEntryData.date}'.`);
  }

  // Fetch accounts to find a "Cash" or "Bank" account for balancing
  const allAccounts = await getAccounts(tenantId);
  // getAccounts now returns an empty array on error, so no need for null check here
  const cashAccount = allAccounts.find(account => 
    account.name.toLowerCase().includes("cash") || account.name.toLowerCase().includes("bank")
  );

  if (!cashAccount) {
    console.error("No suitable 'Cash' or 'Bank' account found for balancing.");
    throw new Error("No suitable 'Cash' or 'Bank' account found for balancing journal entry. Please configure one.");
  }

  const lines = [];
  const amount = journalEntryData.debit > 0 ? journalEntryData.debit : journalEntryData.credit;
  const description = journalEntryData.description;

  // First line: User's provided account and amount
  lines.push({
    tenant_id: tenantId,
    account_id: accountId,
    line_number: 1,
    description: description,
    debit_amount: journalEntryData.debit,
    credit_amount: journalEntryData.credit,
    currency: "USD",
    exchange_rate: 1.0,
    reference: journalEntryData.reference,
  });

  // Second line: Balancing entry to the Cash account
  if (journalEntryData.debit > 0) {
    // If user debited their account, credit Cash account
    lines.push({
      tenant_id: tenantId,
      account_id: cashAccount.id,
      line_number: 2,
      description: `Cash outflow for: ${description}`,
      debit_amount: 0.0,
      credit_amount: amount,
      currency: "USD",
      exchange_rate: 1.0,
      reference: journalEntryData.reference,
    });
  } else {
    // If user credited their account, debit Cash account
    lines.push({
      tenant_id: tenantId,
      account_id: cashAccount.id,
      line_number: 2,
      description: `Cash inflow from: ${description}`,
      debit_amount: amount,
      credit_amount: 0.0,
      currency: "USD",
      exchange_rate: 1.0,
      reference: journalEntryData.reference,
    });
  }

  const payload = {
    tenant_id: tenantId,
    journal_type_id: journalTypeId,
    fiscal_period_id: fiscalPeriodId,
    entry_number: `JE-${Date.now()}`, // Simple unique entry number
    entry_date: new Date(journalEntryData.date).toISOString(), // Format date to ISO 8601 with Z for UTC
    description: journalEntryData.description,
    reference: journalEntryData.reference,
    source: "Frontend", // Source of the entry
    status: "DRAFT", // Initial status
    is_recurring: false,
    is_auto_generated: false,
    is_adjustment: true, // Assuming manual entries are adjustments
    metadata: {}, // Ensure metadata is always an empty dictionary if not provided
    lines: lines, // Use the constructed two-line array
  };

  console.log("Sending Journal Entry Payload:", JSON.stringify(payload, null, 2)); // Log the payload

  try {
    const response = await fetch(`${BASE_URL}/journal-entries`, {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to create journal entry:", errorText);
      throw new Error(`Failed to create journal entry: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const createdEntry: JournalEntryResponseBackend = await response.json();
    return createdEntry;
  } catch (error) {
    console.error("Error creating journal entry:", error);
    throw error;
  }
}

// Interface for the data needed to update a journal entry
export interface UpdateJournalEntryData {
    date: string;
    description: string;
    debit: number;
    credit: number;
    account: string; // This is the account ID
    journal_type_id: string;
    reference: string;
}

/**
 * Updates an existing journal entry.
 * @param tenantId The ID of the tenant.
 * @param entryId The ID of the journal entry to update.
 * @param entryData The data to update the journal entry with.
 * @returns A promise that resolves to the updated JournalEntryResponseBackend object or null on error.
 */
export async function updateJournalEntry(
  tenantId: string,
  entryId: string,
  entryData: UpdateJournalEntryData
): Promise<JournalEntryResponseBackend | null> {
  // Ensure account map is populated for converting account name to account ID
  if (accountMap.size === 0) {
    await getAccountMap();
  }

  // Resolve fiscal_period_id from entry date
  const fiscalPeriodId = await getFiscalPeriodIdByDate(tenantId, entryData.date);
  if (!fiscalPeriodId) {
    console.error(`Fiscal period not found for date '${entryData.date}'.`);
    throw new Error(`Fiscal period not found for date '${entryData.date}'.`);
  }

  // Convert account name to account ID for the primary account
  const primaryAccountId = accountNameToIdMap.get(entryData.account);
  if (!primaryAccountId) {
    console.error(`Account name '${entryData.account}' not found. Cannot update journal entry.`);
    throw new Error(`Account name '${entryData.account}' not found. Cannot update journal entry.`);
  }

  // Fetch accounts to find a "Cash" or "Bank" account for balancing
  const allAccounts = await getAccounts(tenantId);
  // getAccounts now returns an empty array on error, so no need for null check here
  const cashAccount = allAccounts.find(account => 
    account.name.toLowerCase().includes("cash") || account.name.toLowerCase().includes("bank")
  );

  if (!cashAccount) {
    console.error("No suitable 'Cash' or 'Bank' account found for balancing.");
    throw new Error("No suitable 'Cash' or 'Bank' account found for balancing journal entry. Please configure one.");
  }

  const lines = [];
  const amount = entryData.debit > 0 ? entryData.debit : entryData.credit;
  const description = entryData.description;

  // First line: User's provided account and amount
  lines.push({
    tenant_id: tenantId,
    account_id: primaryAccountId, // Use the resolved account ID
    line_number: 1,
    description: description,
    debit_amount: entryData.debit,
    credit_amount: entryData.credit,
    currency: "USD",
    exchange_rate: 1.0,
    reference: entryData.reference,
  });

  // Second line: Balancing entry to the Cash account
  if (entryData.debit > 0) {
    // If user debited their account, credit Cash account
    lines.push({
      tenant_id: tenantId,
      account_id: cashAccount.id,
      line_number: 2,
      description: `Cash outflow for: ${description}`,
      debit_amount: 0.0,
      credit_amount: amount,
      currency: "USD",
      exchange_rate: 1.0,
      reference: entryData.reference,
    });
  } else {
    // If user credited their account, debit Cash account
    lines.push({
      tenant_id: tenantId,
      account_id: cashAccount.id,
      line_number: 2,
      description: `Cash inflow from: ${description}`,
      debit_amount: amount,
      credit_amount: 0.0,
      currency: "USD",
      exchange_rate: 1.0,
      reference: entryData.reference,
    });
  }

  const payload = {
    tenant_id: tenantId,
    journal_type_id: entryData.journal_type_id,
    fiscal_period_id: fiscalPeriodId,
    entry_number: `JE-${Date.now()}-UPD`, // Simple unique entry number for update
    entry_date: new Date(entryData.date).toISOString(), // Ensure ISO format for update
    description: entryData.description,
    reference: entryData.reference,
    source: "Frontend-Edit", // Source of the entry
    status: "DRAFT", // Status after edit
    is_recurring: false,
    is_auto_generated: false,
    is_adjustment: true, // Assuming manual entries are adjustments
    metadata: {}, // Ensure metadata is always an empty dictionary if not provided
    lines: lines, // Use the constructed two-line array
  };

  try {
    const response = await fetch(`${BASE_URL}/journal-entries/${entryId}`, {
      method: "PUT", // Use PUT for updating
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to update journal entry:", errorText);
      throw new Error(`Failed to update journal entry: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const updatedEntry: JournalEntryResponseBackend = await response.json();
    return updatedEntry;
  } catch (error) {
    console.error("Error updating journal entry:", error);
    throw error;
  }
}

/**
 * Rejects a journal entry by updating its status to REVERSED.
 * @param id The ID of the journal entry to reject.
 * @returns A promise that resolves to an object indicating success and status, or null on error.
 */
export async function rejectJournalEntry(id: string): Promise<JournalEntryResponseBackend | null> {
    try {
        // Fetch all journal entries and find the specific one (workaround for missing GET by ID endpoint)
        const allEntriesResponse = await fetch(`${BASE_URL}/journal-entries?tenant_id=default`, {
            headers: {
                "X-API-Key": API_KEY,
                "Content-Type": "application/json",
            },
        });

        if (!allEntriesResponse.ok) {
            const errorText = await allEntriesResponse.text();
            console.error(`Failed to fetch all journal entries for rejection:`, errorText);
            return null;
        }
        
        const allEntries: JournalEntryResponseBackend[] = await allEntriesResponse.json();
        const entryToUpdate = allEntries.find(entry => entry.id === id);

        if (!entryToUpdate) {
            console.error(`Journal entry with ID ${id} not found for rejection.`);
            return null;
        }

        // Prepare the updated data with status set to "REVERSED"
        // Construct payload strictly adhering to JournalEntryCreate schema
        const updatePayload = {
            tenant_id: entryToUpdate.tenant_id,
            journal_type_id: entryToUpdate.journal_type_id,
            fiscal_period_id: entryToUpdate.fiscal_period_id,
            entry_number: entryToUpdate.entry_number,
            entry_date: entryToUpdate.entry_date,
            description: entryToUpdate.description,
            reference: entryToUpdate.reference,
            source: entryToUpdate.source,
            status: "REVERSED", // Set status to REVERSED
            is_recurring: entryToUpdate.is_recurring,
            is_auto_generated: entryToUpdate.is_auto_generated,
            is_adjustment: entryToUpdate.is_adjustment,
            metadata: entryToUpdate.metadata_,
            lines: entryToUpdate.lines.map(line => ({
                tenant_id: entryToUpdate.tenant_id, // Add tenant_id to each line
                account_id: line.account_id,
                line_number: line.line_number,
                description: line.description,
                debit_amount: line.debit_amount,
                credit_amount: line.credit_amount,
                currency: line.currency,
                exchange_rate: line.exchange_rate,
                reference: line.reference,
                dimension1: line.dimension1,
                dimension2: line.dimension2,
                metadata: line.metadata_
            })),
        };
        
        const response = await fetch(`${BASE_URL}/journal-entries/${id}`, {
            method: "PUT", // Use PUT for full update
            headers: {
                "X-API-Key": API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to reject journal entry ${id}:`, errorText);
            return null;
        }

        const updatedEntry: JournalEntryResponseBackend = await response.json();
        return updatedEntry; // Return the full updated entry
    } catch (error) {
        console.error(`Error rejecting journal entry ${id}:`, error);
        return null;
    }
}

/**
 * Posts a journal entry.
 * @param id The ID of the journal entry to post.
 * @returns A promise that resolves to an object indicating success and status, or null on error.
 */
export async function postJournalEntry(id: string): Promise<{ success: boolean; status: string } | null> {
    try {
        const response = await fetch(`${BASE_URL}/journal-entries/${id}/post`, {
            method: "POST",
            headers: {
                "X-API-Key": API_KEY,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to post journal entry ${id}:`, errorText);
            return null; // Return null for component to handle error
        }

        const result: { success: boolean; status: string } = await response.json();
        return result;
    } catch (error) {
        console.error(`Error posting journal entry ${id}:`, error);
        return null;
    }
}

/**
 * Generates a trial balance report.
 * @param tenantId The ID of the tenant.
 * @param fiscalPeriodId The ID of the fiscal period.
 * @returns A promise that resolves to a TrialBalanceResponse object or null on error.
 */
export async function generateTrialBalance(tenantId: string, fiscalPeriodId: string): Promise<TrialBalanceResponse | null> {
    try {
        const response = await fetch(`${BASE_URL}/reports/trial-balance?tenant_id=${tenantId}&fiscal_period_id=${fiscalPeriodId}`, {
            headers: {
                "X-API-Key": API_KEY,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to generate trial balance for tenant ${tenantId}, period ${fiscalPeriodId}:`, errorText);
            return null; // Return null for component to handle error
        }

        const trialBalance: TrialBalanceResponse = await response.json();
        return trialBalance;
    } catch (error) {
        console.error(`Error generating trial balance for tenant ${tenantId}, period ${fiscalPeriodId}:`, error);
        return null;
    }
}

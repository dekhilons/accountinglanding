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
  source: string;
  status: string; // e.g., "DRAFT", "PENDING", "POSTED"
  is_recurring: boolean;
  is_auto_generated: boolean;
  is_anomaly: boolean; // New field
  metadata_: any | null;
  lines: JournalEntryLineBackend[];
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

interface AccountResponseBackend {
    id: string;
    tenant_id: string;
    name: string; // Changed from account_name to name to match backend
    account_number: string;
    account_type_id: string;
    description: string | null;
    balance: number;
    metadata_: any | null;
}

interface JournalTypeResponseBackend {
    id: string;
    tenant_id: string;
    name: string;
    code: string;
    description: string | null;
}

interface FiscalPeriodResponseBackend {
    id: string;
    tenant_id: string;
    fiscal_year_id: string;
    name: string;
    period_number: number;
    start_date: string;
    end_date: string;
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

        const accounts: AccountResponseBackend[] = await response.json();
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

        const journalTypes: JournalTypeResponseBackend[] = await response.json();
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
    const cacheKey = `${tenantId}-${dateString}`;
    if (fiscalPeriodMap.has(cacheKey)) {
        return fiscalPeriodMap.get(cacheKey) || null;
    }

    try {
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

        const fiscalPeriods: FiscalPeriodResponseBackend[] = await response.json();
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
    status?: "normal" | "anomaly" | "approved";
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
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
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
        reference: entry.reference,
        status: entry.status as "normal" | "anomaly" | "approved", // Directly use the status mapped by backend
        is_anomaly: entry.is_anomaly,
      };
    });

    return transformedEntries;
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return [];
  }
}

/**
 * Creates a new journal entry in the General Ledger service.
 * @param tenantId The ID of the tenant.
 * @param journalEntryData The data for the new journal entry.
 * @returns A promise that resolves to the created JournalEntryResponseBackend object.
 */
export async function createJournalEntry(
  tenantId: string,
  journalEntryData: Omit<JournalEntry, "id" | "status">
): Promise<JournalEntryResponseBackend | null> {
  // Ensure maps are populated
  if (accountNameToIdMap.size === 0) {
    await getAccountMap();
  }
  if (journalTypeMap.size === 0) {
    await getJournalTypesMap();
  }

  // Resolve account_id from account name
  const accountId = accountNameToIdMap.get(journalEntryData.account);
  if (!accountId) {
    throw new Error(`Account with name '${journalEntryData.account}' not found.`);
  }

  // Resolve journal_type_id (using a default for now, can be passed from frontend later)
  const journalTypeId = journalTypeMap.get("GJ"); // Assuming "GJ" (General Journal) as default
  if (!journalTypeId) {
    throw new Error(`Journal type with code 'GJ' not found.`);
  }

  // Resolve fiscal_period_id from entry date
  const fiscalPeriodId = await getFiscalPeriodIdByDate(tenantId, journalEntryData.date);
  if (!fiscalPeriodId) {
    throw new Error(`Fiscal period not found for date '${journalEntryData.date}'.`);
  }

  const payload = {
    tenant_id: tenantId,
    journal_type_id: journalTypeId,
    fiscal_period_id: fiscalPeriodId,
    entry_number: `JE-${Date.now()}`, // Simple unique entry number
    entry_date: journalEntryData.date,
    description: journalEntryData.description,
    reference: journalEntryData.reference,
    source: "Frontend", // Source of the entry
    status: "DRAFT", // Initial status
    is_recurring: false,
    is_auto_generated: false,
    lines: [
      {
        tenant_id: tenantId,
        account_id: accountId, // Needs to be resolved from journalEntryData.account
        line_number: 1,
        description: journalEntryData.description,
        debit_amount: journalEntryData.debit,
        credit_amount: journalEntryData.credit,
        currency: "USD",
        exchange_rate: 1.0,
        reference: journalEntryData.reference,
      },
    ],
  };

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
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const createdEntry: JournalEntryResponseBackend = await response.json();
    return createdEntry;
  } catch (error) {
    console.error("Error creating journal entry:", error);
    return null;
  }
}

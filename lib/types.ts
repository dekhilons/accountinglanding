// accountinglanding/lib/types.ts

// Define column types for Journal Entry
export type JournalEntry = {
  id: string
  date: string
  description: string
  debit: number
  credit: number
  account: string
  journal_type_id: string; // Added journal_type_id
  reference: string
  status: "normal" | "anomaly" | "approved" | "DRAFT" | "POSTED" | "REVERSED" // Added POSTED and REVERSED statuses
  is_anomaly: boolean; // Added for backend anomaly status
  created_at?: string; // Add created_at as optional
  fiscal_period_id?: string; // Add fiscal_period_id as optional
}

// Define type for new journal entry form data
export type NewEntryForm = Omit<JournalEntry, "id" | "status" | "account" | "is_anomaly" | "journal_type_id"> & {
  account: string; // To store account ID selected from dropdown
  journal_type_id: string; // To store journal type ID selected from dropdown
};

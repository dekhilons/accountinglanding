// accountinglanding/lib/types.ts

// Define column types for Journal Entry
export type JournalEntry = {
  id: string
  date: string
  description: string
  debit: number
  credit: number
  account: string
  reference: string
  status: "normal" | "anomaly" | "approved"
  is_anomaly: boolean; // Added for backend anomaly status
}

// Define type for new journal entry form data
export type NewEntryForm = Omit<JournalEntry, "id" | "status" | "account" | "is_anomaly"> & {
  account: string; // To store account ID selected from dropdown
  journal_type_id: string; // To store journal type ID selected from dropdown
};

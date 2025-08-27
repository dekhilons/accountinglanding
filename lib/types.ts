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

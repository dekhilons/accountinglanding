// ar-specific-types.ts
import { Payment, Customer, Invoice } from "@/lib/ar-api"; // Assuming these are base types

export type ARPayment = Payment & {
  paymentId: string;
  customer: string;
  datePaid: string;
  matched: "full" | "partial" | "none";
  confidence: number;
  appliedAmount?: number;
  remainingAmount?: number;
}

export type ARRemittance = Payment & { // Or extend a more generic Remittance type if available
  remitId: string;
  customer: string;
  dateReceived: string;
  matched: boolean;
  fileType: "email" | "bank-feed" | "manual";
}

export type CustomerView = "list" | "create" | "details" | "edit";
export type InvoiceView = "list" | "create" | "details" | "edit";

// Add any other AR-specific types as they emerge during refactoring

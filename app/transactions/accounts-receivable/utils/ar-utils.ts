import { type Payment } from "@/lib/ar-api"

/**
 * Calculates summary statistics for payments.
 * @param payments An array of Payment objects.
 * @returns An object containing total payments, pending payments, total amount, auto-applied payments, and auto-apply rate.
 */
export const getStats = (payments: Payment[]) => {
  const totalPayments = payments.length
  const totalAmount = payments.reduce((sum, pmt) => sum + pmt.amount, 0)
  const reconciledPayments = payments.filter((pmt) => pmt.status === "RECONCILED").length

  return {
    totalPayments,
    pendingPayments: payments.filter((pmt) => pmt.status === "RECEIVED").length,
    totalAmount,
    autoAppliedPayments: reconciledPayments,
    autoApplyRate: totalPayments > 0 ? Math.round((reconciledPayments / totalPayments) * 100) : 0,
  }
}

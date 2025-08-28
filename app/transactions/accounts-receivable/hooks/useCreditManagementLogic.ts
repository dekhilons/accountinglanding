import { useState } from "react"
import {
  type CreditLimit,
  type CreditLimitUpdate,
  type CreditAssessmentRequest,
} from "@/lib/ar-api"

export const useCreditManagementLogic = () => {
  const [creditView, setCreditView] = useState<"limits" | "assessments">("limits")
  const [selectedLimit, setSelectedLimit] = useState<CreditLimit | null>(null)
  const [newCreditLimit, setNewCreditLimit] = useState<CreditLimitUpdate>({
    credit_limit: 0,
    expiry_date: "",
    risk_rating: "",
    notes: "",
  })
  const [newAssessment, setNewAssessment] = useState<CreditAssessmentRequest>({
    assessment_type: "INITIAL",
    requested_amount: 0,
    notes: "",
  })

  return {
    creditView,
    setCreditView,
    selectedLimit,
    setSelectedLimit,
    newCreditLimit,
    setNewCreditLimit,
    newAssessment,
    setNewAssessment,
  }
}

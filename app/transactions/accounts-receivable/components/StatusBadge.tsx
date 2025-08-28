"use client"

import {
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "RECONCILED":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          Reconciled
        </Badge>
      )
    case "RECEIVED":
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          <Clock className="mr-1 h-3 w-3" />
          Received
        </Badge>
      )
    case "FAILED":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          <XCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          {status}
        </Badge>
      )
  }
}

export default StatusBadge

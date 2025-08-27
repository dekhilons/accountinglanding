"use client"

import { useState } from "react"
import { Check, X, Edit, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

interface ApprovalCardProps {
  id: string
  title: string
  description: string
  confidence: number
  rationale: string
  onApprove: (id: string) => void
  onReject: (id: string, reason?: string) => void
  onEdit: (id: string) => void
}

export function ApprovalCard({
  id,
  title,
  description,
  confidence,
  rationale,
  onApprove,
  onReject,
  onEdit,
}: ApprovalCardProps) {
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  // Determine confidence level styling
  const getConfidenceBadge = () => {
    if (confidence >= 90) {
      return <Badge className="bg-green-500">High Confidence ({confidence}%)</Badge>
    } else if (confidence >= 70) {
      return <Badge className="bg-yellow-500">Medium Confidence ({confidence}%)</Badge>
    } else {
      return <Badge className="bg-red-500">Low Confidence ({confidence}%)</Badge>
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{title}</CardTitle>
          {getConfidenceBadge()}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200 text-sm">
          <div className="flex items-start mb-2">
            <AlertCircle className="h-4 w-4 text-teal-600 mt-0.5 mr-2 flex-shrink-0" />
            <span className="font-medium">AI Rationale:</span>
          </div>
          <p className="text-gray-700 pl-6">{rationale}</p>
        </div>

        {isRejecting && (
          <div className="mt-4">
            <Textarea
              placeholder="Reason for rejection (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        {isRejecting ? (
          <>
            <Button variant="destructive" onClick={() => onReject(id, rejectReason)}>
              Confirm Rejection
            </Button>
            <Button variant="outline" onClick={() => setIsRejecting(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <div className="flex space-x-2">
              <Button variant="default" className="bg-teal-600 hover:bg-teal-700" onClick={() => onApprove(id)}>
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="border-teal-600 text-teal-600 hover:bg-teal-50"
                onClick={() => onEdit(id)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit & Approve
              </Button>
            </div>
            <Button
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setIsRejecting(true)}
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

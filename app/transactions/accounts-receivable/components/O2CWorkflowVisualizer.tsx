import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  FileText,
  DollarSign,
  CreditCard,
  ArrowRight,
  Package
} from "lucide-react"
import { formatDate, type SalesOrder } from "@/lib/ar-api"

interface O2CWorkflowVisualizerProps {
  salesOrder: SalesOrder
  className?: string
}

interface WorkflowStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  date?: string
  details?: string
}

export const O2CWorkflowVisualizer: React.FC<O2CWorkflowVisualizerProps> = ({
  salesOrder,
  className = ''
}) => {
  const getWorkflowSteps = (order: SalesOrder): WorkflowStep[] => {
    return [
      {
        id: 'order_created',
        title: 'Order Created',
        description: 'Sales order has been created and submitted',
        icon: FileText,
        status: 'completed',
        date: order.created_at,
        details: `Order ${order.order_number}`
      },
      {
        id: 'credit_check',
        title: 'Credit Assessment',
        description: 'Automated credit check and approval process',
        icon: CreditCard,
        status: order.credit_status === 'APPROVED' ? 'completed' :
                order.credit_status === 'REJECTED' ? 'blocked' :
                order.credit_status === 'REVIEW_REQUIRED' ? 'in_progress' : 'pending',
        date: order.approval_date,
        details: order.credit_status
      },
      {
        id: 'order_approved',
        title: 'Order Approved',
        description: 'Order approved and ready for fulfillment',
        icon: CheckCircle,
        status: order.status === 'APPROVED' ? 'completed' :
                order.status === 'REJECTED' ? 'blocked' : 'pending',
        date: order.approval_date,
        details: order.status
      },
      {
        id: 'fulfillment',
        title: 'Fulfillment',
        description: 'Order fulfillment and shipping process',
        icon: Package,
        status: !order.fulfillment_status || order.fulfillment_status === 'PENDING' ? 'pending' :
                order.fulfillment_status === 'IN_PROGRESS' ? 'in_progress' :
                ['FULFILLED', 'SHIPPED', 'DELIVERED'].includes(order.fulfillment_status) ? 'completed' : 'pending',
        date: order.fulfillment_date,
        details: order.fulfillment_status || 'Not started'
      },
      {
        id: 'invoicing',
        title: 'Invoicing',
        description: 'Invoice generation and delivery',
        icon: FileText,
        status: order.status === 'INVOICED' ? 'completed' : 'pending',
        details: 'Invoice not yet generated'
      },
      {
        id: 'payment',
        title: 'Payment',
        description: 'Customer payment processing',
        icon: DollarSign,
        status: 'pending',
        details: 'Awaiting payment'
      },
      {
        id: 'reconciliation',
        title: 'Reconciliation',
        description: 'Payment reconciliation and cash application',
        icon: CheckCircle,
        status: 'pending',
        details: 'Payment not reconciled'
      },
      {
        id: 'completed',
        title: 'Completed',
        description: 'Order-to-cash cycle completed',
        icon: CheckCircle,
        status: 'pending',
        details: 'Cycle not completed'
      }
    ]
  }

  const steps = getWorkflowSteps(salesOrder)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />
      case 'blocked':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'in_progress':
        return 'border-blue-200 bg-blue-50'
      case 'blocked':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length
    return Math.round((completedSteps / steps.length) * 100)
  }

  const currentStepIndex = steps.findIndex(step => step.status === 'in_progress')
  const progressPercentage = getProgressPercentage()

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Order-to-Cash Workflow
          </span>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {progressPercentage}% Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Workflow Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            const isLastStep = index === steps.length - 1
            const isCurrentStep = index === currentStepIndex

            return (
              <div key={step.id} className="relative">
                <div className={`flex items-start gap-4 p-4 rounded-lg border ${getStatusColor(step.status)}`}>
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(step.status)}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{step.title}</h4>
                      {isCurrentStep && (
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                          Current
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{step.details}</span>
                      {step.date && (
                        <span className="text-gray-500">{formatDate(step.date)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {!isLastStep && (
                  <div className="flex justify-center my-2">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Workflow Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Order Number:</span>
              <p className="font-medium">{salesOrder.order_number}</p>
            </div>
            <div>
              <span className="text-gray-500">Total Amount:</span>
              <p className="font-medium">${salesOrder.total_amount.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-gray-500">Current Step:</span>
              <p className="font-medium">
                {currentStepIndex >= 0 ? steps[currentStepIndex].title : 'Completed'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Next Action:</span>
              <p className="font-medium">
                {currentStepIndex >= 0 ? steps[currentStepIndex + 1]?.title || 'Complete workflow' : 'None'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
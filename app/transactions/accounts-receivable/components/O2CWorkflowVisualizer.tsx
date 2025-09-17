import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  FileText,
  DollarSign,
  CreditCard,
  ArrowRight,
  Package,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { formatDate, type SalesOrder, type Customer } from "@/lib/ar-api"

interface O2CWorkflowVisualizerProps {
  salesOrder: SalesOrder
  className?: string
  isExpanded?: boolean
  onToggleExpansion?: () => void
  customers?: Customer[]
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
  className = '',
  isExpanded = false,
  onToggleExpansion,
  customers = []
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
        status: order.status === 'APPROVED' || order.status === 'FULFILLED' ? 'completed' :
                order.status === 'REJECTED' ? 'blocked' : 'pending',
        date: order.approval_date,
        details: order.status
      },
      {
        id: 'fulfillment',
        title: 'Fulfillment',
        description: 'Order fulfillment and shipping process',
        icon: Package,
        status: order.status === 'FULFILLED' ? 'completed' :
                !order.fulfillment_status || order.fulfillment_status === 'PENDING' ? 'pending' :
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

  if (!isExpanded) {
    console.log('Rendering collapsed view with currentStepIndex:', currentStepIndex)
    console.log('Steps:', steps)
    console.log('Progress Percentage:', progressPercentage)
    console.log('Sales Order:', salesOrder)
    console.log('Customers:', customers)
    // Collapsed view
    return (
      <Card className={`${className} cursor-pointer hover:shadow-lg hover:border-teal-200 transition-all duration-200 border-l-4 ${getStatusColor(steps[currentStepIndex >= 0 ? currentStepIndex : steps.length - 1].status).includes('green') ? 'border-l-green-500' : getStatusColor(steps[currentStepIndex >= 0 ? currentStepIndex : steps.length - 1].status).includes('blue') ? 'border-l-teal-500' : getStatusColor(steps[currentStepIndex >= 0 ? currentStepIndex : steps.length - 1].status).includes('red') ? 'border-l-red-500' : 'border-l-gray-300'}`} onClick={onToggleExpansion}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 p-2 rounded-full bg-gray-50">
                {getStatusIcon(steps[currentStepIndex >= 0 ? currentStepIndex : steps.length - 1].status)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-base text-gray-900 truncate">{salesOrder.order_number}</h4>
                <p className="text-sm text-gray-600 truncate">
                  {customers?.find((c: Customer) => c.id === salesOrder.customer_id)?.name || salesOrder.customer_id}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {steps[currentStepIndex >= 0 ? currentStepIndex : steps.length - 1].title}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">${salesOrder.total_amount.toFixed(2)}</p>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{progressPercentage}%</span>
                </div>
              </div>
              <div className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Expanded view
  return (
    <Card className={`${className} border-l-4 border-l-teal-500 shadow-lg`}>
      <CardHeader className="bg-teal-50 border-b py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpansion}
              className="p-1 h-6 w-6 rounded-full hover:bg-white/50 transition-colors"
            >
              <ChevronDown className="h-3 w-3 text-teal-600" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-teal-100 rounded">
                <Truck className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">O2C Workflow</h3>
                <p className="text-xs text-gray-600">{salesOrder.order_number}</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
              {progressPercentage}%
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Workflow Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            const isLastStep = index === steps.length - 1
            const isCurrentStep = index === currentStepIndex

            return (
              <div key={step.id} className="relative">
                <div className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 hover:shadow-sm ${getStatusColor(step.status)} ${
                  isCurrentStep ? 'ring-1 ring-teal-300 ring-opacity-50 shadow-md' : ''
                }`}>
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-full ${
                      step.status === 'completed' ? 'bg-green-100' :
                      step.status === 'in_progress' ? 'bg-teal-100' :
                      step.status === 'blocked' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {getStatusIcon(step.status)}
                    </div>
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium text-sm ${
                        step.status === 'completed' ? 'text-green-800' :
                        step.status === 'in_progress' ? 'text-teal-800' :
                        step.status === 'blocked' ? 'text-red-800' : 'text-gray-800'
                      }`}>
                        {step.title}
                      </h4>
                      {isCurrentStep && (
                        <Badge variant="outline" className="text-xs bg-teal-100 text-teal-700 border-teal-300">
                          Current
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 mb-2 leading-tight">{step.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded">
                        {step.details}
                      </span>
                      {step.date && (
                        <span className="text-xs text-gray-500">
                          {formatDate(step.date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {!isLastStep && (
                  <div className="flex justify-center my-2">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-0.5 bg-gray-300"></div>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      <div className="w-4 h-0.5 bg-gray-300"></div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 bg-teal-100 rounded">
              <FileText className="h-4 w-4 text-teal-600" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900">Summary</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-2 rounded border border-gray-100">
              <span className="text-xs text-gray-500">Order</span>
              <p className="text-sm font-bold text-gray-900">{salesOrder.order_number}</p>
            </div>
            <div className="bg-white p-2 rounded border border-gray-100">
              <span className="text-xs text-gray-500">Amount</span>
              <p className="text-sm font-bold text-green-600">${salesOrder.total_amount.toFixed(2)}</p>
            </div>
            <div className="bg-white p-2 rounded border border-gray-100">
              <span className="text-xs text-gray-500">Current</span>
              <p className="text-xs font-semibold text-teal-600">
                {currentStepIndex >= 0 ? steps[currentStepIndex].title : 'Completed'}
              </p>
            </div>
            <div className="bg-white p-2 rounded border border-gray-100">
              <span className="text-xs text-gray-500">Next</span>
              <p className="text-xs font-semibold text-teal-600">
                {currentStepIndex >= 0 ? steps[currentStepIndex + 1]?.title || 'Complete' : 'None'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
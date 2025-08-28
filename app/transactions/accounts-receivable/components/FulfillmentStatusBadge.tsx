import React from "react"
import { Badge } from "@/components/ui/badge"
import { Truck, Package, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface FulfillmentStatusBadgeProps {
  status?: 'PENDING' | 'IN_PROGRESS' | 'FULFILLED' | 'SHIPPED' | 'DELIVERED'
  className?: string
}

const fulfillmentStatusConfig = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    description: 'Order fulfillment not started'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Package,
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Order is being fulfilled'
  },
  FULFILLED: {
    label: 'Fulfilled',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-300',
    description: 'Order has been fulfilled'
  },
  SHIPPED: {
    label: 'Shipped',
    icon: Truck,
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Order has been shipped'
  },
  DELIVERED: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Order has been delivered'
  }
}

export const FulfillmentStatusBadge: React.FC<FulfillmentStatusBadgeProps> = ({
  status = 'PENDING',
  className = ''
}) => {
  const config = fulfillmentStatusConfig[status] || fulfillmentStatusConfig.PENDING
  const IconComponent = config.icon

  return (
    <Badge
      variant="outline"
      className={`${config.color} ${className}`}
      title={config.description}
    >
      <IconComponent className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  )
}
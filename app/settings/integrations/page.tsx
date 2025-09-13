"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Check, X, RefreshCw, ExternalLink } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { canAccessScreen } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

// Define types
type Integration = {
  id: string
  name: string
  description: string
  type: "erp" | "banking" | "payroll" | "communication" | "other"
  status: "connected" | "disconnected" | "error"
  lastSync?: string
}

export default function IntegrationsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)

  // Check permissions on component mount
  useEffect(() => {
    if (!canAccessScreen('/settings/integrations')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [toast])

  // Sample data for integrations
  const integrations: Integration[] = [
    {
      id: "int-1001",
      name: "QuickBooks Online",
      description: "ERP system integration for accounting data",
      type: "erp",
      status: "connected",
      lastSync: "2024-05-20T14:30:00",
    },
    {
      id: "int-1002",
      name: "Bank of America",
      description: "Banking API for transaction data",
      type: "banking",
      status: "connected",
      lastSync: "2024-05-20T12:15:00",
    },
    {
      id: "int-1003",
      name: "ADP Workforce",
      description: "Payroll provider integration",
      type: "payroll",
      status: "error",
      lastSync: "2024-05-15T09:45:00",
    },
    {
      id: "int-1004",
      name: "Slack",
      description: "Team communication integration",
      type: "communication",
      status: "connected",
      lastSync: "2024-05-20T10:30:00",
    },
    {
      id: "int-1005",
      name: "WhatsApp Business",
      description: "Customer communication integration",
      type: "communication",
      status: "disconnected",
    },
  ]

  // Handle edit integration
  const handleEditIntegration = (integration: Integration) => {
    setSelectedIntegration(integration)
    setIsEditModalOpen(true)
  }

  // Handle test connection
  const handleTestConnection = () => {
    setIsTestingConnection(true)
    // Simulate API call
    setTimeout(() => {
      setIsTestingConnection(false)
      toast({
        title: "Connection Successful",
        description: "The integration connection test was successful.",
      })
    }, 2000)
  }

  // Handle save integration
  const handleSaveIntegration = () => {
    toast({
      title: "Integration Updated",
      description: "The integration settings have been updated.",
    })
    setIsEditModalOpen(false)
  }

  // Handle add integration
  const handleAddIntegration = () => {
    toast({
      title: "Integration Added",
      description: "The new integration has been added.",
    })
    setIsAddModalOpen(false)
  }

  // Handle toggle integration
  const handleToggleIntegration = (integration: Integration) => {
    const newStatus = integration.status === "connected" ? "disconnected" : "connected"
    toast({
      title: newStatus === "connected" ? "Integration Enabled" : "Integration Disabled",
      description: `${integration.name} has been ${newStatus === "connected" ? "enabled" : "disabled"}.`,
    })
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: Integration["status"] }) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-100 text-green-800">
            <Check className="mr-1 h-3 w-3" />
            Connected
          </Badge>
        )
      case "disconnected":
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <X className="mr-1 h-3 w-3" />
            Disconnected
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-red-100 text-red-800">
            <X className="mr-1 h-3 w-3" />
            Error
          </Badge>
        )
      default:
        return null
    }
  }

  // Type badge component
  const TypeBadge = ({ type }: { type: Integration["type"] }) => {
    switch (type) {
      case "erp":
        return <Badge className="bg-blue-100 text-blue-800">ERP</Badge>
      case "banking":
        return <Badge className="bg-purple-100 text-purple-800">Banking</Badge>
      case "payroll":
        return <Badge className="bg-amber-100 text-amber-800">Payroll</Badge>
      case "communication":
        return <Badge className="bg-teal-100 text-teal-800">Communication</Badge>
      case "other":
        return <Badge className="bg-gray-100 text-gray-800">Other</Badge>
      default:
        return null
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground">Manage connections to external systems and services</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Integration
            </Button>
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </div>
                  <TypeBadge type={integration.type} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <StatusBadge status={integration.status} />
                      {integration.lastSync && (
                        <span className="text-xs text-gray-500 ml-2">
                          Last sync: {new Date(integration.lastSync).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <Switch
                      checked={integration.status === "connected"}
                      onCheckedChange={() => handleToggleIntegration(integration)}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditIntegration(integration)}>
                      Edit Credentials
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Integration Modal */}
      <ModalDialog
        title="Add Integration"
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleAddIntegration}
        confirmText="Add Integration"
        cancelText="Cancel"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Integration Name</Label>
              <Input id="name" placeholder="Enter integration name" />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <select className="w-full p-2 border rounded-md">
                <option value="erp">ERP</option>
                <option value="banking">Banking</option>
                <option value="payroll">Payroll</option>
                <option value="communication">Communication</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="Enter description" />
          </div>
          <div>
            <Label htmlFor="endpoint">API Endpoint</Label>
            <Input id="endpoint" placeholder="https://api.example.com" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Username/Client ID</Label>
              <Input id="username" placeholder="Enter username or client ID" />
            </div>
            <div>
              <Label htmlFor="password">Password/Secret</Label>
              <Input id="password" type="password" placeholder="Enter password or secret" />
            </div>
          </div>
        </div>
      </ModalDialog>

      {/* Edit Integration Modal */}
      <ModalDialog
        title={`Edit Integration: ${selectedIntegration?.name}`}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onConfirm={handleSaveIntegration}
        confirmText="Save Changes"
        cancelText="Cancel"
        size="lg"
      >
        {selectedIntegration && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Integration Name</Label>
                <Input id="edit-name" defaultValue={selectedIntegration.name} />
              </div>
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <select className="w-full p-2 border rounded-md" defaultValue={selectedIntegration.type}>
                  <option value="erp">ERP</option>
                  <option value="banking">Banking</option>
                  <option value="payroll">Payroll</option>
                  <option value="communication">Communication</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input id="edit-description" defaultValue={selectedIntegration.description} />
            </div>
            <div>
              <Label htmlFor="edit-endpoint">API Endpoint</Label>
              <Input id="edit-endpoint" placeholder="https://api.example.com" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-username">Username/Client ID</Label>
                <Input id="edit-username" placeholder="Enter username or client ID" />
              </div>
              <div>
                <Label htmlFor="edit-password">Password/Secret</Label>
                <Input id="edit-password" type="password" placeholder="Enter password or secret" />
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleTestConnection} disabled={isTestingConnection}>
                  {isTestingConnection ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
                <div className="flex items-center">
                  <StatusBadge status={selectedIntegration.status} />
                  {selectedIntegration.lastSync && (
                    <span className="text-xs text-gray-500 ml-2">
                      Last sync: {new Date(selectedIntegration.lastSync).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalDialog>
    </AppShell>
  )
}

"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Shield, Mail } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

// Define types
type User = {
  id: string
  name: string
  email: string
  role: "admin" | "manager" | "user" | "viewer"
  department: string
  status: "active" | "inactive" | "pending"
  lastLogin?: string
  permissions: string[]
}

export default function UsersPage() {
  const { toast } = useToast()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "user",
    department: "",
  })

  // Sample users data
  const users: User[] = [
    {
      id: "user-1001",
      name: "John Doe",
      email: "john.doe@company.com",
      role: "admin",
      department: "IT",
      status: "active",
      lastLogin: "2024-05-20T14:30:00",
      permissions: ["full_access", "user_management", "system_config"],
    },
    {
      id: "user-1002",
      name: "Jane Smith",
      email: "jane.smith@company.com",
      role: "manager",
      department: "Accounting",
      status: "active",
      lastLogin: "2024-05-20T10:15:00",
      permissions: ["accounting_full", "approve_transactions", "view_reports"],
    },
    {
      id: "user-1003",
      name: "Mike Johnson",
      email: "mike.johnson@company.com",
      role: "user",
      department: "Finance",
      status: "active",
      lastLogin: "2024-05-19T16:45:00",
      permissions: ["view_transactions", "create_entries", "view_reports"],
    },
    {
      id: "user-1004",
      name: "Sarah Williams",
      email: "sarah.williams@company.com",
      role: "manager",
      department: "Operations",
      status: "active",
      lastLogin: "2024-05-20T09:30:00",
      permissions: ["operations_full", "approve_expenses", "view_reports"],
    },
    {
      id: "user-1005",
      name: "David Brown",
      email: "david.brown@company.com",
      role: "viewer",
      department: "Executive",
      status: "inactive",
      lastLogin: "2024-05-15T11:20:00",
      permissions: ["view_reports", "view_dashboards"],
    },
  ]

  // Handle add user
  const handleAddUser = () => {
    toast({
      title: "User Added",
      description: `${newUser.name} has been added to the system.`,
    })
    setIsAddModalOpen(false)
    setNewUser({ name: "", email: "", role: "user", department: "" })
  }

  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  // Handle save user
  const handleSaveUser = () => {
    if (!selectedUser) return
    toast({
      title: "User Updated",
      description: `${selectedUser.name}'s information has been updated.`,
    })
    setIsEditModalOpen(false)
  }

  // Handle delete user
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
  }

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (!selectedUser) return
    toast({
      title: "User Deleted",
      description: `${selectedUser.name} has been removed from the system.`,
      variant: "destructive",
    })
    setIsDeleteModalOpen(false)
  }

  // Role badge component
  const RoleBadge = ({ role }: { role: User["role"] }) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>
      case "manager":
        return <Badge className="bg-blue-100 text-blue-800">Manager</Badge>
      case "user":
        return <Badge className="bg-green-100 text-green-800">User</Badge>
      case "viewer":
        return <Badge className="bg-gray-100 text-gray-800">Viewer</Badge>
      default:
        return null
    }
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: User["status"] }) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
      default:
        return null
    }
  }

  // Table columns
  const columns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: any) => {
        return <RoleBadge role={row.getValue("role")} />
      },
    },
    {
      accessorKey: "department",
      header: "Department",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        return <StatusBadge status={row.getValue("status")} />
      },
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ row }: any) => {
        const lastLogin = row.getValue("lastLogin")
        return lastLogin ? new Date(lastLogin).toLocaleDateString() : "Never"
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => {
        const user = row.original
        return (
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User & Access Management</h1>
            <p className="text-muted-foreground">Manage user accounts and permissions</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>System Users</CardTitle>
            <CardDescription>Manage user accounts and access permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={users} searchColumn="name" />
          </CardContent>
        </Card>
      </div>

      {/* Add User Modal */}
      <ModalDialog
        title="Add New User"
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleAddUser}
        confirmText="Add User"
        cancelText="Cancel"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select
                value={newUser.department}
                onValueChange={(value) => setNewUser({ ...newUser, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Accounting">Accounting</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </ModalDialog>

      {/* Edit User Modal */}
      <ModalDialog
        title={`Edit User: ${selectedUser?.name}`}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onConfirm={handleSaveUser}
        confirmText="Save Changes"
        cancelText="Cancel"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input id="edit-name" defaultValue={selectedUser.name} />
              </div>
              <div>
                <Label htmlFor="edit-email">Email Address</Label>
                <Input id="edit-email" type="email" defaultValue={selectedUser.email} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select defaultValue={selectedUser.role}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-department">Department</Label>
                <Select defaultValue={selectedUser.department}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Accounting">Accounting</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Permissions</h3>
              <div className="space-y-3">
                {selectedUser.permissions.map((permission, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm">
                        {permission.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Account Status</h3>
                  <p className="text-xs text-gray-500 mt-1">Enable or disable user access</p>
                </div>
                <Switch defaultChecked={selectedUser.status === "active"} />
              </div>
            </div>
          </div>
        )}
      </ModalDialog>

      {/* Delete User Modal */}
      <ModalDialog
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        confirmText="Delete User"
        cancelText="Cancel"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start">
                <Trash2 className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                <div>
                  <h3 className="font-medium text-red-800">Warning</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Deleting {selectedUser.name} will permanently remove their account and all associated data. This
                    action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="border rounded-md p-4">
              <div className="flex items-center mb-2">
                <Mail className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm ml-2">{selectedUser.email}</span>
              </div>
              <div className="flex items-center mb-2">
                <Shield className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium">Role:</span>
                <div className="ml-2">
                  <RoleBadge role={selectedUser.role} />
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium">Department:</span>
                <span className="text-sm ml-2">{selectedUser.department}</span>
              </div>
            </div>
          </div>
        )}
      </ModalDialog>
    </AppShell>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, Shield, Mail, Loader2 } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { canAccessScreen, authenticatedFetch } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ModalDialog } from "@/components/ui/modal-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// Define types matching the API response
type User = {
  id: string
  tenant_id: string
  email: string
  name: string
  department?: string
  role: string
  status: string
  is_active: boolean
  last_login?: string
  phone?: string
  job_title?: string
  employee_id?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

type UserListResponse = {
  users: User[]
  total: number
  page: number
  page_size: number
}

export default function UsersPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    department: "",
    phone: "",
    job_title: "",
    employee_id: "",
  })

  // Check permissions on component mount
  useEffect(() => {
    if (!canAccessScreen('/settings/users')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
      router.push("/dashboard")
      return
    }
    fetchUsers()
  }, [toast])

  // Handle filter changes
  useEffect(() => {
    if (canAccessScreen('/settings/users')) {
      fetchUsers()
    }
  }, [searchTerm, roleFilter, statusFilter])

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      // Only send role filter if it's not "all"
      if (roleFilter && roleFilter !== "all") params.append('role', roleFilter)
      // Only send status filter if it's not "all"
      if (statusFilter && statusFilter !== "all") params.append('status', statusFilter)

      const url = `${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8001'}/api/auth/users${params.toString() ? '?' + params.toString() : ''}`
      const response = await authenticatedFetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data: UserListResponse = await response.json()
      setUsers(data.users)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Create new user
  const handleAddUser = async () => {
    try {
      setIsSubmitting(true)
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8001'}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify(newUser),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create user')
      }

      toast({
        title: "User Created",
        description: `${newUser.name} has been added to the system.`,
      })

      setIsAddModalOpen(false)
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "user",
        department: "",
        phone: "",
        job_title: "",
        employee_id: "",
      })
      fetchUsers() // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update user
  const handleSaveUser = async () => {
    if (!selectedUser) return

    try {
      setIsSubmitting(true)
      const updateData = {
        name: selectedUser.name,
        department: selectedUser.department,
        phone: selectedUser.phone,
        job_title: selectedUser.job_title,
        employee_id: selectedUser.employee_id,
        role: selectedUser.role,
      }

      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8001'}/api/auth/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update user')
      }

      toast({
        title: "User Updated",
        description: `${selectedUser.name}'s information has been updated.`,
      })

      setIsEditModalOpen(false)
      fetchUsers() // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete user
  const handleConfirmDelete = async () => {
    if (!selectedUser) return

    try {
      setIsSubmitting(true)
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8001'}/api/auth/users/${selectedUser.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete user')
      }

      toast({
        title: "User Deleted",
        description: `${selectedUser.name} has been removed from the system.`,
        variant: "destructive",
      })

      setIsDeleteModalOpen(false)
      fetchUsers() // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  // Handle delete user
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
  }

  // Handle toggle user status
  const handleToggleUserStatus = async (user: User) => {
    try {
      setIsSubmitting(true)
      const newStatus = user.status === 'active' ? 'inactive' : 'active'

      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8001'}/api/auth/users/${user.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update user status')
      }

      toast({
        title: "User Status Updated",
        description: `${user.name} has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
      })

      fetchUsers() // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
      accessorKey: "last_login",
      header: "Last Login",
      cell: ({ row }: any) => {
        const lastLogin = row.getValue("last_login")
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleUserStatus(user)}
              disabled={isSubmitting}
              className={user.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
            >
              {user.status === 'active' ? 'Deactivate' : 'Activate'}
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter users by search term, role, or status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role-filter">Role</Label>
                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setRoleFilter("all")
                    setStatusFilter("all")
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>System Users ({users.length})</CardTitle>
            <CardDescription>Manage user accounts and access permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading users...</span>
              </div>
            ) : (
              <DataTable columns={columns} data={users} searchColumn="name" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add User Modal */}
      <ModalDialog
        title="Add New User"
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleAddUser}
        confirmText={isSubmitting ? "Creating..." : "Add User"}
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
                required
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
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="Enter password"
              required
            />
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
              <Input
                id="department"
                value={newUser.department}
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                placeholder="Enter department"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={newUser.job_title}
                onChange={(e) => setNewUser({ ...newUser, job_title: e.target.value })}
                placeholder="Enter job title"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="employee_id">Employee ID</Label>
            <Input
              id="employee_id"
              value={newUser.employee_id}
              onChange={(e) => setNewUser({ ...newUser, employee_id: e.target.value })}
              placeholder="Enter employee ID"
            />
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
                <Input
                  id="edit-name"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                >
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
                <Select
                  value={selectedUser.department || ""}
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, department: value })}
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

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Permissions</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">Current Role:</span> {selectedUser.role}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Permissions are automatically managed based on the user's role. Change the role above to modify permissions.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Account Status</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Current status: <span className={`font-medium ${selectedUser.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.status}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Use the "Activate/Deactivate" button in the table to change status.
                  </p>
                </div>
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

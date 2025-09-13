"use client"

import { useState, useEffect } from "react"
import { Camera, Save, Eye, EyeOff, Loader2 } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { authenticatedFetch, getCurrentUser } from "@/lib/auth"

export default function ProfilePage() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isRequestingRoleChange, setIsRequestingRoleChange] = useState(false)
  const [requestedRole, setRequestedRole] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    department: "",
    phone: "",
    job_title: "",
    employee_id: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    marketingEmails: false,
    twoFactorAuth: false,
  })

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8007'}/api/auth/me`)

      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }

      const userData = await response.json()
      setUser(userData)

      // Populate form with user data
      setProfileData({
        name: userData.name || "",
        email: userData.email || "",
        department: userData.department || "",
        phone: userData.phone || "",
        job_title: userData.job_title || "",
        employee_id: userData.employee_id || "",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const handleProfileSave = async () => {
    try {
      setIsSaving(true)

      const updateData = {
        name: profileData.name,
        department: profileData.department,
        phone: profileData.phone,
        job_title: profileData.job_title,
        employee_id: profileData.employee_id,
      }

      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8007'}/api/auth/me`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update profile')
      }

      const updatedUser = await response.json()

      // Update local storage with new user data
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsChangingPassword(true)

      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8007'}/api/auth/me/change-password`, {
        method: 'POST',
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to change password')
      }

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      })

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handlePreferencesSave = () => {
    // Save preferences (in a real app, this would be saved to your backend)
    toast({
      title: "Preferences Saved",
      description: "Your notification preferences have been updated.",
    })
  }

  const handleRoleChangeRequest = async () => {
    if (!requestedRole) {
      toast({
        title: "Role Required",
        description: "Please select a role to request.",
        variant: "destructive",
      })
      return
    }

    if (requestedRole === user.role) {
      toast({
        title: "Same Role",
        description: "You are already assigned this role.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsRequestingRoleChange(true)

      // In a real implementation, this would send a request to the backend
      // For now, we'll simulate sending a notification to admins
      const requestData = {
        user_id: user.id,
        current_role: user.role,
        requested_role: requestedRole,
        reason: "User requested role change from profile page",
        requested_at: new Date().toISOString(),
      }

      // Simulate API call - in real app this would be a POST to a role change request endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "Role Change Requested",
        description: `Your request to change role to ${requestedRole} has been submitted to administrators for approval.`,
      })

      setRequestedRole("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit role change request",
        variant: "destructive",
      })
    } finally {
      setIsRequestingRoleChange(false)
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </AppShell>
    )
  }

  if (!user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Failed to load profile</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
           <TabsList>
             <TabsTrigger value="profile">Profile</TabsTrigger>
             <TabsTrigger value="security">Security</TabsTrigger>
             <TabsTrigger value="role">Role & Access</TabsTrigger>
             <TabsTrigger value="notifications">Notifications</TabsTrigger>
           </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="text-lg">
                      {user.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      <Camera className="mr-2 h-4 w-4" />
                      Change Photo
                    </Button>
                    <p className="text-sm text-gray-500 mt-1">JPG, GIF or PNG. 1MB max.</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2">
                     <Label htmlFor="name">Full Name</Label>
                     <Input
                       id="name"
                       value={profileData.name}
                       onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                       className="mt-1"
                       placeholder="Enter your full name"
                     />
                   </div>
                   <div>
                     <Label htmlFor="email">Email Address</Label>
                     <Input
                       id="email"
                       type="email"
                       value={profileData.email}
                       onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                       className="mt-1"
                       disabled // Email changes might require verification
                     />
                     <p className="text-xs text-gray-500 mt-1">
                       Contact administrator to change email address
                     </p>
                   </div>
                   <div>
                     <Label htmlFor="phone">Phone Number</Label>
                     <Input
                       id="phone"
                       type="tel"
                       value={profileData.phone}
                       onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                       placeholder="+1 (555) 123-4567"
                       className="mt-1"
                     />
                   </div>
                   <div>
                     <Label htmlFor="department">Department</Label>
                     <Input
                       id="department"
                       value={profileData.department}
                       onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                       className="mt-1"
                       placeholder="Enter your department"
                     />
                   </div>
                   <div>
                     <Label htmlFor="job_title">Job Title</Label>
                     <Input
                       id="job_title"
                       value={profileData.job_title}
                       onChange={(e) => setProfileData({ ...profileData, job_title: e.target.value })}
                       className="mt-1"
                       placeholder="Enter your job title"
                     />
                   </div>
                   <div>
                     <Label htmlFor="employee_id">Employee ID</Label>
                     <Input
                       id="employee_id"
                       value={profileData.employee_id}
                       onChange={(e) => setProfileData({ ...profileData, employee_id: e.target.value })}
                       className="mt-1"
                       placeholder="Enter your employee ID"
                     />
                   </div>
                   <div className="md:col-span-2">
                     <Label>Current Role</Label>
                     <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                       <span className="text-sm font-medium capitalize">{user?.role || 'Not set'}</span>
                       <p className="text-xs text-gray-500 mt-1">
                         Visit the "Role & Access" tab to view permissions or request role changes
                       </p>
                     </div>
                   </div>
                 </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleProfileSave}
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handlePasswordChange}
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Enable Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Secure your account with SMS or authenticator app verification
                    </p>
                  </div>
                  <Switch
                    checked={preferences.twoFactorAuth}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, twoFactorAuth: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="role" className="space-y-6">
            {/* Role & Access Management */}
            <Card>
              <CardHeader>
                <CardTitle>Current Role & Permissions</CardTitle>
                <CardDescription>View your current role and accessible features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Current Role</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      <span className="text-sm font-medium capitalize">{user?.role || 'Not set'}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Access Level</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      <span className="text-sm font-medium">
                        {user?.role === 'admin' ? 'Full System Access' :
                         user?.role === 'manager' ? 'Management Access' :
                         user?.role === 'user' ? 'Standard Access' :
                         user?.role === 'viewer' ? 'Read-Only Access' : 'No Access'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Accessible Features</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                    <div className="text-sm space-y-1">
                      {user?.role === 'admin' && (
                        <div>✅ All system features including user management, settings, and administration</div>
                      )}
                      {user?.role === 'manager' && (
                        <div>✅ Core business operations, reporting, and team management</div>
                      )}
                      {user?.role === 'user' && (
                        <div>✅ Standard business operations and data entry</div>
                      )}
                      {user?.role === 'viewer' && (
                        <div>✅ Read-only access to reports and dashboards</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role Change Request */}
            <Card>
              <CardHeader>
                <CardTitle>Request Role Change</CardTitle>
                <CardDescription>Request a change to your role (requires administrator approval)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="requestedRole">Requested Role</Label>
                  <Select value={requestedRole} onValueChange={setRequestedRole}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select role to request" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Important Notes:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Role change requests require administrator approval</li>
                    <li>• You will be notified via email when your request is processed</li>
                    <li>• Role changes may affect your system access and permissions</li>
                    <li>• Contact your administrator if you need immediate assistance</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleRoleChangeRequest}
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={isRequestingRoleChange || !requestedRole}
                  >
                    {isRequestingRoleChange ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified about account activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, emailNotifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Push Notifications</h3>
                      <p className="text-sm text-gray-500">Receive push notifications in your browser</p>
                    </div>
                    <Switch
                      checked={preferences.pushNotifications}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, pushNotifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Weekly Reports</h3>
                      <p className="text-sm text-gray-500">Receive weekly summary reports</p>
                    </div>
                    <Switch
                      checked={preferences.weeklyReports}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, weeklyReports: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Marketing Emails</h3>
                      <p className="text-sm text-gray-500">Receive product updates and marketing content</p>
                    </div>
                    <Switch
                      checked={preferences.marketingEmails}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, marketingEmails: checked })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handlePreferencesSave} className="bg-teal-600 hover:bg-teal-700">
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

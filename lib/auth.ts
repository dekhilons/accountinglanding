/**
 * Authentication utilities for the frontend
 */

export interface User {
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
  created_at: string
  updated_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  name: string
  password: string
  department?: string
  phone?: string
  job_title?: string
  employee_id?: string
  tenant_id?: string
}

/**
 * Auth service base URL
 */
const AUTH_BASE_URL = 'http://localhost/api/auth'

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false

  const token = localStorage.getItem('access_token')
  const user = localStorage.getItem('user')

  return !!(token && user)
}

/**
 * Get current user from localStorage
 */
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null

  try {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  } catch (error) {
    console.error('Error parsing user data:', error)
    return null
  }
}

/**
 * Get access token
 */
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

/**
 * Get refresh token
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('refresh_token')
}

/**
 * Login user
 */
export const login = async (credentials: LoginRequest): Promise<AuthTokens> => {
  const response = await fetch(`${AUTH_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Login failed')
  }

  const data: AuthTokens = await response.json()

  // Store tokens and user data
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  return data
}

/**
 * Register new user
 */
export const register = async (userData: RegisterRequest): Promise<User> => {
  const response = await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Registration failed')
  }

  return await response.json()
}

/**
 * Refresh access token
 */
export const refreshToken = async (): Promise<AuthTokens> => {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const response = await fetch(`${AUTH_BASE_URL}/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Token refresh failed')
  }

  const data: AuthTokens = await response.json()

  // Update stored tokens
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  return data
}

/**
 * Logout user
 */
export const logout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }
}

/**
 * Get authorization header for API requests
 */
export const getAuthHeader = (): { Authorization?: string } => {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Make authenticated API request
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    try {
      await refreshToken()
      // Retry with new token
      const newHeaders = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...options.headers,
      }
      return await fetch(url, {
        ...options,
        headers: newHeaders,
      })
    } catch (refreshError) {
      // Refresh failed, logout user
      logout()
      throw new Error('Session expired. Please login again.')
    }
  }

  return response
}

/**
 * Check if user has required role
 */
export const hasRole = (requiredRole: string): boolean => {
  const user = getCurrentUser()
  if (!user) return false

  const roleHierarchy = {
    'viewer': 1,
    'user': 2,
    'manager': 3,
    'admin': 4
  }

  const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

  return userLevel >= requiredLevel
}

/**
 * Check if user has specific permission
 */
export const hasPermission = (permission: string): boolean => {
  const user = getCurrentUser()
  if (!user) return false

  // Admin has all permissions
  if (user.role === 'admin') return true

  // Check specific permissions (if implemented)
  return false // Placeholder for future permission system
}
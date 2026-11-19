import type { UserRole } from "./auth"

export interface User {
  id: number
  username: string
  email: string
  fullName?: string
  role: number
  roleName: UserRole
  isActive: boolean
  createdAt: string
}

export interface CreateUserPayload {
  username: string
  email: string
  password: string
  fullName?: string
  role: number
}

export interface UpdateUserStatusPayload {
  isActive: boolean
}

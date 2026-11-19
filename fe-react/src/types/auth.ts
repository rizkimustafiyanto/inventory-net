export type UserRole = "Admin" | "Staff" | "Manager"

export interface UserProfile {
  id: number
  username: string
  fullName: string
  role: UserRole
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  userId: number
  username: string
  fullName: string
  role: string
  expiresAt: string
}

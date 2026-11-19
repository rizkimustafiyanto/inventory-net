export type UserRole = "Admin" | "Staff"

export type UserProfile = {
  id: number
  username: string
  fullName: string
  role: UserRole
}

export type LoginRequest = {
  username: string
  password: string
}

export type LoginResponse = {
  token: string
  userId: number
  username: string
  fullName: string
  role: string
  expiresAt: string
}

export type ApiResponse<T> = {
  success: boolean
  message: string
  data?: T
  errors?: string[]
}

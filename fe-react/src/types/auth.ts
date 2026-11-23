export type UserRole = "Admin" | "Staff" | "Manager"

export interface UserProfile {
  id: number
  userId?: number
  username: string
  fullName: string
  email?: string
  role: UserRole | string
  avatar?: string
  avatarUrl?: string
  createdAt?: string
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
  email?: string
  avatar?: string
  expiresAt: string
}

export interface ForgotPasswordRequest {
  usernameOrEmail: string
}

export interface ForgotPasswordResponse {
  username: string
  email: string
  resetToken: string
  message: string
}

export interface ResetPasswordRequest {
  usernameOrEmail: string
  resetToken: string
  newPassword: string
}

export interface UpdateProfileRequest {
  fullName: string
  email: string
  avatarUrl?: string
}

export interface AvatarUploadResponse {
  avatarUrl: string
  message: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

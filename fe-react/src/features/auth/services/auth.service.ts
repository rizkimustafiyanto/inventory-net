import api from "@/lib/api/client"
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
  AvatarUploadResponse,
} from "@/types"

export const authService = {
  login: async (payload: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post<ApiResponse<LoginResponse>>("/api/auth/login", payload)
    return response.data
  },

  getCurrentUser: async (): Promise<ApiResponse<{ userId: string; username: string; role: string; fullName: string }>> => {
    const response = await api.get<ApiResponse<{ userId: string; username: string; role: string; fullName: string }>>("/api/auth/me")
    return response.data
  },

  forgotPassword: async (payload: ForgotPasswordRequest): Promise<ApiResponse<ForgotPasswordResponse>> => {
    const response = await api.post<ApiResponse<ForgotPasswordResponse>>("/api/auth/forgot-password", payload)
    return response.data
  },

  resetPassword: async (payload: ResetPasswordRequest): Promise<ApiResponse<boolean>> => {
    const response = await api.post<ApiResponse<boolean>>("/api/auth/reset-password", payload)
    return response.data
  },

  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    const response = await api.get<ApiResponse<UserProfile>>("/api/auth/profile")
    return response.data
  },

  updateProfile: async (payload: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> => {
    const response = await api.put<ApiResponse<UserProfile>>("/api/auth/profile", payload)
    return response.data
  },

  changePassword: async (payload: ChangePasswordRequest): Promise<ApiResponse<boolean>> => {
    const response = await api.put<ApiResponse<boolean>>("/api/auth/change-password", payload)
    return response.data
  },

  uploadAvatar: async (file: File): Promise<ApiResponse<AvatarUploadResponse>> => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await api.post<ApiResponse<AvatarUploadResponse>>("/api/auth/profile/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  },
}

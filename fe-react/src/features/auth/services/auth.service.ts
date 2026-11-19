import api from "@/lib/api/client"
import type { ApiResponse, LoginRequest, LoginResponse } from "../types"

export const authService = {
  login: async (payload: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post<ApiResponse<LoginResponse>>("/api/auth/login", payload)
    return response.data
  },

  getCurrentUser: async (): Promise<ApiResponse<{ userId: string; username: string; role: string; fullName: string }>> => {
    const response = await api.get<ApiResponse<{ userId: string; username: string; role: string; fullName: string }>>("/api/auth/me")
    return response.data
  },
}

import api from "@/lib/api/client"
import type { ApiResponse, User, CreateUserPayload, UserFilterParams } from "@/types"

export const userService = {
  getPaged: async (params?: UserFilterParams): Promise<ApiResponse<User[]>> => {
    const res = await api.get<ApiResponse<User[]>>("/api/users", { params })
    return res.data
  },

  getAll: async (): Promise<ApiResponse<User[]>> => {
    const res = await api.get<ApiResponse<User[]>>("/api/users")
    return res.data
  },

  create: async (payload: CreateUserPayload): Promise<ApiResponse<User>> => {
    const res = await api.post<ApiResponse<User>>("/api/users", payload)
    return res.data
  },

  updateStatus: async (id: number, isActive: boolean): Promise<ApiResponse<boolean>> => {
    const res = await api.put<ApiResponse<boolean>>(`/api/users/${id}/status`, { isActive })
    return res.data
  },

  delete: async (id: number): Promise<ApiResponse<boolean>> => {
    const res = await api.delete<ApiResponse<boolean>>(`/api/users/${id}`)
    return res.data
  },
}

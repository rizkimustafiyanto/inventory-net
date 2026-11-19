import api from "@/lib/api/client"
import type { ApiResponse } from "@/features/auth/types"
import type { Category, CreateCategoryPayload } from "../types"

export const categoryService = {
  getAll: async (): Promise<ApiResponse<Category[]>> => {
    const res = await api.get<ApiResponse<Category[]>>("/api/categories")
    return res.data
  },

  create: async (payload: CreateCategoryPayload): Promise<ApiResponse<Category>> => {
    const res = await api.post<ApiResponse<Category>>("/api/categories", payload)
    return res.data
  },

  delete: async (id: number): Promise<ApiResponse<boolean>> => {
    const res = await api.delete<ApiResponse<boolean>>(`/api/categories/${id}`)
    return res.data
  },
}

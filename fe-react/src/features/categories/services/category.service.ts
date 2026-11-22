import api from "@/lib/api/client"
import type {
  ApiResponse,
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryFilterParams,
} from "@/types"

export const categoryService = {
  getPaged: async (params?: CategoryFilterParams): Promise<ApiResponse<Category[]>> => {
    const res = await api.get<ApiResponse<Category[]>>("/api/categories", { params })
    return res.data
  },

  getAll: async (): Promise<ApiResponse<Category[]>> => {
    const res = await api.get<ApiResponse<Category[]>>("/api/categories/all")
    return res.data
  },

  getById: async (id: number): Promise<ApiResponse<Category>> => {
    const res = await api.get<ApiResponse<Category>>(`/api/categories/${id}`)
    return res.data
  },

  create: async (payload: CreateCategoryPayload): Promise<ApiResponse<Category>> => {
    const res = await api.post<ApiResponse<Category>>("/api/categories", payload)
    return res.data
  },

  update: async (id: number, payload: UpdateCategoryPayload): Promise<ApiResponse<Category>> => {
    const res = await api.put<ApiResponse<Category>>(`/api/categories/${id}`, payload)
    return res.data
  },

  delete: async (id: number): Promise<ApiResponse<boolean>> => {
    const res = await api.delete<ApiResponse<boolean>>(`/api/categories/${id}`)
    return res.data
  },
}

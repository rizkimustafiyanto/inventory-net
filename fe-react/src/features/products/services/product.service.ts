import api from "@/lib/api/client"
import type {
  ApiResponse,
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductFilterParams,
} from "@/types"

export const productService = {
  getPaged: async (params?: ProductFilterParams): Promise<ApiResponse<Product[]>> => {
    const res = await api.get<ApiResponse<Product[]>>("/api/products", { params })
    return res.data
  },

  getById: async (id: number): Promise<ApiResponse<Product>> => {
    const res = await api.get<ApiResponse<Product>>(`/api/products/${id}`)
    return res.data
  },

  create: async (payload: CreateProductPayload): Promise<ApiResponse<Product>> => {
    const res = await api.post<ApiResponse<Product>>("/api/products", payload)
    return res.data
  },

  update: async (id: number, payload: UpdateProductPayload): Promise<ApiResponse<Product>> => {
    const res = await api.put<ApiResponse<Product>>(`/api/products/${id}`, payload)
    return res.data
  },

  delete: async (id: number): Promise<ApiResponse<boolean>> => {
    const res = await api.delete<ApiResponse<boolean>>(`/api/products/${id}`)
    return res.data
  },
}

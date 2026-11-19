import type { ApiResponse } from "@/features/auth/types"

export type Product = {
  id: number
  sku: string
  name: string
  description?: string
  price: number
  stockQuantity: number
  minStockLevel: number
  isLowStock: boolean
  categoryId: number
  categoryName: string
  createdAt: string
}

export type PagedResult<T> = {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export type CreateProductPayload = {
  sku: string
  name: string
  description?: string
  price: number
  initialStock: number
  minStockLevel: number
  categoryId: number
}

export type UpdateProductPayload = {
  name: string
  description?: string
  price: number
  minStockLevel: number
  categoryId: number
}

export type ProductFilterParams = {
  pageNumber?: number
  pageSize?: number
  search?: string
  categoryId?: number
  lowStockOnly?: boolean
}

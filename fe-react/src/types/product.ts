export interface Product {
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

export interface CreateProductPayload {
  sku: string
  name: string
  description?: string
  price: number
  initialStock: number
  minStockLevel: number
  categoryId: number
}

export interface UpdateProductPayload {
  name: string
  description?: string
  price: number
  minStockLevel: number
  categoryId: number
}

export interface ProductFilterParams {
  pageNumber?: number
  pageSize?: number
  search?: string
  categoryId?: number
  lowStockOnly?: boolean
}

export interface Category {
  id: number
  name: string
  description?: string
  productCount?: number
  createdAt?: string
}

export interface CreateCategoryPayload {
  name: string
  description?: string
}

export interface UpdateCategoryPayload {
  name: string
  description?: string
}

export interface CategoryFilterParams {
  pageNumber?: number
  pageSize?: number
  search?: string
}

export type GetCategoriesParams = CategoryFilterParams

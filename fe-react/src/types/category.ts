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

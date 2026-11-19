import type { ApiResponse } from "@/features/auth/types"

export type Category = {
  id: number
  name: string
  description?: string
  productCount: number
  createdAt: string
}

export type CreateCategoryPayload = {
  name: string
  description?: string
}

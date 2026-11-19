import type { ApiResponse } from "@/features/auth/types"
import type { PagedResult } from "@/features/products/types"

export type StockMovementType = 1 | 2 | 3 // 1: In, 2: Out, 3: Adjustment

export type StockMovement = {
  id: number
  productId: number
  productName: string
  productSku: string
  type: StockMovementType
  typeName: string
  quantity: number
  stockBefore: number
  stockAfter: number
  reason?: string
  referenceNumber?: string
  userName?: string
  createdAt: string
}

export type CreateStockMovementPayload = {
  productId: number
  type: StockMovementType
  quantity: number
  reason?: string
  referenceNumber?: string
}

export type StockSummary = {
  totalProducts: number
  totalItemsInStock: number
  lowStockCount: number
  outOfStockCount: number
}

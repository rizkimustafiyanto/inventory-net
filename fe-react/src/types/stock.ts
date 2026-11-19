export type StockMovementType = 1 | 2 | 3 // 1: In, 2: Out, 3: Adjustment

export interface StockMovement {
  id: number
  productId: number
  productName: string
  productSku: string
  type: StockMovementType
  typeName?: string
  quantity: number
  stockBefore: number
  stockAfter: number
  reason?: string
  referenceNumber?: string
  userName?: string
  createdAt: string
}

export interface CreateStockMovementPayload {
  productId: number
  type: StockMovementType
  quantity: number
  reason?: string
  referenceNumber?: string
}

export interface StockSummary {
  totalProducts: number
  totalItemsInStock: number
  lowStockCount: number
  outOfStockCount: number
}

export interface StockMovementFilterParams {
  productId?: number
  pageNumber?: number
  pageSize?: number
}

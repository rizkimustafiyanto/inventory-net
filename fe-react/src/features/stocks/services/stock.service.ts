import api from "@/lib/api/client"
import type { ApiResponse } from "@/features/auth/types"
import type { PagedResult } from "@/features/products/types"
import type { StockMovement, CreateStockMovementPayload, StockSummary } from "../types"

export const stockService = {
  recordMovement: async (payload: CreateStockMovementPayload): Promise<ApiResponse<StockMovement>> => {
    const res = await api.post<ApiResponse<StockMovement>>("/api/stocks/movement", payload)
    return res.data
  },

  getMovements: async (productId?: number, pageNumber = 1, pageSize = 15): Promise<ApiResponse<PagedResult<StockMovement>>> => {
    const res = await api.get<ApiResponse<PagedResult<StockMovement>>>("/api/stocks/movements", {
      params: { productId, pageNumber, pageSize },
    })
    return res.data
  },

  getSummary: async (): Promise<ApiResponse<StockSummary>> => {
    const res = await api.get<ApiResponse<StockSummary>>("/api/stocks/summary")
    return res.data
  },
}

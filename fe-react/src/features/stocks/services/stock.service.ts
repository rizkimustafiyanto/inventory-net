import api from "@/lib/api/client"
import type {
  ApiResponse,
  StockMovement,
  CreateStockMovementPayload,
  StockSummary,
  StockMovementFilterParams,
} from "@/types"

export const stockService = {
  recordMovement: async (payload: CreateStockMovementPayload): Promise<ApiResponse<StockMovement>> => {
    const res = await api.post<ApiResponse<StockMovement>>("/api/stocks/movement", payload)
    return res.data
  },

  getMovements: async (
    paramsOrProductId?: StockMovementFilterParams | number,
    pageNumber = 1,
    pageSize = 15
  ): Promise<ApiResponse<StockMovement[]>> => {
    let params: StockMovementFilterParams = {}
    if (typeof paramsOrProductId === "object" && paramsOrProductId !== null) {
      params = paramsOrProductId
    } else {
      params = {
        productId: paramsOrProductId,
        pageNumber,
        pageSize,
      }
    }

    const res = await api.get<ApiResponse<StockMovement[]>>("/api/stocks/movements", {
      params,
    })
    return res.data
  },

  getSummary: async (): Promise<ApiResponse<StockSummary>> => {
    const res = await api.get<ApiResponse<StockSummary>>("/api/stocks/summary")
    return res.data
  },
}

import api from "@/lib/api/client"
import type { ApiResponse, StockReport } from "@/types"

export const reportService = {
  getStockSummary: async (date?: string): Promise<ApiResponse<StockReport[]>> => {
    const res = await api.get<ApiResponse<StockReport[]>>("/api/reports/stock-summary", {
      params: { date },
    })
    return res.data
  },
}

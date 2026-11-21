import api from "@/lib/api/client"
import type { ApiResponse, StockReport, StockReportFilterParams } from "@/types"

export const reportService = {
  getPagedStockSummary: async (params?: StockReportFilterParams): Promise<ApiResponse<StockReport[]>> => {
    const res = await api.get<ApiResponse<StockReport[]>>("/api/reports/stock-summary", {
      params,
    })
    return res.data
  },

  getAllStockSummary: async (date?: string): Promise<ApiResponse<StockReport[]>> => {
    const res = await api.get<ApiResponse<StockReport[]>>("/api/reports/stock-summary/all", {
      params: { date },
    })
    return res.data
  },

  getStockSummary: async (date?: string): Promise<ApiResponse<StockReport[]>> => {
    const res = await api.get<ApiResponse<StockReport[]>>("/api/reports/stock-summary/all", {
      params: { date },
    })
    return res.data
  },
}

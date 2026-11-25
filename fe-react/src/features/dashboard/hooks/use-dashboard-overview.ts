"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { stockService } from "@/features/stocks/services/stock.service"
import { productService } from "@/features/products/services/product.service"
import { useInventorySocket } from "@/lib/socket"
import type { StockSummary, StockMovement, Product } from "@/types"

export function useDashboardOverview() {
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { subscribeStockMovement, subscribeStockUpdate } = useInventorySocket()

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const [sumRes, movRes, lowRes] = await Promise.all([
        stockService.getSummary(),
        stockService.getMovements({ pageNumber: 1, pageSize: 5 }),
        productService.getPaged({ pageNumber: 1, pageSize: 5, lowStockOnly: true }),
      ])

      if (sumRes.success && sumRes.data) setSummary(sumRes.data)
      if (movRes.success && movRes.data) setRecentMovements(movRes.data)
      if (lowRes.success && lowRes.data) setLowStockProducts(lowRes.data)
    } catch {
      if (!silent) toast.error("Gagal memuat data ringkasan inventaris")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData()
    })
  }, [fetchData])

  // Real-time synchronization for Dashboard KPIs and recent movements
  useEffect(() => {
    const unsubMovement = subscribeStockMovement(() => {
      fetchData(true)
    })
    const unsubUpdate = subscribeStockUpdate(() => {
      fetchData(true)
    })
    return () => {
      unsubMovement()
      unsubUpdate()
    }
  }, [subscribeStockMovement, subscribeStockUpdate, fetchData])

  return {
    summary,
    recentMovements,
    lowStockProducts,
    loading,
    reload: () => fetchData(false),
  }
}

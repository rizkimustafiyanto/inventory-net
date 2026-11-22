"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { stockService } from "../services/stock.service"
import { productService } from "@/features/products/services/product.service"
import { useDebounce } from "@/hooks"
import { useInventorySocket } from "@/lib/socket"
import type { StockMovement, Product, PaginationMeta } from "@/types"

export function useStockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Pagination (Server-Side)
  const [filterProductId, setFilterProductId] = useState<number | undefined>(undefined)
  const [filterType, setFilterType] = useState<number>(0)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 350)
  const [prevSearch, setPrevSearch] = useState(debouncedSearch)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined)

  if (debouncedSearch !== prevSearch) {
    setPrevSearch(debouncedSearch)
    setPage(1)
  }

  const loadProducts = useCallback(async () => {
    try {
      const prodRes = await productService.getPaged({ pageSize: 100 })
      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data)
      }
    } catch {
      // ignore
    }
  }, [])

  const loadMovements = useCallback(async () => {
    try {
      setLoading(true)
      const movRes = await stockService.getMovements({
        productId: filterProductId,
        type: filterType > 0 ? filterType : undefined,
        search: debouncedSearch.trim() || undefined,
        pageNumber: page,
        pageSize,
      })

      if (movRes.success && movRes.data) {
        setMovements(movRes.data)
        if (movRes.meta) setMeta(movRes.meta)
      }
    } catch {
      toast.error("Gagal memuat data mutasi stok")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filterProductId, filterType, debouncedSearch])

  const reloadAll = useCallback(() => {
    loadProducts()
    loadMovements()
  }, [loadProducts, loadMovements])

  const { subscribeStockMovement } = useInventorySocket()

  // Real-time WebSocket listener: Prepend live stock mutations immediately
  useEffect(() => {
    const unsubscribe = subscribeStockMovement((movement) => {
      // If matches active filters and user is on page 1, prepend immediately
      if (
        page === 1 &&
        (!filterProductId || filterProductId === movement.productId) &&
        (!filterType || filterType === movement.type)
      ) {
        setMovements((prev) => [
          {
            id: movement.id,
            productId: movement.productId,
            productName: movement.productName,
            productSku: movement.productSku,
            type: movement.type,
            quantity: movement.quantity,
            stockBefore: movement.stockBefore,
            stockAfter: movement.stockAfter,
            reason: movement.reason,
            referenceNumber: movement.referenceNumber,
            userName: movement.userName,
            createdAt: movement.createdAt,
          },
          ...prev.slice(0, pageSize - 1),
        ])
        setMeta((prev) => (prev ? { ...prev, totalCount: prev.totalCount + 1 } : prev))
      }

      toast.info(
        `Mutasi Baru: [${movement.productSku}] ${movement.quantity} unit (${
          movement.type === 1 ? "Masuk" : movement.type === 2 ? "Keluar" : "Penyesuaian"
        })`
      )
    })
    return unsubscribe
  }, [subscribeStockMovement, page, pageSize, filterProductId, filterType])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    loadMovements()
  }, [loadMovements])

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleProductFilterChange = (prodId?: number) => {
    setFilterProductId(prodId)
    setPage(1)
  }

  const handleTypeFilterChange = (typeVal: number) => {
    setFilterType(typeVal)
    setPage(1)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  return {
    movements,
    products,
    loading,
    search,
    filterProductId,
    filterType,
    page,
    pageSize,
    meta,
    setPage,
    handleSearchChange,
    handleProductFilterChange,
    handleTypeFilterChange,
    handlePageSizeChange,
    reload: loadMovements,
    reloadAll,
  }
}

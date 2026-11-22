"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { stockService } from "../services/stock.service"
import { productService } from "@/features/products/services/product.service"
import { useDebounce } from "@/hooks"
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined)

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

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    loadMovements()
  }, [loadMovements])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
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

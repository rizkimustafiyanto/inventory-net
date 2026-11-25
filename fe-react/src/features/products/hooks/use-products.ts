"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { productService } from "../services/product.service"
import { categoryService } from "@/features/categories/services/category.service"
import { useDebounce } from "@/hooks"
import { useInventorySocket } from "@/lib/socket"
import type { Product, Category, PaginationMeta } from "@/types"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Pagination (Server-Side)
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>(undefined)
  const [lowStockOnly, setLowStockOnly] = useState(false)
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

  const loadCategories = useCallback(async () => {
    try {
      const catRes = await categoryService.getAll()
      if (catRes.success && catRes.data) {
        setCategories(catRes.data)
      }
    } catch {
      // ignore
    }
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      const prodRes = await productService.getPaged({
        pageNumber: page,
        pageSize,
        search: debouncedSearch.trim() || undefined,
        categoryId: categoryFilter,
        lowStockOnly: lowStockOnly || undefined,
      })

      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data)
        if (prodRes.meta) setMeta(prodRes.meta)
      }
    } catch {
      toast.error("Gagal memuat data produk")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, categoryFilter, lowStockOnly])

  const reloadAll = useCallback(() => {
    loadCategories()
    loadProducts()
  }, [loadCategories, loadProducts])

  const { subscribeStockUpdate } = useInventorySocket()

  // Real-time SignalR WebSocket subscription for live stock updates
  useEffect(() => {
    const unsubscribe = subscribeStockUpdate((update) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === update.productId
            ? {
                ...p,
                stockQuantity: update.newStock,
                isLowStock: update.newStock <= p.minStockLevel,
              }
            : p
        )
      )
    })
    return unsubscribe
  }, [subscribeStockUpdate])

  useEffect(() => {
    queueMicrotask(() => {
      void loadCategories()
    })
  }, [loadCategories])

  useEffect(() => {
    queueMicrotask(() => {
      void loadProducts()
    })
  }, [loadProducts])

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleCategoryFilterChange = (catId?: number) => {
    setCategoryFilter(catId)
    setPage(1)
  }

  const handleLowStockToggle = () => {
    setLowStockOnly((prev) => !prev)
    setPage(1)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus produk "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return

    try {
      const res = await productService.delete(id)
      if (res.success) {
        toast.success(`Produk "${name}" berhasil dihapus`)
        loadProducts()
      } else {
        toast.error(res.message || "Gagal menghapus produk")
      }
    } catch {
      toast.error("Gagal menghapus produk")
    }
  }

  return {
    products,
    categories,
    loading,
    search,
    categoryFilter,
    lowStockOnly,
    page,
    pageSize,
    meta,
    setPage,
    handleSearchChange,
    handleCategoryFilterChange,
    handleLowStockToggle,
    handlePageSizeChange,
    handleDelete,
    reload: loadProducts,
    reloadAll,
  }
}
